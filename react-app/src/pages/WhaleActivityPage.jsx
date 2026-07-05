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

export default function WhaleActivityPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "Crypto Market - Whale Activity";
  }, []);

  useEffect(() => {
    let ignore = false;
    async function loadData() {
      try {
        setLoading(true);
        const response = await fetch("/api/ai/market-insights");
        const payload = await response.json();
        if (!ignore) setData(payload.whaleActivity || null);
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

  const metrics = useMemo(() => data?.summary || null, [data]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Whale Activity Dashboard</h1>
          <p className="mt-2 text-sm text-slate-400">Monitor large transactions, exchange flows, smart-money positioning, liquidity, and on-chain market intelligence in one view.</p>
        </div>
        <NavLink to="/ai-dashboard" className="w-fit rounded-md border border-cyan-800 bg-cyan-950/40 px-3 py-2 text-sm font-semibold text-cyan-200 hover:bg-cyan-900/50">
          Back to AI Dashboard
        </NavLink>
      </div>

      {loading ? (
        <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 text-slate-300">Loading whale activity intelligence...</div>
      ) : error ? (
        <div className="rounded-3xl border border-red-800 bg-red-950/40 p-6 text-red-300">{error}</div>
      ) : data ? (
        <>
          <section className="grid gap-4 md:grid-cols-4">
            <StatCard label="Large Transactions" value={metrics.largeTransactions} accent="text-cyan-300" />
            <StatCard label="Whale Wallets" value={metrics.whaleWallets} accent="text-emerald-300" />
            <StatCard label="Exchange Inflows" value={`$${(metrics.exchangeInflows / 1000000).toFixed(1)}M`} accent="text-amber-300" />
            <StatCard label="Exchange Outflows" value={`$${(metrics.exchangeOutflows / 1000000).toFixed(1)}M`} accent="text-rose-300" />
          </section>

          <section className="mt-4 grid gap-4 md:grid-cols-4">
            <StatCard label="Buying Pressure" value={`${metrics.buyingPressure}%`} accent="text-emerald-300" />
            <StatCard label="Selling Pressure" value={`${metrics.sellingPressure}%`} accent="text-rose-300" />
            <StatCard label="Liquidity" value={`${metrics.liquidity}%`} accent="text-violet-300" />
            <StatCard label="Smart Money" value={`${metrics.smartMoney}%`} accent="text-cyan-300" />
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Whale activity timeline</h2>
              <ResponsiveContainer width="100%" height={260}>
                <LineChart data={data.timeline || []}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="time" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#38bdf8" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Wallet distribution</h2>
              <ResponsiveContainer width="100%" height={260}>
                <PieChart>
                  <Pie data={data.walletDistribution || []} dataKey="value" nameKey="label" innerRadius={60} outerRadius={90} paddingAngle={2}>
                    <Cell fill="#38bdf8" />
                    <Cell fill="#34d399" />
                    <Cell fill="#f59e0b" />
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Whale asset overview</h2>
              <div className="overflow-hidden rounded-2xl border border-slate-800">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-800 text-slate-300">
                    <tr>
                      <th className="px-4 py-3">Asset</th>
                      <th className="px-4 py-3">Large Tx</th>
                      <th className="px-4 py-3">Inflows</th>
                      <th className="px-4 py-3">Outflows</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.assets?.map((asset) => (
                      <tr key={asset.symbol} className="border-t border-slate-800 text-slate-200">
                        <td className="px-4 py-3 font-medium">{asset.symbol}</td>
                        <td className="px-4 py-3">{asset.largeTransactions}</td>
                        <td className="px-4 py-3">${(asset.exchangeInflows / 1000000).toFixed(1)}M</td>
                        <td className="px-4 py-3">${(asset.exchangeOutflows / 1000000).toFixed(1)}M</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Smart money & alerts</h2>
              <div className="space-y-3">
                {data.alerts?.map((alert) => (
                  <div key={alert.title} className="rounded-2xl border border-slate-800 bg-slate-950/50 p-3 text-sm text-slate-300">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-white">{alert.title}</span>
                      <span className="text-cyan-300">{alert.severity}</span>
                    </div>
                    <p className="mt-1">{alert.message}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section className="mt-8 grid gap-6 xl:grid-cols-2">
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Order book pressure</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={data.orderBook || []}>
                  <CartesianGrid stroke="#1f2937" />
                  <XAxis dataKey="price" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" />
                  <Tooltip />
                  <Bar dataKey="bids" fill="#34d399" />
                  <Bar dataKey="asks" fill="#fb7185" />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-4 shadow-lg shadow-slate-950/20">
              <h2 className="mb-3 text-lg font-bold text-white">Market intelligence</h2>
              <div className="space-y-3">
                {data.marketIntelligence?.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
                    <span>{item.label}</span>
                    <span className="font-semibold text-white">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </>
      ) : null}
    </main>
  );
}
