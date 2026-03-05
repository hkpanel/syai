/**
 * GET /api/kis/test
 * 한투 API 연결 테스트
 * 토큰 발급 → 삼성전자(005930) 시세 조회로 정상 연결 확인
 */
import { NextResponse } from "next/server";
import { getAccessToken, getPrice } from "@/lib/kis-api";

export async function GET() {
  const results: Record<string, unknown> = {};

  // 1) 토큰 발급 테스트
  try {
    const token = await getAccessToken();
    results.token = {
      success: true,
      preview: token.slice(0, 20) + "...",
    };
  } catch (err) {
    results.token = { success: false, error: String(err) };
    return NextResponse.json({ success: false, results }, { status: 500 });
  }

  // 2) 시세 조회 테스트 (삼성전자)
  try {
    const price = await getPrice("005930");
    results.price = {
      success: true,
      data: price,
    };
  } catch (err) {
    results.price = { success: false, error: String(err) };
  }

  const allOk = Object.values(results).every(
    (r) => (r as Record<string, unknown>).success === true
  );

  return NextResponse.json({
    success: allOk,
    message: allOk ? "한투 API 연결 성공!" : "일부 테스트 실패",
    results,
  });
}
