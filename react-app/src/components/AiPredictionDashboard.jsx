import React, { useMemo } from "react";
import { motion } from "framer-motion";
import { ResponsiveContainer, LineChart, Line, CartesianGrid, XAxis, YAxis, Tooltip, AreaChart, Area, BarChart, Bar } from "recharts";
import { formatNumber, formatPrice, getChangeColor } from "../utils/coinFormatting.js";

function StatCard({ title, value, subtext, tone = "neutral" }) {
  const toneClasses = {
    positive: "text-emerald-400",
    negative: "text-rose-400",
    neutral: "text-slate-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-slate-900/70 p-4 backdrop-blur"
    >
      <div className="text-xs uppercase tracking-[0.3em] text-slate-500">{title}</div>
      <div className={`mt-2 text-2xl font-semibold ${toneClasses[tone]}`}>{value}</div>
      <div className="mt-1 text-sm text-slate-400">{subtext}</div>
    </motion.div>
  );
}

export default function AiPredictionDashboard({ prediction }) {
  const forecastData = useMemo(() => {
    if (!prediction?.forecast?.horizons?.length) return [];
    return prediction.forecast.horizons.map((item) => ({
      name: item.label,
      price: Number(item.price) || 0,
    }));
  }, [prediction]);

  const historyData = useMemo(() => {
    if (!prediction?.history?.length) return [];
    return prediction.history.map((item) => ({
      date: item.date,
      price: Number(item.price) || 0,
    }));
  }, [prediction]);

  const modelRows = useMemo(() => {
    const models = prediction?.models || {};
    return Object.entries(models).map(([key, value]) => ({
      key,
      name: key === "randomForest" ? "Random Forest" : key === "xgboost" ? "XGBoost" : key === "prophet" ? "Prophet" : key === "arima" ? "ARIMA" : "LSTM",
      signal: value?.direction || "Stable",
      price: Number(value?.predictedPrice) || 0,
      confidence: Number(value?.confidence) || Number(value?.metrics?.rmse) || 0,
      rmse: Number(value?.metrics?.rmse) || 0,
      mae: Number(value?.metrics?.mae) || 0,
    }));
  }, [prediction]);

  if (!prediction) return null;

  const currentPrice = Number(prediction.currentPrice) || 0;
  const forecastPrice = Number(prediction.forecast?.horizons?.[1]?.price) || currentPrice;
  const changePct = ((forecastPrice - currentPrice) / currentPrice) * 100;
  const confidence = Number(prediction.forecast?.confidence) || Number(prediction.recommendation?.confidence) || 0;
  const accuracy = Number(prediction.evaluation?.classification?.accuracy) || 0;

  return (
    <div className="mt-6 space-y-6">
      <div className="grid gap-4 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-cyan-400/20 bg-slate-900/80 p-6 shadow-[0_0_45px_rgba(2,6,23,0.4)] backdrop-blur">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <div className="text-sm uppercase tracking-[0.3em] text-cyan-300">AI price engine</div>
              <div className="mt-1 text-2xl font-semibold text-white">{prediction.symbol} forecast suite</div>
            </div>
            <div className={`rounded-full border px-3 py-1 text-sm ${changePct >= 0 ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-300" : "border-rose-500/20 bg-rose-500/10 text-rose-300"}`}>
              {changePct >= 0 ? "Bullish" : "Bearish"}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <StatCard title="Current price" value={formatPrice(currentPrice)} subtext="Live market reference" />
            <StatCard title="Predicted next day" value={formatPrice(forecastPrice)} subtext="Ensemble target" tone={changePct >= 0 ? "positive" : "negative"} />
            <StatCard title="AI confidence" value={`${confidence}%`} subtext="Model agreement" tone="positive" />
            <StatCard title="Model accuracy" value={`${accuracy.toFixed(1)}%`} subtext="Classification quality" tone="positive" />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 shadow-[0_0_45px_rgba(2,6,23,0.4)] backdrop-blur">
          <div className="text-sm uppercase tracking-[0.3em] text-slate-500">Expected return / loss</div>
          <div className="mt-4 space-y-4">
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4">
              <div className="text-sm text-emerald-300">Expected return</div>
              <div className="mt-1 text-2xl font-semibold text-emerald-200">{formatPrice(Math.max(0, forecastPrice - currentPrice))}</div>
            </div>
            <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4">
              <div className="text-sm text-rose-300">Expected loss</div>
              <div className="mt-1 text-2xl font-semibold text-rose-200">{formatPrice(Math.max(0, currentPrice - forecastPrice))}</div>
            </div>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_0_40px_rgba(2,6,23,0.35)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">Prediction history</div>
              <div className="text-lg font-semibold text-white">Recent market path</div>
            </div>
            <div className="rounded-full border border-white/10 bg-white/10 px-2 py-1 text-xs text-slate-300">Interactive</div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={historyData}>
                <defs>
                  <linearGradient id="historyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#22d3ee" stopOpacity={0.03} />
                  </linearGradient>
                </defs>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="date" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="price" stroke="#22d3ee" fillOpacity={1} fill="url(#historyFill)" strokeWidth={2.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_0_40px_rgba(2,6,23,0.35)] backdrop-blur">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm text-slate-400">Forecast horizons</div>
              <div className="text-lg font-semibold text-white">Next hour to next month</div>
            </div>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={forecastData}>
                <CartesianGrid stroke="rgba(148,163,184,0.12)" vertical={false} />
                <XAxis dataKey="name" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip />
                <Bar dataKey="price" fill="#38bdf8" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-white/10 bg-slate-900/80 p-4 shadow-[0_0_40px_rgba(2,6,23,0.35)] backdrop-blur">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <div className="text-sm text-slate-400">Model comparison</div>
            <div className="text-lg font-semibold text-white">Cross-model performance</div>
          </div>
        </div>
        <div className="grid gap-3 lg:grid-cols-2 xl:grid-cols-3">
          {modelRows.map((model) => (
            <div key={model.key} className="rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <div className="flex items-center justify-between">
                <div className="font-semibold text-white">{model.name}</div>
                <div className={`rounded-full px-2 py-1 text-xs ${model.signal === "Up" ? "bg-emerald-500/10 text-emerald-300" : model.signal === "Down" ? "bg-rose-500/10 text-rose-300" : "bg-slate-800 text-slate-300"}`}>
                  {model.signal}
                </div>
              </div>
              <div className="mt-3 text-sm text-slate-400">Predicted price</div>
              <div className="text-xl font-semibold text-slate-100">{formatPrice(model.price)}</div>
              <div className="mt-3 flex justify-between text-sm text-slate-400">
                <span>RMSE {formatPrice(model.rmse)}</span>
                <span>MAE {formatPrice(model.mae)}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
