// 3지점 · 버핏 (care.butfit.io) — 광화문 지점
// 캘린더는 FullCalendar 사용. 날짜별 컬럼(.fc-timegrid-col[data-date]) 안의
// 이벤트(.fc-event)에서 순서대로 [시간, 수업종류, (프로그램), 이름, 예약/정원] 을 읽는다.
//  예) "18:30 - 19:20" · "그룹 필라테스(바디녹스)" · "Rave Blast" · "최미미" · "3/8"
"use strict";
const U = require("./util");

const CAL_URL = "https://care.butfit.io/session/calendar";

async function readCalendar(page) {
  await page.waitForSelector(".fc-event, .fc-timegrid-event", { timeout: 20000 }).catch(function () {});
  await page.waitForTimeout(800);
  return await page.evaluate(function () {
    var rows = [];
    document.querySelectorAll(".fc-timegrid-col[data-date], .fc-daygrid-day[data-date]").forEach(function (col) {
      var date = col.getAttribute("data-date");
      col.querySelectorAll(".fc-event, .fc-timegrid-event, .fc-daygrid-event").forEach(function (ev) {
        var texts = [].slice.call(ev.querySelectorAll("*"))
          .filter(function (n) { return n.children.length === 0 && n.textContent.trim(); })
          .map(function (n) { return n.textContent.replace(/\s+/g, " ").trim(); });
        // 중복 인접 제거
        texts = texts.filter(function (t, i) { return t !== texts[i - 1]; });
        rows.push({ date: date, texts: texts });
      });
    });
    return rows;
  });
}

function parseRow(row) {
  var texts = row.texts || [];
  var timeT = texts.find(function (t) { return /\d{1,2}:\d{2}\s*[-~]\s*\d{1,2}:\d{2}/.test(t); }) || "";
  var countIdx = -1;
  for (var i = texts.length - 1; i >= 0; i--) { if (/^\d+\s*\/\s*\d+$/.test(texts[i])) { countIdx = i; break; } }
  var cnt = countIdx >= 0 ? U.splitCount(texts[countIdx]) : { booked: null, capacity: null };
  var name = countIdx > 0 ? texts[countIdx - 1] : "";
  // 시간 다음 ~ 이름 앞 = [수업종류, (프로그램)] → 가장 구체적인(마지막) 항목을 제목으로
  var start = texts.indexOf(timeT) + 1;
  var endMid = countIdx > 0 ? countIdx - 1 : texts.length;
  var middle = texts.slice(start, endMid).filter(Boolean);
  var title = (middle[middle.length - 1] || middle[0] || "수업").replace(/\(바디녹스\)/g, "").trim();
  var rng = U.splitRange(timeT);
  return U.normClass({
    date: row.date, start: rng.start, end: rng.end,
    title: title, instructor: name,
    booked: cnt.booked, capacity: cnt.capacity,
  });
}

module.exports = {
  id: "butfit",
  name: "3지점 · 버핏",
  source: "care.butfit.io",

  async collect(page, creds, range) {
    if (!creds.user || !creds.pass) throw new Error("로그인 정보(BUTFIT_USER/PASS) 미설정");

    await U.ensureAuthed(page, CAL_URL, creds);

    var seen = {};
    var out = [];
    function add(rows) {
      rows.forEach(function (r) {
        if (!r.date || !r.texts.length) return;
        var c = parseRow(r);
        if (!c.start) return;
        var key = c.date + c.start + c.title;
        if (!seen[key]) { seen[key] = 1; out.push(c); }
      });
    }

    add(await readCalendar(page));

    // 다음 주(가능하면)
    try {
      var next = await page.$(".fc-next-button, [aria-label='next'], [title='다음']");
      if (!next) next = await page.$("xpath=//button[.//*[local-name()='svg']][last()]");
      if (next) { await next.click(); await page.waitForTimeout(1800); add(await readCalendar(page)); }
    } catch (e) { /* 이번 주만 반환 */ }

    var today = U.todayYmd();
    return out.filter(function (c) { return c.date >= today; });
  },
};
