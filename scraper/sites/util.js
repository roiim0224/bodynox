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
  await page.goto(url, { waitUntil: "networkidle" }).catch(function () {});
  var pwd = await page.$(opts.passSelector || "input[type=password]");
  if (!pwd) return true; // 이미 로그인됨(스케줄 화면)

  // 아이디/휴대폰 입력칸
  if (opts.userSelector) {
    await page.fill(opts.userSelector, creds.user);
  } else {
    var uField = await page.$(
      "input#identity, input[type=tel], input[name*=phone i], input[name*=mobile i], " +
      "input[name*=id i], input[type=email], input[name*=email i], input[type=text]"
    );
    if (!uField) throw new Error("아이디 입력칸을 찾지 못함(로그인 폼 변경?)");
    await uField.fill(creds.user);
  }

  await pwd.fill(creds.pass);

  // 제출
  var submit = await page.$(opts.submitSelector || "button[type=submit], input[type=submit]");
  if (!submit) {
    submit = await page.$("xpath=//button[contains(normalize-space(.), '로그인')] | //a[contains(normalize-space(.), '로그인')]");
  }
  if (submit) { await submit.click().catch(function () {}); }
  else { await pwd.press("Enter"); }

  await page.waitForLoadState("networkidle").catch(function () {});
  await page.waitForTimeout(1500);

  // 재확인: 다시 대상 URL 로 가서 비밀번호 화면이면 실패
  await page.goto(url, { waitUntil: "networkidle" }).catch(function () {});
  if (await page.$(opts.passSelector || "input[type=password]")) {
    throw new Error("로그인 실패(로그인 화면 유지) — 자격증명 또는 폼 확인 필요");
  }
  return true;
}

module.exports = {
  pad: pad, ymd: ymd, normTime: normTime, splitRange: splitRange, splitCount: splitCount,
  dateRange: dateRange, toInt: toInt, normClass: normClass, ensureAuthed: ensureAuthed,
  todayYmd: function () { return ymd(new Date()); },
};
