import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

function StatCard({ label, value, accent = "text-white" }) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
      <p className="text-sm text-slate-400">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${accent}`}>{value}</p>
    </div>
  );
}

export default function SentimentAnalysisPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Crypto Market - Sentiment Analysis";
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const response = await fetch("/api/ai/market-insights");
        const payload = await response.json();
        if (!ignore) setData(payload);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadData();
    return () => {
      ignore = true;
    };
  }, []);

  const dashboard = useMemo(() => data?.sentimentDashboard || null, [data]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">AI Sentiment Analysis Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">News, social feeds, influencer impact, and market mood are fused into a single explainable sentiment view.</p>
        </div>
        <NavLink to="/ai-dashboard" className="w-fit rounded-md border border-cyan-800 bg-cyan-950/40 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-900/50">
          Back to AI Dashboard
        </NavLink>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-300">Loading sentiment intelligence...</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-800 bg-red-950/40 p-6 text-red-300">{error}</div>
      ) : dashboard ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard label="Positive Sentiment" value={`${dashboard.positiveSentiment}%`} accent="text-emerald-300" />
            <StatCard label="Negative Sentiment" value={`${dashboard.negativeSentiment}%`} accent="text-rose-300" />
            <StatCard label="Neutral Sentiment" value={`${dashboard.neutralSentiment}%`} accent="text-amber-300" />
            <StatCard label="Fear & Greed Index" value={`${dashboard.fearGreedIndex}`} accent="text-cyan-300" />
          </section>

          <section className="mt-4 grid gap-4 md:grid-cols-4">
            <StatCard label="AI Sentiment Score" value={`${dashboard.aiSentimentScore}`} accent="text-violet-300" />
            <StatCard label="Market Emotion" value={dashboard.marketEmotion} accent="text-emerald-300" />
            <StatCard label="Market Mood" value={dashboard.marketMood} accent="text-cyan-300" />
            <StatCard label="Sources" value="News + Reddit + X" accent="text-slate-200" />
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Sentiment timeline</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={dashboard.sentimentTimeline || []}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="score" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Sentiment mix</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={[{ label: "Positive", value: dashboard.positiveSentiment }, { label: "Negative", value: dashboard.negativeSentiment }, { label: "Neutral", value: dashboard.neutralSentiment }]} dataKey="value" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    <Cell fill="#34d399" />
                    <Cell fill="#fb7185" />
                    <Cell fill="#fbbf24" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Latest headlines</h2>
              <div className="space-y-3">
                {dashboard.headlines?.map((item) => (
                  <div key={`${item.symbol}-${item.headline}`} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{item.symbol}</span>
                      <span className="text-cyan-300">{item.score.toFixed(0)}</span>
                    </div>
                    <p className="mt-1">{item.headline}</p>
                  </div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Trending topics</h2>
              <div className="space-y-3">
                {dashboard.trendingTopics?.map((topic) => (
                  <div key={topic.topic} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
                    <span>{topic.topic}</span>
                    <span className="font-semibold text-white">{topic.volume}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Social media analysis</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={dashboard.socialMediaAnalysis || []}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="platform" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Influencer activity</h2>
              <div className="space-y-3">
                {dashboard.influencerActivity?.map((item) => (
                  <div key={item.handle} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{item.handle}</span>
                      <span className="text-cyan-300">{item.sentiment}</span>
                    </div>
                    <p className="mt-1">Impact score: {item.impact}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
            <h2 className="mb-3 text-lg font-bold text-white">Word cloud & market summary</h2>
            <p className="mb-4 text-sm text-slate-300">{dashboard.summary}</p>
            <div className="flex flex-wrap gap-3">
              {dashboard.wordCloud?.map((item) => (
                <span key={`${item.word}-${item.weight}`} className="rounded-full border border-slate-700 bg-slate-950/60 px-3 py-1 text-sm text-slate-200" style={{ fontSize: `${Math.max(12, item.weight / 2)}px` }}>{item.word}</span>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
