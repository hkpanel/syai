/**
 * SY.ai 메인 페이지 — D테마 (오렌지+레드)
 * v4: 서비스별 탭 구조 추가, 쉬운 표현으로 수정
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
    desc: "국내 ETF AI 자동 리밸런싱",
    detail: "안정/균형/공격 3가지 전략 프로파일 중 선택하면, AI가 국내 ETF를 24시간 자동 리밸런싱합니다. 한국투자증권 API 직접 연동.",
    features: ["자동 리밸런싱", "AI 시장분석", "커버드콜 월배당", "텔레그램 알림"],
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

const PROFILES = [
  {
    name: "안정형", en: "Conservative", icon: "🛡️",
    target: "연 8~12%", mdd: "MDD -15% 이내",
    desc: "월배당 + 안전자산 중심. 커버드콜 ETF로 꾸준한 현금흐름을 확보하며 안정적으로 복리를 쌓습니다.",
    tags: ["커버드콜 월배당", "채권 포함", "저변동성"],
    color: "#4a90d9",
    highlight: false,
  },
  {
    name: "균형형", en: "Balanced", icon: "⚖️",
    target: "연 15~25%", mdd: "MDD -25% 이내",
    desc: "성장 + 배당 혼합. S&P500 성장성과 배당 안정성을 동시에 추구하는 가장 인기 있는 전략입니다.",
    tags: ["성장+배당 혼합", "나스닥 포함", "균형 포트폴리오"],
    color: "#FF6B35",
    highlight: true,
  },
  {
    name: "공격형", en: "Aggressive", icon: "🚀",
    target: "연 25%+", mdd: "MDD -35% 각오",
    desc: "성장 섹터 집중. 나스닥·테크 섹터 비중을 극대화하여 장기 고수익을 추구합니다.",
    tags: ["나스닥 집중", "테크 섹터", "고수익 추구"],
    color: "#FF2E63",
    highlight: false,
  },
];

const AI_FEATURES = [
  {
    icon: "🌡️", title: "시장 온도 감지",
    desc: "지금 시장이 상승세인지, 하락세인지, 위기인지 AI가 종합 판단해서 전략을 자동으로 바꿉니다. 공포지수(VIX), 금리 등을 함께 봅니다.",
  },
  {
    icon: "📰", title: "뉴스 감성 분석",
    desc: "AI가 매일 금융 뉴스를 읽고 지금 시장 분위기가 긍정인지 부정인지 점수를 냅니다. 나쁜 뉴스가 쏟아지면 먼저 방어 포지션으로 전환합니다.",
  },
  {
    icon: "🔗", title: "자산 간 이상 신호 감지",
    desc: "주식·채권·금·달러가 평소와 다르게 움직이기 시작하면 위기 신호입니다. AI가 이런 이상한 움직임을 포착해서 미리 대응합니다.",
  },
  {
    icon: "📡", title: "구글 트렌드 & 공포지수",
    desc: "경기 침체 검색량이 급증하거나 공포지수가 치솟으면 AI가 감지하고 안전 자산 비중을 높입니다. 뉴스보다 빠르게 반응합니다.",
  },
];

const STEPS = [
  { n: "01", title: "회원가입", desc: "소셜 로그인으로 30초 안에 가입" },
  { n: "02", title: "프로파일 선택", desc: "안정/균형/공격 중 하나 선택" },
  { n: "03", title: "한투 API 연동", desc: "AppKey · AppSecret · 계좌번호 등록" },
  { n: "04", title: "크레딧 충전", desc: "원화 또는 SYC 코인으로 충전" },
  { n: "05", title: "자동매매 시작", desc: "AI가 24시간 대신 운용" },
];

type ServiceTab = "deepstock" | "deepcrypto" | "deepsoccer";

export default function HomePage() {
  const [vis, setVis] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ServiceTab>("deepstock");
  useEffect(() => { setVis(true); }, []);

  const tabConfig: { id: ServiceTab; label: string; icon: string; live: boolean }[] = [
    { id: "deepstock",  label: "DeepStock",  icon: "📈", live: true  },
    { id: "deepcrypto", label: "DeepCrypto", icon: "₿",  live: false },
    { id: "deepsoccer", label: "DeepSoccer", icon: "⚽", live: false },
  ];

  return (
    <div style={{ minHeight: "100vh", overflow: "hidden" }}>
      <style>{`
        .svc-card { transition: all 0.4s cubic-bezier(0.22,1,0.36,1); border: 1px solid rgba(255,255,255,0.06); }
        .svc-card:hover { transform: translateY(-8px); border-color: rgba(255,255,255,0.12); }
        .profile-card { transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.06); }
        .profile-card:hover { transform: translateY(-4px); }
        .ai-card { transition: all 0.3s ease; border: 1px solid rgba(255,255,255,0.06); }
        .ai-card:hover { background: rgba(255,107,53,0.04) !important; border-color: rgba(255,107,53,0.15) !important; }
        .svc-tab { padding: 12px 28px; border: none; border-bottom: 2px solid transparent;
          background: none; font-size: 14px; font-weight: 600; cursor: pointer;
          transition: all 0.2s; display: inline-flex; align-items: center; gap: 8px; }
        .svc-tab.active { color: #FF6B35 !important; border-bottom-color: #FF6B35; }
        .svc-tab.can-click:hover { color: #e8e8ed !important; }
        .svc-tab.disabled { cursor: not-allowed; }
        @keyframes heroGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }
        @media(max-width:768px){
          .fee-grid { grid-template-columns: 1fr !important; }
          .step-grid { grid-template-columns: 1fr 1fr !important; }
          .step-line-h { display: none !important; }
        }
      `}</style>

      {/* 네비게이션 */}
      <nav style={{
        position: "sticky", top: 0, zIndex: 100,
        background: "rgba(12,8,8,0.85)", backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 24px", height: 64, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SY.ai</span>
            <span style={{ fontSize: 10, color: "#6b6b7e", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4 }}>BETA</span>
          </Link>
          <Link href="/deepstock" style={{ padding: "8px 16px", borderRadius: 8, textDecoration: "none", color: "#FF6B35", background: "rgba(255,107,53,0.08)", fontSize: 14, fontWeight: 500 }}>📈 DeepStock 시작하기</Link>
        </div>
      </nav>

      {/* 히어로 */}
      <section style={{ position: "relative", padding: "120px 24px 80px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)", animation: "heroGlow 6s ease infinite", pointerEvents: "none" }} />
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "inline-block", padding: "6px 16px", borderRadius: 20, background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", fontSize: 13, color: "#FF6B35", fontWeight: 500, marginBottom: 24 }}>AI x 투자 x 블록체인</div>
          <h1 style={{ fontSize: "clamp(36px, 6vw, 64px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1.5px", marginBottom: 20 }}>
            <span style={{ color: "#e8e8ed" }}>국내 ETF 자동투자,</span><br />
            <span style={{ background: "linear-gradient(135deg, #FF6B35, #FF2E63, #FFB088)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI가 24시간 운용합니다</span>
          </h1>
          <p style={{ fontSize: "clamp(15px, 2vw, 18px)", color: "#6b6b7e", lineHeight: 1.7, maxWidth: 560, margin: "0 auto 40px" }}>
            한국투자증권 API 연동, 국내 상장 ETF 자동 리밸런싱.<br />
            위험도 프로파일만 선택하면 AI가 나머지를 처리합니다.<br />
            SYC 코인으로 결제하면 최대 30% 할인.
          </p>
          <div style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/deepstock" style={{ padding: "14px 32px", borderRadius: 12, textDecoration: "none", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff", fontWeight: 700, fontSize: 15 }}>DeepStock 시작하기 →</Link>
            <Link href="https://www.sykoreapanel.com/syc" style={{ padding: "14px 32px", borderRadius: 12, textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#e8e8ed", fontWeight: 500, fontSize: 15 }}>SYC 코인 알아보기</Link>
          </div>
        </div>
        <div style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 80, flexWrap: "wrap", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s" }}>
          {[{ label: "창업자 투자 경력", value: 20, suffix: "년" }, { label: "트레이딩봇 운영", value: 10, suffix: "년" }, { label: "전략 자동 실행", value: 24, suffix: "시간" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div style={{ fontSize: 36, fontWeight: 800, color: "#FF6B35", marginBottom: 4 }}><AnimNum value={s.value} suffix={s.suffix} /></div>
              <div style={{ fontSize: 13, color: "#6b6b7e" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* 서비스 카드 */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "40px 24px 60px" }}>
        <div style={{ textAlign: "center", marginBottom: 60 }}>
          <h2 style={{ fontSize: 32, fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>AI 서비스 라인업</h2>
          <p style={{ fontSize: 15, color: "#6b6b7e" }}>SY.ai에서 제공하는 AI 기반 서비스를 만나보세요</p>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {SERVICES.map((svc, idx) => (
            <div key={svc.id} className="svc-card"
              onMouseEnter={() => setHovered(svc.id)} onMouseLeave={() => setHovered(null)}
              style={{ background: hovered === svc.id ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", borderRadius: 20, padding: 32, cursor: svc.status === "LIVE" ? "pointer" : "default", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)", transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.1 * idx}s`, position: "relative", overflow: "hidden" }}
              onClick={() => { if (svc.status === "LIVE") window.location.href = svc.href; }}
            >
              <div style={{ position: "absolute", top: -60, right: -60, width: 160, height: 160, borderRadius: "50%", background: svc.gradient, opacity: hovered === svc.id ? 0.12 : 0.06 }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
                <div style={{ width: 52, height: 52, borderRadius: 14, background: svc.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24 }}>{svc.icon}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 6, background: `${svc.statusColor}15` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: svc.statusColor, animation: svc.status === "LIVE" ? "pulse 2s infinite" : "none" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: svc.statusColor }}>{svc.status}</span>
                </div>
              </div>
              <h3 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8ed", marginBottom: 6 }}>{svc.name}</h3>
              <p style={{ fontSize: 14, color: "#8b8b9e", marginBottom: 16 }}>{svc.desc}</p>
              <p style={{ fontSize: 13, color: "#6b6b7e", lineHeight: 1.7, marginBottom: 24 }}>{svc.detail}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 20 }}>
                {svc.features.map((f) => (<span key={f} style={{ padding: "4px 10px", borderRadius: 6, fontSize: 12, background: "rgba(255,255,255,0.04)", color: "#8b8b9e", border: "1px solid rgba(255,255,255,0.06)" }}>{f}</span>))}
              </div>
              {svc.status === "LIVE"
                ? <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 14, fontWeight: 600, color: "#FF6B35" }}>시작하기 <span style={{ fontSize: 18 }}>→</span></div>
                : <div style={{ fontSize: 13, color: "#4a4a5e" }}>서비스 준비중입니다</div>
              }
            </div>
          ))}
        </div>
      </section>

      {/* 서비스 상세 탭 섹션 */}
      <section style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 100px" }}>
        {/* 탭 */}
        <div style={{ borderBottom: "1px solid rgba(255,255,255,0.08)", marginBottom: 60, display: "flex" }}>
          {tabConfig.map((t) => (
            <button key={t.id}
              className={`svc-tab ${activeTab === t.id ? "active" : ""} ${t.live ? "can-click" : "disabled"}`}
              style={{ color: activeTab === t.id ? "#FF6B35" : t.live ? "#6b6b7e" : "#3a3a4e" }}
              onClick={() => { if (t.live) setActiveTab(t.id); }}
            >
              <span>{t.icon} {t.label}</span>
              {!t.live && <span style={{ fontSize: 10, padding: "1px 6px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "#3a3a4e" }}>준비중</span>}
            </button>
          ))}
        </div>

        {/* DeepStock 탭 내용 */}
        {activeTab === "deepstock" && (
          <>
            {/* 전략 프로파일 */}
            <div style={{ marginBottom: 80 }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", fontSize: 12, color: "#FF6B35", fontWeight: 600, marginBottom: 16, letterSpacing: 1 }}>전략 프로파일</div>
                <h2 style={{ fontSize: 30, fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>위험도만 선택하세요</h2>
                <p style={{ fontSize: 15, color: "#6b6b7e", maxWidth: 480, margin: "0 auto" }}>3가지 프로파일 중 하나를 선택하면 AI가 시장 상황에 맞게 ETF 비중을 동적으로 조절합니다</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: 20 }}>
                {PROFILES.map((p) => (
                  <div key={p.name} className="profile-card" style={{ borderRadius: 20, padding: 32, background: p.highlight ? "rgba(255,107,53,0.04)" : "rgba(255,255,255,0.02)", borderColor: p.highlight ? "rgba(255,107,53,0.2)" : "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                    {p.highlight && <div style={{ position: "absolute", top: 16, right: 16, padding: "3px 10px", background: "rgba(255,107,53,0.12)", borderRadius: 6, fontSize: 11, fontWeight: 700, color: "#FF6B35" }}>인기</div>}
                    <div style={{ fontSize: 36, marginBottom: 16 }}>{p.icon}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 4 }}>
                      <h3 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8ed" }}>{p.name}</h3>
                      <span style={{ fontSize: 13, color: "#6b6b7e" }}>{p.en}</span>
                    </div>
                    <div style={{ display: "flex", gap: 12, marginBottom: 20, flexWrap: "wrap" }}>
                      <div style={{ padding: "6px 14px", borderRadius: 8, background: `${p.color}15`, border: `1px solid ${p.color}30` }}><span style={{ fontSize: 16, fontWeight: 700, color: p.color }}>{p.target}</span></div>
                      <div style={{ padding: "6px 14px", borderRadius: 8, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}><span style={{ fontSize: 13, color: "#6b6b7e" }}>{p.mdd}</span></div>
                    </div>
                    <p style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.8, marginBottom: 20 }}>{p.desc}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                      {p.tags.map((t) => (<span key={t} style={{ padding: "3px 10px", borderRadius: 6, fontSize: 12, background: "rgba(255,255,255,0.04)", color: "#6b6b7e", border: "1px solid rgba(255,255,255,0.06)" }}>{t}</span>))}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ textAlign: "center", fontSize: 12, color: "#4a4a5e", marginTop: 20 }}>※ 레버리지 ETF는 모든 프로파일에서 제외됩니다. 과거 시뮬레이션 수익률은 미래 수익을 보장하지 않습니다.</p>
            </div>

            {/* AI 엔진 */}
            <div style={{ marginBottom: 80 }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", fontSize: 12, color: "#FF6B35", fontWeight: 600, marginBottom: 16, letterSpacing: 1 }}>AI 시장분석 엔진</div>
                <h2 style={{ fontSize: 30, fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>단순 보조지표가 아닙니다</h2>
                <p style={{ fontSize: 15, color: "#6b6b7e", maxWidth: 520, margin: "0 auto" }}>이동평균선·MACD 같은 단순 신호가 아니라, 뉴스·시장 온도·자산 흐름을 종합해서 판단합니다</p>
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 20 }}>
                {AI_FEATURES.map((f, i) => (
                  <div key={i} className="ai-card" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, padding: 28 }}>
                    <div style={{ fontSize: 32, marginBottom: 16 }}>{f.icon}</div>
                    <h3 style={{ fontSize: 16, fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>{f.title}</h3>
                    <p style={{ fontSize: 13, color: "#6b6b7e", lineHeight: 1.8 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* 수수료 */}
            <div style={{ marginBottom: 80 }}>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <div style={{ display: "inline-block", padding: "4px 12px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", fontSize: 12, color: "#FF6B35", fontWeight: 600, marginBottom: 16, letterSpacing: 1 }}>수수료 정책</div>
                <h2 style={{ fontSize: 30, fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>투명한 수수료</h2>
                <p style={{ fontSize: 15, color: "#6b6b7e" }}>숨겨진 비용 없이 거래 금액 기준으로만 부과됩니다</p>
              </div>
              <div className="fee-grid" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, maxWidth: 900, margin: "0 auto" }}>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 32 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8ed", marginBottom: 24 }}>💰 기본 수수료</h3>
                  <div style={{ textAlign: "center", padding: "24px 0", marginBottom: 24, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div style={{ fontSize: 48, fontWeight: 800, color: "#FF6B35", letterSpacing: "-1px" }}>0.05%</div>
                    <div style={{ fontSize: 14, color: "#6b6b7e", marginTop: 8 }}>매수 · 매도 · 리밸런싱 동일 적용</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                    {[{ label: "1,000만원 매수 시", value: "수수료 5,000원" }, { label: "500만원 매도 시", value: "수수료 2,500원" }, { label: "리밸런싱 매매도", value: "동일 수수료 적용" }].map((ex) => (
                      <div key={ex.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
                        <span style={{ fontSize: 13, color: "#6b6b7e" }}>{ex.label}</span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: "#e8e8ed" }}>{ex.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 20, padding: 32 }}>
                  <h3 style={{ fontSize: 18, fontWeight: 700, color: "#e8e8ed", marginBottom: 24 }}>💳 크레딧 충전 방식</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                    <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#e8e8ed" }}>🏦 원화 결제</span>
                        <span style={{ fontSize: 13, color: "#4a90d9", fontWeight: 600, padding: "2px 8px", background: "rgba(74,144,217,0.1)", borderRadius: 4 }}>1:1</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#6b6b7e" }}>카드 · 무통장 입금 (PortOne PG 연동)</div>
                      <div style={{ fontSize: 12, color: "#4a4a5e", marginTop: 4 }}>만원 → 10,000 크레딧</div>
                    </div>
                    <div style={{ padding: 20, borderRadius: 14, background: "rgba(255,107,53,0.04)", border: "1px solid rgba(255,107,53,0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                        <span style={{ fontSize: 15, fontWeight: 600, color: "#e8e8ed" }}>🪙 SYC 코인 결제</span>
                        <span style={{ fontSize: 13, color: "#FF6B35", fontWeight: 700, padding: "2px 8px", background: "rgba(255,107,53,0.1)", borderRadius: 4 }}>20~30% 할인</span>
                      </div>
                      <div style={{ fontSize: 13, color: "#6b6b7e" }}>MetaMask 연동 (PancakeSwap 시세 기준)</div>
                      <div style={{ fontSize: 12, color: "#FF6B35", marginTop: 4, fontWeight: 500 }}>SYC 보유 시 추가 혜택</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 이용 방법 */}
            <div>
              <div style={{ textAlign: "center", marginBottom: 48 }}>
                <h2 style={{ fontSize: 30, fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>이렇게 시작하세요</h2>
                <p style={{ fontSize: 15, color: "#6b6b7e" }}>5단계면 자동매매가 시작됩니다</p>
              </div>
              <div className="step-grid" style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: 12 }}>
                {STEPS.map((s, i) => (
                  <div key={i} style={{ textAlign: "center", position: "relative" }}>
                    {i < STEPS.length - 1 && <div className="step-line-h" style={{ position: "absolute", top: 20, left: "calc(50% + 20px)", width: "calc(100% - 40px)", height: 1, background: "rgba(255,255,255,0.06)" }} />}
                    <div style={{ width: 40, height: 40, borderRadius: "50%", margin: "0 auto 16px", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 13, fontWeight: 800, color: "#fff", position: "relative", zIndex: 1 }}>{s.n}</div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: "#e8e8ed", marginBottom: 8 }}>{s.title}</div>
                    <div style={{ fontSize: 12, color: "#6b6b7e", lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 48 }}>
                <Link href="/deepstock" style={{ display: "inline-block", padding: "16px 48px", borderRadius: 14, textDecoration: "none", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff", fontWeight: 700, fontSize: 16 }}>지금 바로 시작하기 →</Link>
              </div>
            </div>
          </>
        )}

        {/* DeepCrypto 준비중 */}
        {activeTab === "deepcrypto" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>₿</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#e8e8ed", marginBottom: 16 }}>DeepCrypto 준비중</h2>
            <p style={{ fontSize: 15, color: "#6b6b7e", lineHeight: 1.8 }}>비트코인, 이더리움 등 주요 코인의 AI 매매 시그널 서비스를 준비중입니다.<br />DeepStock 런칭 이후 순차적으로 오픈 예정입니다.</p>
          </div>
        )}

        {/* DeepSoccer 준비중 */}
        {activeTab === "deepsoccer" && (
          <div style={{ textAlign: "center", padding: "80px 0" }}>
            <div style={{ fontSize: 64, marginBottom: 24 }}>⚽</div>
            <h2 style={{ fontSize: 28, fontWeight: 700, color: "#e8e8ed", marginBottom: 16 }}>DeepSoccer 준비중</h2>
            <p style={{ fontSize: 15, color: "#6b6b7e", lineHeight: 1.8 }}>전세계 주요 리그 경기 결과를 AI가 분석하는 서비스를 준비중입니다.<br />DeepStock 런칭 이후 순차적으로 오픈 예정입니다.</p>
          </div>
        )}
      </section>

      {/* SYC 배너 */}
      <section style={{ maxWidth: 1200, margin: "0 auto 80px", padding: "0 24px" }}>
        <div style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,46,99,0.04))", border: "1px solid rgba(255,107,53,0.12)", borderRadius: 20, padding: "40px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
          <div>
            <h3 style={{ fontSize: 22, fontWeight: 700, color: "#e8e8ed", marginBottom: 8 }}>SYC 코인으로 결제하면 최대 30% 할인</h3>
            <p style={{ fontSize: 14, color: "#8b8b9e" }}>충전금을 SYC 코인으로 결제하면 원화 대비 20~30% 할인된 가격으로 서비스를 이용할 수 있습니다.</p>
          </div>
          <Link href="https://www.sykoreapanel.com/syc" style={{ padding: "12px 28px", borderRadius: 12, textDecoration: "none", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff", fontWeight: 700, fontSize: 14, whiteSpace: "nowrap" }}>SYC 구매하기</Link>
        </div>
      </section>

      {/* 푸터 */}
      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "32px 24px", textAlign: "center" }}>
        <div style={{ fontSize: 12, color: "#4a4a5e", lineHeight: 1.8 }}>
          SY.ai는 투자 자문 서비스가 아닙니다. 모든 투자 판단은 본인 책임 하에 이루어져야 합니다.<br />
          과거 시뮬레이션 수익률은 미래 수익을 보장하지 않습니다.<br />
          © 2026 SY.ai · SY한국판넬 · SY Coin Project
        </div>
      </footer>
    </div>
  );
}
