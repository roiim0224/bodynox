// 공통 유틸 — 날짜/시간 정규화, 안전 파서
"use strict";

function pad(n) { return (n < 10 ? "0" : "") + n; }

// Date -> "YYYY-MM-DD" (KST 기준으로 실행 환경 TZ=Asia/Seoul 가정)
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

// 오늘부터 n일간의 "YYYY-MM-DD" 배열
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

// 표준 수업 객체로 정규화 (누락 필드는 안전 기본값)
function normClass(c) {
  return {
    date: c.date || "",
    start: normTime(c.start),
    end: normTime(c.end),
    title: (c.title || "수업").trim(),
    instructor: (c.instructor || "").trim(),
    capacity: typeof c.capacity === "number" ? c.capacity : toInt(c.capacity),
    booked: typeof c.booked === "number" ? c.booked : toInt(c.booked),
    status: c.status || "confirmed",
  };
}

module.exports = { pad, ymd, normTime, dateRange, toInt, normClass, todayYmd: function () { return ymd(new Date()); } };
