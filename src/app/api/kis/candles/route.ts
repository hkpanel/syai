/**
 * GET /api/kis/candles?code=069500&start=20240101&end=20241231
 * 국내주식 일봉 데이터 조회
 */
import { NextRequest, NextResponse } from "next/server";
import { getDailyCandles } from "@/lib/kis-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    if (!code || !start || !end) {
      return NextResponse.json(
        { success: false, message: "code, start(YYYYMMDD), end(YYYYMMDD) 파라미터 필요" },
        { status: 400 }
      );
    }

    const candles = await getDailyCandles(code, start, end);
    return NextResponse.json({ success: true, data: candles, count: candles.length });
  } catch (err) {
    console.error("일봉 조회 오류:", err);
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 }
    );
  }
}
