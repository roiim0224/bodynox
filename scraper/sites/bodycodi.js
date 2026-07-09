// 1지점 · 바디코디 (crm.bodycodi.com)
// 로그인: 자체 이메일/비밀번호 + (내부 지점만 보기) 보기 비밀번호
//
// ⚠️ 아래 SELECTOR/추출 로직은 실제 로그인 화면을 확인한 뒤 채워집니다.
//    현재는 "미구현" 상태로, 실행 시 이 지점은 '연결 오류'로 표시됩니다(정직한 실패).
"use strict";
const U = require("./util");

module.exports = {
  id: "bodycodi",
  name: "1지점 · 바디코디",
  source: "crm.bodycodi.com",

  // creds: { user, pass, viewPass }
  async collect(page, creds, range) {
    if (!creds.user || !creds.pass) throw new Error("로그인 정보(BODYCODI_USER/PASS) 미설정");

    // --- 로그인 ---
    await page.goto("https://crm.bodycodi.com/manager/schedule/class", { waitUntil: "networkidle" });
    // TODO(inspection): 로그인 폼 셀렉터 확정
    //   await page.fill('input[type=email], input[name=email]', creds.user);
    //   await page.fill('input[type=password]', creds.pass);
    //   await page.click('button[type=submit]');
    //   await page.waitForLoadState('networkidle');
    // 내부 지점 보기 비밀번호(있을 경우)
    //   if (creds.viewPass) { ... }

    // --- 스케줄 추출 ---
    // TODO(inspection): 스케줄 API(우선) 또는 DOM에서 수업 목록 추출 후 U.normClass 로 정규화
    throw new Error("추출 로직 미구현 — 로그인 화면 점검 후 연결 예정");

    // 예시 반환 형태:
    // return classes.map(U.normClass);
  },
};
