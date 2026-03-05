/**
 * GET /api/kis/price?code=069500
 * GET /api/kis/price?codes=069500,371460,453850  (복수 종목)
 * 한투 현재가 조회
 */
import { NextRequest, NextResponse } from "next/server";
import { getPrice, getPrices } from "@/lib/kis-api";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;
    const code = searchParams.get("code");
    const codes = searchParams.get("codes");

    if (codes) {
      // 복수 종목
      const codeList = codes.split(",").map(c => c.trim()).filter(Boolean);
      const prices = await getPrices(codeList);
      return NextResponse.json({ success: true, data: prices });
    }

    if (code) {
      // 단일 종목
      const price = await getPrice(code);
      return NextResponse.json({ success: true, data: price });
    }

    return NextResponse.json(
      { success: false, message: "code 또는 codes 파라미터 필요" },
      { status: 400 }
    );
  } catch (err) {
    console.error("시세 조회 오류:", err);
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 }
    );
  }
}
