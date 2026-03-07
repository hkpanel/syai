"use client";

import { useEffect, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from "recharts";
import { db } from "@/lib/firebase";
import { doc, onSnapshot } from "firebase/firestore";

interface CurvePoint { date: string; value: number; spy: number; }
interface BacktestData {
  profileName: string; start: string; end: string;
  totalReturn: number; spyReturn: number | null;
  cagr: number; mdd: number; sharpe: number;
  finalValue: number; rebalances: number;
  equityCurve: CurvePoint[]; updatedAt: string;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const ai  = payload.find((p: any) => p.dataKey === "value");
  const spy = payload.find((p: any) => p.dataKey === "spy");
  return (
    <div style={{ background: "#1a1a2e", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "10px 14px", fontSize: 12 }}>
      <p style={{ color: "#888", marginBottom: 4 }}>{label}</p>
      {ai  && <p style={{ color: "#FF6B35", fontWeight: 700 }}>DeepStock {ai.value.toFixed(1)}</p>}
      {spy && <p style={{ color: "#999" }}>S&P 500 {spy.value.toFixed(1)}</p>}
    </div>
  );
};

export default function BacktestChart() {
  const [data, setData] = useState<BacktestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "syai", "backtest-result"), (snap) => {
      if (snap.exists()) setData(snap.data() as BacktestData);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const updatedKr = (() => {
    if (!data?.updatedAt) return "";
    try {
      const d = new Date(data.updatedAt);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const dd = String(d.getDate()).padStart(2, "0");
      const hh = d.getHours();
      const min = String(d.getMinutes()).padStart(2, "0");
      return `${m}. ${dd}. ${hh < 12 ? "오전" : "오후"} ${hh % 12 || 12}:${min} 업데이트 백테스트`;
    } catch { return ""; }
  })();

  const excess = data?.spyReturn != null
    ? (data.totalReturn - data.spyReturn).toFixed(1) : null;

  const allVals = data?.equityCurve.flatMap(p => [p.value, p.spy]) ?? [50, 200];
  const yMin = Math.floor(Math.min(...allVals) / 50) * 50;
  const yMax = Math.ceil(Math.max(...allVals) / 50) * 50;

  const STATS = data ? [
    { label: "총 수익률",      value: `${data.totalReturn > 0 ? "+" : ""}${data.totalReturn.toFixed(1)}%`, color: "#FF6B35" },
    { label: "연평균 수익(CAGR)", value: `${data.cagr > 0 ? "+" : ""}${data.cagr.toFixed(1)}%`,          color: "#FF6B35" },
    { label: "최대 낙폭(MDD)",  value: `${data.mdd.toFixed(1)}%`,                                         color: "#aaa"    },
    { label: "샤프 지수",       value: data.sharpe.toFixed(2),                                             color: "#aaa"    },
  ] : [];

  return (
    <div style={{ width: "100%" }}>
      <style>{`
        @media(max-width:767px){
          .bt-title { font-size:20px !important; line-height:1.4 !important; }
          .bt-sub   { font-size:12px !important; }
          .bt-grid  { grid-template-columns:1fr 1fr !important; gap:8px !important; }
          .bt-card  { padding:12px 8px !important; }
          .bt-val   { font-size:18px !important; }
          .bt-chart { height:200px !important; }
          .bt-legend{ display:none !important; }
          .bt-chartbox { padding:16px 8px 12px !important; }
        }
      `}</style>

      {/* ── 헤더 ── */}
      <div style={{ textAlign: "center", marginBottom: 28 }}>
        <span style={{
          display: "inline-block", padding: "3px 12px", borderRadius: 20,
          background: "linear-gradient(135deg,#FF6B35,#FF2E63)",
          color: "#fff", fontSize: 10, fontWeight: 800, letterSpacing: 1, marginBottom: 14,
        }}>VERIFIED BACKTEST</span>

        <h2 className="bt-title" style={{
          fontSize: "clamp(20px,2.8vw,30px)", fontWeight: 800,
          color: "#e8e8ed", marginBottom: 10, wordBreak: "keep-all", lineHeight: 1.25,
        }}>
          시장이 좋았을 때만 백테스트한{" "}
          <span style={{ color: "#6b6b7e" }}>다른 곳과 다릅니다</span>
        </h2>

        <p className="bt-sub" style={{ fontSize: "clamp(12px,1.4vw,14px)", color: "#6b6b7e", lineHeight: 1.8, wordBreak: "keep-all" }}>
          2008년 금융위기, 2020년 코로나 폭락, 2022년 금리 인상 쇼크까지
        </p>

        {excess && Number(excess) > 0 && (
          <p className="bt-sub" style={{
            fontSize: "clamp(12px,1.4vw,14px)", color: "#aaa",
            marginTop: 6, fontWeight: 600, wordBreak: "keep-all",
          }}>
            <strong style={{ color: "#e8e8ed" }}>20년간 모든 위기 구간을 포함한</strong> 실전 검증 결과입니다.{" "}
            S&P 500 대비 <strong style={{ color: "#FF6B35" }}>+{excess}%p</strong> 초과 수익.
          </p>
        )}

        {updatedKr && (
          <p style={{ fontSize: 11, color: "#3a3a4e", marginTop: 8 }}>({updatedKr})</p>
        )}
      </div>

      {/* ── 수치 카드 ── */}
      {data && (
        <div className="bt-grid" style={{
          display: "grid", gridTemplateColumns: "repeat(4,1fr)",
          gap: 12, maxWidth: 820, margin: "0 auto 24px",
        }}>
          {STATS.map(s => (
            <div key={s.label} className="bt-card" style={{
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.07)",
              borderRadius: 14, padding: "16px 10px", textAlign: "center",
            }}>
              <p style={{ fontSize: 11, color: "#6b6b7e", marginBottom: 6, wordBreak: "keep-all" }}>{s.label}</p>
              <p className="bt-val" style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* ── 차트 ── */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#4a4a5e", fontSize: 13 }}>
          백테스트 데이터 로딩중...
        </div>
      ) : !data ? (
        <div style={{ textAlign: "center", padding: "48px 0", color: "#4a4a5e", fontSize: 13 }}>
          백테스트 데이터 없음 — 엔진 메뉴 4번을 실행하세요
        </div>
      ) : (
        <div className="bt-chartbox" style={{
          background: "rgba(255,255,255,0.02)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 16, padding: "24px 20px 16px",
        }}>
          {/* 차트 상단 */}
          <div style={{
            display: "flex", alignItems: "flex-start",
            justifyContent: "space-between", marginBottom: 14,
            flexWrap: "wrap", gap: 8,
          }}>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#e8e8ed" }}>자산 성장 곡선</p>
              <p style={{ fontSize: 11, color: "#4a4a5e", marginTop: 2 }}>
                {data.start} ~ {data.end} | 초기 투자금 100 기준
              </p>
            </div>
            <div className="bt-legend" style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#FF6B35" }}>
                <span style={{ width: 16, height: 2, background: "#FF6B35", display: "inline-block", borderRadius: 2 }} />
                DeepStock
              </span>
              <span style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 11, color: "#666" }}>
                <span style={{ width: 16, height: 2, background: "#666", display: "inline-block", borderRadius: 2 }} />
                S&amp;P 500
              </span>
            </div>
          </div>

          <div className="bt-chart" style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={data.equityCurve} margin={{ top: 5, right: 20, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis
                  dataKey="date"
                  tick={{ fill: "#4a4a5e", fontSize: 10 }}
                  tickFormatter={(v) => v.slice(0, 7)}
                  interval={Math.floor((data.equityCurve.length - 1) / 7)}
                  axisLine={{ stroke: "rgba(255,255,255,0.06)" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "#4a4a5e", fontSize: 10 }}
                  domain={[yMin, yMax]}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`}
                  axisLine={false}
                  tickLine={false}
                  width={38}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={100} stroke="rgba(255,255,255,0.1)" strokeDasharray="4 4" />
                <Line type="monotone" dataKey="spy"   stroke="#444" strokeWidth={1.5} dot={false} />
                <Line type="monotone" dataKey="value" stroke="#FF6B35" strokeWidth={2.5} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <p style={{ textAlign: "center", fontSize: 10, color: "#3a3a4e", marginTop: 12 }}>
            ※ 과거 백테스트 결과이며, 미래 수익을 보장하지 않습니다. 수수료 0.05% 적용.
          </p>
        </div>
      )}
    </div>
  );
}
