"use client";

/**
 * BacktestChart.tsx
 * Firestore syai/backtest-result 실시간 읽어서 백테스트 차트 표시
 *
 * 설치: src/components/BacktestChart.tsx 에 넣으면 됨
 * 사용: <BacktestChart /> — 홈페이지 원하는 위치에 삽입
 */

import { useEffect, useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { db } from "@/lib/firebase";          // 기존 firebase 설정 재사용
import { doc, onSnapshot } from "firebase/firestore";

// ─── 타입 ───────────────────────────────────────
interface CurvePoint {
  date: string;
  value: number;   // AI 전략 (100 기준)
  spy: number;     // S&P500 벤치마크 (100 기준)
}

interface BacktestData {
  profileName: string;
  start: string;
  end: string;
  totalReturn: number;
  spyReturn: number | null;
  cagr: number;
  mdd: number;
  sharpe: number;
  finalValue: number;
  rebalances: number;
  equityCurve: CurvePoint[];
  updatedAt: string;
}

// ─── 커스텀 툴팁 ──────────────────────────────────
const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  const ai  = payload.find((p: any) => p.dataKey === "value");
  const spy = payload.find((p: any) => p.dataKey === "spy");
  return (
    <div className="bg-[#1a1a2e] border border-white/10 rounded-lg p-3 text-sm shadow-xl">
      <p className="text-gray-400 mb-1">{label}</p>
      {ai  && <p style={{ color: "#FF6B35" }}>DeepStock: {ai.value.toFixed(1)}</p>}
      {spy && <p style={{ color: "#888" }}>S&P 500: {spy.value.toFixed(1)}</p>}
    </div>
  );
};

// ─── 메인 컴포넌트 ────────────────────────────────
export default function BacktestChart() {
  const [data, setData] = useState<BacktestData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const ref = doc(db, "syai", "backtest-result");
    const unsub = onSnapshot(ref, (snap) => {
      if (snap.exists()) {
        setData(snap.data() as BacktestData);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-500 text-sm">
        백테스트 데이터 로딩중...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex justify-center items-center py-20 text-gray-500 text-sm">
        백테스트 데이터가 없습니다. 엔진에서 4번을 실행해주세요.
      </div>
    );
  }

  const updatedKr = (() => {
    try {
      const d = new Date(data.updatedAt);
      const m = d.getMonth() + 1;
      const dd = d.getDate();
      const hh = d.getHours();
      const min = String(d.getMinutes()).padStart(2, "0");
      const ampm = hh < 12 ? "오전" : "오후";
      const h12 = hh % 12 || 12;
      return `${m < 10 ? "0" + m : m}. ${dd < 10 ? "0" + dd : dd}. ${ampm} ${h12}:${min} 업데이트 백테스트`;
    } catch {
      return data.updatedAt;
    }
  })();

  const excess = data.spyReturn != null
    ? (data.totalReturn - data.spyReturn).toFixed(1)
    : null;

  // Y축 범위 계산
  const allVals = data.equityCurve.flatMap((p) => [p.value, p.spy]);
  const yMin = Math.floor(Math.min(...allVals) / 10) * 10;
  const yMax = Math.ceil(Math.max(...allVals) / 10) * 10;

  return (
    <section className="w-full mt-16 px-4">
      {/* ── 홍보 문구 ── */}
      <div className="text-center mb-8">
        <span className="inline-block bg-gradient-to-r from-[#FF6B35] to-[#FF2E63] text-white text-xs font-bold px-3 py-1 rounded-full mb-3">
          VERIFIED BACKTEST
        </span>
        <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
          시장이 좋았을 때만 백테스트한{" "}
          <span className="text-gray-400">다른 곳과 다릅니다</span>
        </h2>
        <p className="text-gray-400 text-sm md:text-base leading-relaxed max-w-2xl mx-auto">
          2008년 금융위기, 2020년 코로나 폭락, 2022년 금리 인상 쇼크까지
          <br className="hidden md:block" />
          <strong className="text-white">20년간 모든 위기 구간을 포함한</strong> 실전 검증 결과입니다.
          {excess && Number(excess) > 0 && (
            <> S&P 500 대비 <strong className="text-[#FF6B35]">+{excess}%p</strong> 초과 수익.</>
          )}
        </p>
        <p className="text-gray-600 text-xs mt-2">({updatedKr})</p>
      </div>

      {/* ── 핵심 수치 요약 ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6 max-w-3xl mx-auto">
        {[
          { label: "총 수익률", value: `${data.totalReturn > 0 ? "+" : ""}${data.totalReturn.toFixed(1)}%`, color: data.totalReturn > 0 ? "#FF6B35" : "#FF2E63" },
          { label: "연평균 수익(CAGR)", value: `${data.cagr > 0 ? "+" : ""}${data.cagr.toFixed(1)}%`, color: data.cagr > 0 ? "#FF6B35" : "#FF2E63" },
          { label: "최대 낙폭(MDD)", value: `${data.mdd.toFixed(1)}%`, color: "#888" },
          { label: "샤프 지수", value: data.sharpe.toFixed(2), color: "#aaa" },
        ].map((item) => (
          <div key={item.label} className="bg-white/5 rounded-xl p-3 text-center border border-white/10">
            <p className="text-gray-500 text-xs mb-1">{item.label}</p>
            <p className="font-bold text-lg" style={{ color: item.color }}>{item.value}</p>
          </div>
        ))}
      </div>

      {/* ── 차트 ── */}
      <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-white font-semibold text-sm">자산 성장 곡선</h3>
            <p className="text-gray-500 text-xs">{data.start} ~ {data.end} | 초기 투자금 100 기준</p>
          </div>
          <div className="flex gap-4 text-xs">
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#FF6B35] inline-block rounded" />
              <span className="text-gray-400">DeepStock</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-0.5 bg-[#666] inline-block rounded" />
              <span className="text-gray-400">S&P 500</span>
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={320}>
          <LineChart data={data.equityCurve} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#666", fontSize: 10 }}
              tickFormatter={(v) => v.slice(0, 7)}   // "2020-01"
              interval={Math.floor(data.equityCurve.length / 8)}
            />
            <YAxis
              tick={{ fill: "#666", fontSize: 10 }}
              domain={[yMin, yMax]}
              tickFormatter={(v) => `${v}`}
            />
            <Tooltip content={<CustomTooltip />} />
            {/* 초기 투자금 기준선 */}
            <ReferenceLine y={100} stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
            <Line
              type="monotone"
              dataKey="spy"
              stroke="#555"
              strokeWidth={1.5}
              dot={false}
              name="S&P 500"
            />
            <Line
              type="monotone"
              dataKey="value"
              stroke="#FF6B35"
              strokeWidth={2}
              dot={false}
              name="DeepStock"
            />
          </LineChart>
        </ResponsiveContainer>

        {/* 하단 면책 */}
        <p className="text-center text-gray-600 text-xs mt-4">
          ※ 과거 백테스트 결과이며, 미래 수익을 보장하지 않습니다. 수수료 0.05% 적용.
        </p>
      </div>
    </section>
  );
}
