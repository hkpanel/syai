/**
 * POST /api/kis/order
 * 주식 현금 주문 (매수/매도)
 * 
 * body: { side: "BUY"|"SELL", code: "069500", qty: 10, price?: 0 }
 * price=0 이면 시장가
 * 
 * ⚠️ TODO: Firebase Auth 인증 검증 추가 필요 (관리자만 호출 가능하게)
 */
import { NextRequest, NextResponse } from "next/server";
import { placeOrder } from "@/lib/kis-api";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { side, code, qty, price = 0 } = body;

    // 입력 검증
    if (!side || !["BUY", "SELL"].includes(side)) {
      return NextResponse.json(
        { success: false, message: "side는 BUY 또는 SELL이어야 합니다" },
        { status: 400 }
      );
    }
    if (!code || typeof code !== "string") {
      return NextResponse.json(
        { success: false, message: "종목코드(code) 필요" },
        { status: 400 }
      );
    }
    if (!qty || qty <= 0) {
      return NextResponse.json(
        { success: false, message: "수량(qty)은 1 이상이어야 합니다" },
        { status: 400 }
      );
    }

    const result = await placeOrder(side, code, qty, price);
    return NextResponse.json({ success: result.success, data: result });
  } catch (err) {
    console.error("주문 오류:", err);
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 }
    );
  }
}
