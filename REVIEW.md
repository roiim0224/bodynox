# 코드 리뷰 & GEO/SEO 개선 (2026-06-24)

바디녹스필라테스 홈페이지에 대한 코드 리뷰와 AI 검색 대응(GEO/SEO) 작업 결과입니다.

---

## 1. 총평

전반적으로 완성도가 높습니다. 시맨틱 마크업, `data-i18n` 기반 3개 국어 i18n, 접근성(스킵링크·aria·포커스 트랩·`prefers-reduced-motion`), 지연 로딩(`loading="lazy"`, 비디오 `preload="none"`), Netlify Forms 무백엔드 연동까지 모범적입니다. 이번 작업은 **AI·검색엔진이 콘텐츠를 정확히 읽고 인용하도록** 구조화 데이터와 다국어 신호를 보강하는 데 집중했습니다.

---

## 2. 이번에 적용한 변경 (코드 반영 완료)

### GEO / 구조화 데이터
- **FAQPage 스키마 추가** (`index.html`): 기존 6개 FAQ를 `schema.org/FAQPage` JSON-LD로 추가. AI 답변 엔진과 구글이 질문–답변을 그대로 인용·노출하기 가장 좋은 형식입니다. 화면의 FAQ 텍스트와 내용 일치.
- **LocalBusiness 스키마 강화** (`index.html`):
  - 타입을 `["ExerciseGym","HealthAndBeautyBusiness","LocalBusiness"]`로 구체화
  - `@id`, `alternateName`, `description`, `logo`, `knowsLanguage`(ko/en/ja) 추가
  - 결제·통화: `currenciesAccepted`, `paymentAccepted`
  - 주소에 `addressRegion`·`postalCode`, `areaServed`(서울) 추가
  - **`hasOfferCatalog`**: 체험(30,000원)·개인·듀엣·그룹(99,000원) 수업을 Offer/Service로 명시 → "OO동 필라테스 가격/수업" 류 질문에 AI가 답하기 좋아짐
  - `sameAs`에 네이버 플레이스 링크 추가

### 다국어(i18n) 검색 신호
- **hreflang 추가** (`index.html` `<head>`): `ko / en / ja / x-default` 4개. 한 URL + `?lang=` 파라미터로 언어를 구분합니다.
- **`?lang=` 라우팅** (`assets/js/main.js`): 진입 시 URL의 `?lang=` 값을 최우선 인식(이후 저장값 → 브라우저 언어 → ko). 언어 전환 시 `history.replaceState`로 URL의 `?lang=`도 동기화해 **공유·색인 가능한 주소**가 됩니다.
- **sitemap.xml**: `xhtml:link` hreflang 대체 링크 + `lastmod` 추가.

### 크롤링 / 검증
- **robots.txt**: GPTBot·OAI-SearchBot·ChatGPT-User·Google-Extended·ClaudeBot·PerplexityBot·Applebot-Extended 등 **AI 크롤러 명시적 허용**. (콘텐츠가 AI 답변에 인용되길 원하는 방향)
- **HTML 유효성 수정**: 센터 소개의 `<div class="info-list">`가 `<li>`를 직접 자식으로 가져 비표준이었음 → `<ul>`로 교정.

검증 완료: JSON-LD 2개 블록 파싱 OK, main.js/i18n.js 문법 OK, sitemap XML 유효.

---

## 3. 코드 리뷰 — 추가 권장 사항 (선택)

| 우선순위 | 항목 | 설명 |
|---|---|---|
| 높음 | 히어로 영상 용량 | `main_video.mp4` 약 19MB. 배포 전 720p·~2–3MB로 압축 권장(LCP·모바일 데이터). |
| 중간 | 갤러리 링크 `href="#"` | 클릭 시 페이지 상단으로 점프. 라이트박스 또는 원본 이미지 링크로 교체 권장. |
| 중간 | 후기/SNS의 `href="#"` | 네이버 플레이스·인스타 실제 URL로 연결(현재 placeholder). |
| 낮음 | `aria-label` 한국어 고정 | `aria-label="주요 메뉴"` 등 일부 정적 aria가 한국어 고정. `data-i18n-aria`로 확장 가능. |
| 낮음 | 이미지 `alt` 다국어 | 현재 alt는 한국어. SEO상 큰 문제는 아니나 다국어 대응 시 고려. |

---

## 4. 오픈 전 반드시 채워야 할 실제 정보 (SEO 직결)

구조화 데이터·검색 노출이 효과를 내려면 placeholder를 실제 값으로 교체해야 합니다.

- **`<title>` / `meta description`**: `OO동 OO역` → 실제 지역·역명. (검색 노출 핵심)
- **LocalBusiness 스키마**: 주소·전화·우편번호, 그리고
  - `geo`(위도·경도): 실제 좌표 확보 후 블록에 추가 — 지도/로컬 검색에 유리
  - `aggregateRating`: **실제 네이버/구글 평점·리뷰 수**가 확정되면 추가. 허위 평점은 검색엔진 제재 대상이라 **의도적으로 비워 두었습니다.**
- **`sameAs`** / 푸터 SNS: 인스타·블로그 실제 URL
- **`CONFIG`**(`assets/js/main.js`): 전화·카카오채널·네이버예약·결제 링크
- **사업자 정보**(푸터): 상호·대표·사업자등록번호·통신판매업신고번호
- 배포 후 도메인이 확정되면 `og:url`·`canonical`·hreflang·sitemap·스키마의 URL을 실제 도메인으로 일괄 확인.

---

## 5. 코드 외 등록 작업 (가장 큰 GEO/SEO 효과)

홈페이지 코드만으로는 부족하고, 아래 플랫폼 등록이 실제 노출을 좌우합니다.

1. **네이버 스마트플레이스** 등록 — '지역명+필라테스' 검색·지도 노출의 핵심. 홈페이지와 **주소·영업시간·전화 정보 일치**(NAP).
2. **구글 비즈니스 프로필** 등록 — 구글/지도 + AI 답변의 1차 출처.
3. **네이버 서치어드바이저 / 구글 서치콘솔**에 사이트·sitemap 제출.
4. 정보 일관성: 홈페이지 = 네이버 = 구글에서 상호·주소·전화가 한 글자도 다르지 않게.

> 핵심 요약: 별도의 'AI 전용 사이트'가 아니라, 정보를 **명확한 텍스트 + 구조화 데이터 + 일관된 플랫폼 정보**로 정리하는 것이 사람과 AI 모두에게 잘 읽히는 길입니다. 이번 변경으로 그 토대(FAQPage·LocalBusiness·hreflang·robots)를 코드에 심었습니다.
