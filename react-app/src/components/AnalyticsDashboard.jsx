import React, { useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell } from "recharts";
import { formatNumber, formatPrice, getChangeColor } from "../utils/coinFormatting.js";
import { buildCoinAnalyticsMetrics } from "../utils/coinAnalytics.js";

const NAV_ITEMS = [
  { id: "overview", label: "Overview" },
  { id: "prediction", label: "AI Prediction" },
  { id: "signals", label: "Technical" },
  { id: "portfolio", label: "Portfolio" },
  { id: "alerts", label: "Alerts" },
];

const sparklineData = [
  { name: "A", value: 42 },
  { name: "B", value: 46 },
  { name: "C", value: 44 },
  { name: "D", value: 51 },
  { name: "E", value: 47 },
  { name: "F", value: 60 },
  { name: "G", value: 58 },
];

const riskData = [
  { name: "Volatility", value: 62 },
  { name: "Momentum", value: 84 },
  { name: "Liquidity", value: 76 },
];

const sentimentData = [
  { name: "Positive", value: 68 },
  { name: "Neutral", value: 22 },
  { name: "Negative", value: 10 },
];

function StatCard({ title, value, detail, tone = "neutral" }) {
  const toneClasses = {
    positive: "text-emerald-400",
    negative: "text-rose-400",
    neutral: "text-slate-300",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_0_30px_rgba(15,23,42,0.35)] backdrop-blur-xl"
    >
      <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-400">{detail}</div>
    </motion.div>
  );
}

export default function AnalyticsDashboard({ coin, onClose }) {
  const [activeView, setActiveView] = useState("overview");
  const [isLive, setIsLive] = useState(true);

  const metrics = useMemo(() => buildCoinAnalyticsMetrics(coin), [coin]);

  if (!metrics) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] overflow-hidden bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.16),_transparent_30%),linear-gradient(135deg,_#020617_0%,_#0f172a_55%,_#111827_100%)] text-slate-100"
      >
        <div className="flex h-full w-full flex-col">
          <header className="flex items-center justify-between border-b border-white/10 bg-slate-950/70 px-4 py-3 backdrop-blur-xl lg:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={onClose}
                className="rounded-full border border-white/10 bg-white/10 p-2 text-sm text-slate-300 transition hover:bg-white/20"
                aria-label="Close dashboard"
              >
                ✕
              </button>
              <div className="flex h-11 w-11 items-center justify-center rounded-full border border-cyan-400/40 bg-cyan-500/10 text-lg font-semibold text-cyan-300">
                {metrics.symbol.charAt(0)}
              </div>
              <div>
                <div className="text-lg font-semibold">{metrics.name} <span className="text-slate-400">{metrics.symbol}</span></div>
                <div className="text-sm text-slate-400">Rank #{metrics.rank} • AI market intelligence</div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsLive((v) => !v)}
                className={`rounded-full px-3 py-2 text-sm ${isLive ? "bg-emerald-500/15 text-emerald-300" : "bg-white/10 text-slate-300"}`}
              >
                {isLive ? "● Live" : "○ Pause"}
              </button>
              <div className="hidden rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-300 md:block">
                {new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
              </div>
            </div>
          </header>

          <div className="flex flex-1 overflow-hidden">
            <aside className="hidden w-64 flex-col border-r border-white/10 bg-slate-950/50 p-4 lg:flex">
              <div className="mb-6 rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4">
                <div className="text-xs uppercase tracking-[0.35em] text-cyan-300">Signal Center</div>
                <div className="mt-2 text-xl font-semibold">Advanced Analytics</div>
              </div>

              <nav className="space-y-2">
                {NAV_ITEMS.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setActiveView(item.id)}
                    className={`w-full rounded-xl px-3 py-3 text-left text-sm transition ${activeView === item.id ? "bg-cyan-500/15 text-cyan-300" : "text-slate-400 hover:bg-white/10 hover:text-slate-200"}`}
                  >
                    {item.label}
                  </button>
                ))}
              </nav>

              <div className="mt-auto rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-400">
                <div className="font-medium text-slate-200">AI Forecast</div>
                <div className="mt-2">Momentum remains constructive with improving volume flow.</div>
              </div>
            </aside>

            <main className="flex-1 overflow-y-auto p-4 lg:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm text-slate-400">{metrics.symbol} / USD</div>
                  <div className="text-4xl font-semibold">{formatPrice(metrics.price)}</div>
                </div>
                <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-2 text-sm text-slate-300">
                  <span className={getChangeColor(metrics.change24)}>
                    {metrics.change24 > 0 ? "+" : ""}{metrics.change24.toFixed(2)}% 24h
                  </span>
                  <span className="text-slate-500">•</span>
                  <span className={getChangeColor(metrics.change7d)}>
                    {metrics.change7d > 0 ? "+" : ""}{metrics.change7d.toFixed(2)}% 7d
                  </span>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-[1.8fr_1fr]">
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_0_40px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                >
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <div className="text-sm text-slate-400">Price trajectory</div>
                      <div className="text-lg font-semibold">{metrics.name} performance</div>
                    </div>
                    <div className="rounded-full border border-emerald-400/20 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                      Strong trend
                    </div>
                  </div>

                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sparklineData}>
                        <defs>
                          <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.5} />
                            <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.02} />
                          </linearGradient>
                        </defs>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip />
                        <Area type="monotone" dataKey="value" stroke="#22d3ee" fillOpacity={1} fill="url(#priceFill)" strokeWidth={2.5} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <div className="space-y-4">
                  <StatCard title="AI score" value={`${metrics.aiScore}/100`} detail="Model confidence is rising" tone="positive" />
                  <StatCard title="Prediction confidence" value={`${metrics.confidence}%`} detail="Bullish outlook" tone="positive" />
                  <StatCard title="Risk" value={metrics.riskLabel} detail="Balanced volatility profile" tone={metrics.riskLabel === "High" ? "negative" : "neutral"} />
                </div>
              </div>

              <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <StatCard title="Market cap" value={formatNumber(metrics.marketCap)} detail="Fully diluted view" />
                <StatCard title="24h volume" value={formatNumber(metrics.volume)} detail="Liquidity pulse" />
                <StatCard title="Circulating supply" value={metrics.supply ? metrics.supply.toLocaleString() : "—"} detail={metrics.symbol} />
                <StatCard title="Fear & Greed" value={`${metrics.fearGreed}/100`} detail="Sentiment regime" tone="positive" />
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_0_40px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                >
                  <div className="mb-4 text-lg font-semibold">Momentum indicators</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={sparklineData}>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip />
                        <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2.5} dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_0_40px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                >
                  <div className="mb-4 text-lg font-semibold">AI recommendation</div>
                  <div className="space-y-3 text-sm text-slate-300">
                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-3">
                      <div className="font-medium text-cyan-200">{metrics.recommendation.label}</div>
                      <div className="mt-1 text-slate-300">{metrics.recommendation.rationale}</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="font-medium">Performance score</div>
                      <div className="mt-1 text-slate-400">{metrics.performanceScore}/100 based on trend, momentum, and risk.</div>
                    </div>
                    <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                      <div className="font-medium">Risk posture</div>
                      <div className="mt-1 text-slate-400">{metrics.riskLabel} with a score of {metrics.riskScore}/100.</div>
                    </div>
                  </div>
                </motion.div>
              </div>

              <div className="mt-4 grid gap-4 xl:grid-cols-2">
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_0_40px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                >
                  <div className="mb-4 text-lg font-semibold">Risk decomposition</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={riskData}>
                        <CartesianGrid stroke="rgba(148, 163, 184, 0.12)" vertical={false} />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#64748b", fontSize: 12 }} />
                        <YAxis hide />
                        <Tooltip />
                        <Bar dataKey="value" fill="#f59e0b" radius={[8, 8, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-3xl border border-white/10 bg-slate-900/70 p-4 shadow-[0_0_40px_rgba(2,6,23,0.45)] backdrop-blur-xl"
                >
                  <div className="mb-4 text-lg font-semibold">Sentiment pulse</div>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={sentimentData} dataKey="value" nameKey="name" innerRadius={55} outerRadius={85} paddingAngle={2}>
                          <Cell fill="#34d399" />
                          <Cell fill="#38bdf8" />
                          <Cell fill="#fb7185" />
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </motion.div>
              </div>
            </main>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
