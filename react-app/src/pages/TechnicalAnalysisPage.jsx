import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import TechnicalAnalysisDashboard from "../components/TechnicalAnalysisDashboard.jsx";

export default function TechnicalAnalysisPage() {
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Crypto Market - Technical Analysis";
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadAnalysis() {
      try {
        setLoading(true);
        const response = await fetch("/api/ai/market-insights");
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Unable to load technical analysis");
        if (!ignore) {
          setAnalysis(data.technicalAnalysis?.[0] || null);
        }
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadAnalysis();
    return () => {
      ignore = true;
    };
  }, []);

  const summary = useMemo(() => {
    if (!analysis) return null;
    return [
      { label: "RSI", value: analysis.rsi?.toFixed(1) },
      { label: "MACD", value: analysis.macd?.toFixed(2) },
      { label: "ADX", value: analysis.adx?.toFixed(2) },
      { label: "Signal", value: analysis.signal },
    ];
  }, [analysis]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Technical Analysis Dashboard</h1>
          <p className="mt-2 text-sm text-gray-400">RSI, MACD, EMA, SMA, VWAP, ATR, ADX, Bollinger Bands, Ichimoku Cloud, Fibonacci-style support and resistance, and momentum signals.</p>
        </div>
        <NavLink to="/ai-dashboard" className="w-fit rounded-md border border-cyan-800 bg-cyan-950/40 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-900/50">
          Back to AI Dashboard
        </NavLink>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6 text-slate-300">Preparing technical analysis views...</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-500/20 bg-red-500/10 p-6 text-red-300">{error}</div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {summary?.map((item) => (
              <div key={item.label} className="rounded-2xl border border-white/10 bg-slate-900/80 p-4">
                <div className="text-sm text-slate-400">{item.label}</div>
                <div className="mt-2 text-2xl font-semibold text-white">{item.value}</div>
              </div>
            ))}
          </div>
          <TechnicalAnalysisDashboard analysis={analysis} />
        </>
      )}
    </main>
  );
}
