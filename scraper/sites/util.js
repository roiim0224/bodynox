// 공통 유틸 — 날짜/시간 정규화, 범용 로그인, 텍스트 파서
"use strict";

function pad(n) { return (n < 10 ? "0" : "") + n; }

function ymd(d) {
  return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate());
}

// "9:5" / "09:05" / "오전 9:05" 등 -> "09:05"
function normTime(s) {
  if (!s) return "";
  s = String(s).trim();
  var pm = /오후|pm/i.test(s);
  var am = /오전|am/i.test(s);
  var m = s.match(/(\d{1,2})\s*[:시]\s*(\d{1,2})?/);
  if (!m) return "";
  var h = parseInt(m[1], 10);
  var min = m[2] ? parseInt(m[2], 10) : 0;
  if (pm && h < 12) h += 12;
  if (am && h === 12) h = 0;
  return pad(h) + ":" + pad(min);
}

// "10:30 - 11:20" -> { start:"10:30", end:"11:20" }
function splitRange(s) {
  var m = String(s || "").match(/(\d{1,2}:\d{2})\s*[-~]\s*(\d{1,2}:\d{2})/);
  return m ? { start: normTime(m[1]), end: normTime(m[2]) } : { start: "", end: "" };
}

// "3명/8명" 또는 "3/8" -> { booked:3, capacity:8 }
function splitCount(s) {
  var m = String(s || "").match(/(\d+)\s*명?\s*\/\s*(\d+)\s*명?/);
  return m ? { booked: parseInt(m[1], 10), capacity: parseInt(m[2], 10) } : { booked: null, capacity: null };
}

function dateRange(days) {
  var out = [];
  var base = new Date();
  for (var i = 0; i < days; i++) {
    var d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    out.push(ymd(d));
  }
  return out;
}

function toInt(v) {
  var n = parseInt(String(v).replace(/[^\d-]/g, ""), 10);
  return isNaN(n) ? null : n;
}

// 표준 수업 객체로 정규화
function normClass(c) {
  var status = c.status || (
    (typeof c.capacity === "number" && typeof c.booked === "number" && c.booked >= c.capacity) ? "full" : "confirmed"
  );
  return {
    date: c.date || "",
    start: normTime(c.start),
    end: normTime(c.end),
    title: (c.title || "수업").toString().trim(),
    instructor: (c.instructor || "").toString().trim(),
    capacity: typeof c.capacity === "number" ? c.capacity : toInt(c.capacity),
    booked: typeof c.booked === "number" ? c.booked : toInt(c.booked),
    status: status,
  };
}

// ---------------------------------------------------------------------
// 범용 로그인: 대상 URL 로 이동 후 비밀번호 입력칸이 있으면 로그인 시도.
// 세 사이트 모두 (아이디/휴대폰) + (비밀번호) + (제출) 단순 폼이라 공통 처리 가능.
// opts.userSelector / opts.passSelector / opts.submitSelector 로 개별 지정 가능.
// ---------------------------------------------------------------------
async function ensureAuthed(page, url, creds, opts) {
  opts = opts || {};
  var passSel = opts.passSelector || "input[type=password]";
  var id = opts.tag || "";

  await page.goto(url, { waitUntil: "domcontentloaded" }).catch(function () {});
  await page.waitForTimeout(2500);

  var pwd = await page.$(passSel);
  if (!pwd) { console.log("  [" + id + "] 이미 로그인 상태"); return true; }
  console.log("  [" + id + "] 로그인 폼 감지 url=" + page.url());

  // 아이디/휴대폰 입력칸
  var uSel = opts.userSelector ||
    "input#identity, input[type=tel], input[name*='phone' i], input[name*='mobile' i], " +
    "input[name*='id' i], input[type=email], input[name*='email' i], input[type=text]";
  var uField = await page.$(uSel);
  if (!uField) throw new Error("아이디 입력칸 못 찾음 url=" + page.url());
  await uField.click({ clickCount: 3 }).catch(function () {});
  await uField.fill("");
  await uField.type(String(creds.user), { delay: 25 });
  await pwd.click().catch(function () {});
  await pwd.fill("");
  await pwd.type(String(creds.pass), { delay: 25 });

  // React controlled input 대응: 네이티브 setter 로 두 칸을 확정 세팅 + input 이벤트
  var setNative = function (el, v) {
    var proto = window.HTMLInputElement && window.HTMLInputElement.prototype;
    var desc = proto && Object.getOwnPropertyDescriptor(proto, "value");
    if (desc && desc.set) { desc.set.call(el, v); } else { el.value = v; }
    el.dispatchEvent(new Event("input", { bubbles: true }));
    el.dispatchEvent(new Event("change", { bubbles: true }));
  };
  await uField.evaluate(setNative, String(creds.user)).catch(function () {});
  await pwd.evaluate(setNative, String(creds.pass)).catch(function () {});

  // 각 칸에 실제 들어간 값의 길이 확인(값 노출 없이 진단)
  try {
    var uv = await uField.inputValue();
    var pv = await pwd.inputValue();
    console.log("  [" + id + "] 필드확인 아이디칸.len=" + uv.length + " (기대=" + String(creds.user).length + ") 비번칸.len=" + pv.length + " (기대=" + String(creds.pass).length + ")");
  } catch (e) { console.log("  [" + id + "] 필드확인 실패: " + String(e).slice(0, 60)); }
  console.log("  [" + id + "] 입력 완료");

  // 제출 (버튼 활성화 대기 후 클릭)
  await page.waitForTimeout(500);
  var submit = await page.$(opts.submitSelector || "button[type=submit], input[type=submit]");
  if (!submit) {
    submit = await page.$("xpath=//button[contains(normalize-space(.), '로그인') or contains(translate(normalize-space(.),'LOGIN','login'),'login')]");
  }
  if (submit) { await submit.click({ force: true }).catch(function () {}); }
  else { await pwd.press("Enter"); }
  console.log("  [" + id + "] 제출");

  // 성공 신호: 비밀번호 입력칸이 사라짐(폼이 앱 화면으로 대체)
  var ok = false;
  try {
    await page.waitForSelector(passSel, { state: "detached", timeout: 15000 });
    ok = true;
  } catch (e) {
    await page.waitForTimeout(2500);
    if (!(await page.$(passSel))) ok = true;
  }

  if (!ok) {
    var title = "";
    try { title = await page.title(); } catch (e) {}
    var snip = "";
    try { snip = await page.evaluate(function () { return document.body ? document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 220) : ""; }); } catch (e) {}
    throw new Error("로그인 실패(비번칸 유지) url=" + page.url() + " title=" + title + " text=" + snip);
  }
  console.log("  [" + id + "] 로그인 성공 url=" + page.url());

  // 스케줄 페이지 보장
  var want = new URL(url).pathname;
  if (page.url().indexOf(want) === -1) {
    await page.goto(url, { waitUntil: "domcontentloaded" }).catch(function () {});
    await page.waitForTimeout(2500);
  }
  return true;
}

module.exports = {
  pad: pad, ymd: ymd, normTime: normTime, splitRange: splitRange, splitCount: splitCount,
  dateRange: dateRange, toInt: toInt, normClass: normClass, ensureAuthed: ensureAuthed,
  todayYmd: function () { return ymd(new Date()); },
};
