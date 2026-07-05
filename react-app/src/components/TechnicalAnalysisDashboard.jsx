import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, AreaChart, Area, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";
import { formatPrice } from "../utils/coinFormatting.js";

function GaugeCard({ label, value, max = 100, tone = "cyan" }) {
  const ratio = Math.max(0, Math.min(100, Number(value) || 0)) / max;
  const colorMap = {
    cyan: "from-cyan-400 to-sky-500",
    emerald: "from-emerald-400 to-green-500",
    rose: "from-rose-400 to-orange-500",
    amber: "from-amber-400 to-yellow-500",
  };
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur">
      <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</div>
      <div className="mt-3 h-2.5 overflow-hidden rounded-full bg-slate-800">
        <div className={`h-full rounded-full bg-gradient-to-r ${colorMap[tone]}`} style={{ width: `${ratio * 100}%` }} />
      </div>
      <div className="mt-3 text-2xl font-semibold text-white">{value}</div>
    </div>
  );
}

function SignalChip({ signal }) {
  const tone = signal === "Bullish" || signal === "Buy" ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : signal === "Bearish" || signal === "Sell" ? "border-rose-500/20 bg-rose-500/10 text-rose-300" : "border-slate-600/30 bg-slate-800/70 text-slate-200";
  return <span className={`rounded-full border px-3 py-1 text-sm ${tone}`}>{signal}</span>;
}

export default function TechnicalAnalysisDashboard({ analysis }) {
  const chartData = useMemo(() => {
    if (!analysis?.history?.length) return [];
    return analysis.history.map((point) => ({
      label: point.label,
      price: Number(point.price) || 0,
      ema: Number(point.ema) || 0,
      sma: Number(point.sma) || 0,
      vwap: Number(point.vwap) || 0,
    }));
  }, [analysis]);

  const radarData = useMemo(() => {
    if (!analysis) return [];
    return [
      { subject: "RSI", value: Math.max(0, Math.min(100, Number(analysis.rsi) || 0)) },
      { subject: "Momentum", value: Math.max(0, Math.min(100, Number(analysis.momentum) || 0)) },
      { subject: "Volatility", value: Math.max(0, Math.min(100, Number(analysis.volatility) || 0)) },
      { subject: "Trend", value: Math.max(0, Math.min(100, Number(analysis.trendStrength) || 0)) },
      { subject: "ADX", value: Math.max(0, Math.min(100, Number(analysis.adx) || 0)) },
    ];
  }, [analysis]);

  if (!analysis) return null;

  return (
    <div className="mt-6 space-y-6">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-6 shadow-[0_0_45px_rgba(2,6,23,0.35)] backdrop-blur">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-sm uppercase tracking-[0.3em] text-cyan-300">Technical analysis</div>
            <div className="mt-1 text-2xl font-semibold text-white">{analysis.symbol} market structure</div>
          </div>
          <SignalChip signal={analysis.signal} />
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <GaugeCard label="RSI" value={analysis.rsi?.toFixed(1)} max={100} tone="cyan" />
          <GaugeCard label="MACD" value={analysis.macd?.toFixed(2)} max={100} tone="emerald" />
          <GaugeCard label="Trend strength" value={analysis.trendStrength?.toFixed(1)} max={100} tone="amber" />
          <GaugeCard label="Volatility" value={analysis.volatility?.toFixed(1)} max={100} tone="rose" />
        </div>
      </motion.div>

      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_0_40px_rgba(2,6,23,0.35)] backdrop-blur">
          <div className="mb-3 text-lg font-semibold text-white">Indicator overlay</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="priceArea" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.04} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.14)" vertical={false} />
                <XAxis dataKey="label" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="price" stroke="#38bdf8" fill="url(#priceArea)" />
                <Line type="monotone" dataKey="ema" stroke="#a78bfa" strokeWidth={2} />
                <Line type="monotone" dataKey="sma" stroke="#f59e0b" strokeWidth={2} />
                <Line type="monotone" dataKey="vwap" stroke="#34d399" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_0_40px_rgba(2,6,23,0.35)] backdrop-blur">
          <div className="mb-3 text-lg font-semibold text-white">Indicator radar</div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radarData}>
                <PolarGrid stroke="rgba(148,163,184,0.2)" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} />
                <Radar dataKey="value" stroke="#22d3ee" fill="#22d3ee" fillOpacity={0.35} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">EMA</div>
          <div className="mt-2 text-xl font-semibold text-white">{formatPrice(analysis.ema)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">SMA</div>
          <div className="mt-2 text-xl font-semibold text-white">{formatPrice(analysis.sma)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">VWAP</div>
          <div className="mt-2 text-xl font-semibold text-white">{formatPrice(analysis.vwap)}</div>
        </div>
        <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
          <div className="text-xs uppercase tracking-[0.3em] text-slate-500">ATR</div>
          <div className="mt-2 text-xl font-semibold text-white">{formatPrice(analysis.atr)}</div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <div className="mb-3 text-lg font-semibold text-white">Support & resistance</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="text-sm text-emerald-300">Support</div>
              <div className="mt-1 text-xl font-semibold text-emerald-100">{formatPrice(analysis.support)}</div>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <div className="text-sm text-rose-300">Resistance</div>
              <div className="mt-1 text-xl font-semibold text-rose-100">{formatPrice(analysis.resistance)}</div>
            </div>
          </div>
        </div>
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-4">
          <div className="mb-3 text-lg font-semibold text-white">Bands & cloud</div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Bollinger upper</div>
              <div className="mt-1 text-xl font-semibold text-white">{formatPrice(analysis.bollinger?.upper)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="text-sm text-slate-400">Ichimoku cloud</div>
              <div className="mt-1 text-xl font-semibold text-white">{formatPrice(analysis.ichimoku)}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
