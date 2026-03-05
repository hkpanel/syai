/**
 * SY.ai 메인 페이지 v7
 * 다운로드형 AI 분석 도구 + 서비스탭(Stock/Crypto/Soccer) + 법적 안전 문구
 */
"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { onAuthChange, signOut } from "@/lib/auth";
import type { User } from "firebase/auth";
import AuthModal from "@/app/components/AuthModal";

import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

function AnimNum({ value, suffix = "" }: { value: number; suffix?: string }) {
  const [d, setD] = useState(0);
  useEffect(() => {
    let n = 0; const step = value / 40;
    const t = setInterval(() => { n += step; if (n >= value) { setD(value); clearInterval(t); } else setD(Math.floor(n)); }, 25);
    return () => clearInterval(t);
  }, [value]);
  return <span>{d.toLocaleString()}{suffix}</span>;
}

const BACKTEST = [
  { year: "2020", ds: 100, bank: 100, sp: 100 },
  { year: "2021", ds: 128, bank: 102, sp: 127 },
  { year: "2022", ds: 119, bank: 104, sp: 103 },
  { year: "2023", ds: 152, bank: 107, sp: 129 },
  { year: "2024", ds: 189, bank: 110, sp: 162 },
  { year: "2025", ds: 215, bank: 113, sp: 179 },
  { year: "2026", ds: 248, bank: 116, sp: 198 },
];

const DEFAULT_AI_LIVE = {
  regime: "sideways", regimeKr: "횡보장", score: -0.06, fearGreed: 42, vix: 22.4,
  action: "hold", updatedAt: "",
  signals: [
    { name: "시장 온도", score: -0.10, icon: "🌡️" },
    { name: "뉴스 감성", score: -0.20, icon: "📰" },
    { name: "자산 상관", score: +0.10, icon: "🔗" },
    { name: "대안 데이터", score: 0.00, icon: "📡" },
  ],
};

const DEFAULT_ETF_SEL = [
  { cat: "S&P500", name: "TIGER 미국S&P500", cap: "14.9조", score: 0.995, color: "#FF6B35" },
  { cat: "나스닥", name: "TIGER 미국나스닥100", cap: "8.0조", score: 0.819, color: "#FF2E63" },
  { cat: "커버드콜", name: "KODEX 200타겟위클리커버드콜", cap: "3.3조", score: 0.728, color: "#f0b90b" },
  { cat: "채권", name: "ACE 미국30년국채(H)", cap: "1.9조", score: 0.659, color: "#4a90d9" },
  { cat: "금", name: "ACE KRX금현물", cap: "5.2조", score: 0.795, color: "#f5d442" },
  { cat: "한국", name: "KODEX 코스피100", cap: "0.7조", score: 0.624, color: "#64d26d" },
  { cat: "섹터", name: "TIGER 반도체TOP10", cap: "7.2조", score: 0.863, color: "#b47aff" },
];

const SERVICES = [
  { id: "deepstock", name: "DeepStock", icon: "📈", status: "BETA", color: "#FF6B35", desc: "국내 ETF AI 자동 분석 · 리밸런싱 제안", detail: "1,072개 국내 ETF를 AI가 실시간 스캔하고, 시장 분석 기반으로 최적 포트폴리오를 제안합니다. 한국투자증권 API 연동.", features: ["AI 시장분석", "ETF 자동선정", "리밸런싱 제안", "백테스트"], gradient: "linear-gradient(135deg,#FF6B35,#FF2E63)" },
  { id: "deepcrypto", name: "DeepCrypto", icon: "₿", status: "준비중", color: "#f0b90b", desc: "암호화폐 AI 분석 & 매매 시그널", detail: "비트코인, 이더리움 등 주요 코인을 AI가 분석하여 매매 시그널을 제공합니다. 업비트·바이낸스 연동.", features: ["AI 차트분석", "매매 시그널", "변동성 알림", "차익거래"], gradient: "linear-gradient(135deg,#f0b90b,#f5d442)" },
  { id: "deepsoccer", name: "DeepSoccer", icon: "⚽", status: "준비중", color: "#4a90d9", desc: "축구 AI 예측 분석", detail: "전세계 주요 리그 경기를 AI가 분석하여 데이터 기반 예측을 제공합니다.", features: ["BTTS 예측", "배당률 분석", "앙상블 AI", "실시간 업데이트"], gradient: "linear-gradient(135deg,#4a90d9,#357abd)" },
];

const PROFILES = [
  { name: "안정형", icon: "🛡️", target: "연 8~12%", mdd: "MDD -15%", desc: "월배당 + 안전자산 중심", tags: ["커버드콜 월배당", "채권", "저변동성"], color: "#4a90d9", hl: false },
  { name: "균형형", icon: "⚖️", target: "연 15~25%", mdd: "MDD -25%", desc: "성장 + 배당 혼합 (가장 인기)", tags: ["S&P500", "나스닥", "균형"], color: "#FF6B35", hl: true },
  { name: "공격형", icon: "🚀", target: "연 25%+", mdd: "MDD -35%", desc: "성장 섹터 집중", tags: ["나스닥 집중", "테크", "고수익"], color: "#FF2E63", hl: false },
];

const AI_FEAT = [
  { icon: "🌡️", title: "시장 온도 감지 (LSTM)", desc: "과거 패턴을 기억하는 딥러닝이 VIX·금리·공포지수를 종합해 시장을 4가지 국면으로 분류합니다" },
  { icon: "📰", title: "뉴스 감성 분석 (FinBERT)", desc: "금융 특화 AI가 매일 뉴스를 읽고 시장 분위기를 점수화합니다. 가격에 반영되기 전에 먼저 감지합니다" },
  { icon: "🔗", title: "자산 간 이상 신호 감지", desc: "주식·채권·금·달러 상관관계가 깨지면 위기를 먼저 감지하고 방어 포지션으로 전환합니다" },
  { icon: "📡", title: "대안 데이터 + 강화학습", desc: "구글 트렌드·환율·금리 스프레드를 추적하며, 강화학습이 시행착오를 통해 스스로 전략을 진화시킵니다" },
];

export default function HomePage() {
  const [vis, setVis] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [showAuth, setShowAuth] = useState(false);
  const [activeTab, setActiveTab] = useState("deepstock");
  const [aiLive, setAiLive] = useState(DEFAULT_AI_LIVE);
  const [etfSel, setEtfSel] = useState(DEFAULT_ETF_SEL);
  const [etfUpdated, setEtfUpdated] = useState("");
  const [signalUpdated, setSignalUpdated] = useState("");
  useEffect(() => { setVis(true); }, []);
  useEffect(() => { const u = onAuthChange(setUser); return () => u(); }, []);

  // Firestore 실시간 구독 — AI 분석 결과
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "syai", "live-signal"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          setAiLive({
            regime: d.regime || "sideways",
            regimeKr: d.regimeKr || "분석중",
            score: d.score ?? 0,
            fearGreed: d.fearGreed ?? 50,
            vix: d.vix ?? 20,
            action: d.action || "hold",
            updatedAt: d.updatedAt || "",
            signals: d.signals || DEFAULT_AI_LIVE.signals,
          });
          if (d.updatedAt) {
            const dt = new Date(d.updatedAt);
            setSignalUpdated(dt.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
          }
        }
      });
      return () => unsub();
    } catch { /* Firestore 미연결 시 기본값 사용 */ }
  }, []);

  // Firestore 실시간 구독 — ETF 선정 결과
  useEffect(() => {
    try {
      const unsub = onSnapshot(doc(db, "syai", "etf-selection"), (snap) => {
        if (snap.exists()) {
          const d = snap.data();
          if (d.selected && d.selected.length > 0) {
            setEtfSel(d.selected);
          }
          if (d.updatedAt) {
            const dt = new Date(d.updatedAt);
            setEtfUpdated(dt.toLocaleString("ko-KR", { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }));
          }
        }
      });
      return () => unsub();
    } catch { /* Firestore 미연결 시 기본값 사용 */ }
  }, []);

  const rc: Record<string, string> = { bull: "#64d26d", bear: "#FF2E63", crisis: "#FF2E63", sideways: "#f0b90b" };
  const re: Record<string, string> = { bull: "🟢", bear: "🔴", crisis: "🔴", sideways: "🟡" };

  return (
    <div style={{ minHeight: "100vh", background: "#0a0a12", color: "#e8e8ed", fontFamily: "'Pretendard',-apple-system,sans-serif" }}>
      <style>{`
        @import url('https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css');
        *{margin:0;padding:0;box-sizing:border-box}
        .gc{background:rgba(255,255,255,0.02);border:1px solid rgba(255,255,255,0.06);border-radius:16px;transition:all .4s cubic-bezier(.22,1,.36,1)}
        .gc:hover{border-color:rgba(255,107,53,0.2);transform:translateY(-4px)}
        .gl{height:1px;background:linear-gradient(90deg,transparent,rgba(255,107,53,0.4),transparent);margin:clamp(12px,2vh,24px) auto;max-width:600px}
        .pd{width:8px;height:8px;border-radius:50%;background:#64d26d;animation:pd 2s infinite}
        @keyframes pd{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.4;transform:scale(.8)}}
        @keyframes su{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes cb{from{width:0}to{width:var(--t)}}
        .bf{height:100%;border-radius:4px;animation:cb 1.5s ease-out forwards}
        .cl{stroke-dasharray:1000;stroke-dashoffset:1000;animation:dl 2s ease-out forwards}
        @keyframes dl{to{stroke-dashoffset:0}}
        @media(max-width:767px){
          .ht{font-size:24px!important} .hs{font-size:12px!important}
          .g2{grid-template-columns:1fr!important} .g3{grid-template-columns:1fr!important}
          .g7{grid-template-columns:repeat(2,1fr)!important}
          .sr{display:grid!important;grid-template-columns:1fr 1fr!important;gap:16px!important;max-width:300px!important;margin:0 auto!important}
          .cs{flex-direction:column!important}
          .gc{padding:18px!important}
          section{margin-bottom:36px!important}
          h2,h3,p,div{word-break:keep-all!important}
          .hero-wrap{padding-bottom:80px!important}
          .sr{margin-top:80px!important}
        }
      `}</style>

      {/* NAV */}
      <nav style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 100, background: "rgba(10,10,18,0.85)", backdropFilter: "blur(20px)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <div style={{ maxWidth: 1200, margin: "0 auto", padding: "0 24px", height: 56, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{ fontSize: 18, fontWeight: 800, background: "linear-gradient(135deg,#FF6B35,#FF2E63)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>SY.ai</div>
            <div style={{ fontSize: 9, padding: "2px 6px", borderRadius: 4, background: "rgba(255,107,53,0.1)", color: "#FF6B35", fontWeight: 700 }}>BETA</div>
          </div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 12, color: "#8b8b9e" }}>{user.displayName || user.email}</span>
              <button onClick={() => signOut()} style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid rgba(255,255,255,0.08)", background: "none", color: "#8b8b9e", fontSize: 11, cursor: "pointer" }}>로그아웃</button>
            </div>
          ) : (
            <button onClick={() => setShowAuth(true)} style={{ padding: "7px 18px", borderRadius: 8, border: "none", background: "linear-gradient(135deg,#FF6B35,#FF2E63)", color: "#fff", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>시작하기</button>
          )}
        </div>
      </nav>

      {/* HERO */}
      <section className="hero-wrap" style={{ position: "relative", paddingTop: "clamp(90px,12vh,150px)", paddingBottom: "clamp(40px,12vh,130px)", textAlign: "center", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: "20%", left: "50%", transform: "translate(-50%,-50%)", width: "clamp(300px,60vw,700px)", height: "clamp(300px,60vw,700px)", borderRadius: "50%", background: "radial-gradient(circle,rgba(255,107,53,0.08) 0%,transparent 70%)", pointerEvents: "none" }} />
        <div style={{ position: "relative", zIndex: 1, maxWidth: 900, margin: "0 auto", padding: "0 24px", opacity: vis ? 1 : 0, transform: vis ? "none" : "translateY(30px)", transition: "all 1s ease" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "5px 14px", borderRadius: 20, background: "rgba(100,210,109,0.08)", border: "1px solid rgba(100,210,109,0.2)", marginBottom: 18 }}>
            <div className="pd" />
            <span style={{ fontSize: 12, color: "#64d26d", fontWeight: 600 }}>AI 엔진 가동중 · 주식 · 코인 · 스포츠 AI 분석</span>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 6, marginBottom: "clamp(24px,4vh,40px)" }}>
            {["FinBERT", "LSTM", "강화학습", "앙상블", "상관관계 네트워크"].map(t => (
              <span key={t} style={{ fontSize: 10, padding: "3px 10px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.12)", color: "#FF6B35", fontWeight: 600 }}>{t}</span>
            ))}
          </div>
          <h1 className="ht" style={{ fontSize: "clamp(28px,5vw,52px)", fontWeight: 800, lineHeight: 1.15, letterSpacing: "-1px", marginBottom: "clamp(16px,3vh,28px)" }}>
            <span style={{ background: "linear-gradient(135deg,#FF6B35,#FF2E63)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>읽고, 기억하고, 진화하는 AI</span>
          </h1>
          <p style={{ fontSize: "clamp(13px,1.5vw,16px)", color: "#f0b90b", fontWeight: 600, marginBottom: "clamp(16px,3vh,24px)" }}>어려운 기술을 모르셔도 괜찮습니다.</p>
          <p className="hs" style={{ fontSize: "clamp(13px,1.6vw,17px)", color: "#8b8b9e", lineHeight: 1.8, maxWidth: 660, margin: `0 auto clamp(32px,5vh,48px)` }}>
            4개의 독립 AI 엔진이 시장 온도 · 뉴스 감성 · 공포지수를 24시간 분석하고, <strong style={{ color: "#e8e8ed" }}>1,072+개 ETF</strong>를 실시간 스캔하여 당신의 투자 성향에 맞는 최적의 포트폴리오를 제안합니다.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 14, flexWrap: "wrap", marginBottom: "clamp(32px,5vh,48px)" }}>
            <a href="#download" style={{ padding: "14px 36px", borderRadius: 12, textDecoration: "none", background: "linear-gradient(135deg,#FF6B35,#FF2E63)", color: "#fff", fontWeight: 700, fontSize: 15, boxShadow: "0 8px 32px rgba(255,107,53,0.3)" }}>프로그램 다운로드</a>
            <a href="#backtest" style={{ padding: "14px 36px", borderRadius: 12, textDecoration: "none", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#e8e8ed", fontWeight: 600, fontSize: 15 }}>수익률 확인 ↓</a>
          </div>
          <div className="sr" style={{ display: "flex", justifyContent: "center", gap: 36 }}>
            {[{ n: 1072, s: "+", l: "ETF 실시간 스캔" }, { n: 4, s: "개", l: "AI 분석 엔진" }, { n: 3, s: "종", l: "주식·코인·스포츠" }, { n: 24, s: "h", l: "무중단 분석" }].map((s, i) => (
              <div key={i} style={{ textAlign: "center" }}>
                <div style={{ fontSize: "clamp(24px,3vw,36px)", fontWeight: 800, background: "linear-gradient(135deg,#FF6B35,#FF2E63)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}><AnimNum value={s.n} suffix={s.s} /></div>
                <div style={{ fontSize: 11, color: "#6b6b7e", marginTop: 2 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gl" />

      {/* ═══ 3가지 서비스 ═══ */}
      <section style={{ maxWidth: 1200, margin: "0 auto 40px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, marginBottom: 8 }}>하나의 프로그램, 세 가지 AI</h2>
          <p style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e" }}>SY.ai 런처 하나로 필요한 서비스만 골라 쓰세요</p>
        </div>
        <div className="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
          {SERVICES.map((svc, i) => (
            <div key={i} className="gc" style={{ padding: 28, cursor: "pointer", borderColor: activeTab === svc.id ? "rgba(255,107,53,0.3)" : undefined }} onClick={() => setActiveTab(svc.id)}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
                <span style={{ fontSize: 28 }}>{svc.icon}</span>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 800 }}>{svc.name}</div>
                  <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 4, background: `${svc.color}20`, color: svc.color, fontWeight: 700 }}>{svc.status}</span>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.7, marginBottom: 14 }}>{svc.detail}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {svc.features.map(f => (
                  <span key={f} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: "rgba(255,255,255,0.04)", color: "#8b8b9e", fontWeight: 600 }}>{f}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="gl" />

      {/* ═══ 다운로드 CTA ═══ */}
      <section id="download" style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "0 24px" }}>
        <div className="gc" style={{ padding: "40px 32px", textAlign: "center", background: "linear-gradient(135deg,rgba(255,107,53,0.04),rgba(255,46,99,0.02))", borderColor: "rgba(255,107,53,0.15)" }}>
          <div style={{ fontSize: 40, marginBottom: 16 }}>🤖</div>
          <h2 style={{ fontSize: "clamp(20px,3vw,28px)", fontWeight: 800, marginBottom: 8 }}>SY.ai — AI 투자 분석 도구</h2>
          <p style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#8b8b9e", lineHeight: 1.8, marginBottom: 24 }}>
            내 PC에 설치하고, 내 API 키로, 내가 직접 실행합니다. AI가 분석하고 제안하지만 <strong style={{ color: "#e8e8ed" }}>최종 투자 결정은 항상 본인</strong>입니다. 자동 업데이트 지원 · 가벼운 코어 + 플러그인 구조
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <a href="#" style={{ padding: "14px 32px", borderRadius: 12, textDecoration: "none", background: "linear-gradient(135deg,#FF6B35,#FF2E63)", color: "#fff", fontWeight: 700, fontSize: 14, boxShadow: "0 8px 32px rgba(255,107,53,0.3)" }}>Windows 다운로드 (준비중)</a>
          </div>
          <div style={{ marginTop: 16, display: "flex", justifyContent: "center", gap: 20, fontSize: 11, color: "#6b6b7e", flexWrap: "wrap" }}>
            <span>✅ 자동 업데이트</span>
            <span>✅ 내 PC에서 실행</span>
            <span>✅ API 키 본인 관리</span>
          </div>
        </div>
      </section>

      <div className="gl" />

      {/* ETF 자동 선정 */}
      <section style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", padding: "3px 11px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", fontSize: 11, color: "#FF6B35", fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>AI 자동 선정</div>
          <h2 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, marginBottom: 8, wordBreak: "keep-all" }}>1,072+개 중 AI가 고른 최적의 7종</h2>
          <p style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e" }}>시가총액 · 거래량 · NAV 괴리율 종합 분석</p>
          {etfUpdated && <p style={{ fontSize: 11, color: "#4a4a5e", marginTop: 4 }}>({etfUpdated} 업데이트)</p>}
        </div>
        <div className="g7" style={{ display: "grid", gridTemplateColumns: "repeat(7,1fr)", gap: 10 }}>
          {etfSel.map((e, i) => (
            <div key={i} className="gc" style={{ padding: 16, textAlign: "center", animation: `su .5s ease ${i * .08}s both` }}>
              <div style={{ fontSize: 10, color: e.color, fontWeight: 700, marginBottom: 6 }}>{e.cat}</div>
              <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 4, lineHeight: 1.3, minHeight: 32 }}>{e.name}</div>
              <div style={{ fontSize: 10, color: "#6b6b7e", marginBottom: 8 }}>{e.cap}</div>
              <div style={{ width: "100%", height: 4, borderRadius: 2, background: "rgba(255,255,255,0.04)" }}>
                <div className="bf" style={{ background: e.color, "--t": `${e.score * 100}%` } as React.CSSProperties} />
              </div>
              <div style={{ fontSize: 10, color: e.color, fontWeight: 700, marginTop: 4 }}>{(e.score * 100).toFixed(1)}점</div>
            </div>
          ))}
        </div>
      </section>

      <div className="gl" />

      {/* 실시간 AI 분석 */}
      <section style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: "3px 11px", borderRadius: 20, background: "rgba(100,210,109,0.06)", border: "1px solid rgba(100,210,109,0.15)", fontSize: 11, color: "#64d26d", fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>
            <div className="pd" style={{ width: 6, height: 6 }} />LIVE · AI 시장 분석
          </div>
          <h2 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, marginBottom: 4 }}>AI가 지금 이 순간도 시장을 보고 있습니다</h2>
          {signalUpdated && <p style={{ fontSize: 12, color: "#4a4a5e", marginBottom: 0 }}>({signalUpdated} 업데이트)</p>}
        </div>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, maxWidth: 900, margin: "0 auto" }}>
          <div className="gc" style={{ padding: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 20 }}>
              <span style={{ fontSize: 28 }}>{re[aiLive.regime]}</span>
              <div>
                <div style={{ fontSize: 22, fontWeight: 800, color: rc[aiLive.regime] }}>{aiLive.regimeKr}</div>
                <div style={{ fontSize: 12, color: "#6b6b7e" }}>종합 점수: {aiLive.score.toFixed(2)}</div>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 10, color: "#6b6b7e", marginBottom: 4 }}>Fear & Greed</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f0b90b" }}>{aiLive.fearGreed}</div>
                <div style={{ fontSize: 10, color: "#6b6b7e" }}>공포</div>
              </div>
              <div style={{ padding: 14, borderRadius: 10, background: "rgba(255,255,255,0.02)" }}>
                <div style={{ fontSize: 10, color: "#6b6b7e", marginBottom: 4 }}>VIX 공포지수</div>
                <div style={{ fontSize: 22, fontWeight: 800, color: "#f0b90b" }}>{aiLive.vix}</div>
                <div style={{ fontSize: 10, color: "#6b6b7e" }}>경계</div>
              </div>
            </div>
            <div style={{ marginTop: 16, padding: 12, borderRadius: 8, background: "rgba(255,107,53,0.04)", border: "1px solid rgba(255,107,53,0.1)", fontSize: 12, color: "#FF6B35", fontWeight: 600, textAlign: "center" }}>
              💡 AI 권장: {aiLive.action === "hold" ? "현재 비중 유지 (HOLD)" : aiLive.action === "increase_risk" ? "성장 비중 확대 (공격)" : "안전자산 확대 (방어)"}
            </div>
          </div>
          <div className="gc" style={{ padding: 28 }}>
            <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 18 }}>4개 AI 분석 엔진</div>
            {aiLive.signals.map((s, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: i < 3 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <span style={{ fontSize: 20 }}>{s.icon}</span>
                <div style={{ flex: 1, fontSize: 13, fontWeight: 600 }}>{s.name}</div>
                <div style={{ width: 80, height: 6, borderRadius: 3, background: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                  <div style={{ width: `${Math.abs(s.score) * 100 + 10}%`, height: "100%", borderRadius: 3, background: s.score > 0 ? "#64d26d" : s.score < 0 ? "#FF2E63" : "#8b8b9e" }} />
                </div>
                <div style={{ fontSize: 13, fontWeight: 700, color: s.score > 0 ? "#64d26d" : s.score < 0 ? "#FF2E63" : "#8b8b9e", width: 44, textAlign: "right" }}>{s.score > 0 ? "+" : ""}{s.score.toFixed(2)}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="gl" />

      {/* 백테스트 차트 */}
      <section id="backtest" style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", padding: "3px 11px", borderRadius: 20, background: "rgba(255,107,53,0.06)", border: "1px solid rgba(255,107,53,0.15)", fontSize: 11, color: "#FF6B35", fontWeight: 600, marginBottom: 12, letterSpacing: 1 }}>BACKTEST</div>
          <h2 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, marginBottom: 8 }}>6년 전에 시작했다면?</h2>
          <p style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e" }}>균형형 프로파일 · 월 1회 리밸런싱 · 배당 재투자 포함</p>
        </div>
        <div className="gc cs" style={{ padding: 32, display: "flex", gap: 32, alignItems: "center" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <svg viewBox="0 0 500 220" style={{ width: "100%" }}>
              {[50, 100, 150, 200].map(y => (<g key={y}><line x1="40" y1={220 - y} x2="480" y2={220 - y} stroke="rgba(255,255,255,0.04)" /><text x="35" y={224 - y} textAnchor="end" fill="#4a4a5e" fontSize="10">{y}%</text></g>))}
              {BACKTEST.map((d, i) => (<text key={i} x={40 + i * 73} y={218} textAnchor="middle" fill="#6b6b7e" fontSize="10">{d.year}</text>))}
              <polyline fill="none" stroke="#4a4a5e" strokeWidth="1.5" strokeDasharray="4,4" points={BACKTEST.map((d, i) => `${40 + i * 73},${220 - d.bank}`).join(" ")} />
              <polyline className="cl" fill="none" stroke="#4a90d9" strokeWidth="2" points={BACKTEST.map((d, i) => `${40 + i * 73},${220 - d.sp}`).join(" ")} />
              <polyline className="cl" fill="none" stroke="url(#gr)" strokeWidth="3" points={BACKTEST.map((d, i) => `${40 + i * 73},${220 - d.ds}`).join(" ")} />
              <defs><linearGradient id="gr" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stopColor="#FF6B35" /><stop offset="100%" stopColor="#FF2E63" /></linearGradient></defs>
              <text x="482" y={220 - 248 + 4} fill="#FF6B35" fontSize="12" fontWeight="800">+148%</text>
              <text x="482" y={220 - 198 + 4} fill="#4a90d9" fontSize="10">+98%</text>
              <text x="482" y={220 - 116 + 4} fill="#4a4a5e" fontSize="10">+16%</text>
            </svg>
          </div>
          <div style={{ minWidth: 200 }}>
            {[{ n: "DeepStock 균형형", r: "+148%", c: "16.3%", co: "#FF6B35", b: true }, { n: "S&P500 단순보유", r: "+98%", c: "12.1%", co: "#4a90d9", b: false }, { n: "은행 예금", r: "+16%", c: "2.5%", co: "#4a4a5e", b: false }].map((l, i) => (
              <div key={i} style={{ padding: "14px 0", borderBottom: i < 2 ? "1px solid rgba(255,255,255,0.04)" : "none" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <div style={{ width: 12, height: 3, borderRadius: 2, background: l.co }} />
                  <span style={{ fontSize: 13, fontWeight: l.b ? 700 : 500, color: l.b ? "#e8e8ed" : "#8b8b9e" }}>{l.n}</span>
                </div>
                <div style={{ display: "flex", gap: 16, paddingLeft: 20 }}>
                  <div><span style={{ fontSize: 20, fontWeight: 800, color: l.co }}>{l.r}</span><span style={{ fontSize: 10, color: "#6b6b7e", marginLeft: 4 }}>누적</span></div>
                  <div><span style={{ fontSize: 14, fontWeight: 600, color: "#8b8b9e" }}>{l.c}</span><span style={{ fontSize: 10, color: "#6b6b7e", marginLeft: 4 }}>연평균</span></div>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 14, padding: 10, borderRadius: 8, background: "rgba(255,255,255,0.02)", fontSize: 10, color: "#4a4a5e", lineHeight: 1.6 }}>※ 과거 시뮬레이션이며 미래 수익을 보장하지 않습니다</div>
          </div>
        </div>
      </section>

      <div className="gl" />

      {/* AI 엔진 4개 */}
      <section style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, marginBottom: 8 }}>이동평균선, MACD로 투자하던 시대는 끝났습니다</h2>
          <p style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e" }}>FinBERT · LSTM · 강화학습 — 4개 독립 AI 엔진이 앙상블로 시장을 읽습니다</p>
        </div>
        <div className="g2" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, maxWidth: 900, margin: "0 auto" }}>
          {AI_FEAT.map((f, i) => (
            <div key={i} className="gc" style={{ padding: 24, animation: `su .5s ease ${i * .1}s both` }}>
              <div style={{ fontSize: 28, marginBottom: 12 }}>{f.icon}</div>
              <div style={{ fontSize: 16, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 13, color: "#8b8b9e", lineHeight: 1.7 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      <div className="gl" />

      {/* 프로파일 3개 */}
      <section style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "0 24px" }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h2 style={{ fontSize: "clamp(20px,3vw,30px)", fontWeight: 800, marginBottom: 8 }}>하나만 고르세요. 나머지는 AI가 분석합니다.</h2>
          <p style={{ fontSize: "clamp(12px,1.4vw,15px)", color: "#6b6b7e" }}>투자 성향에 따라 3가지 중 선택하면 AI가 최적 비중을 제안합니다</p>
        </div>
        <div className="g3" style={{ display: "grid", gridTemplateColumns: "repeat(3,1fr)", gap: 16, maxWidth: 1000, margin: "0 auto" }}>
          {PROFILES.map((p, i) => (
            <div key={i} className="gc" style={{ padding: 28, borderColor: p.hl ? "rgba(255,107,53,0.3)" : undefined, position: "relative", overflow: "hidden" }}>
              {p.hl && <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 3, background: "linear-gradient(90deg,#FF6B35,#FF2E63)" }} />}
              <div style={{ fontSize: 32, marginBottom: 12 }}>{p.icon}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: p.color, marginBottom: 4 }}>{p.name}</div>
              <div style={{ fontSize: 26, fontWeight: 800, marginBottom: 4 }}>{p.target}</div>
              <div style={{ fontSize: 12, color: "#8b8b9e", marginBottom: 16 }}>{p.mdd} · {p.desc}</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {p.tags.map(t => (<span key={t} style={{ fontSize: 10, padding: "3px 8px", borderRadius: 4, background: `${p.color}15`, color: p.color, fontWeight: 600 }}>{t}</span>))}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div className="gl" />

      {/* SYC 배너 + CTA */}
      <section style={{ maxWidth: 1200, margin: "0 auto 56px", padding: "0 24px" }}>
        <div className="gc" style={{ padding: "32px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16, background: "linear-gradient(135deg,rgba(255,107,53,0.06),rgba(255,46,99,0.03))", borderColor: "rgba(255,107,53,0.12)" }}>
          <div>
            <h3 style={{ fontSize: "clamp(15px,2.2vw,19px)", fontWeight: 700, marginBottom: 6 }}>SYC 코인으로 결제하면 최대 30% 할인</h3>
            <p style={{ fontSize: "clamp(11px,1.3vw,13px)", color: "#8b8b9e", wordBreak: "keep-all" }}>수수료 0.05% · SYC 결제 시 추가 할인 · 숨겨진 비용 없음</p>
          </div>
          <Link href="https://www.sykoreapanel.com/syc" style={{ padding: "10px 22px", borderRadius: 10, textDecoration: "none", background: "linear-gradient(135deg,#FF6B35,#FF2E63)", color: "#fff", fontWeight: 700, fontSize: 13, whiteSpace: "nowrap" }}>SYC 알아보기</Link>
        </div>
      </section>

      <section style={{ textAlign: "center", padding: "48px 24px 64px" }}>
        <h2 style={{ fontSize: "clamp(22px,3.5vw,36px)", fontWeight: 800, marginBottom: 12 }}>읽고, 기억하고, 진화하는 AI를 경험하세요</h2>
        <p style={{ fontSize: "clamp(13px,1.5vw,16px)", color: "#6b6b7e", marginBottom: 28 }}>다운로드 → API 키 입력 → 프로파일 선택 → AI가 24시간 분석</p>
        <a href="#download" style={{ display: "inline-block", padding: "15px 44px", borderRadius: 14, textDecoration: "none", background: "linear-gradient(135deg,#FF6B35,#FF2E63)", color: "#fff", fontWeight: 700, fontSize: 16, boxShadow: "0 8px 40px rgba(255,107,53,0.3)" }}>프로그램 다운로드</a>
      </section>

      <footer style={{ borderTop: "1px solid rgba(255,255,255,0.04)", padding: "22px 16px", textAlign: "center" }}>
        <div style={{ fontSize: 11, color: "#4a4a5e", lineHeight: 1.8 }}>
          SY.ai는 AI 기반 투자 분석 소프트웨어이며, 투자자문업·투자일임업에 해당하지 않습니다.<br />
          본 소프트웨어는 종목 추천이나 개별 투자 조언을 제공하지 않으며, 모든 투자 판단과 실행은 이용자 본인의 책임입니다.<br />
          과거 시뮬레이션 수익률은 미래 수익을 보장하지 않습니다.<br />
          © 2026 SY.ai · SY한국판넬 · SY Coin Project
        </div>
      </footer>

      {showAuth && <AuthModal onClose={() => setShowAuth(false)} onLogin={() => setShowAuth(false)} />}
    </div>
  );
}
