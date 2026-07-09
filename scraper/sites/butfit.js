// 3지점 · 버핏 (care.butfit.io)
// 로그인: 휴대폰번호 + 비밀번호
//
// ⚠️ 실제 로그인 화면 점검 후 SELECTOR/추출 로직을 채웁니다.
"use strict";
const U = require("./util");

module.exports = {
  id: "butfit",
  name: "3지점 · 버핏",
  source: "care.butfit.io",

  // creds: { user (휴대폰), pass }
  async collect(page, creds, range) {
    if (!creds.user || !creds.pass) throw new Error("로그인 정보(BUTFIT_USER/PASS) 미설정");

    await page.goto("https://care.butfit.io/session/calendar", { waitUntil: "networkidle" });
    // TODO(inspection): 로그인 폼 셀렉터 + 스케줄 API/DOM 추출
    throw new Error("추출 로직 미구현 — 로그인 화면 점검 후 연결 예정");
  },
};
