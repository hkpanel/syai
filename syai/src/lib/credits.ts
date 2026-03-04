/**
 * 충전금(크레딧) 시스템 — Firestore
 * 고객이 원화 또는 SYC로 충전 → 매매 시마다 수수료 차감
 *
 * Firestore 구조:
 *   users/{uid}/credits/{id}   ← 충전/차감 이력
 *   users/{uid}/credits/_balance ← 현재 잔액 요약
 */

import {
  collection, doc, onSnapshot, runTransaction,
  query, orderBy, limit, serverTimestamp,
  getDoc, type Unsubscribe,
} from "firebase/firestore";
import { db } from "./firebase";

/* ─── 타입 ─── */
export interface CreditRecord {
  id: string;
  type: "charge" | "deduct" | "refund";
  method: "portone" | "syc" | "system";
  amount: number;
  balance: number;
  desc: string;
  tradeId?: string;
  txHash?: string;
  createdAt?: unknown;
}

export interface CreditBalance {
  total: number;
  totalCharged: number;
  totalUsed: number;
}

/* ─── 수수료 설정 ─── */
export const TRADE_FEE_RATE = 0.001;   // 0.1%
export const SYC_DISCOUNT_RATE = 0.25; // 25% 할인
export const MIN_CHARGE_KRW = 10000;   // 최소 충전 1만원

export function calcTradeFee(amount: number): number {
  return Math.max(100, Math.ceil(amount * TRADE_FEE_RATE));
}

/* ─── 잔액 조회 ─── */
function balRef(uid: string) { return doc(db, "users", uid, "credits", "_balance"); }

export async function getCreditBalance(uid: string): Promise<CreditBalance> {
  const snap = await getDoc(balRef(uid));
  if (snap.exists()) {
    const d = snap.data();
    return { total: d.total || 0, totalCharged: d.totalCharged || 0, totalUsed: d.totalUsed || 0 };
  }
  return { total: 0, totalCharged: 0, totalUsed: 0 };
}

export function subscribeCreditBalance(uid: string, cb: (b: CreditBalance) => void): Unsubscribe {
  return onSnapshot(balRef(uid), (snap) => {
    if (snap.exists()) {
      const d = snap.data();
      cb({ total: d.total || 0, totalCharged: d.totalCharged || 0, totalUsed: d.totalUsed || 0 });
    } else { cb({ total: 0, totalCharged: 0, totalUsed: 0 }); }
  });
}

/* ─── 충전 ─── */
export async function chargeCredits(
  uid: string, amount: number, method: "portone" | "syc",
  opts?: { paymentId?: string; txHash?: string; desc?: string },
): Promise<CreditRecord> {
  if (amount <= 0) throw new Error("충전 금액은 0보다 커야 합니다");
  const rid = `chg_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
  const col = collection(db, "users", uid, "credits");

  return runTransaction(db, async (tx) => {
    const snap = await tx.get(balRef(uid));
    const cur = snap.exists() ? (snap.data().total || 0) : 0;
    const charged = snap.exists() ? (snap.data().totalCharged || 0) : 0;
    const newBal = cur + amount;

    tx.set(balRef(uid), {
      total: newBal, totalCharged: charged + amount,
      totalUsed: snap.exists() ? (snap.data().totalUsed || 0) : 0,
      updatedAt: serverTimestamp(),
    }, { merge: true });

    const rec: CreditRecord = {
      id: rid, type: "charge", method, amount, balance: newBal,
      desc: opts?.desc || (method === "syc" ? "SYC 코인 충전" : "원화 충전"),
      txHash: opts?.txHash,
    };
    tx.set(doc(col, rid), { ...rec, createdAt: serverTimestamp() });
    return rec;
  });
}

/* ─── 매매 수수료 차감 ─── */
export async function deductTradeFee(
  uid: string, tradeAmount: number, tradeId: string, desc?: string,
): Promise<{ success: boolean; fee: number; balance: number; error?: string }> {
  const fee = calcTradeFee(tradeAmount);
  try {
    return await runTransaction(db, async (tx) => {
      const snap = await tx.get(balRef(uid));
      const cur = snap.exists() ? (snap.data().total || 0) : 0;
      if (cur < fee) throw new Error(`충전금 부족 (잔액: ${cur.toLocaleString()}원, 수수료: ${fee.toLocaleString()}원)`);
      const newBal = cur - fee;
      const used = snap.exists() ? (snap.data().totalUsed || 0) : 0;

      tx.set(balRef(uid), { total: newBal, totalUsed: used + fee, updatedAt: serverTimestamp() }, { merge: true });
      const rid = `ded_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      tx.set(doc(collection(db, "users", uid, "credits"), rid), {
        id: rid, type: "deduct", method: "system", amount: -fee, balance: newBal,
        desc: desc || `매매 수수료 (₩${tradeAmount.toLocaleString()})`, tradeId, createdAt: serverTimestamp(),
      });
      return { success: true, fee, balance: newBal };
    });
  } catch (e: unknown) {
    return { success: false, fee, balance: 0, error: (e as { message?: string }).message || "차감 실패" };
  }
}

/* ─── 이력 조회 ─── */
export function subscribeCreditHistory(uid: string, cb: (r: CreditRecord[]) => void, max = 50): Unsubscribe {
  const q = query(collection(db, "users", uid, "credits"), orderBy("createdAt", "desc"), limit(max));
  return onSnapshot(q, (snap) => {
    const records: CreditRecord[] = [];
    snap.forEach((d) => { if (d.id !== "_balance") records.push({ id: d.id, ...d.data() } as CreditRecord); });
    cb(records);
  });
}
