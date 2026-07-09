// 1지점 · 바디코디 (crm.bodycodi.com)
// 그룹수업 스케줄러는 DHTMLX Scheduler 라이브러리 사용 → 페이지의 scheduler.getEvents()
// 에서 날짜·시간·수업명·강사·정원·마감여부를 정확히 읽는다. (실측 확인됨)
//
// text 형식: "Reformer-full body / 김지은 / 4명/5명"  ( 수업명 / 강사 / 예약명/정원명 )
// badgeState: "full"(마감) | "less"(여유)
"use strict";
const U = require("./util");

const SCHEDULE_URL = "https://crm.bodycodi.com/manager/schedule/class";

async function readWeek(page) {
  // DHTMLX scheduler 로드 대기
  await page.waitForFunction(function () {
    return typeof window.scheduler !== "undefined" && window.scheduler.getEvents;
  }, { timeout: 20000 });
  await page.waitForTimeout(800);
  return await page.evaluate(function () {
    return (window.scheduler.getEvents() || []).map(function (e) {
      return {
        s: +e.start_date, e: +e.end_date,
        text: String(e.text || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim(),
        badge: String(e.badgeState || ""),
        svc: String(e.serviceType || ""),
      };
    });
  });
}

function parseEvent(ev) {
  var d = new Date(ev.s), e = new Date(ev.e);
  var parts = ev.text.split(" / ");
  var cnt = U.splitCount(ev.text);
  return U.normClass({
    date: U.ymd(d),
    start: U.pad(d.getHours()) + ":" + U.pad(d.getMinutes()),
    end: U.pad(e.getHours()) + ":" + U.pad(e.getMinutes()),
    title: parts[0] || "수업",
    instructor: parts[1] || "",
    booked: cnt.booked, capacity: cnt.capacity,
    status: ev.badge === "full" ? "full" : "confirmed",
  });
}

module.exports = {
  id: "bodycodi",
  name: "1지점 · 바디코디",
  source: "crm.bodycodi.com",

  // creds: { user, pass, viewPass }
  async collect(page, creds, range) {
    if (!creds.user || !creds.pass) throw new Error("로그인 정보(BODYCODI_USER/PASS) 미설정");

    await U.ensureAuthed(page, SCHEDULE_URL, creds);

    var seen = {};
    var out = [];
    function add(list) {
      list.forEach(function (ev) {
        var c = parseEvent(ev);
        var key = c.date + c.start + c.title;
        if (!seen[key]) { seen[key] = 1; out.push(c); }
      });
    }

    // 이번 주
    add(await readWeek(page));

    // 다음 주(가능하면). DHTMLX 기본 next 버튼 또는 커스텀 화살표 클릭
    try {
      var next = await page.$(".dhx_cal_next_button");
      if (!next) next = await page.$("xpath=//*[normalize-space(.)='▶' or contains(@class,'next')]");
      if (next) { await next.click(); await page.waitForTimeout(1500); add(await readWeek(page)); }
    } catch (e) { /* 다음 주 실패해도 이번 주는 반환 */ }

    // 오늘 이후만
    var today = U.todayYmd();
    return out.filter(function (c) { return c.date >= today; });
  },
};
