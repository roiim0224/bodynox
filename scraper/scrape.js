// =====================================================================
// BODYNOX 지점 스케줄 수집기 (오케스트레이터)
// - 세 지점 모듈을 순서대로 실행하여 표준 schedule.json 을 생성
// - 한 지점이 실패해도 나머지는 정상 수집 (지점별 격리)
// - 결과: dashboard/data/schedule.json  (대시보드가 읽는 파일)
//
// 실행: node scraper/scrape.js
// 환경변수(자격증명): GitHub Actions Secrets 로 주입
//   BODYCODI_USER / BODYCODI_PASS / BODYCODI_VIEW_PASS
//   STUDIOMATE_USER / STUDIOMATE_PASS
//   BUTFIT_USER / BUTFIT_PASS
// =====================================================================
"use strict";
const fs = require("fs");
const path = require("path");
const { chromium } = require("playwright");
const U = require("./sites/util");

const OUT = path.join(__dirname, "..", "dashboard", "data", "schedule.json");
const DAYS = 8; // 오늘부터 8일치

const SITES = [
  { mod: require("./sites/bodycodi"),   creds: { user: env("BODYCODI_USER"), pass: env("BODYCODI_PASS"), viewPass: env("BODYCODI_VIEW_PASS") } },
  { mod: require("./sites/studiomate"), creds: { user: env("STUDIOMATE_USER"), pass: env("STUDIOMATE_PASS") } },
  { mod: require("./sites/butfit"),     creds: { user: env("BUTFIT_USER"), pass: env("BUTFIT_PASS") } },
];

function env(k) { return (process.env[k] || "").trim(); }

function nowIso() {
  // 워크플로에서 TZ=Asia/Seoul 로 실행되므로 로컬시간이 곧 KST
  const d = new Date();
  const p = U.pad;
  return d.getFullYear() + "-" + p(d.getMonth() + 1) + "-" + p(d.getDate()) +
    "T" + p(d.getHours()) + ":" + p(d.getMinutes()) + ":" + p(d.getSeconds()) + "+09:00";
}

async function main() {
  const range = U.dateRange(DAYS);
  const browser = await chromium.launch({ headless: true });
  const branches = [];

  for (const site of SITES) {
    const m = site.mod;
    const context = await browser.newContext({
      locale: "ko-KR",
      timezoneId: "Asia/Seoul",
      userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
    });
    const page = await context.newPage();
    page.setDefaultTimeout(30000);

    let entry = { id: m.id, name: m.name, source: m.source, status: "ok", error: null, classes: [] };
    try {
      console.log("[" + m.id + "] 수집 시작…");
      const classes = await m.collect(page, site.creds, range);
      entry.classes = (classes || []).filter(Boolean);
      console.log("[" + m.id + "] 수업 " + entry.classes.length + "건");
    } catch (err) {
      entry.status = "error";
      entry.error = String(err && err.message ? err.message : err).slice(0, 200);
      console.error("[" + m.id + "] 실패:", entry.error);
      // 진단용 스크린샷/HTML (CI 아티팩트로 업로드 → 로그인 화면 등 확인)
      try {
        const dbg = path.join(__dirname, "debug");
        fs.mkdirSync(dbg, { recursive: true });
        await page.screenshot({ path: path.join(dbg, m.id + ".png"), fullPage: true });
        fs.writeFileSync(path.join(dbg, m.id + ".html"), await page.content(), "utf8");
      } catch (e2) { console.error("  (디버그 저장 실패:", String(e2).slice(0, 80) + ")"); }
    }
    branches.push(entry);
    await context.close();
  }

  await browser.close();

  const out = { updatedAt: nowIso(), sample: false, branches: branches };
  fs.writeFileSync(OUT, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log("저장 완료 →", OUT);

  // 하나도 성공 못 하면 실패 종료(워크플로에서 감지 가능)하되, 파일은 남긴다
  const anyOk = branches.some(function (b) { return b.status === "ok"; });
  if (!anyOk) { console.error("모든 지점 수집 실패"); process.exitCode = 2; }
}

main().catch(function (e) { console.error("치명적 오류:", e); process.exit(1); });
