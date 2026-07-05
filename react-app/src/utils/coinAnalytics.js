export function buildCoinAnalyticsMetrics(coin) {
  if (!coin) return null;

  const price = Number.parseFloat(coin.price_usd || 0) || 0;
  const change24 = Number.parseFloat(coin.percent_change_24h || 0) || 0;
  const change7d = Number.parseFloat(coin.percent_change_7d || 0) || 0;
  const marketCap = Number.parseFloat(coin.market_cap_usd || 0) || 0;
  const volume = Number.parseFloat(coin.volume24 || 0) || 0;
  const supply = Number.parseFloat(coin.csupply || 0) || 0;
  const rank = coin.rank || "—";
  const confidence = coin.ai?.trendPrediction?.confidence || 72;
  const aiScore = coin.ai?.trendPrediction?.confidence || coin.ai?.score || 84;
  const riskLabel = coin.ai?.risk?.label || "Medium";
  const riskScore = coin.ai?.risk?.score || 50;

  const recommendation = (() => {
    if (change24 >= 3 && confidence >= 80) {
      return {
        label: "Buy",
        rationale: "Momentum and conviction are both strong.",
      };
    }

    if (change24 <= -3 || riskScore >= 70) {
      return {
        label: "Hold",
        rationale: "Risk-adjusted exposure is elevated.",
      };
    }

    return {
      label: "Buy",
      rationale: "Balanced momentum suggests a measured entry.",
    };
  })();

  const performanceScore = Math.min(
    100,
    Math.round(
      confidence * 0.65 +
        Math.max(0, change24) * 2.3 +
        Math.max(0, change7d) * 1.2 +
        (riskLabel === "High" ? -8 : 8)
    )
  );

  const fearGreed = Math.min(
    100,
    Math.max(0, Math.round(50 + change24 * 6 + confidence * 0.15))
  );

  return {
    price,
    change24,
    change7d,
    marketCap,
    volume,
    supply,
    rank,
    confidence,
    aiScore,
    riskLabel,
    riskScore,
    performanceScore,
    fearGreed,
    symbol: (coin.symbol || "?").toUpperCase(),
    name: coin.name || "Coin",
    recommendation,
    marketBias: change24 >= 1 ? "Bullish" : "Cautious",
  };
}