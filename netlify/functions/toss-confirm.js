/* =====================================================================
   (선택 · 고급) 토스페이먼츠 결제 승인 검증 — Netlify Function
   ---------------------------------------------------------------------
   ⚠️ 무백엔드 '링크페이/PayPal 노코드'만 쓰는 기본 구성에서는 이 파일이 필요 없습니다.
   결제위젯/SDK로 '동적 금액·서버측 금액검증·회원권 자동발급'을 하려는 경우에만 사용합니다.

   동작: 프론트 결제창 인증 성공 → 이 함수로 paymentKey·orderId·amount 전달
        → 시크릿 키로 토스 confirm API 호출(서버에서만) → 승인 결과 반환.
   필수: Netlify 환경변수 TOSS_SECRET_KEY 설정 (프론트에 절대 노출 금지)
   참고: https://docs.tosspayments.com/guides/v2/get-started/payment-flow
   ===================================================================== */
export async function handler(event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }
  const secret = process.env.TOSS_SECRET_KEY;
  if (!secret) {
    return { statusCode: 500, body: JSON.stringify({ error: "TOSS_SECRET_KEY 미설정" }) };
  }
  try {
    const { paymentKey, orderId, amount } = JSON.parse(event.body || "{}");
    if (!paymentKey || !orderId || !amount) {
      return { statusCode: 400, body: JSON.stringify({ error: "필수 파라미터 누락" }) };
    }
    // TODO: 결제 전 저장해 둔 (orderId→amount)와 amount 일치 여부를 먼저 검증해 위변조 차단

    const res = await fetch("https://api.tosspayments.com/v1/payments/confirm", {
      method: "POST",
      headers: {
        Authorization: "Basic " + Buffer.from(secret + ":").toString("base64"),
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ paymentKey, orderId, amount }),
    });
    const data = await res.json();
    return { statusCode: res.status, body: JSON.stringify(data) };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
}
