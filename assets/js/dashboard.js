/* =====================================================================
   BODYNOX 지점 스케줄 대시보드
   - /content/schedule.json 을 불러와 세 지점 스케줄을 한 화면에 표시
   - "새로고침"을 누르면 최신 스냅샷을 즉시 다시 가져옵니다
   - 데이터 형식(schedule.json):
     { updatedAt, sample?, branches: [{ id, name, source, status, error,
        classes: [{ date, start, end, title, instructor, capacity, booked, status }] }] }
   ===================================================================== */
(function () {
  "use strict";

  var SCHEDULE_URL = "data/schedule.json";
  var WEEKDAYS = ["일", "월", "화", "수", "목", "금", "토"];
  var BRANCH_COLORS = { bodycodi: "var(--accent)", studiomate: "var(--ink)", butfit: "var(--ok)" };

  var state = { data: null, selected: null, initialized: false };

  var $ = function (id) { return document.getElementById(id); };

  // ---------- 날짜 유틸 ----------
  function pad(n) { return (n < 10 ? "0" : "") + n; }
  function ymd(d) { return d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()); }
  function parseYmd(s) { var p = s.split("-"); return new Date(+p[0], +p[1] - 1, +p[2]); }
  function addDays(s, n) { var d = parseYmd(s); d.setDate(d.getDate() + n); return ymd(d); }
  function todayYmd() { return ymd(new Date()); }
  function isToday(s) { return s === todayYmd(); }
  function fmtDate(s) { var d = parseYmd(s); return (d.getMonth() + 1) + "월 " + d.getDate() + "일"; }
  function fmtWeekday(s) { return "(" + WEEKDAYS[parseYmd(s).getDay()] + ")"; }

  function timeAgo(iso) {
    if (!iso) return "";
    var then = new Date(iso).getTime();
    if (isNaN(then)) return "";
    var mins = Math.round((Date.now() - then) / 60000);
    if (mins < 1) return "방금 전";
    if (mins < 60) return mins + "분 전";
    var hrs = Math.round(mins / 60);
    if (hrs < 24) return hrs + "시간 전";
    return Math.round(hrs / 24) + "일 전";
  }

  // ---------- 데이터 로드 ----------
  function load() {
    var btn = $("refreshBtn");
    btn.classList.add("is-loading");
    btn.disabled = true;

    return fetch(SCHEDULE_URL + "?t=" + Date.now(), { cache: "no-store" })
      .then(function (r) {
        if (!r.ok) throw new Error("HTTP " + r.status);
        return r.json();
      })
      .then(function (data) {
        state.data = data;
        if (!state.initialized) { state.selected = pickInitialDate(data); state.initialized = true; }
        renderBanner();
        renderUpdated();
        renderStatus();
        renderBoard();
      })
      .catch(function (err) {
        showError(err);
      })
      .then(function () {
        btn.classList.remove("is-loading");
        btn.disabled = false;
      });
  }

  // 첫 로드 시 보여줄 날짜: 오늘에 수업이 있으면 오늘, 없으면 데이터가 있는 가장 가까운 날
  function pickInitialDate(data) {
    var today = todayYmd();
    var dates = allDates(data);
    if (!dates.length) return today;
    if (dates.indexOf(today) !== -1) return today;
    var future = dates.filter(function (d) { return d >= today; });
    return future.length ? future[0] : dates[dates.length - 1];
  }

  function allDates(data) {
    var set = {};
    (data.branches || []).forEach(function (b) {
      (b.classes || []).forEach(function (c) { if (c.date) set[c.date] = 1; });
    });
    return Object.keys(set).sort();
  }

  // ---------- 렌더 ----------
  function renderBanner() {
    var banner = $("banner"), text = $("bannerText");
    var data = state.data;
    var anyError = (data.branches || []).some(function (b) { return b.status === "error"; });
    if (anyError) {
      banner.className = "dash-banner warn";
      var failed = (data.branches || []).filter(function (b) { return b.status === "error"; })
        .map(function (b) { return b.name; }).join(", ");
      text.innerHTML = "일부 지점을 불러오지 못했습니다: <b>" + esc(failed) + "</b>. 잠시 후 새로고침해 주세요.";
    } else if (data.sample) {
      banner.className = "dash-banner info";
      text.innerHTML = "현재는 <b>예시(샘플) 데이터</b>입니다. 세 지점 실시간 연동을 켜면 이 화면에 실제 스케줄이 표시됩니다.";
    } else {
      banner.className = "dash-banner hidden";
    }
  }

  function renderUpdated() {
    var el = $("updated");
    var ago = timeAgo(state.data.updatedAt);
    el.innerHTML = ago
      ? "마지막 업데이트<br><b>" + esc(ago) + "</b>"
      : "업데이트 시각 정보 없음";
  }

  function renderStatus() {
    var wrap = $("branchStatus");
    wrap.innerHTML = "";
    (state.data.branches || []).forEach(function (b) {
      var cls = b.status === "error" ? "error" : (b.status === "stale" ? "stale" : "ok");
      var count = (b.classes || []).filter(function (c) { return c.date === state.selected; }).length;
      var stateTxt = b.status === "error" ? "연결 오류" : (b.status === "stale" ? "지연됨" : "연결됨");
      var div = document.createElement("div");
      div.className = "branch-pill " + cls;
      div.innerHTML =
        '<span class="dot"></span>' +
        '<div><div class="bp-name">' + esc(b.name) + '</div>' +
        '<div class="bp-src">' + esc(b.source) + '</div></div>' +
        '<div class="bp-meta">' +
          '<div class="bp-count">' + count + '<small> 개</small></div>' +
          '<div class="bp-state">' + stateTxt + '</div>' +
        '</div>';
      wrap.appendChild(div);
    });
  }

  function renderBoard() {
    // 날짜 라벨
    $("dateLabel").textContent = fmtDate(state.selected) + " " + fmtWeekday(state.selected);
    var wk = $("weekLabel");
    if (isToday(state.selected)) { wk.textContent = "오늘"; wk.className = "w today"; }
    else { wk.textContent = ""; wk.className = "w"; }

    var board = $("board");
    board.innerHTML = "";
    (state.data.branches || []).forEach(function (b) {
      board.appendChild(renderColumn(b));
    });
  }

  function renderColumn(branch) {
    var col = document.createElement("div");
    col.className = "board__col";
    var color = BRANCH_COLORS[branch.id] || "var(--muted)";

    var classes = (branch.classes || [])
      .filter(function (c) { return c.date === state.selected; })
      .sort(function (a, b) { return (a.start || "").localeCompare(b.start || ""); });

    var head =
      '<div class="board__col-head">' +
        '<span class="cdot" style="background:' + color + '"></span>' +
        '<h3>' + esc(branch.name) + '</h3>' +
        '<span class="cnt">' + classes.length + '</span>' +
      '</div>';

    var body;
    if (branch.status === "error") {
      body = '<div class="col-error">불러오기 실패' +
             (branch.error ? '<small>' + esc(branch.error) + '</small>' : '') + '</div>';
    } else if (!classes.length) {
      body = '<div class="col-empty">이 날짜에는 예정된 수업이 없습니다</div>';
    } else {
      body = '<div class="cls-list">' + classes.map(renderClass).join("") + '</div>';
    }
    col.innerHTML = head + body;
    return col;
  }

  function renderClass(c) {
    var cap = typeof c.capacity === "number" ? c.capacity : null;
    var booked = typeof c.booked === "number" ? c.booked : null;
    var full = c.status === "full" || (cap !== null && booked !== null && booked >= cap);
    var cancelled = c.status === "cancelled";

    var badge = "";
    if (cancelled) badge = '<span class="cls-badge cancelled">취소</span>';
    else if (full) badge = '<span class="cls-badge full">마감</span>';

    var capHtml = "";
    if (cap !== null && booked !== null) {
      var pct = cap > 0 ? Math.min(100, Math.round((booked / cap) * 100)) : 0;
      capHtml =
        '<div class="cap">' +
          '<div class="cap__bar"><div class="cap__fill' + (full ? ' is-full' : '') + '" style="width:' + pct + '%"></div></div>' +
          '<div class="cap__num">' + booked + '/' + cap + '</div>' +
        '</div>';
    }

    var end = c.end ? '<span class="end"> – ' + esc(c.end) + '</span>' : "";
    var who = c.instructor
      ? '<span class="who"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="8" r="3.2"/><path d="M5.5 20a6.5 6.5 0 0 1 13 0"/></svg>' + esc(c.instructor) + '</span>'
      : "";

    return (
      '<div class="cls-card">' +
        '<div class="cls-card__top">' +
          '<span class="cls-card__time">' + esc(c.start || "") + end + '</span>' + badge +
        '</div>' +
        '<div class="cls-card__title">' + esc(c.title || "수업") + '</div>' +
        '<div class="cls-card__meta">' + who + '</div>' +
        capHtml +
      '</div>'
    );
  }

  function showError(err) {
    var banner = $("banner"), text = $("bannerText");
    banner.className = "dash-banner warn";
    text.innerHTML = "스케줄 데이터를 불러오지 못했습니다 (" + esc(String(err.message || err)) +
      "). 인터넷 연결을 확인하거나 잠시 후 다시 시도해 주세요.";
    $("updated").textContent = "불러오기 실패";
  }

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (m) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[m];
    });
  }

  // ---------- 이벤트 ----------
  function go(delta) { state.selected = addDays(state.selected, delta); renderStatus(); renderBoard(); }

  document.addEventListener("DOMContentLoaded", function () {
    $("refreshBtn").addEventListener("click", load);
    $("prevDay").addEventListener("click", function () { go(-1); });
    $("nextDay").addEventListener("click", function () { go(1); });
    $("todayBtn").addEventListener("click", function () { state.selected = todayYmd(); renderStatus(); renderBoard(); });
    load();
  });
})();
