// 2지점 · 스튜디오메이트 (pilatesh1.studiomate.kr)
// 로그인 폼(실측): #identity(휴대폰) + #password + button[type=submit]
// 스케줄 화면 구조는 로그인 후 확정 예정 → 우선 널리 쓰이는 캘린더(DHTMLX/FullCalendar)
// 자동 감지 방식으로 추출을 시도하고, 실패 시 진단 메시지를 남긴다.
"use strict";
const U = require("./util");

const LOGIN_URL = "https://pilatesh1.studiomate.kr/login";
const SCHEDULE_URL = "https://pilatesh1.studiomate.kr/schedule";

async function extractGeneric(page) {
  await page.waitForTimeout(1500);
  return await page.evaluate(function () {
    function pad(n) { return (n < 10 ? "0" : "") + n; }
    var out = [];

    // 1) DHTMLX Scheduler
    if (typeof window.scheduler !== "undefined" && window.scheduler.getEvents) {
      (window.scheduler.getEvents() || []).forEach(function (e) {
        var d = e.start_date, en = e.end_date;
        out.push({
          date: d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()),
          start: pad(d.getHours()) + ":" + pad(d.getMinutes()),
          end: pad(en.getHours()) + ":" + pad(en.getMinutes()),
          text: String(e.text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        });
      });
      return { lib: "dhtmlx", rows: out };
    }

    // 2) FullCalendar
    var cols = document.querySelectorAll(".fc-timegrid-col[data-date], .fc-daygrid-day[data-date]");
    if (cols.length) {
      cols.forEach(function (col) {
        var date = col.getAttribute("data-date");
        col.querySelectorAll(".fc-event, .fc-timegrid-event, .fc-daygrid-event").forEach(function (ev) {
          var texts = [].slice.call(ev.querySelectorAll("*"))
            .filter(function (n) { return n.children.length === 0 && n.textContent.trim(); })
            .map(function (n) { return n.textContent.replace(/\s+/g, " ").trim(); });
          out.push({ date: date, texts: texts });
        });
      });
      return { lib: "fullcalendar", rows: out };
    }

    // 3) 미확인 — 진단용 힌트 반환
    var timeBlocks = [].slice.call(document.querySelectorAll("*"))
      .filter(function (el) { return /\d{1,2}:\d{2}\s*[-~]\s*\d{1,2}:\d{2}/.test(el.textContent) && el.querySelectorAll("*").length <= 6; })
      .length;
    return { lib: "unknown", rows: [], hint: { timeBlocks: timeBlocks, hasFc: !!document.querySelector(".fc"), url: location.pathname } };
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
      userSelector: "#identity", passSelector: "#password", submitSelector: "button[type=submit]",
    });

    var res = await extractGeneric(page);
    if (res.lib === "unknown") {
      throw new Error("스케줄 화면 구조 미확인(로그인 후 점검 필요) hint=" + JSON.stringify(res.hint));
    }

    var out = [];
    res.rows.forEach(function (r) {
      var c;
      if (res.lib === "dhtmlx") {
        var parts = (r.text || "").split(" / ");
        var cnt = U.splitCount(r.text);
        c = U.normClass({ date: r.date, start: r.start, end: r.end, title: parts[0], instructor: parts[1] || "", booked: cnt.booked, capacity: cnt.capacity });
      } else {
        var texts = r.texts || [];
        var timeT = texts.find(function (t) { return /\d{1,2}:\d{2}\s*[-~]\s*\d{1,2}:\d{2}/.test(t); }) || "";
        var rng = U.splitRange(timeT);
        var cIdx = -1; for (var i = texts.length - 1; i >= 0; i--) { if (/^\d+\s*\/\s*\d+$/.test(texts[i])) { cIdx = i; break; } }
        var cnt2 = cIdx >= 0 ? U.splitCount(texts[cIdx]) : { booked: null, capacity: null };
        var name = cIdx > 0 ? texts[cIdx - 1] : "";
        var mid = texts.slice(texts.indexOf(timeT) + 1, cIdx > 0 ? cIdx - 1 : texts.length).filter(Boolean);
        c = U.normClass({ date: r.date, start: rng.start, end: rng.end, title: (mid[mid.length - 1] || mid[0] || "수업"), instructor: name, booked: cnt2.booked, capacity: cnt2.capacity });
      }
      if (c.start) out.push(c);
    });

    var today = U.todayYmd();
    return out.filter(function (c) { return c.date >= today; });
  },
};
