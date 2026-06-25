/* =====================================================================
   BODYNOX PILATES — main.js  (i18n: ko/en/ja + 인터랙션)
   ⚙️ 채널/결제 링크는 아래 CONFIG에서, 텍스트는 assets/js/i18n.js에서 관리.
   ===================================================================== */
const CONFIG = {
  phone: "0200000000",
  kakaoChannel: "https://pf.kakao.com/_xXXXXX",                     // 카카오톡 채널 URL (가입 후 교체)
  naverBooking: "https://map.naver.com/p/entry/place/1398430038",   // 네이버 플레이스/예약 (실제 플레이스)
  instagram: "https://www.instagram.com/",
  payment: {
    domesticPayLink: "",   // 토스페이먼츠 링크페이 URL
    paypalPayLink: "",     // PayPal No-Code Checkout URL
  },
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const won = (n) => Number(n).toLocaleString("ko-KR") + "원";

/* ====================== i18n 엔진 ====================== */
const I18N = window.I18N || {};
const LANGS = ["ko", "en", "ja"];
// 우선순위: URL ?lang= (검색엔진 hreflang 진입) > 저장값 > 브라우저 언어 > ko
const urlLang = new URLSearchParams(location.search).get("lang");
const stored = localStorage.getItem("bnx_lang");
const browser = (navigator.language || "ko").slice(0, 2).toLowerCase();
let lang = LANGS.includes(urlLang) ? urlLang
  : LANGS.includes(stored) ? stored
  : LANGS.includes(browser) ? browser : "ko";

const t = (key) =>
  (I18N[lang] && I18N[lang][key] != null ? I18N[lang][key] : (I18N.ko && I18N.ko[key])) ?? "";

function applyI18n() {
  const dict = I18N[lang];
  if (!dict) return;
  document.documentElement.lang = lang;
  $$("[data-i18n]").forEach((el) => { const v = dict[el.dataset.i18n]; if (v != null) el.textContent = v; });
  $$("[data-i18n-html]").forEach((el) => { const v = dict[el.dataset.i18nHtml]; if (v != null) el.innerHTML = v; });
  $$("[data-i18n-ph]").forEach((el) => { const v = dict[el.dataset.i18nPh]; if (v != null) el.setAttribute("placeholder", v); });
  $$("[data-i18n-aria]").forEach((el) => { const v = dict[el.dataset.i18nAria]; if (v != null) el.setAttribute("aria-label", v); });
  $$("[data-badge]").forEach((el) => { const v = dict[el.dataset.badge]; if (v != null) el.style.setProperty("--badge", JSON.stringify(v)); });
  $$(".lang-switch button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.lang === lang)));
  applyInlinePrices(); // 문장 속 금액(예: "체험 30,000원부터")을 최신 금액으로 유지
}
function setLang(l) {
  if (!LANGS.includes(l)) return;
  lang = l;
  localStorage.setItem("bnx_lang", l);
  // URL의 ?lang= 동기화 (히스토리 오염 없이 공유 가능한 주소 유지)
  try {
    const u = new URL(location.href);
    u.searchParams.set("lang", l);
    history.replaceState(null, "", u);
  } catch (e) {}
  applyI18n();
  if (navToggle) navToggle.setAttribute("aria-label", t(mobileMenu.classList.contains("open") ? "a11y.menu_close" : "a11y.menu_open"));
}
$$(".lang-switch button").forEach((b) => b.addEventListener("click", () => setLang(b.dataset.lang)));

/* ====================== 가격 금액 (관리자 편집: content/prices.json) ======================
   구조: { "trial": 30000, "group": 99000 }  (숫자, 언어 공통)
   - [data-amount-display="키"]  : 가격 카드의 표시 숫자 (콤마 자동)
   - [data-amount-key="키"]      : 결제 버튼의 실제 결제 금액(data-amount)
   - [data-amount-inline="키"]   : 문장 속 금액(예: 히어로 "체험 30,000원부터")
   파일을 못 읽으면 HTML에 적힌 기본 금액으로 그대로 동작합니다. */
let CMS_PRICES = null;
const fmtAmount = (n) => Number(n).toLocaleString("ko-KR");
function applyInlinePrices() {
  if (!CMS_PRICES) return;
  $$("[data-amount-inline]").forEach((el) => {
    const amt = CMS_PRICES[el.dataset.amountInline];
    if (amt == null) return;
    el.textContent = el.textContent.replace(/[\d,]+/, fmtAmount(amt)); // 첫 숫자 그룹만 교체
  });
}
// prices.json 키 ↔ JSON-LD Offer의 category 매핑 (검색엔진용 구조화 데이터)
const PRICE_CATEGORY = { trial: "체험", group: "그룹" };
function updateJsonLdPrices() {
  if (!CMS_PRICES) return;
  const catToAmount = {};
  for (const k in PRICE_CATEGORY) if (CMS_PRICES[k] != null) catToAmount[PRICE_CATEGORY[k]] = String(CMS_PRICES[k]);
  $$('script[type="application/ld+json"]').forEach((s) => {
    let data;
    try { data = JSON.parse(s.textContent); } catch (_) { return; }
    let touched = false;
    (function walk(node) {
      if (Array.isArray(node)) { node.forEach(walk); return; }
      if (node && typeof node === "object") {
        if (node["@type"] === "Offer" && "price" in node && catToAmount[node.category] != null
            && node.price !== catToAmount[node.category]) {
          node.price = catToAmount[node.category];
          touched = true;
        }
        Object.values(node).forEach(walk);
      }
    })(data);
    if (touched) s.textContent = JSON.stringify(data);
  });
}
function applyPrices() {
  if (!CMS_PRICES) return;
  $$("[data-amount-display]").forEach((el) => {
    const amt = CMS_PRICES[el.dataset.amountDisplay];
    if (amt == null) return;
    const small = el.querySelector("small"); // 단위(원/1회 등) 보존
    el.textContent = fmtAmount(amt);
    if (small) el.appendChild(small);
  });
  $$("[data-amount-key]").forEach((el) => {
    const amt = CMS_PRICES[el.dataset.amountKey];
    if (amt != null) el.dataset.amount = String(amt);
  });
  applyInlinePrices();
  updateJsonLdPrices();
}

/* ====================== 채널 링크 주입 ====================== */
$$("[data-channel]").forEach((el) => {
  const c = el.dataset.channel;
  if (c === "kakao" && CONFIG.kakaoChannel) el.href = CONFIG.kakaoChannel;
  if (c === "naver" && CONFIG.naverBooking) el.href = CONFIG.naverBooking;
  if (c === "kakao" || c === "naver") { el.target = "_blank"; el.rel = "noopener"; }
});

/* ====================== 헤더 스크롤 + 플로팅 CTA ====================== */
const header = $("#header");
const floatCta = $("#floatCta");
const onScroll = () => {
  const y = window.scrollY;
  header.classList.toggle("scrolled", y > 8);
  if (floatCta) floatCta.classList.toggle("show", y > 620);
};
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

/* ====================== 모바일 메뉴 ====================== */
const navToggle = $("#navToggle");
const mobileMenu = $("#mobileMenu");
const bgRegions = [$("#main"), $(".footer")].filter(Boolean);
const setMenu = (open) => {
  navToggle.setAttribute("aria-expanded", String(open));
  navToggle.setAttribute("aria-label", t(open ? "a11y.menu_close" : "a11y.menu_open"));
  mobileMenu.classList.toggle("open", open);
  document.body.style.overflow = open ? "hidden" : "";
  bgRegions.forEach((el) => (open ? el.setAttribute("inert", "") : el.removeAttribute("inert")));
};
navToggle?.addEventListener("click", () => setMenu(!mobileMenu.classList.contains("open")));
$$("#mobileMenu a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

/* ====================== 스크롤 리빌 ====================== */
const io = new IntersectionObserver(
  (entries) => entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }),
  { threshold: 0.12, rootMargin: "0px 0px -8% 0px" }
);
$$(".reveal").forEach((el) => io.observe(el));

/* ====================== FAQ 아코디언 ====================== */
$$(".faq__q").forEach((btn) => {
  const panel = btn.nextElementSibling;
  btn.addEventListener("click", () => {
    const open = btn.getAttribute("aria-expanded") === "true";
    btn.setAttribute("aria-expanded", String(!open));
    panel.style.maxHeight = open ? null : panel.scrollHeight + "px";
  });
});

/* ====================== 히어로 영상 (데스크톱만 로드, 모바일은 포스터) ====================== */
const heroVideo = $("#heroVideo");
if (heroVideo && heroVideo.dataset.src) {
  const okWidth = window.matchMedia("(min-width: 860px)").matches;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (okWidth && !reduce) {
    const src = document.createElement("source");
    src.src = heroVideo.dataset.src;
    src.type = "video/mp4";
    heroVideo.appendChild(src);
    heroVideo.load();
    heroVideo.play().catch(() => {});
  }
}

/* ====================== 문의 폼 제출 ====================== */
const form = $("#contactForm");
form?.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  try {
    if (location.protocol.startsWith("http")) {
      await fetch("/", { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams(data).toString() });
    }
  } catch (_) {}
  $("#formSuccess").classList.add("show");
  $(".form__fields").style.display = "none";
});

/* ====================== 결제 모달 ====================== */
const payModal = $("#payModal");
let lastFocus = null;
const trapTab = (e) => {
  if (e.key !== "Tab") return;
  const f = $$("button, a[href], input, textarea, select", payModal).filter((el) => !el.disabled && el.offsetParent !== null);
  if (!f.length) return;
  const first = f[0], last = f[f.length - 1];
  if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
  else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
};
const openPay = (item, amount) => {
  $("#payItem").textContent = item;
  $("#payAmount").textContent = won(amount);
  payModal.classList.add("open");
  lastFocus = document.activeElement;
  $(".modal__close", payModal).focus();
  document.body.style.overflow = "hidden";
  payModal.addEventListener("keydown", trapTab);
};
const closePay = () => {
  payModal.classList.remove("open");
  payModal.removeEventListener("keydown", trapTab);
  document.body.style.overflow = "";
  lastFocus?.focus();
};
$$("[data-pay]").forEach((b) => b.addEventListener("click", () => openPay(b.dataset.item, b.dataset.amount)));
$$("[data-close]", payModal).forEach((el) => el.addEventListener("click", closePay));
document.addEventListener("keydown", (e) => { if (e.key === "Escape" && payModal.classList.contains("open")) closePay(); });
$$(".pay-option").forEach((opt) =>
  opt.addEventListener("click", () => {
    const m = opt.dataset.method;
    const P = CONFIG.payment;
    const url = m === "intl" ? P.paypalPayLink : P.domesticPayLink;
    if (url) {
      window.open(url, "_blank", "noopener");
    } else {
      closePay();
      if (CONFIG.kakaoChannel && !CONFIG.kakaoChannel.includes("xXXXXX")) {
        window.open(CONFIG.kakaoChannel, "_blank", "noopener");
      } else {
        location.hash = "#contact";
      }
    }
  })
);

/* ====================== 연도 + 최초 i18n 적용 ====================== */
$$("[data-year]").forEach((el) => (el.textContent = new Date().getFullYear()));
applyI18n();

/* ====================== 관리자(Decap CMS) 편집 문구 덮어쓰기 ======================
   content/*.json 을 읽어 해당 섹션의 문구를 최신 값으로 교체합니다.
   각 파일 구조: { "필드명": { "ko": "...", "en": "...", "ja": "..." }, ... }
   i18n 키 규칙: "<prefix>.<필드명>"  (예: content/nav.json 의 about -> nav.about)
   파일이 없거나 못 읽어도 위 i18n.js 기본값으로 그대로 정상 동작합니다. */
const CMS_OVERLAYS = [
  { file: "/content/about.json", prefix: "about" },     // 센터 소개 문구
  { file: "/content/nav.json", prefix: "nav" },         // 상단 메뉴
  { file: "/content/pricing.json", prefix: "pricing" }, // 가격 안내
];
async function applyCmsOverlay() {
  let changed = false;
  for (const { file, prefix } of CMS_OVERLAYS) {
    try {
      const res = await fetch(file, { cache: "no-store" });
      if (!res.ok) continue;
      const data = await res.json();
      for (const [field, langs] of Object.entries(data)) {
        if (!langs || typeof langs !== "object") continue;
        const key = prefix + "." + field;
        for (const l of LANGS) {
          if (I18N[l] && typeof langs[l] === "string" && langs[l].trim()) {
            I18N[l][key] = langs[l];
            changed = true;
          }
        }
      }
    } catch (_) {/* 네트워크/로컬 파일 환경에서는 무시하고 기본값 유지 */}
  }
  if (changed) applyI18n();

  // 금액 숫자 덮어쓰기
  try {
    const res = await fetch("/content/prices.json", { cache: "no-store" });
    if (res.ok) { CMS_PRICES = await res.json(); applyPrices(); }
  } catch (_) {/* 기본 금액 유지 */}
}
applyCmsOverlay();
