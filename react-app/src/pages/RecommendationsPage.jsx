import React, { useEffect, useMemo, useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext.jsx";
import { formatPrice } from "../utils/coinFormatting.js";

function Badge({ children, className }) {
  return <span className={`inline-flex rounded-md border px-2 py-1 text-xs font-semibold ${className}`}>{children}</span>;
}

function ProbabilityBar({ label, value, color }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-slate-400">
        <span>{label}</span>
        <span className="font-semibold text-slate-200">{Math.round(value * 100)}%</span>
      </div>
      <div className="h-2 rounded-full bg-slate-800">
        <div className={`h-2 rounded-full ${color}`} style={{ width: `${Math.max(6, value * 100)}%` }} />
      </div>
    </div>
  );
}

export default function RecommendationsPage() {
  const { isAuthenticated, token, buyCrypto } = useAuth();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [buyingSymbol, setBuyingSymbol] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    document.title = "Crypto Market - Explainable AI Recommendations";
  }, []);

  useEffect(() => {
    let ignore = false;

    async function loadRecommendations() {
      if (!isAuthenticated || !token) {
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");
        const response = await fetch("/api/recommendations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const payload = await response.json();
        if (!response.ok) throw new Error(payload.error || "Unable to load recommendations");
        if (!ignore) setData(payload);
      } catch (err) {
        if (!ignore) setError(err instanceof Error ? err.message : String(err));
      } finally {
        if (!ignore) setLoading(false);
      }
    }

    loadRecommendations();
    return () => {
      ignore = true;
    };
  }, [isAuthenticated, token]);

  const summary = useMemo(() => {
    if (!data?.profile) return null;
    return {
      label: data.profile.label,
      description: data.profile.description,
      size: data.portfolioSize,
      recommendations: data.recommendations?.length || 0,
    };
  }, [data]);

  const handleBuy = async (coin) => {
    if (!isAuthenticated) {
      alert("Please login first to buy this coin.");
      return;
    }

    const symbol = (coin.symbol || "").toUpperCase();
    const price = Number.parseFloat(coin.price_usd) || 0;
    const qtyStr = prompt(`Buy ${symbol}\n\nCurrent Price: $${price.toFixed(2)}\n\nEnter quantity:`, "1");
    if (qtyStr === null) return;

    const qty = Number(qtyStr);
    if (!Number.isFinite(qty) || qty <= 0) {
      alert("Please enter a valid quantity.");
      return;
    }

    setBuyingSymbol(symbol);
    setMessage("");
    try {
      const result = await buyCrypto(symbol, qty, price);
      if (!result.success) {
        setError(result.error || "Purchase failed.");
        return;
      }
      setMessage(`Purchased ${qty} ${symbol} for $${(qty * price).toFixed(2)}.`);
    } finally {
      setBuyingSymbol("");
    }
  };

  if (!isAuthenticated) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-10 text-slate-300">
        <h1 className="text-2xl font-bold text-white">Explainable AI Recommendation Dashboard</h1>
        <p className="mt-3 max-w-2xl text-sm text-slate-400">
          Sign in to receive transparent crypto suggestions with probabilities, risk metrics, trade levels, and explainability insights.
        </p>
        <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
          <NavLink to="/login" className="rounded-md bg-cyan-600 px-4 py-2 font-semibold text-white hover:bg-cyan-700">
            Login to continue
          </NavLink>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-7xl px-4 py-10">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Explainable AI Recommendation Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">
            Every signal is paired with probabilities, expected returns, explainable factors, and actionable trade levels.
          </p>
        </div>
        <NavLink to="/ai-dashboard" className="w-fit rounded-md border border-cyan-800 bg-cyan-950/40 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-900/50">
          Back to AI Dashboard
        </NavLink>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-slate-300">Loading your explainable AI recommendations...</div>
      ) : error ? (
        <div className="rounded-2xl border border-red-800 bg-red-950/40 p-6 text-red-300">{error}</div>
      ) : (
        <>
          <section className="grid gap-4 lg:grid-cols-3">
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Investor profile</p>
              <p className="mt-2 text-xl font-semibold text-white">{summary?.label}</p>
              <p className="mt-2 text-sm text-slate-400">{summary?.description}</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Current holdings</p>
              <p className="mt-2 text-xl font-semibold text-white">{summary?.size || 0}</p>
              <p className="mt-2 text-sm text-slate-400">Coins already in your portfolio.</p>
            </div>
            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <p className="text-sm text-slate-400">Suggested now</p>
              <p className="mt-2 text-xl font-semibold text-white">{summary?.recommendations || 0}</p>
              <p className="mt-2 text-sm text-slate-400">Curated ideas for your next move.</p>
            </div>
          </section>

          <section className="mt-8 grid gap-4 xl:grid-cols-2">
            {data?.recommendations?.map((coin) => (
              <article key={coin.id} className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl shadow-slate-950/40">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="text-lg font-semibold text-white">{coin.name}</p>
                    <p className="text-sm text-slate-400">{coin.symbol}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge className="border-cyan-800 bg-cyan-950/40 text-cyan-300">{coin.aiRecommendation}</Badge>
                    <Badge className="border-emerald-800 bg-emerald-950/40 text-emerald-300">{coin.riskLevel} Risk</Badge>
                  </div>
                </div>

                <div className="mt-5 grid gap-4 md:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm text-slate-400">Price</p>
                    <p className="mt-1 text-xl font-semibold text-white">{formatPrice(Number.parseFloat(coin.price_usd) || 0)}</p>
                    <p className="mt-2 text-sm text-slate-400">24h change: {coin.percent_change_24h}%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm text-slate-400">Confidence</p>
                    <p className="mt-1 text-xl font-semibold text-white">{coin.confidenceScore}%</p>
                    <p className="mt-2 text-sm text-slate-400">Risk reward: {coin.riskRewardRatio}x</p>
                  </div>
                </div>

                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm text-slate-400">Buy Prob.</p>
                    <p className="mt-1 text-xl font-semibold text-emerald-300">{Math.round(coin.buyProbability * 100)}%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm text-slate-400">Sell Prob.</p>
                    <p className="mt-1 text-xl font-semibold text-rose-300">{Math.round(coin.sellProbability * 100)}%</p>
                  </div>
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm text-slate-400">Hold Prob.</p>
                    <p className="mt-1 text-xl font-semibold text-amber-300">{Math.round(coin.holdProbability * 100)}%</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-5 lg:grid-cols-2">
                  <div className="space-y-3 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-400">Expected return</p>
                        <p className="mt-1 text-lg font-semibold text-white">{formatPrice(coin.expectedReturn)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Expected loss</p>
                        <p className="mt-1 text-lg font-semibold text-white">{formatPrice(coin.expectedLoss)}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-400">Entry price</p>
                        <p className="mt-1 text-lg font-semibold text-white">{formatPrice(coin.entryPrice)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Exit price</p>
                        <p className="mt-1 text-lg font-semibold text-white">{formatPrice(coin.exitPrice)}</p>
                      </div>
                    </div>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <p className="text-sm text-slate-400">Stop loss</p>
                        <p className="mt-1 text-lg font-semibold text-white">{formatPrice(coin.stopLoss)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-slate-400">Take profit</p>
                        <p className="mt-1 text-lg font-semibold text-white">{formatPrice(coin.takeProfit)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-white">Probability breakdown</p>
                    <div className="mt-4 space-y-3">
                      <ProbabilityBar label="Buy" value={coin.buyProbability} color="bg-emerald-500" />
                      <ProbabilityBar label="Sell" value={coin.sellProbability} color="bg-rose-500" />
                      <ProbabilityBar label="Hold" value={coin.holdProbability} color="bg-amber-500" />
                    </div>
                  </div>
                </div>

                <div className="mt-6 rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                  <p className="text-sm font-semibold text-white">Prediction explanation</p>
                  <p className="mt-2 text-sm text-slate-300">{coin.predictionExplanation}</p>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-white">Feature importance</p>
                    <div className="mt-4 space-y-3">
                      {coin.featureImportance?.map((item) => (
                        <div key={item.feature}>
                          <div className="mb-1 flex items-center justify-between text-sm text-slate-400">
                            <span>{item.feature}</span>
                            <span className="font-semibold text-slate-200">{item.importance}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-slate-800">
                            <div className="h-2 rounded-full bg-cyan-500" style={{ width: `${item.importance}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-white">SHAP / LIME explainability</p>
                    <div className="mt-4 space-y-3 text-sm text-slate-300">
                      {coin.shapResults?.map((item) => (
                        <div key={item.feature} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                          <span>{item.feature}</span>
                          <span className="font-semibold text-cyan-300">{item.impact}</span>
                        </div>
                      ))}
                      {coin.limeResults?.map((item) => (
                        <div key={item.label} className="rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2">
                          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">{item.label}</p>
                          <p className="mt-1 text-sm text-slate-300">{item.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid gap-4 lg:grid-cols-2">
                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-white">Trading signals</p>
                    <div className="mt-3 space-y-2">
                      {coin.tradingSignals?.map((signal) => (
                        <div key={signal.label} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                          <span>{signal.label}</span>
                          <span className="font-semibold text-white">{signal.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-800 bg-slate-950/50 p-4">
                    <p className="text-sm font-semibold text-white">Recommendation history</p>
                    <div className="mt-3 space-y-2">
                      {coin.recommendationHistory?.map((event) => (
                        <div key={`${event.timestamp}-${event.action}`} className="flex items-center justify-between rounded-lg border border-slate-800 bg-slate-900/70 px-3 py-2 text-sm text-slate-300">
                          <span>{event.timestamp}</span>
                          <span className="font-semibold text-white">{event.action} · {event.confidence}%</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <p className="mt-6 text-sm text-slate-400">{coin.reason}</p>

                <button
                  type="button"
                  onClick={() => handleBuy(coin)}
                  disabled={buyingSymbol === coin.symbol}
                  className="mt-5 w-full rounded-md bg-cyan-600 px-3 py-2 text-sm font-semibold text-white hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {buyingSymbol === coin.symbol ? "Executing order..." : `Trade ${coin.symbol}`}
                </button>
              </article>
            ))}
          </section>

          {message ? <p className="mt-6 text-sm text-emerald-400">{message}</p> : null}
        </>
      )}
    </main>
  );
}
