/**
 * SY.ai 메인 페이지 — D테마 (오렌지+레드)
 * v5: 모바일 최적화 (clamp, @media 767px)
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthChange, signOut } from "@/lib/auth";
import type { User } from "firebase/auth";
import AuthModal from "@/app/components/AuthModal";

type ServiceId = "deepstock" | "deepcrypto" | "deepsoccer";

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
  { id: "deepstock", name: "DeepStock", icon: "📈", status: "LIVE", statusColor: "#FF6B35", desc: "국내 ETF AI 자동 리밸런싱", detail: "안정/균형/공격 3가지 전략 프로파일 중 선택하면, AI가 국내 ETF를 24시간 자동 리밸런싱합니다. 한국투자증권 API 직접 연동.", features: ["자동 리밸런싱", "AI 시장분석", "커버드콜 월배당", "텔레그램 알림"], href: "/deepstock", gradient: "linear-gradient(135deg, #FF6B35, #FF2E63)" },
  { id: "deepcrypto", name: "DeepCrypto", icon: "₿", status: "준비중", statusColor: "#f0b90b", desc: "암호화폐 AI 분석 & 시그널", detail: "비트코인, 이더리움 등 주요 코인의 매매 시점을 AI가 분석하여 프리미엄 시그널을 제공합니다.", features: ["AI 차트 분석", "매매 시그널", "변동성 알림", "포트폴리오 추적"], href: "#", gradient: "linear-gradient(135deg, #f0b90b, #f5d442)" },
  { id: "deepsoccer", name: "DeepSoccer", icon: "⚽", status: "준비중", statusColor: "#4a90d9", desc: "축구 AI 예측 분석", detail: "전세계 주요 리그 경기 결과를 AI가 분석하여 데이터 기반 예측을 제공합니다.", features: ["경기 결과 예측", "배당률 분석", "팀 폼 분석", "실시간 업데이트"], href: "#", gradient: "linear-gradient(135deg, #4a90d9, #357abd)" },
];

const PROFILES = [
  { name: "안정형", en: "Conservative", icon: "🛡️", target: "연 8~12%", mdd: "MDD -15% 이내", desc: "월배당 + 안전자산 중심. 커버드콜 ETF로 꾸준한 현금흐름을 확보하며 안정적으로 복리를 쌓습니다.", tags: ["커버드콜 월배당", "채권 포함", "저변동성"], color: "#4a90d9", highlight: false },
  { name: "균형형", en: "Balanced", icon: "⚖️", target: "연 15~25%", mdd: "MDD -25% 이내", desc: "성장 + 배당 혼합. S&P500 성장성과 배당 안정성을 동시에 추구하는 가장 인기 있는 전략입니다.", tags: ["성장+배당 혼합", "나스닥 포함", "균형 포트폴리오"], color: "#FF6B35", highlight: true },
  { name: "공격형", en: "Aggressive", icon: "🚀", target: "연 25%+", mdd: "MDD -35% 각오", desc: "성장 섹터 집중. 나스닥·테크 섹터 비중을 극대화하여 장기 고수익을 추구합니다.", tags: ["나스닥 집중", "테크 섹터", "고수익 추구"], color: "#FF2E63", highlight: false },
];

const AI_FEATURES = [
  { icon: "🌡️", title: "시장 온도 감지", desc: "지금 시장이 상승세인지, 하락세인지, 위기인지 AI가 종합 판단해서 전략을 자동으로 바꿉니다. 공포지수(VIX), 금리 등을 함께 봅니다." },
  { icon: "📰", title: "뉴스 감성 분석", desc: "AI가 매일 금융 뉴스를 읽고 지금 시장 분위기가 긍정인지 부정인지 점수를 냅니다. 나쁜 뉴스가 쏟아지면 먼저 방어 포지션으로 전환합니다." },
  { icon: "🔗", title: "자산 간 이상 신호 감지", desc: "주식·채권·금·달러가 평소와 다르게 움직이기 시작하면 위기 신호입니다. AI가 이런 이상한 움직임을 포착해서 미리 대응합니다." },
  { icon: "📡", title: "구글 트렌드 & 공포지수", desc: "'경기 침체' 검색량이 급증하거나 공포지수가 치솟으면 AI가 감지하고 안전 자산 비중을 높입니다. 뉴스보다 빠르게 반응합니다." },
];

const STEPS = [
  { n: "01", title: "회원가입", desc: "소셜 로그인으로 30초 안에 가입" },
  { n: "02", title: "프로파일 선택", desc: "안정/균형/공격 중 하나 선택" },
  { n: "03", title: "한투 API 연동", desc: "AppKey · AppSecret · 계좌번호 등록" },
  { n: "04", title: "크레딧 충전", desc: "원화 또는 SYC 코인으로 충전" },
  { n: "05", title: "자동매매 시작", desc: "AI가 24시간 대신 운용" },
];

export default function HomePage() {
  const [vis, setVis] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ServiceId>("deepstock");
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  useEffect(() => { setVis(true); }, []);
  useEffect(() => { const unsub = onAuthChange(setUser); return () => unsub(); }, []);

  const tabs: { id: ServiceId; label: string; live: boolean }[] = [
    { id: "deepstock", label: "📈 DeepStock", live: true },
    { id: "deepcrypto", label: "₿ DeepCrypto", live: false },
    { id: "deepsoccer", label: "⚽ DeepSoccer", live: false },
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
        .svc-tab-btn { padding: 12px 28px; border: none; border-bottom: 3px solid transparent; background: none; font-size: 15px; font-weight: 600; cursor: pointer; transition: all 0.2s; white-space: nowrap; }
        .svc-tab-btn.tab-active { color: #FF6B35 !important; border-bottom-color: #FF6B35; }
        .svc-tab-btn.tab-live:hover { color: #e8e8ed !important; }
        .svc-tab-btn.tab-disabled { color: #3a3a4e !important; cursor: not-allowed; }
        .fee-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 24px; }
        .step-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
        .ai-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; }
        .svc-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 24px; }
        .profile-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 20px; }
        .tab-bar { display: flex; border-bottom: 1px solid rgba(255,255,255,0.08); overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
        .tab-bar::-webkit-scrollbar { display: none; }
        @keyframes heroGlow { 0%,100%{opacity:.6} 50%{opacity:1} }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:.5} }

        @media (max-width: 767px) {
          .nav-beta { display: none !important; }
          .nav-start { display: none !important; }
          .nav-name { max-width: 80px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-size: 12px !important; }
          .hero-section { padding: 64px 16px 48px !important; }
          .hero-title { font-size: 26px !important; letter-spacing: -0.5px !important; line-height: 1.25 !important; }
          .hero-sub { font-size: 13px !important; }
          .hero-cta-wrap { flex-direction: column !important; }
          .hero-cta-wrap a { text-align: center !important; }
          .hero-stats { gap: 20px !important; margin-top: 40px !important; }
          .hero-stat-num { font-size: 26px !important; }
          .hero-stat-label { font-size: 11px !important; }
          .section-title { font-size: 20px !important; }
          .section-sub { font-size: 12px !important; }
          .svc-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .svc-tab-btn { padding: 10px 14px !important; font-size: 12px !important; }
          .profile-grid { grid-template-columns: 1fr !important; }
          .ai-grid { grid-template-columns: 1fr 1fr !important; gap: 10px !important; }
          .ai-card { padding: 16px !important; }
          .ai-icon { font-size: 22px !important; margin-bottom: 8px !important; }
          .ai-card h3 { font-size: 12px !important; margin-bottom: 6px !important; }
          .ai-card p { font-size: 11px !important; line-height: 1.6 !important; }
          .fee-grid { grid-template-columns: 1fr !important; gap: 14px !important; }
          .fee-big-num { font-size: 36px !important; }
          .fee-card { padding: 22px !important; }
          .step-grid { grid-template-columns: 1fr 1fr !important; gap: 18px !important; }
          .step-line { display: none !important; }
          .syc-banner { flex-direction: column !important; padding: 24px 18px !important; }
          .syc-banner h3 { font-size: 16px !important; }
          .syc-banner p { font-size: 12px !important; }
          .main-section { padding-left: 16px !important; padding-right: 16px !important; }
          .detail-section { padding: 0 16px 60px !important; }
        }
      `}</style>

      <nav style={{ position: "sticky", top: 0, zIndex: 100, background: "rgba(12,8,8,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div style={{ maxWidth: 1280, margin: "0 auto", padding: "0 16px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Link href="/" style={{ textDecoration: "none", display: "flex", alignItems: "center", gap: 10, flexShrink: 0 }}>
            <span style={{ fontSize: 20, fontWeight: 800, letterSpacing: "-0.5px", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SY.ai</span>
            <span className="nav-beta" style={{ fontSize: 10, color: "#6b6b7e", border: "1px solid rgba(255,255,255,0.08)", padding: "2px 6px", borderRadius: 4 }}>BETA</span>
          </Link>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <Link href="/deepstock" className="nav-start" style={{ padding: "7px 14px", borderRadius: 8, textDecoration: "none", color: "#FF6B35", background: "rgba(255,107,53,0.08)", fontSize: 13, fontWeight: 600 }}>📈 시작하기</Link>
            {user ? (
              <>
                <span className="nav-name" style={{ fontSize: 13, color: "#e8e8ed", fontWeight: 500 }}>{user.displayName || "회원"}</span>
                <button onClick={() => signOut()} style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.1)", background: "none", color: "#6b6b7e", fontSize: 12, cursor: "pointer", whiteSpace: "nowrap" }}>로그아웃</button>
              </>
            ) : (
              <button onClick={() => setShowAuth(true)} style={{ padding: "7px 14px", borderRadius: 8, border: "1px solid rgba(255,107,53,0.3)", background: "rgba(255,107,53,0.08)", color: "#FF6B35", fontSize: 13, fontWeight: 600, cursor: "pointer", whiteSpace: "nowrap" }}>로그인</button>
            )}
          </div>
        </div>
      </nav>

      <section className="hero-section" style={{ position: "relative", padding: "100px 24px 72px", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "-50%", left: "50%", transform: "translateX(-50%)", width: 800, height: 800, borderRadius: "50%", background: "radial-gradient(circle, rgba(255,107,53,0.1) 0%, transparent 70%)", animation: "heroGlow 6s ease infinite", pointerEvents: "none" }} />
        <div style={{ opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1)" }}>
          <div style={{ display: "inline-block", padding: "5px 14px", borderRadius: 20, background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)", fontSize: 12, color: "#FF6B35", fontWeight: 500, marginBottom: 20 }}>AI x 투자 x 블록체인</div>
          <h1 className="hero-title" style={{ fontSize: "clamp(26px, 5vw, 58px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1px", marginBottom: 18 }}>
            <span style={{ color: "#e8e8ed" }}>국내 ETF 자동투자,</span><br />
            <span style={{ background: "linear-gradient(135deg, #FF6B35, #FF2E63, #FFB088)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>AI가 24시간 운용합니다</span>
          </h1>
          <p className="hero-sub" style={{ fontSize: "clamp(13px, 1.6vw, 17px)", color: "#6b6b7e", lineHeight: 1.7, maxWidth: 500, margin: "0 auto 28px" }}>
            한국투자증권 API 연동, 국내 상장 ETF 자동 리밸런싱.<br />
            위험도 프로파일만 선택하면 AI가 나머지를 처리합니다.<br />
            SYC 코인으로 결제하면 최대 30% 할인.
          </p>
          <div className="hero-cta-wrap" style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}>
            <Link href="/deepstock" style={{ padding: "12px 26px", borderRadius: 12, textDecoration: "none", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff", fontWeight: 700, fontSize: "clamp(13px,1.4vw,15px)" }}>DeepStock 시작하기 →</Link>
            <Link href="https://www.sykoreapanel.com/syc" style={{ padding: "12px 26px", borderRadius: 12, textDecoration: "none", border: "1px solid rgba(255,255,255,0.12)", color: "#e8e8ed", fontWeight: 500, fontSize: "clamp(13px,1.4vw,15px)" }}>SYC 코인 알아보기</Link>
          </div>
        </div>
        <div className="hero-stats" style={{ display: "flex", justifyContent: "center", gap: 48, marginTop: 64, flexWrap: "wrap", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(30px)", transition: "all 0.8s cubic-bezier(0.22,1,0.36,1) 0.3s" }}>
          {[{ label: "창업자 투자 경력", value: 20, suffix: "년" }, { label: "트레이딩봇 운영", value: 10, suffix: "년" }, { label: "전략 자동 실행", value: 24, suffix: "시간" }].map((s, i) => (
            <div key={i} style={{ textAlign: "center" }}>
              <div className="hero-stat-num" style={{ fontSize: "clamp(26px,3vw,34px)", fontWeight: 800, color: "#FF6B35", marginBottom: 4 }}><AnimNum value={s.value} suffix={s.suffix} /></div>
              <div className="hero-stat-label" style={{ fontSize: "clamp(11px,1.1vw,13px)", color: "#6b6b7e" }}>{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="main-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "28px 24px 44px" }}>
        <div style={{ textAlign: "center", marginBottom: "clamp(28px,4vw,48px)" }}>
          <h2 className="section-title" style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 10 }}>AI 서비스 라인업</h2>
          <p className="section-sub" style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e" }}>SY.ai에서 제공하는 AI 기반 서비스를 만나보세요</p>
        </div>
        <div className="svc-grid">
          {SERVICES.map((svc, idx) => (
            <div key={svc.id} className="svc-card"
              onMouseEnter={() => setHovered(svc.id)} onMouseLeave={() => setHovered(null)}
              style={{ background: hovered === svc.id ? "rgba(255,255,255,0.04)" : "rgba(255,255,255,0.02)", borderRadius: 18, padding: 26, cursor: svc.status === "LIVE" ? "pointer" : "default", opacity: vis ? 1 : 0, transform: vis ? "translateY(0)" : "translateY(40px)", transition: `all 0.6s cubic-bezier(0.22,1,0.36,1) ${0.1 * idx}s`, position: "relative", overflow: "hidden" }}
              onClick={() => { if (svc.status === "LIVE") window.location.href = svc.href; }}>
              <div style={{ position: "absolute", top: -50, right: -50, width: 130, height: 130, borderRadius: "50%", background: svc.gradient, opacity: hovered === svc.id ? 0.12 : 0.06 }} />
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div style={{ width: 46, height: 46, borderRadius: 12, background: svc.gradient, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 21 }}>{svc.icon}</div>
                <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 9px", borderRadius: 6, background: `${svc.statusColor}15` }}>
                  <div style={{ width: 6, height: 6, borderRadius: "50%", background: svc.statusColor, animation: svc.status === "LIVE" ? "pulse 2s infinite" : "none" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: svc.statusColor }}>{svc.status}</span>
                </div>
              </div>
              <h3 style={{ fontSize: "clamp(17px,2vw,20px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 5 }}>{svc.name}</h3>
              <p style={{ fontSize: "clamp(12px,1.3vw,14px)", color: "#8b8b9e", marginBottom: 10 }}>{svc.desc}</p>
              <p style={{ fontSize: "clamp(11px,1.2vw,13px)", color: "#6b6b7e", lineHeight: 1.7, marginBottom: 18 }}>{svc.detail}</p>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                {svc.features.map((f) => (<span key={f} style={{ padding: "3px 8px", borderRadius: 6, fontSize: 11, background: "rgba(255,255,255,0.04)", color: "#8b8b9e", border: "1px solid rgba(255,255,255,0.06)" }}>{f}</span>))}
              </div>
              {svc.status === "LIVE"
                ? <div style={{ fontSize: 13, fontWeight: 600, color: "#FF6B35" }}>시작하기 →</div>
                : <div style={{ fontSize: 12, color: "#4a4a5e" }}>서비스 준비중입니다</div>}
            </div>
          ))}
        </div>
      </section>

      <section className="detail-section" style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px 80px" }}>
        <div className="tab-bar" style={{ marginBottom: 44 }}>
          {tabs.map((t) => (
            <button key={t.id}
              className={`svc-tab-btn ${activeTab === t.id ? "tab-active" : ""} ${t.live ? "tab-live" : "tab-disabled"}`}
              style={{ color: activeTab === t.id ? "#FF6B35" : t.live ? "#6b6b7e" : "#3a3a4e" }}
              onClick={() => { if (t.live) setActiveTab(t.id); }}>
              {t.label}
              {!t.live && <span style={{ marginLeft: 6, fontSize: 10, padding: "1px 5px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "#3a3a4e", verticalAlign: "middle" }}>준비중</span>}
            </button>
          ))}
        </div>

        {activeTab === "deepstock" && (
          <>
            <div style={{ marginBottom: "clamp(44px,5vw,72px)" }}>
              <div style={{ textAlign: "center", marginBottom: "clamp(24px,3.5vw,40px)" }}>
                <div style={{ display: "inline-block", padding: "3px 11px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", fontSize: 11, color: "#FF6B35", fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>DEEPSTOCK · 전략 프로파일</div>
                <h2 className="section-title" style={{ fontSize: "clamp(20px,2.8vw,28px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 10 }}>위험도만 선택하세요</h2>
                <p className="section-sub" style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e", maxWidth: 440, margin: "0 auto" }}>3가지 프로파일 중 하나를 선택하면 AI가 시장 상황에 맞게 ETF 비중을 동적으로 조절합니다</p>
              </div>
              <div className="profile-grid">
                {PROFILES.map((p) => (
                  <div key={p.name} className="profile-card" style={{ borderRadius: 18, padding: 26, background: p.highlight ? "rgba(255,107,53,0.04)" : "rgba(255,255,255,0.02)", borderColor: p.highlight ? "rgba(255,107,53,0.2)" : "rgba(255,255,255,0.06)", position: "relative", overflow: "hidden" }}>
                    {p.highlight && <div style={{ position: "absolute", top: 14, right: 14, padding: "2px 8px", background: "rgba(255,107,53,0.12)", borderRadius: 5, fontSize: 11, fontWeight: 700, color: "#FF6B35" }}>인기</div>}
                    <div style={{ fontSize: 30, marginBottom: 12 }}>{p.icon}</div>
                    <div style={{ display: "flex", alignItems: "baseline", gap: 7, marginBottom: 4 }}>
                      <h3 style={{ fontSize: "clamp(17px,2vw,20px)", fontWeight: 700, color: "#e8e8ed" }}>{p.name}</h3>
                      <span style={{ fontSize: 12, color: "#6b6b7e" }}>{p.en}</span>
                    </div>
                    <div style={{ display: "flex", gap: 8, marginBottom: 14, flexWrap: "wrap" }}>
                      <div style={{ padding: "5px 11px", borderRadius: 7, background: `${p.color}15`, border: `1px solid ${p.color}30` }}><span style={{ fontSize: 14, fontWeight: 700, color: p.color }}>{p.target}</span></div>
                      <div style={{ padding: "5px 11px", borderRadius: 7, background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}><span style={{ fontSize: 12, color: "#6b6b7e" }}>{p.mdd}</span></div>
                    </div>
                    <p style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.8, marginBottom: 14 }}>{p.desc}</p>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                      {p.tags.map((tg) => (<span key={tg} style={{ padding: "3px 8px", borderRadius: 5, fontSize: 11, background: "rgba(255,255,255,0.04)", color: "#6b6b7e", border: "1px solid rgba(255,255,255,0.06)" }}>{tg}</span>))}
                    </div>
                  </div>
                ))}
              </div>
              <p style={{ textAlign: "center", fontSize: 11, color: "#4a4a5e", marginTop: 14 }}>※ 레버리지 ETF는 모든 프로파일에서 제외됩니다. 과거 시뮬레이션 수익률은 미래 수익을 보장하지 않습니다.</p>
            </div>

            <div style={{ marginBottom: "clamp(44px,5vw,72px)" }}>
              <div style={{ textAlign: "center", marginBottom: "clamp(24px,3.5vw,40px)" }}>
                <div style={{ display: "inline-block", padding: "3px 11px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", fontSize: 11, color: "#FF6B35", fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>DEEPSTOCK · AI 시장분석 엔진</div>
                <h2 className="section-title" style={{ fontSize: "clamp(20px,2.8vw,28px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 10 }}>단순 보조지표가 아닙니다</h2>
                <p className="section-sub" style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e", maxWidth: 480, margin: "0 auto" }}>이동평균선·MACD 같은 단순 신호가 아니라, 뉴스·시장 온도·자산 흐름을 종합해서 판단합니다</p>
              </div>
              <div className="ai-grid">
                {AI_FEATURES.map((f, i) => (
                  <div key={i} className="ai-card" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 14, padding: 22 }}>
                    <div className="ai-icon" style={{ fontSize: 26, marginBottom: 12 }}>{f.icon}</div>
                    <h3 style={{ fontSize: "clamp(13px,1.4vw,15px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 10 }}>{f.title}</h3>
                    <p style={{ fontSize: "clamp(11px,1.2vw,13px)", color: "#6b6b7e", lineHeight: 1.8 }}>{f.desc}</p>
                  </div>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: "clamp(44px,5vw,72px)" }}>
              <div style={{ textAlign: "center", marginBottom: "clamp(24px,3.5vw,40px)" }}>
                <div style={{ display: "inline-block", padding: "3px 11px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", fontSize: 11, color: "#FF6B35", fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>DEEPSTOCK · 수수료 정책</div>
                <h2 className="section-title" style={{ fontSize: "clamp(20px,2.8vw,28px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 10 }}>투명한 수수료</h2>
                <p className="section-sub" style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e" }}>숨겨진 비용 없이 거래 금액 기준으로만 부과됩니다</p>
              </div>
              <div className="fee-grid" style={{ maxWidth: 840, margin: "0 auto" }}>
                <div className="fee-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 26 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e8e8ed", marginBottom: 18 }}>💰 기본 수수료</h3>
                  <div style={{ textAlign: "center", padding: "18px 0", marginBottom: 18, borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
                    <div className="fee-big-num" style={{ fontSize: 42, fontWeight: 800, color: "#FF6B35", letterSpacing: "-1px" }}>0.05%</div>
                    <div style={{ fontSize: 12, color: "#6b6b7e", marginTop: 6 }}>매수 · 매도 · 리밸런싱 동일 적용</div>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {[{ label: "1,000만원 매수 시", value: "수수료 5,000원" }, { label: "500만원 매도 시", value: "수수료 2,500원" }, { label: "리밸런싱 매매도", value: "동일 수수료" }].map((ex) => (
                      <div key={ex.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 12px", borderRadius: 8, background: "rgba(255,255,255,0.02)" }}>
                        <span style={{ fontSize: 12, color: "#6b6b7e" }}>{ex.label}</span>
                        <span style={{ fontSize: 12, fontWeight: 600, color: "#e8e8ed" }}>{ex.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="fee-card" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 18, padding: 26 }}>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: "#e8e8ed", marginBottom: 18 }}>💳 크레딧 충전 방식</h3>
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div style={{ padding: 16, borderRadius: 11, background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e8ed" }}>🏦 원화 결제</span>
                        <span style={{ fontSize: 12, color: "#4a90d9", fontWeight: 600, padding: "2px 7px", background: "rgba(74,144,217,0.1)", borderRadius: 4 }}>1:1</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b6b7e" }}>카드 · 무통장 입금 (PortOne PG 연동)</div>
                      <div style={{ fontSize: 11, color: "#4a4a5e", marginTop: 3 }}>만원 → 10,000 크레딧</div>
                    </div>
                    <div style={{ padding: 16, borderRadius: 11, background: "rgba(255,107,53,0.04)", border: "1px solid rgba(255,107,53,0.15)" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                        <span style={{ fontSize: 14, fontWeight: 600, color: "#e8e8ed" }}>🪙 SYC 코인 결제</span>
                        <span style={{ fontSize: 12, color: "#FF6B35", fontWeight: 700, padding: "2px 7px", background: "rgba(255,107,53,0.1)", borderRadius: 4 }}>20~30% 할인</span>
                      </div>
                      <div style={{ fontSize: 12, color: "#6b6b7e" }}>MetaMask 연동 (PancakeSwap 시세 기준)</div>
                      <div style={{ fontSize: 11, color: "#FF6B35", marginTop: 3, fontWeight: 500 }}>SYC 보유 시 추가 혜택</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <div style={{ textAlign: "center", marginBottom: "clamp(24px,3.5vw,40px)" }}>
                <h2 className="section-title" style={{ fontSize: "clamp(20px,2.8vw,28px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 10 }}>이렇게 시작하세요</h2>
                <p className="section-sub" style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e" }}>5단계면 자동매매가 시작됩니다</p>
              </div>
              <div className="step-grid">
                {STEPS.map((s, i) => (
                  <div key={i} style={{ textAlign: "center", position: "relative" }}>
                    {i < STEPS.length - 1 && <div className="step-line" style={{ position: "absolute", top: 17, left: "calc(50% + 17px)", width: "calc(100% - 34px)", height: 1, background: "rgba(255,255,255,0.06)" }} />}
                    <div style={{ width: 34, height: 34, borderRadius: "50%", margin: "0 auto 12px", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: "#fff", position: "relative", zIndex: 1 }}>{s.n}</div>
                    <div style={{ fontSize: "clamp(12px,1.3vw,13px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 5 }}>{s.title}</div>
                    <div style={{ fontSize: "clamp(10px,1.1vw,12px)", color: "#6b6b7e", lineHeight: 1.6 }}>{s.desc}</div>
                  </div>
                ))}
              </div>
              <div style={{ textAlign: "center", marginTop: 36 }}>
                <Link href="/deepstock" style={{ display: "inline-block", padding: "13px 36px", borderRadius: 12, textDecoration: "none", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff", fontWeight: 700, fontSize: "clamp(13px,1.4vw,15px)" }}>지금 바로 시작하기 →</Link>
              </div>
            </div>
          </>
        )}

        {activeTab === "deepcrypto" && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 18 }}>₿</div>
            <h2 style={{ fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>DeepCrypto 준비중</h2>
            <p style={{ fontSize: "clamp(12px,1.4vw,14px)", color: "#6b6b7e", lineHeight: 1.8 }}>비트코인, 이더리움 등 주요 코인의 AI 매매 시그널 서비스를 준비중입니다.<br />DeepStock 런칭 이후 순차적으로 오픈 예정입니다.</p>
          </div>
        )}

        {activeTab === "deepsoccer" && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ fontSize: 52, marginBottom: 18 }}>⚽</div>
            <h2 style={{ fontSize: "clamp(18px,2.5vw,24px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 12 }}>DeepSoccer 준비중</h2>
            <p style={{ fontSize: "clamp(12px,1.4vw,14px)", color: "#6b6b7e", lineHeight: 1.8 }}>전세계 주요 리그 경기 결과를 AI가 분석하는 서비스를 준비중입니다.<br />DeepStock 런칭 이후 순차적으로 오픈 예정입니다.</p>
          </div>
        )}
      </section>

      <section className="main-section" style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "0 24px" }}>
        <div className="syc-banner" style={{ background: "linear-gradient(135deg, rgba(255,107,53,0.08), rgba(255,46,99,0.04))", border: "1px solid rgba(255,107,53,0.12)", borderRadius: 18, padding: "32px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
          <div>
            <h3 style={{ fontSize: "clamp(15px,2.2vw,19px)", fontWeight: 700, color: "#e8e8ed", marginBottom: 6 }}>SYC 코인으로 결제하면 최대 30% 할인</h3>
            <p style={{ fontSize: "clamp(11px,1.3vw,13px)", color: "#8b8b9e" }}>충전금을 SYC 코인으로 결제하면 원화 대비 20~30% 할인된 가격으로 이용할 수 있습니다.</p>
          </div>
          <Link href="https://www.sykoreapanel.com/syc" style={{ padding: "10px 22px", borderRadius: 10, textDecoration: "none", background: "linear-gradient(135deg, #FF6B35, #FF2E63)", color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>SYC 구매하기</Link>
        </div>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.06)", padding: "22px 16px", textAlign: "center" }}>
        <div style={{ fontSize: "clamp(10px,1.1vw,11px)", color: "#4a4a5e", lineHeight: 1.8 }}>
          SY.ai는 투자 자문 서비스가 아닙니다. 모든 투자 판단은 본인 책임 하에 이루어져야 합니다.<br />
          과거 시뮬레이션 수익률은 미래 수익을 보장하지 않습니다.<br />
          © 2026 SY.ai · SY한국판넬 · SY Coin Project
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={() => setShowAuth(false)} />}
    </div>
  );
}
