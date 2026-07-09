# 바디녹스필라테스 — 반응형 홈페이지 (초안)

기존 bodynox.com(Flutter 앱)을 대체할, **모던·시크(블랙&화이트 + 웜 클레이 포인트)** 콘셉트의 **반응형 원페이지** 홈페이지입니다. 빌드 단계 없는 **순수 정적 사이트**라 어디서든 쉽게 실행·배포할 수 있습니다.

> 디자인·구조는 제출하신 『홈페이지 제작 기획안』 + 6개 전문 관점 검토 결과(전환·콘텐츠·로컬SEO·법규·제작·디자인)를 반영했습니다.

---

## 1. 로컬에서 실행하기

**A. 설치 없이 (가장 간단, macOS 기본 파이썬)**
```bash
cd bodynox-homepage
python3 -m http.server 5500
# 브라우저에서 http://localhost:5500
```

**B. npm으로 (자동 새로고침 원하면)**
```bash
npm run dev          # http://localhost:5500  (npx serve)
```

그냥 `index.html`을 더블클릭해도 열리지만, 폰트/이미지 경로와 폼 동작 확인을 위해 위 방식(로컬 서버) 사용을 권장합니다.

---

## 2. 콘텐츠 교체 가이드 (개발 지식 없이)

대부분 `index.html`의 한국어 텍스트를 찾아 바꾸면 됩니다. `OO`, `000`, `예시`로 표기된 곳이 교체 대상입니다.

| 무엇을 | 어디서 |
|---|---|
| 슬로건·소개·수업·가격·FAQ 문구 | `index.html` (해당 섹션 텍스트) |
| 지역명·주소·전화·영업시간 | `index.html`에서 `OO역`, `OO구`, `02-000-0000` 검색 → 교체 |
| 사진 | **bodynox.com에서 가져온 실제 사진**이 `assets/img/real/`에 적용돼 있습니다(main_*, brand_*, about_us_*, learn_more_* 등). 교체 시 같은 경로의 파일을 바꾸거나 `index.html`의 `<img src>`를 수정 |
| 히어로 영상 | `assets/img/real/main_video.mp4` (데스크톱 자동재생, 모바일은 `main_1.webp` 포스터). 19MB라 배포 전 압축 권장 |
| 로고 / 파비콘 | **실제 브랜드 자산** 사용: 헤더·푸터 `assets/brand/logo_2.webp`, 파비콘 `assets/brand/favicon.png` |
| 가격 표시/문의 정책 | `#pricing` 섹션 — 체험가만 명시 + 회원권은 상담 유도(하이브리드) |
| 사업자 정보(상호·대표·번호·주소) | `index.html` 푸터의 `.biz-info` |

**이미지 권장 규격**: 히어로 세로형(약 1100×1320), 공간/갤러리 4:3·1:1, 강사 4:5. 용량 최적화(.webp, 200~400KB 이하)를 권장합니다.

---

## 3. 채널 & 결제 설정 — `assets/js/main.js` 상단 `CONFIG`

```js
const CONFIG = {
  phone: "0200000000",
  kakaoChannel: "https://pf.kakao.com/_xXXXXX",  // 카카오톡 채널
  naverBooking: "https://booking.naver.com/...", // 네이버 예약
  instagram: "https://www.instagram.com/...",
  payment: {
    domesticPayLink: "",   // 토스페이먼츠 링크페이 URL
    paypalPayLink: "",     // PayPal No-Code Checkout URL
  },
};
```
이 한 곳만 채우면 사이트 전체의 버튼(카카오·네이버·전화·결제)에 자동 반영됩니다. (값이 비어 있으면 결제 버튼은 상담 채널로 안내)

---

## 4. 결제 연동 (한국 + 해외) — 리서치 기반 권장 구성

> **결론: 국내 = 토스페이먼츠 링크페이, 해외 = PayPal (둘 다 무백엔드).**
> Stripe는 2026년 현재 **한국 사업자 가입·정산 불가**라 제외했습니다. Paddle/Lemon Squeezy 등 MoR은 대면 서비스 판매를 약관상 금지해 제외했습니다.

### 4-1. 국내 — 토스페이먼츠 링크페이 (LinkPay)
- 카드 + 카카오페이·네이버페이·토스페이를 **한 계약으로** 커버
- 수수료: 연매출 30억 이하 **영세~중소 우대수수료 신용카드 0.40%~1.45%** (국내 최저 수준)
- **서버 불필요** — 상점관리자에서 결제 링크를 만들어 버튼에 연결
- 가입: ① https://www.tosspayments.com/ → ‘이용 신청하기’ (심사 7~10일) → ② 승인 후 **링크페이 추가 신청**(☎ 1544-7772 / support@tosspayments.com) → ③ 생성한 링크를 `CONFIG.payment.domesticPayLink`에 입력

### 4-2. 해외 — PayPal Business (No-Code Checkout)
- 해외 고객 카드·PayPal 결제를 **무백엔드**로 수신 (한국 사업자 즉시 가입 가능)
- 수수료: 해외 결제 약 **4.40% + 고정 + 환전 스프레드(~3%)** (최저는 아니지만 한국 사업자 해외수금의 유일 현실안)
- 가입: ① https://www.paypal.com/kr/business → 사업자·은행계좌 등록 → ② https://developer.paypal.com/studio/checkout/no-code 에서 Buy 버튼/링크 생성 → ③ `CONFIG.payment.paypalPayLink`에 입력

### 4-3. (선택·확장) 정기결제/회원권 자동발급이 필요해지면
- **PortOne(포트원) + Netlify Functions**로 확장. `netlify/functions/toss-confirm.js` 스텁과 `netlify.toml`이 이미 준비돼 있습니다.
- 이때 **시크릿 키는 반드시 Netlify 환경변수**에만 저장하고 결제 검증은 서버에서 수행하세요.

> ⚠️ 온라인 결제 운영 전 **통신판매업 신고**(간이과세자 또는 직전년도 거래 50회 미만이면 면제), **사업자 정보·환불정책 표기**가 선행되어야 합니다 (PG 심사 요건이기도 함). 자세한 내용은 §7 참고.

---

## 4-4. 다국어 (i18n) — 한국어 · English · 日本語

- 헤더(데스크톱·모바일) 우측 **KO / EN / JP 스위처**로 전 콘텐츠(메뉴 포함)가 즉시 전환됩니다. 선택은 브라우저에 저장되고, 첫 방문 시 브라우저 언어를 자동 감지합니다.
- 모든 번역 텍스트는 **`assets/js/i18n.js`** 한 파일에 `{ ko, en, ja }`로 모여 있습니다. 문구 수정은 이 파일의 해당 키만 고치면 됩니다.
- HTML에는 `data-i18n="키"`(텍스트), `data-i18n-html`(HTML 포함), `data-i18n-ph`(placeholder), `data-i18n-aria`(aria-label)가 붙어 있고, 기본 표시는 한국어(무JS·SEO 대비)입니다.
- 언어 추가: i18n.js에 새 언어 객체 추가 → `main.js`의 `LANGS` 배열에 코드 추가 → 스위처에 버튼 1개 추가.

## 5. 배포 — 현재 자동 배포 중 ✅

이 사이트는 이미 배포되어 있습니다. 별도 배포 작업이 필요 없습니다.

- **주소**: https://bodynox.netlify.app
- **방식**: GitHub 저장소(`roiim0224/bodynox`)의 `main` 브랜치에 커밋이 올라가면 Netlify가 **자동으로 재배포**합니다.
- 관리자(`/admin`)에서 저장(Publish)해도, GitHub Desktop으로 Push해도 똑같이 자동 반영됩니다.
- 문의 폼은 `data-netlify` 속성으로 **백엔드 없이 자동 수집**됩니다 (Netlify 대시보드 → Forms, 무료 월 100건).
  - 폼 알림 메일: Site settings → Forms → Form notifications

> ⚠️ **드래그&드롭 수동 배포는 사용하지 마세요.** git 연동이 끊겨 `/admin` 로그인·저장이 깨질 수 있습니다.

배포 후 `index.html`의 `og:url`, `canonical`, `sitemap.xml`, 구조화데이터의 URL을 **실제 도메인**으로 바꿔주세요.

---

## 6. 분석 · 검색 노출(SEO) 설정

- **GA4**: `index.html` `<head>`의 주석 처리된 gtag 스니펫을 해제하고 측정 ID(`G-XXXX`) 입력. 전환 이벤트(예약버튼 클릭·폼 제출·전화 탭) 추적 권장.
- **네이버 서치어드바이저**: https://searchadvisor.naver.com → 사이트 등록 → 소유확인 → `sitemap.xml` 제출 (미등록 시 네이버 색인 지연)
- **구글 서치콘솔**: https://search.google.com/search-console → 사이트 등록 → 사이트맵 제출
- **네이버 스마트플레이스**(가장 중요): https://smartplace.naver.com 에서 사업자등록증으로 직접 등록. ‘지역명+필라테스’ 검색 노출의 핵심이며, 홈페이지의 주소·영업시간·전화와 **정보를 일치**시키세요.
- **OG 이미지**: `assets/brand/og-image.svg` (카카오/인스타 공유 시 일부 환경은 PNG/JPG가 더 안전 — 필요 시 PNG로 변환).

---

## 7. 법적 체크리스트 (한국)

- [x] **개인정보처리방침**(`privacy.html`) + 문의 폼 **수집·이용 동의 체크박스**(필수) — 이미 적용됨. `[ ]` 항목(책임자·연락처 등) 채우기
- [x] **마케팅 수신 동의**를 필수 동의와 **분리**(선택) — 이미 적용됨
- [x] 푸터 **사업자 정보** 영역 — 실제 값 입력 필요
- [ ] **통신판매업 신고**(온라인 결제 운영 시) — 면제 요건(간이과세/연 50회 미만) 확인 후, 비면제면 정부24 신고 → 신고번호 푸터 표기
- [ ] **후기·인물 사진**: 서면(전자) 동의(사용 범위·기간·철회) 확보. 인스타는 **공식 임베드**만 사용(캡처 게재 금지)
- [ ] **광고 표현**: ‘치료·교정·완치’ 등 의료/효과 단정 금지, ‘개인차 있음’ 고지 (필라테스는 의료행위 아님) — 카피에 반영됨
- [x] 폰트: Pretendard(OFL)·Poppins 사용 — 상업적 무료 (단독 재배포 금지)

---

## 8. 디자인 시스템 요약 (`assets/css/style.css` 상단 토큰)

- 컬러: 잉크 `#141414` · 웜 화이트 `#faf8f5` · 보조 `#6f6657`(AA 통과) · **포인트 브랜드 마젠타 `#e0118b`**(장식) / `#b30f73`(텍스트 대비 확보, 실제 로고 색과 일치). 보더는 `#e3dcd2`(텍스트 사용 금지).
- 타이포: 국문 **Pretendard**, 영문/로고 **Poppins**, fluid `clamp()` 스케일
- 스페이싱 8pt, 모션 300~420ms ease-out(1회), `prefers-reduced-motion` 대응, `:focus-visible` 포커스 링, WCAG 2.1 AA 대비 고려

---

## 9. 폴더 구조
```
bodynox-homepage/
├─ index.html            메인 원페이지
├─ privacy.html          개인정보처리방침
├─ terms.html            이용약관
├─ assets/
│  ├─ css/style.css      디자인 시스템 + 전체 스타일
│  ├─ js/main.js         인터랙션 + i18n 엔진 + CONFIG(채널·결제)
│  ├─ js/i18n.js         ko/en/ja 번역 사전(텍스트 수정은 여기)
│  ├─ img/real/          bodynox.com 실제 사진·영상
│  ├─ brand/             실제 로고(logo_2.webp)·파비콘·OG 이미지
│  ├─ icons/             SVG 아이콘
│  └─ fonts/             Poppins(로컬)
├─ netlify/functions/    (선택) 토스 결제검증 서버리스
├─ netlify.toml          배포 설정
├─ robots.txt / sitemap.xml
└─ package.json
```

문의: 콘텐츠/사진/실제 가격이 준비되면 교체 후 바로 오픈할 수 있습니다.
