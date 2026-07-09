// 2지점 · 스튜디오메이트 (pilatesh1.studiomate.kr) — 서울역점
// 로그인(실측): #identity(휴대폰) + #password + button[type=submit]
// 스케줄(실측): FullCalendar. 단, 날짜가 컬럼이 아니라 각 이벤트 텍스트에 포함됨.
//   이벤트 leaf 텍스트 순서 예:
//   ["2026. 7. 6. (월)","10:00~10:50","1/5","김주아 강사님","그룹수업","김주아","강사", ...]
//   ["2026. 7. 6. (월)","10:00~10:50","개인","김태완 님","프라이빗수업","채수진","강사", ...]
//   → 개인정보(회원명)는 담지 않고 종류/시간/강사/정원만 추출.
"use strict";
const U = require("./util");

const SCHEDULE_URL = "https://pilatesh1.studiomate.kr/schedule";

async function readEvents(page) {
  await page.waitForSelector(".fc-event, .fc-timegrid-event", { timeout: 20000 }).catch(function () {});
  await page.waitForTimeout(1000);
  return await page.evaluate(function () {
    return [].slice.call(document.querySelectorAll(".fc-event, .fc-timegrid-event, .fc-daygrid-event"))
      .map(function (ev) {
        return [].slice.call(ev.querySelectorAll("*"))
          .filter(function (n) { return n.children.length === 0 && n.textContent.trim(); })
          .map(function (n) { return n.textContent.replace(/\s+/g, " ").trim(); })
          .filter(function (t, i, a) { return t !== a[i - 1]; });
      });
  });
}

function parseEvent(texts) {
  var dateT = texts.find(function (t) { return /\d{4}\.\s*\d{1,2}\.\s*\d{1,2}\./.test(t); });
  var timeT = texts.find(function (t) { return /\d{1,2}:\d{2}\s*[~-]\s*\d{1,2}:\d{2}/.test(t); });
  if (!dateT || !timeT) return null;
  var dm = dateT.match(/(\d{4})\.\s*(\d{1,2})\.\s*(\d{1,2})\./);
  var date = dm[1] + "-" + U.pad(+dm[2]) + "-" + U.pad(+dm[3]);
  var rng = U.splitRange(timeT);

  var joined = texts.join(" ");
  var isPrivate = /프라이빗|개인/.test(joined);
  var typeT = texts.find(function (t) { return /^(그룹수업|프라이빗수업|상담|기타일정)$/.test(t); });
  var title = typeT ? (typeT === "프라이빗수업" ? "개인수업" : typeT) : (isPrivate ? "개인수업" : "수업");

  var countT = texts.find(function (t) { return /^\d+\s*\/\s*\d+$/.test(t); });
  var cnt = countT ? U.splitCount(countT) : { booked: isPrivate ? 1 : null, capacity: isPrivate ? 1 : null };

  var instructor = "";
  var tt = texts.find(function (t) { return /\s강사님$/.test(t); });
  if (tt) instructor = tt.replace(/\s*강사님$/, "").trim();
  else { var gi = texts.indexOf("강사"); if (gi > 0) instructor = texts[gi - 1]; }

  return U.normClass({
    date: date, start: rng.start, end: rng.end,
    title: title, instructor: instructor,
    booked: cnt.booked, capacity: cnt.capacity,
  });
}

module.exports = {
  id: "studiomate",
  name: "2지점 · 스튜디오메이트",
  source: "pilatesh1.studiomate.kr",

  // creds: { user(휴대폰), pass }
  async collect(page, creds, range) {
    if (!creds.user || !creds.pass) throw new Error("로그인 정보(STUDIOMATE_USER/PASS) 미설정");

    await U.ensureAuthed(page, SCHEDULE_URL, creds, {
      tag: "studiomate", userSelector: "#identity", passSelector: "#password", submitSelector: "button[type=submit]",
    });

    var seen = {};
    var out = [];
    function add(rowsTexts) {
      rowsTexts.forEach(function (texts) {
        var c = parseEvent(texts);
        if (!c || !c.start || !c.date) return;
        var key = c.date + c.start + c.title + c.instructor;
        if (!seen[key]) { seen[key] = 1; out.push(c); }
      });
    }

    add(await readEvents(page));

    // 다음 주(가능하면). 커스텀 '▶' 또는 FullCalendar next 버튼
    try {
      var next = await page.$(".fc-next-button, [aria-label='next']");
      if (!next) next = await page.$("xpath=//button[normalize-space(.)='▶' or contains(@class,'next')]");
      if (next) { await next.click(); await page.waitForTimeout(1800); add(await readEvents(page)); }
    } catch (e) { /* 이번 주만 반환 */ }

    var today = U.todayYmd();
    return out.filter(function (c) { return c.date >= today; });
  },
};
