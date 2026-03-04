/**
 * SY.ai 메인 페이지 — D테마 (오렌지+레드)
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

function AnimNum({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let n = 0;
    const step = value / 50;
    const t = setInterval(() => {
      n += step;
      if (n >= value) { setD(value); clearInterval(t); } else setD(Math.floor(n));
    }, 20);
    return () => clearInterval(t);
  }, [value]);
  return <span>{d.toLocaleString()}{suffix}</span>;
}

const SERVICES = [
  {
    id: "deepstock", name: "DeepStock", icon: "📈", status: "LIVE", statusColor: "#FF6B35",
    desc: "한국투자증권 API 연동 자동매매",
    detail: "리밸런싱 + 차트매매 혼합 전략으로 국내 주식 자동 운용. 한투 API키만 등록하면 서버가 24시간 매매합니다.",
    features: ["자동 리밸런싱", "차트 시그널 매매", "실시간 포트폴리오", "매매 알림"],
    href: "/deepstock", gradient: "linear-gradient(135deg, #FF6B35, #FF2E63)",
  },
  {
    id: "deepcrypto", name: "DeepCrypto", icon: "₿", status: "준비중", statusColor: "#f0b90b",
    desc: "암호화폐 AI 분석 & 시그널",
    detail: "비트코인, 이더리움 등 주요 코인의 매매 시점을 AI가 분석하여 프리미엄 시그널을 제공합니다.",
    features: ["AI 차트 분석", "매매 시그널", "변동성 알림", "포트폴리오 추적"],
    href: "#", gradient: "linear-gradient(135deg, #f0b90b, #f5d442)",
  },
  {
    id: "deepsoccer", name: "DeepSoccer", icon: "⚽", status: "준비중", statusColor: "#4a90d9",
    desc: "축구 AI 예측 분석",
    detail: "전세계 주요 리그 경기 결과를 AI가 분석하여 데이터 기반 예측을 제공합니다.",
    features: ["경기 결과 예측", "배당률 분석", "팀 폼 분석", "실시간 업데이트"],
    href: "#", gradient: "linear-gradient(135deg, #4a90d9, #357abd)",
  },
];

export default function HomePage() {
  const [vis, setVis] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  useEffect(() => { setVis(true); }, []);

  return (
    <div style={{ minHeight: "100vh", overflow: "hidden" }}>
      <style>{`
        .svc-card { transition: all 0.4s cubic-bezier(0.22,1,0.36,1); border: 1px solid rgba(255,255,255,0.06); }
        .svc-card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.12); }
      `}</style>

      {/* 네비게이션 */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(12,8,8,0.85)", backdropFilter: "blur(20px)",
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
            <span style={{ fontSize: 10, color: "#6b6b7e", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4 }}>BETA</span>
          </Link>
          <Link href="/deepstock" style={{
            padding: "8px 16px", borderRadius: 8, textDecoration: "none",
            color: "#FF6B35", background: "rgba(255,107,53,0.08)", fontSize: 14, fontWeight: 500,
          }}>📈 DeepStock</Link>
        </div>
      </nav>

      {/* 히어로 */}
      <section style={{ position: "relative", padding: "120px 24px 80px", textAlign: "center", overflow: "hidden" }}>
        <div style={{
          position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)",
          width: 800, height: 800, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)",
          animation: "heroGlow 6s ease infinite", pointerEvents: "none",
        }} />
        <div style={{
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)",
          transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)",
        }}>
          <div style={{
            display: "inline-block", padding: "6px 16px", borderRadius: 20,
            background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)",
            fontSize: 13, color: "#FF6B35", fontWeight: 500, marginBottom: 24,
          }}>AI x 투자 x 블록체인</div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1.5px", marginBottom: 20 }}>
            <span style={{ color: "#e8e8ed" }}>투자의 미래,</span><br />
            <span style={{
              background: "linear-gradient(135deg, #FF6B35, #FF2E63, #FFB088)",
              WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent",
            }}>AI가 운용합니다</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#6b6b7e", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
            한국투자증권 API 연동 자동매매부터<br />암호화폐 시그널, 스포츠 AI 예측까지.<br />SYC 코인으로 결제하면 최대 30% 할인.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/deepstock" style={{
              padding: "14px 32px", borderRadius: 12, textDecoration: "none",
              background: "linear-gradient(135deg, #FF6B35, #FF2E63)",
              color: "#fff", fontWeight: 700, fontSize: 15,
            }}>DeepStock 시작하기 →</Link>
            <Link href="https://www.sykoreapanel.com/syc" style={{
              padding: "14px 32px", borderRadius: 12, textDecoration: "none",
              border: "1px solid rgba(255,255,255,0.12)", color: "#e8e8ed", fontWeight: 500, fontSize: 15,
            }}>SYC 코인 알아보기</Link>
          </div>
        </div>
        <div style={{
          display: "flex", justifyContent: "center", gap: 48, marginTop: 80, flexWrap: "wrap",
          opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(30px)",
          transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s",
        }}>
          {[
            { label: "창업자 투자 경력", value: 20, suffix: "년" },
            { label: "트레이딩봇 운영", value: 10, suffix: "년" },
            { label: "전략 자동 실행", value: 24, suffix: "시간" },
          ].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#FF6B35", marginBottom: 4 }}>
                <AnimNum value={s.value} suffix={s.suffix} />
              </div>
              <div style={{ fontSize: 13, color: "#6b6b7e" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 서비스 카드 */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 100px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>AI 서비스 라인업</h2>
          <p style={{ fontSize: 15, color: "#6b6b7e" }}>SY.ai에서 제공하는 AI 기반 서비스를 만나보세요</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {SERVICES.map((svc, idx) => (
            <div key={svc.id} className="svc-card"
              onMouseEnter={() => setHovered(svc.id)} onMouseLeave={() => setHovered(null)}
              style={{
                background: hovered === svc.id ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)",
                borderRadius: 20, padding: 32, cursor: svc.status === "LIVE" ? "pointer" : "default",
                opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)",
                transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.1 * idx}s`,
                position: "relative", overflow: "hidden",
              }}
              onClick={() => { if (svc.status === "LIVE") window.location.href = svc.href; }}
            >
              <div style={{
                position: "absolute", top: -60, right: -60, width: 160, height: 160,
                borderRadius: "50%", background: svc.gradient, opacity: hovered === svc.id ? 0.12 : 0.06,
              }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14, background: svc.gradient,
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24,
                }}>{svc.icon}</div>
                <div style={{
                  display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6,
                  background: `${svc.statusColor}15`,
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: "50%", background: svc.statusColor,
                    animation: svc.status === "LIVE" ? "pulse 2s infinite" : "none",
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: svc.statusColor }}>{svc.status}</span>
                </div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8ed", marginBottom: 6 }}>{svc.name}</h3>
              <p style={{ fontSize: 14, color: "#8b8b9e", marginBottom: 16 }}>{svc.desc}</p>
              <p style={{ fontSize: 13, color: "#6b6b7e", lineHeight: 1.7, marginBottom: 24 }}>{svc.detail}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {svc.features.map((f) => (
                  <span key={f} style={{
                    padding: "4px 10px", borderRadius: 6, fontSize: 12,
                    background: "rgba(255,255,255,0.04)", color: "#8b8b9e",
                    border: "1px solid rgba(255,255,255,0.06)",
                  }}>{f}</span>
                ))}
              </div>
              {svc.status === "LIVE" ? (
                <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#FF6B35" }}>
                  시작하기 <span style={{ fontSize: 18 }}>→</span>
                </div>
              ) : (
                <div style={{ fontSize: 13, color: "#4a4a5e" }}>서비스 준비중입니다</div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* SYC 배너 */}
      <section style={{ maxWidth: 1200, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{
          background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,46,99,0.04))",
          border: "1px solid rgba(255,107,53,0.12)", borderRadius: 20,
          padding: "40px 32px", display: "flex", alignItems: "center",
          justifyContent: "space-between", flexWrap: "wrap", gap: 20,
        }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8ed", marginBottom: 8 }}>SYC 코인으로 결제하면 최대 30% 할인</h3>
            <p style={{ fontSize: 14, color: "#8b8b9e" }}>충전금을 SYC 코인으로 결제하면 원화 대비 20~30% 할인된 가격으로 서비스를 이용할 수 있습니다.</p>
          </div>
          <Link href="https://www.sykoreapanel.com/syc" style={{
            padding: "12px 28px", borderRadius: 12, textDecoration: "none",
            background: "linear-gradient(135deg, #FF6B35, #FF2E63)",
            color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap",
          }}>SYC 구매하기</Link>
        </div>
      </section>

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
