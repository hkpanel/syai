/**
 * DeepStock 대시보드
 * /deepstock 경로
 * 한투 API키 등록 + 포트폴리오 + 전략 + 매매이력
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

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

const MOCK_TRADES = [
  { time: "14:32", type: "매수", name: "삼성전자", qty: 2, price: 74500, fee: 149 },
  { time: "13:15", type: "매도", name: "카카오", qty: 5, price: 52300, fee: 262 },
  { time: "10:02", type: "매수", name: "SK하이닉스", qty: 1, price: 191500, fee: 192 },
  { time: "09:31", type: "리밸런싱", name: "포트폴리오 #1", qty: 0, price: 0, fee: 500 },
];

export default function DeepStockPage() {
  const [kisRegistered, setKisRegistered] = useState(false);
  const [strategyRunning, setStrategyRunning] = useState(false);
  const [tab, setTab] = useState<"overview" | "strategy" | "history">("overview");

  return (
    <div style={{ minHeight: "100vh", background: "#08080c", color: "#e8e8ed" }}>
      <style>{`
        .ds-tab { padding: 10px 20px; border: none; background: none; color: #6b6b7e; font-size: 14px;
          font-weight: 500; cursor: pointer; border-bottom: 2px solid transparent; transition: all 0.2s; }
        .ds-tab:hover { color: #e8e8ed; }
        .ds-tab.active { color: #00d4aa; border-bottom-color: #00d4aa; }
        .ds-btn { padding: 10px 20px; border: none; border-radius: 10px; font-size: 13px; font-weight: 600;
          cursor: pointer; transition: all 0.2s; }
        .ds-btn-green { background: linear-gradient(135deg, #00d4aa, #00b894); color: #08080c; }
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
              background: "linear-gradient(135deg, #00d4aa, #00b894)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>SY.ai</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              display: "flex", alignItems: "center", gap: 6,
              padding: "6px 12px", borderRadius: 8,
              background: "rgba(0,212,170,0.08)", border: "1px solid rgba(0,212,170,0.15)",
            }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: "#00d4aa" }}>충전금 ₩0</span>
            </div>
          </div>
        </div>
      </nav>

      {/* 메인 콘텐츠 */}
      <div style={{ maxWidth: 1280, margin: "0 auto", padding: "32px 24px 80px" }}>
        {/* 헤더 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8, flexWrap: "wrap", gap: 12 }}>
          <div>
            <h1 style={{ fontSize: 28, fontWeight: 700, color: "#e8e8ed" }}>DeepStock</h1>
            <p style={{ fontSize: 13, color: "#6b6b7e", marginTop: 4 }}>한국투자증권 API 연동 자동매매</p>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {strategyRunning ? (
              <button className="ds-btn ds-btn-red" onClick={() => setStrategyRunning(false)}>⏸ 전략 일시정지</button>
            ) : (
              <button className="ds-btn ds-btn-green" onClick={() => {
                if (!kisRegistered) { alert("먼저 한국투자증권 API키를 등록해주세요."); return; }
                setStrategyRunning(true);
              }}>▶ 전략 시작</button>
            )}
          </div>
        </div>

        {/* 탭 */}
        <div style={{ display: "flex", gap: 4, marginBottom: 28, borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
          {(["overview", "strategy", "history"] as const).map((t) => (
            <button key={t} className={`ds-tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
              {{ overview: "📊 대시보드", strategy: "🎯 전략 설정", history: "📋 매매 이력" }[t]}
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
                { label: "총 수익률", value: "+4.28%", color: "#00d4aa" },
                { label: "오늘 수익", value: "+₩85,000", color: "#00d4aa" },
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
                      <div style={{ textAlign: "right", fontWeight: 600, color: plus ? "#00d4aa" : "#ff6b6b" }}>{plus ? "+" : ""}{pnl}%</div>
                      <div className="hm" style={{ textAlign: "right", color: "#8b8b9e" }}>{h.qty}주</div>
                      <div className="hm" style={{ textAlign: "right" }}>
                        <span style={{ padding: "2px 8px", borderRadius: 4, background: "rgba(0,212,170,0.08)", color: "#00d4aa", fontSize: 12 }}>{h.ratio}%</span>
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
                        background: t.type === "매수" ? "rgba(0,212,170,0.1)" : t.type === "매도" ? "rgba(255,107,107,0.1)" : "rgba(240,185,11,0.1)",
                        color: t.type === "매수" ? "#00d4aa" : t.type === "매도" ? "#ff6b6b" : "#f0b90b",
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
              </Card>
            </div>

            {/* 전략 상태 */}
            <Card title="전략 상태" style={{ marginTop: 20 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 16, padding: "8px 0" }}>
                <div style={{
                  width: 10, height: 10, borderRadius: "50%",
                  background: strategyRunning ? "#00d4aa" : "#6b6b7e",
                  boxShadow: strategyRunning ? "0 0 12px rgba(0,212,170,0.4)" : "none",
                }} />
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: "#e8e8ed" }}>
                    {strategyRunning ? "전략 실행 중" : "전략 정지됨"}
                  </div>
                  <div style={{ fontSize: 12, color: "#6b6b7e" }}>
                    {strategyRunning ? "리밸런싱 + 차트매매 혼합 전략 | 다음 체크: 15:00"
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
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {[
                  { label: "HTS ID", placeholder: "한투 HTS 로그인 ID", type: "text" },
                  { label: "AppKey", placeholder: "36자리 AppKey", type: "password" },
                  { label: "AppSecret", placeholder: "180자리 AppSecret", type: "password" },
                  { label: "계좌번호", placeholder: "00000000-01", type: "text" },
                ].map((f) => (
                  <div key={f.label}>
                    <label style={{ fontSize: 12, color: "#6b6b7e", display: "block", marginBottom: 4 }}>{f.label}</label>
                    <input type={f.type} placeholder={f.placeholder} style={{
                      width: "100%", padding: "12px 16px", borderRadius: 10,
                      border: "1px solid rgba(255,255,255,0.1)", background: "rgba(255,255,255,0.03)",
                      color: "#e8e8ed", fontSize: 14, outline: "none",
                    }} />
                  </div>
                ))}
              </div>
              <div style={{ display: "flex", gap: 8, marginTop: 20 }}>
                <button className="ds-btn ds-btn-outline" style={{ flex: 1 }} onClick={() => setKisRegistered(true)}>모의투자 모드</button>
                <button className="ds-btn ds-btn-green" style={{ flex: 1 }} onClick={() => setKisRegistered(true)}>API키 저장</button>
              </div>
              <div style={{ marginTop: 16, padding: "12px 16px", borderRadius: 8, background: "rgba(255,255,255,0.02)", fontSize: 12, color: "#6b6b7e", lineHeight: 1.7 }}>
                아직 API키가 없으시다면? <a href="https://apiportal.koreainvestment.com" target="_blank" style={{ color: "#00d4aa" }}>KIS Developers 바로가기 →</a>
              </div>
            </Card>

            <Card title="전략 선택">
              <div style={{
                padding: 20, borderRadius: 12, border: "2px solid rgba(0,212,170,0.2)",
                background: "rgba(0,212,170,0.03)", marginBottom: 16,
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
                  <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "rgba(0,212,170,0.12)", color: "#00d4aa" }}>추천</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#e8e8ed" }}>리밸런싱 + 차트매매 혼합</span>
                </div>
                <p style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.7 }}>
                  목표 비율대로 포트폴리오를 자동 리밸런싱하면서, 차트 시그널(이동평균, RSI 등)을 활용해 매매 타이밍을 최적화합니다.
                </p>
                <div style={{ display: "flex", gap: 6, marginTop: 12, flexWrap: "wrap" }}>
                  {["자동 리밸런싱", "이동평균 크로스", "RSI 과매수/과매도", "손절/익절 자동"].map((t) => (
                    <span key={t} style={{ padding: "3px 8px", borderRadius: 4, fontSize: 11, background: "rgba(0,212,170,0.08)", color: "#00d4aa" }}>{t}</span>
                  ))}
                </div>
              </div>
              <div style={{ padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)", opacity: 0.5 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <span style={{ padding: "4px 8px", borderRadius: 4, fontSize: 11, fontWeight: 700, background: "rgba(255,255,255,0.06)", color: "#6b6b7e" }}>준비중</span>
                  <span style={{ fontSize: 16, fontWeight: 700, color: "#8b8b9e" }}>모멘텀 팩터 전략</span>
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
    </div>
  );
}
