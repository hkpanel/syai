/**
 * DeepStock 대시보드
 * /deepstock 경로
 * 한투 API키 등록 + 포트폴리오 + 전략 + 매매이력
 * v2: 수수료 0.05% 반영
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthChange, signOut } from "@/lib/auth";
import type { User } from "firebase/auth";
import AuthModal from "@/app/components/AuthModal";

/* ─── 카드 컴포넌트 ─── */
function Card({ title, children, action, style: s }: {
  title: string; children: React.ReactNode; action?: React.ReactNode; style?: React.CSSProperties;
}) {
  return (
    <div style={{
      background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: 16, padding: 24, ...s,
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: "#e8e8ed" }}>{title}</h3>
        {action}
      </div>
      {children}
    </div>
  );
}

/* ─── 모의 데이터 (나중에 실제 API로 교체) ─── */
const MOCK_HOLDINGS = [
  { code: "005930", name: "삼성전자", qty: 10, avgPrice: 72000, curPrice: 74500, ratio: 30 },
  { code: "000660", name: "SK하이닉스", qty: 5, avgPrice: 185000, curPrice: 192000, ratio: 25 },
  { code: "035420", name: "NAVER", qty: 8, avgPrice: 210000, curPrice: 205000, ratio: 20 },
  { code: "051910", name: "LG화학", qty: 3, avgPrice: 380000, curPrice: 395000, ratio: 15 },
  { code: "006400", name: "삼성SDI", qty: 4, avgPrice: 420000, curPrice: 410000, ratio: 10 },
];

// 수수료: 거래금액 × 0.05%
const MOCK_TRADES = [
  { time: "14:32", type: "매수", name: "삼성전자", qty: 2, price: 74500, fee: 75 },   // 149,000 × 0.05%
  { time: "13:15", type: "매도", name: "카카오", qty: 5, price: 52300, fee: 131 },    // 261,500 × 0.05%
  { time: "10:02", type: "매수", name: "SK하이닉스", qty: 1, price: 191500, fee: 96 }, // 191,500 × 0.05%
  { time: "09:31", type: "리밸런싱", name: "포트폴리오 #1", qty: 0, price: 0, fee: 830 },
];

export default function DeepStockPage() {
  const [kisRegistered, setKisRegistered] = useState(false);
  const [strategyRunning, setStrategyRunning] = useState(false);
  const [tab, setTab] = useState<"overview" | "strategy" | "fee" | "history">("overview");
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => { const unsub = onAuthChange(setUser); return () => unsub(); }, []);

  // KIS API 키 폼
  const [kisForm, setKisForm] = useState({ htsId: "", appKey: "", appSecret: "", accountNo: "" });
  const [kisSaving, setKisSaving] = useState(false);
  const [kisMode, setKisMode] = useState<"real" | "mock" | null>(null); // real=실전, mock=모의
  const [kisLoaded, setKisLoaded] = useState(false);

  // 전략 프로파일
  const [selectedProfile, setSelectedProfile] = useState<string>("balanced");

  // 로그인 시 Firestore에서 KIS 설정 불러오기
  useEffect(() => {
    if (!user) { setKisRegistered(false); setKisLoaded(false); setKisMode(null); return; }
    (async () => {
      try {
        const { doc: fsDoc, getDoc } = await import("firebase/firestore");
        const { db } = await import("@/lib/firebase");
        const snap = await getDoc(fsDoc(db, "users", user.uid, "deepstock-config", "kis"));
        if (snap.exists()) {
          const d = snap.data();
          setKisForm({ htsId: d.htsId || "", appKey: d.appKey ? "••••••••" : "", appSecret: d.appSecret ? "••••••••" : "", accountNo: d.accountNo || "" });
          setKisMode(d.mode || "real");
          setKisRegistered(true);
          setSelectedProfile(d.profile || "balanced");
        }
        setKisLoaded(true);
      } catch (e) { console.error("KIS 설정 로드 실패:", e); setKisLoaded(true); }
    })();
  }, [user]);

  // KIS API 키 저장
  const saveKisConfig = async (mode: "real" | "mock") => {
    if (!user) { setShowAuth(true); return; }
    if (mode === "real" && (!kisForm.appKey || kisForm.appKey === "••••••••" && !kisForm.htsId)) {
      alert("AppKey와 AppSecret을 입력해주세요."); return;
    }
    setKisSaving(true);
    try {
      const { doc: fsDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      const data: Record<string, unknown> = {
        mode,
        profile: selectedProfile,
        updatedAt: serverTimestamp(),
      };
      if (mode === "real") {
        if (kisForm.htsId) data.htsId = kisForm.htsId;
        if (kisForm.appKey && kisForm.appKey !== "••••••••") data.appKey = kisForm.appKey;
        if (kisForm.appSecret && kisForm.appSecret !== "••••••••") data.appSecret = kisForm.appSecret;
        if (kisForm.accountNo) data.accountNo = kisForm.accountNo;
      }
      await setDoc(fsDoc(db, "users", user.uid, "deepstock-config", "kis"), data, { merge: true });
      setKisMode(mode);
      setKisRegistered(true);
      alert(mode === "mock" ? "모의투자 모드로 설정되었습니다!" : "API키가 저장되었습니다!");
    } catch (e) {
      console.error("KIS 저장 실패:", e);
      alert("저장 실패: " + String(e));
    }
    setKisSaving(false);
  };

  // 프로파일 저장
  const saveProfile = async (profile: string) => {
    setSelectedProfile(profile);
    if (!user) return;
    try {
      const { doc: fsDoc, setDoc, serverTimestamp } = await import("firebase/firestore");
      const { db } = await import("@/lib/firebase");
      await setDoc(fsDoc(db, "users", user.uid, "deepstock-config", "kis"), { profile, updatedAt: serverTimestamp() }, { merge: true });
    } catch (e) { console.error("프로파일 저장 실패:", e); }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#0c0808", color: "#e8e8ed" }}>
      <style>{`
        .ds-tab { padding: 10px 20px; border: none; background: none; color: #6b6b7e; font-size: 14px;
          font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .ds-tab:hover { color: #e8e8ed; }
        .ds-tab.active { color: #FF6B35; border-bottom-color: #FF6B35; }
        .ds-btn { padding: 10px 20px; border: none; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; }
        .ds-btn-green { background: linear-gradient(135deg, #FF6B35, #FF2E63); color: #fff; }
        .ds-btn-red { background: rgba(255,107,107,0.12); color: #ff6b6b; }
        .ds-btn-outline { background: none; border: 1px solid rgba(255,255,255,0.1); color: #e8e8ed; }
        .h-row { display: grid; grid-template-columns: 2fr 1fr 1fr 1fr 1fr; gap: 12px;
          padding: 14px 0; border-bottom: 1px solid rgba(255,255,255,0.04); align-items: center; }
        .h-row:last-child { border-bottom: none; }
        @media (max-width: 768px) {
          .h-row { grid-template-columns: 1.5fr 1fr 1fr; font-size: 12px; }
          .h-row .hm { display: none; }
          .desk-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>

      {/* 네비게이션 */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(8,8,12,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          maxWidth: 1280, margin: "0 auto", padding: "0 24px",
          height: 64, display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{
              fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px",
              background: "linear-gradient(135deg, #FF6B35, #FF2E63)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>SY.ai</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#FF6B35" }}>충전금 ₩0</span>
            </div>
            {user ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: 13, color: "#e8e8ed", fontWeight: 500 }}>{user.displayName || "회원"}</span>
                <button onClick={() => signOut()} style={{ padding: "6px 10px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "#6b6b7e", fontSize: 12, cursor: "pointer" }}>로그아웃</button>
              </div>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ padding: "7px 14px", borderRadius: 8, border: "none", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff", fontSize: 13, fontWeight: 600, cursor: "pointer" }}>로그인</button>
            )}
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8e8ed" }}>DeepStock</h1>
            <p style={{ fontSize: 13, color: "#6b6b7e", marginTop: 4 }}>국내 ETF AI 자동 리밸런싱 | 한국투자증권 API 연동</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {strategyRunning ? (
              <button className="ds-btn ds-btn-red" onClick={() => setStrategyRunning(false)}>⏸ 전략 일시정지</button>
            ) : (
              <button className="ds-btn ds-btn-green" onClick={() => {
                if (!user) { setShowAuth(true); return; }
                if (!kisRegistered) { alert("먼저 한국투자증권 API키를 등록해주세요."); return; }
                setStrategyRunning(true);
              }}>▶ 전략 시작</button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {(["overview", "strategy", "fee", "history"] as const).map((t) => (
            <button key={t} className={`ds-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {{ overview: "📊 대시보드", strategy: "🎯 전략 설정", fee: "💰 수수료", history: "📋 매매 이력" }[t]}
            </button>
          ))}
        </div>

        {/* ═══ 대시보드 탭 ═══ */}
        {tab === "overview" && (
          <>
            {/* API 미등록 경고 */}
            {!kisRegistered && (
              <div style={{
                background: "rgba(240,185,11,0.06)", border: "1px solid rgba(240,185,11,0.15)",
                borderRadius: 14, padding: "20px 24px", marginBottom: 24,
                display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16,
              }}>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#f0b90b", marginBottom: 4 }}>한국투자증권 API 키 미등록</div>
                  <div style={{ fontSize: 13, color: "#8b8b9e" }}>자동매매를 시작하려면 한투 Open API의 AppKey와 AppSecret을 등록해주세요.</div>
                </div>
                <button className="ds-btn" style={{ background: "rgba(240,185,11,0.12)", color: "#f0b90b" }}
                  onClick={() => setTab("strategy")}>API키 등록하기 →</button>
              </div>
            )}

            {/* 요약 카드 */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 16, marginBottom: 24 }}>
              {[
                { label: "총 평가금액", value: "₩12,450,000", color: "#e8e8ed" },
                { label: "총 수익률", value: "+4.28%", color: "#FF6B35" },
                { label: "오늘 수익", value: "+₩85,000", color: "#FF6B35" },
                { label: "충전금 잔액", value: "₩48,200", color: "#f0b90b" },
              ].map((s, i) => (
                <div key={i} style={{
                  background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: 14, padding: "20px 24px",
                }}>
                  <div style={{ fontSize: 12, color: "#6b6b7e", marginBottom: 8 }}>{s.label}</div>
                  <div style={{ fontSize: 24, fontWeight: 700, color: s.color }}>{s.value}</div>
                </div>
              ))}
            </div>

            {/* 보유종목 + 최근매매 */}
            <div className="desk-grid" style={{ display: "grid", gridTemplateColumns: "1fr 380px", gap: 20 }}>
              <Card title="보유 종목" action={<span style={{ fontSize: 12, color: "#6b6b7e" }}>5종목</span>}>
                <div className="h-row" style={{ color: "#6b6b7e", fontSize: 12, fontWeight: 500, padding: "0 0 10px" }}>
                  <span>종목</span><span style={{ textAlign: "right" }}>현재가</span>
                  <span style={{ textAlign: "right" }}>수익률</span>
                  <span className="hm" style={{ textAlign: "right" }}>수량</span>
                  <span className="hm" style={{ textAlign: "right" }}>비중</span>
                </div>
                {MOCK_HOLDINGS.map((h) => {
                  const pnl = ((h.curPrice - h.avgPrice) / h.avgPrice * 100).toFixed(2);
                  const plus = h.curPrice >= h.avgPrice;
                  return (
                    <div key={h.code} className="h-row" style={{ fontSize: 13 }}>
                      <div>
                        <div style={{ fontWeight: 600, color: "#e8e8ed" }}>{h.name}</div>
                        <div style={{ fontSize: 11, color: "#6b6b7e" }}>{h.code}</div>
                      </div>
                      <div style={{ textAlign: "right", color: "#e8e8ed", fontWeight: 500 }}>₩{h.curPrice.toLocaleString()}</div>
                      <div style={{ textAlign: "right", fontWeight: 600, color: plus ? "#FF6B35" : "#ff6b6b" }}>{plus ? "+" : ""}{pnl}%</div>
                      <div className="hm" style={{ textAlign: "right", color: "#8b8b9e" }}>{h.qty}주</div>
                      <div className="hm" style={{ textAlign: "right" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(255,107,53,0.08)", color: "#FF6B35", fontSize: 12 }}>{h.ratio}%</span>
                      </div>
                    </div>
                  );
                })}
              </Card>
              <Card title="오늘 매매" style={{ height: "fit-content" }}>
                {MOCK_TRADES.map((t, i) => (
                  <div key={i} style={{
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 0", borderBottom: i < MOCK_TRADES.length - 1 ? "1px solid rgba(255,255,255,0.04)" : "none",
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{
                        width: 32, height: 32, borderRadius: 8, display: "flex",
                        alignItems: "center", justifyContent: "center", fontSize: 12, fontWeight: 700,
                        background: t.type === "매수" ? "rgba(255,107,53,0.1)" : t.type === "매도" ? "rgba(255,107,107,0.1)" : "rgba(240,185,11,0.1)",
                        color: t.type === "매수" ? "#FF6B35" : t.type === "매도" ? "#ff6b6b" : "#f0b90b",
                      }}>{t.type === "매수" ? "B" : t.type === "매도" ? "S" : "R"}</div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: "#e8e8ed" }}>{t.name}</div>
                        <div style={{ fontSize: 11, color: "#6b6b7e" }}>{t.time} {t.qty > 0 && `· ${t.qty}주`}</div>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      {t.price > 0 && <div style={{ fontSize: 13, fontWeight: 500, color: "#e8e8ed" }}>₩{t.price.toLocaleString()}</div>}
                      <div style={{ fontSize: 11, color: "#6b6b7e" }}>수수료 ₩{t.fee.toLocaleString()}</div>
                    </div>
                  </div>
                ))}
                <div style={{
                  marginTop: 12, padding: "10px 14px", borderRadius: 8,
                  background: "rgba(255,255,255,0.02)", display: "flex", justifyContent: "space-between",
                }}>
                  <span style={{ fontSize: 12, color: "#6b6b7e" }}>오늘 총 수수료</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#FF6B35" }}>₩{MOCK_TRADES.reduce((s, t) => s + t.fee, 0).toLocaleString()}</span>
                </div>
              </Card>
            </div>

            {/* 전략 상태 */}
            <Card title="전략 상태" style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: strategyRunning ? "#FF6B35" : "#6b6b7e",
                  boxShadow: strategyRunning ? "0 0 12px rgba(255,107,53,0.4)" : "none",
                }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8ed" }}>
                    {strategyRunning ? "전략 실행 중" : "전략 정지됨"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b6b7e" }}>
                    {strategyRunning ? "리밸런싱 + AI 시장분석 혼합 전략 | 다음 체크: 15:00"
                      : kisRegistered ? "전략 시작 버튼을 눌러주세요" : "한투 API키를 먼저 등록해주세요"}
                  </div>
                </div>
              </div>
            </Card>
          </>
        )}

        {/* ═══ 전략 설정 탭 ═══ */}
        {tab === "strategy" && (
          <div style={{ maxWidth: 640 }}>
            <Card title="한국투자증권 API 키 등록" style={{ marginBottom: 20 }}>
              <p style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.7, marginBottom: 20 }}>
                한국투자증권 KIS Developers에서 발급받은 AppKey와 AppSecret을 등록해주세요.<br />
                API키는 암호화되어 안전하게 저장되며, 오직 매매 실행 시에만 사용됩니다.
              </p>
              {kisMode && <div style={{ marginBottom: 16, padding: "10px 14px", borderRadius: 8, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.1)" }}>
                <span style={{ fontSize: 13, color: "#FF6B35", fontWeight: 600 }}>✅ {kisMode === "mock" ? "모의투자 모드" : "실전 모드"} 설정됨</span>
              </div>}
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "HTS ID", placeholder: "한투 HTS 로그인 ID", type: "text", key: "htsId" },
                  { label: "AppKey", placeholder: "36자리 AppKey", type: "password", key: "appKey" },
                  { label: "AppSecret", placeholder: "180자리 AppSecret", type: "password", key: "appSecret" },
                  { label: "계좌번호", placeholder: "00000000-01", type: "text", key: "accountNo" },
                ].map((f) => (
                  <div key={f.label}>
                    <label style={{ fontSize: 12, color: "#6b6b7e", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder}
                      value={kisForm[f.key as keyof typeof kisForm]}
                      onChange={(e) => setKisForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                      style={{
                        width: "100%", padding: "12px 16px", borderRadius: 10,
                        border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)",
                        color: "#e8e8ed", fontSize: 14, outline: "none", boxSizing: "border-box" as const,
                      }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button className="ds-btn ds-btn-outline" style={{ flex: 1 }} disabled={kisSaving} onClick={() => saveKisConfig("mock")}>{kisSaving ? "저장 중..." : "모의투자 모드"}</button>
                <button className="ds-btn ds-btn-green" style={{ flex: 1 }} disabled={kisSaving} onClick={() => saveKisConfig("real")}>{kisSaving ? "저장 중..." : "API키 저장"}</button>
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.02)", fontSize: 12, color: "#6b6b7e", lineHeight: 1.7 }}>
                아직 API키가 없으시다면? <a href="https://apiportal.koreainvestment.com" target="_blank" style={{ color: "#FF6B35" }}>KIS Developers 바로가기 →</a>
              </div>
            </Card>

            <Card title="전략 프로파일 선택">
              {[
                {
                  id: "conservative",
                  name: "안정형 (Conservative)",
                  target: "연 8~12% 목표",
                  mdd: "MDD -15% 이내",
                  desc: "커버드콜 월배당 ETF 중심. 채권 포함으로 변동성을 낮추고 꾸준한 현금흐름을 추구합니다.",
                },
                {
                  id: "balanced",
                  name: "균형형 (Balanced)",
                  target: "연 15~25% 목표",
                  mdd: "MDD -25% 이내",
                  desc: "S&P500 성장성 + 배당 안정성 혼합. 가장 많은 투자자가 선택하는 균형 잡힌 전략입니다.",
                },
                {
                  id: "aggressive",
                  name: "공격형 (Aggressive)",
                  target: "연 25%+ 목표",
                  mdd: "MDD -35% 각오",
                  desc: "나스닥·테크 섹터 집중. 변동성을 감수하고 장기 최대 수익을 추구합니다.",
                },
              ].map((p) => {
                const selected = selectedProfile === p.id;
                return (
                <div key={p.id} onClick={() => saveProfile(p.id)} style={{
                  padding: 20, borderRadius: 12, marginBottom: 12, cursor: "pointer",
                  border: selected ? "2px solid rgba(255,107,53,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  background: selected ? "rgba(255,107,53,0.05)" : "rgba(255,255,255,0.01)",
                  transition: "all 0.2s",
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 8 }}>
                    {selected && (
                      <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "rgba(255,107,53,0.12)", color: "#FF6B35" }}>선택됨</span>
                    )}
                    {p.id === "balanced" && !selected && (
                      <span style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "#6b6b7e" }}>추천</span>
                    )}
                    <span style={{ fontSize: 15, fontWeight: 700, color: "#e8e8ed" }}>{p.name}</span>
                  </div>
                  <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 12, color: "#FF6B35", padding: "2px 8px", background: "rgba(255,107,53,0.08)", borderRadius: 4 }}>{p.target}</span>
                    <span style={{ fontSize: 12, color: "#6b6b7e", padding: "2px 8px", background: "rgba(255,255,255,0.04)", borderRadius: 4 }}>{p.mdd}</span>
                  </div>
                  <p style={{ fontSize: 13, color: "#6b6b7e", lineHeight: 1.7 }}>{p.desc}</p>
                </div>
                );
              })}
              <p style={{ fontSize: 11, color: "#4a4a5e", lineHeight: 1.7, marginTop: 8 }}>
                ※ 레버리지 ETF는 모든 프로파일에서 제외됩니다.<br />
                ※ 과거 시뮬레이션 수익률은 미래 수익을 보장하지 않습니다.
              </p>
            </Card>
          </div>
        )}

        {/* ═══ 수수료 탭 ═══ */}
        {tab === "fee" && (
          <div style={{ maxWidth: 720 }}>
            {/* 기본 수수료 */}
            <Card title="💰 기본 수수료" style={{ marginBottom: 20 }}>
              <div style={{
                textAlign: "center", padding: "32px 0", marginBottom: 24,
                borderBottom: "1px solid rgba(255,255,255,0.04)",
              }}>
                <div style={{ fontSize: 56, fontWeight: 800, color: "#FF6B35", letterSpacing: "-1px" }}>0.05%</div>
                <div style={{ fontSize: 15, color: "#8b8b9e", marginTop: 10 }}>매수 · 매도 · 리밸런싱 동일 적용</div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {[
                  { label: "1,000만원 매수 시", value: "수수료 5,000원" },
                  { label: "500만원 매도 시", value: "수수료 2,500원" },
                  { label: "리밸런싱으로 인한 매매", value: "동일 수수료 적용" },
                ].map((ex) => (
                  <div key={ex.label} style={{
                    display: "flex", justifyContent: "space-between", alignItems: "center",
                    padding: "14px 18px", borderRadius: 10, background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}>
                    <span style={{ fontSize: 14, color: "#8b8b9e" }}>{ex.label}</span>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#e8e8ed" }}>{ex.value}</span>
                  </div>
                ))}
              </div>
              <div style={{
                marginTop: 20, padding: "14px 18px", borderRadius: 10,
                background: "rgba(240,185,11,0.04)", border: "1px solid rgba(240,185,11,0.1)",
              }}>
                <p style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.7 }}>
                  ⚠️ DeepStock 수수료는 SY.ai 플랫폼 이용 수수료입니다.<br />
                  한국투자증권 자체 거래 수수료(약 0.015%)는 별도 부과됩니다.
                </p>
              </div>
            </Card>

            {/* 크레딧 충전 */}
            <Card title="💳 크레딧 충전 방식">
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                <div style={{
                  padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(255,255,255,0.06)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e8ed", marginBottom: 4 }}>🏦 원화 결제</div>
                      <div style={{ fontSize: 13, color: "#6b6b7e" }}>카드 · 무통장 입금 (PortOne PG 연동)</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#4a90d9" }}>1:1</div>
                      <div style={{ fontSize: 12, color: "#6b6b7e" }}>만원 → 10,000 크레딧</div>
                    </div>
                  </div>
                </div>
                <div style={{
                  padding: 20, borderRadius: 14, background: "rgba(255,107,53,0.04)",
                  border: "2px solid rgba(255,107,53,0.15)",
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                        <div style={{ fontSize: 16, fontWeight: 700, color: "#e8e8ed" }}>🪙 SYC 코인 결제</div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: "#FF6B35", padding: "2px 8px", background: "rgba(255,107,53,0.12)", borderRadius: 4 }}>추천</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#6b6b7e" }}>MetaMask 연동 (PancakeSwap 시세 기준)</div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: 18, fontWeight: 800, color: "#FF6B35" }}>20~30%</div>
                      <div style={{ fontSize: 12, color: "#FF6B35" }}>할인 적용</div>
                    </div>
                  </div>
                  <div style={{ fontSize: 12, color: "#8b8b9e", lineHeight: 1.7, marginTop: 10 }}>
                    SYC 코인으로 충전하면 원화 대비 20~30% 할인된 크레딧을 받을 수 있습니다.<br />
                    PancakeSwap 현재 시세 기준으로 자동 계산됩니다.
                  </div>
                  <a href="https://www.sykoreapanel.com/syc" target="_blank" style={{
                    display: "inline-block", marginTop: 14, padding: "8px 16px", borderRadius: 8,
                    background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff",
                    fontSize: 13, fontWeight: 600, textDecoration: "none",
                  }}>SYC 코인 구매하기 →</a>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* ═══ 매매 이력 탭 ═══ */}
        {tab === "history" && (
          <Card title="매매 이력">
            <div style={{ fontSize: 14, color: "#6b6b7e", textAlign: "center", padding: 40 }}>
              아직 매매 이력이 없습니다. 전략을 시작하면 여기에 매매 내역이 기록됩니다.
            </div>
          </Card>
        )}
      </div>

      {/* 푸터 */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#4a4a5e", lineHeight: 1.8 }}>
          SY.ai는 투자 자문 서비스가 아닙니다. 모든 투자 판단은 본인 책임 하에 이루어져야 합니다.<br />
          © 2026 SY.ai · SY한국판넬 · SY Coin Project
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={() => setShowAuth(false)} />}
    </div>
  );
}
