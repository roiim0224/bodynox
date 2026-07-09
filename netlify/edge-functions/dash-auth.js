// 대시보드 비밀번호 잠금 (HTTP Basic Auth)
// - Netlify 환경변수 DASH_PASSWORD 가 설정되면 /dashboard/* 전체가 잠깁니다.
// - DASH_PASSWORD 가 없으면 잠그지 않습니다(설정 전 잠금 사고 방지, fail-open).
// - 아이디는 bodynox 고정, 비밀번호는 DASH_PASSWORD 값.
//   같은 realm 을 사용하므로 페이지·데이터파일(data/schedule.json) 요청에
//   브라우저가 인증정보를 자동 재사용합니다.

export default async (request) => {
  const pass = Netlify.env.get("DASH_PASSWORD");
  if (!pass) return; // 미설정 → 통과(잠금 비활성)

  const header = request.headers.get("authorization") || "";
  const expected = "Basic " + btoa("bodynox:" + pass);

  if (header === expected) return; // 인증 성공 → 통과

  return new Response("BODYNOX 대시보드 — 로그인이 필요합니다.", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="BODYNOX Dashboard", charset="UTF-8"',
      "Content-Type": "text/plain; charset=utf-8",
    },
  });
};

export const config = { path: ["/dashboard", "/dashboard/*"] };
