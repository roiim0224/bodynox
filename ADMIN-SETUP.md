# 관리자 페이지(/admin) 설정 안내 — 비개발자용

이 사이트에는 Decap CMS 관리자(`사이트주소/admin`)가 붙어 있습니다.
관리자에서 문구를 고치고 **저장**하면 → 자동으로 git에 커밋되어 → 실제 사이트에 영구 반영됩니다.
(새로고침하면 사라지는 가짜 관리자가 아닙니다.)

아래 순서를 **딱 한 번만** 설정하면 됩니다.

---

## 1단계. 코드를 GitHub에 올리기 — GitHub Desktop 앱 (터미널 불필요)

> Git Gateway는 "폴더 드래그&드롭 배포"로는 동작하지 않습니다. 반드시 GitHub 저장소에 올려서 연결해야 합니다.
> 첫 커밋은 이미 만들어져 있으므로, 아래는 그걸 GitHub에 "게시(Publish)"하는 과정입니다.

1. **GitHub Desktop 설치**: https://desktop.github.com → **Download for macOS**
   → 받은 파일 압축 풀고 **응용 프로그램(Applications)** 폴더로 드래그 → 실행
2. **GitHub 로그인**: 첫 실행 시 **Sign in to GitHub.com** → 브라우저에서 **Authorize**
   (이름/이메일 설정 화면이 나오면 그대로 **Continue/Finish**)
3. **폴더 추가**: 상단 메뉴 **File → Add Local Repository**
   → **Choose…** 로 `bodynox-homepage` 폴더 선택 → **Add Repository**
   (이미 커밋이 있어 "변경사항 없음" 상태로 보이면 정상입니다)
4. **게시**: 오른쪽 위 **Publish repository** 버튼 클릭
   → 이름은 `bodynox-homepage` 그대로
   → **Keep this code private** 체크 **유지(비공개)** → **Publish Repository**
5. 끝나면 `https://github.com/<내아이디>/bodynox-homepage` (비공개)에 올라갑니다.

> 이후 내 컴퓨터에서 파일을 직접 고쳤다면, GitHub Desktop에서 **Commit → Push** 두 번 클릭으로 올리면 됩니다.
> (단, 관리자 `/admin`에서 고친 내용은 자동으로 GitHub에 올라가므로 Desktop이 필요 없습니다.)

---

## 2단계. Netlify에서 GitHub 저장소 연결해 배포

1. https://app.netlify.com 로그인
2. **Add new site** → **Import an existing project**
3. **Deploy with GitHub** → 방금 만든 저장소(`bodynox-homepage`) 선택
4. 빌드 설정은 비워둬도 됩니다(이 사이트는 빌드가 없습니다). **Deploy** 클릭
5. 잠시 뒤 `랜덤이름.netlify.app` 주소가 생기면 배포 완료

---

## 3단계. 로그인 기능(Netlify Identity) 켜기

1. 사이트 대시보드 → 상단 **Integrations**(또는 좌측 메뉴) 에서 **Identity** 검색/이동
   - 화면에 따라 **Site configuration → Identity** 위치일 수 있습니다.
2. **Enable Identity** 클릭

### 가입을 "초대받은 사람만"으로 제한 (권장)
3. Identity 설정 안 **Registration** → **Invite only** 선택
   (이걸 안 하면 아무나 가입할 수 있습니다.)

---

## 4단계. Git Gateway 켜기 (저장 → git 커밋의 핵심)

1. 같은 Identity 설정 화면을 아래로 스크롤 → **Services** → **Git Gateway**
2. **Enable Git Gateway** 클릭
   - 이게 켜져 있어야 관리자에서 누른 "저장"이 실제 git 커밋이 됩니다.

---

## 5단계. 본인을 관리자로 초대

1. 사이트 대시보드 → **Identity** 탭 → **Invite users**
2. 본인 이메일(예: roiim0224@gmail.com) 입력 → **Send**
3. 메일함에서 초대 메일의 **Accept the invite** 클릭
4. 사이트로 이동되면 **비밀번호 설정** 창이 뜹니다 → 비밀번호 입력
   - 설정이 끝나면 자동으로 `/admin` 으로 이동합니다.

> 초대 메일 링크를 눌렀는데 비밀번호 창이 안 뜨면,
> 직접 `사이트주소/admin` 으로 가서 로그인하면 됩니다.

---

## 6단계. 문구 수정 테스트

1. `사이트주소/admin` 접속 → 로그인
2. 왼쪽 **사이트 문구** 아래에 편집할 수 있는 항목이 있습니다:
   - **센터 소개 문구** — 첫 화면 소개 본문
   - **상단 메뉴** — 센터 소개 / 수업 / 가격 / 강사 / 후기 / 오시는 길 / 예약·상담 버튼
   - **가격 안내** — 가격 제목·설명, 체험·개인레슨·그룹의 이름/가격/설명/항목/버튼, 하단 안내문
   - **가격 금액 (숫자)** — 첫 방문 체험 금액, 그룹 회원권 월 금액 (숫자만 입력)
     · 여기서 숫자를 바꾸면 가격 카드 표시 금액, 결제 버튼 결제 금액, 첫 화면 "체험 ○○원부터" 배지가 **한 번에 함께** 바뀝니다.
3. 원하는 항목을 열고 한국어/English/日本語 칸에서 문구 수정
4. 오른쪽 위 **Publish**(게시) 클릭
5. 1~2분 뒤 사이트에 반영됩니다.
   - 반영이 느리면 Netlify가 자동 재배포 중인 것이니 조금만 기다리세요.

> 각 항목은 **한/영/일 3개 언어**를 각각 입력하게 되어 있습니다.
> 한 언어만 바꾸면 그 언어 화면에만 반영되고, 나머지는 기존 문구가 유지됩니다.

---

## (선택) 내 컴퓨터에서 관리자 화면 미리 테스트하기 — 로컬 백엔드

배포 전에 `/admin` 편집 화면을 실제로 눌러보고 싶을 때 쓰는 방법입니다.
로그인 없이, 수정 내용이 **내 컴퓨터의 파일에 바로 저장**됩니다. (Netlify 불필요)

**터미널 2개**를 띄웁니다.

터미널 ①  — 편집 내용을 파일에 저장해주는 서버
```bash
cd bodynox-homepage
npm run cms          # decap-server (포트 8081). 켜두기만 하면 됩니다.
```

터미널 ②  — 사이트 서버
```bash
cd bodynox-homepage
npm run dev          # http://localhost:5500
```

그다음 브라우저에서 **http://localhost:5500/admin** 접속
→ 로그인 화면 없이 바로 편집 화면이 열립니다.
→ 항목을 고치고 **저장(Publish)** 하면 `content/*.json` 파일이 즉시 바뀝니다.
→ http://localhost:5500 새로고침으로 반영 확인.

> - 두 터미널 모두 켜져 있어야 합니다. 끌 때는 각 터미널에서 **Ctrl + C**.
> - 이 로컬 저장은 git 커밋이 아니라 **내 컴퓨터 파일 수정**입니다.
>   실제 사이트 반영은 그 파일을 GitHub에 올리거나, 배포된 `/admin`에서 다시 저장해야 합니다.
> - `admin/config.yml`의 `local_backend: true`는 **localhost에서만** 동작하고
>   실제 배포 사이트에서는 무시되므로 그대로 둬도 안전합니다.

---

## 자주 묻는 질문

- **수정한 게 사라지나요?** 아니요. git에 커밋되므로 영구 보존됩니다.
- **여러 명이 쓸 수 있나요?** 네. 5단계에서 같은 방법으로 다른 사람도 초대하면 됩니다.
- **나중에 다른 문구도 편집하고 싶어요.** 개발자에게 "admin/config.yml에 항목 추가"를 요청하면
  메뉴/수업/가격 등도 같은 방식으로 관리자에서 편집할 수 있게 확장됩니다.
