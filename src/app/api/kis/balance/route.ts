/**
 * GET /api/kis/balance
 * 한투 계좌 잔고 조회
 */
import { NextResponse } from "next/server";
import { getBalance } from "@/lib/kis-api";

export async function GET() {
  try {
    const balance = await getBalance();
    return NextResponse.json({ success: true, data: balance });
  } catch (err) {
    console.error("잔고 조회 오류:", err);
    return NextResponse.json(
      { success: false, message: String(err) },
      { status: 500 }
    );
  }
}
