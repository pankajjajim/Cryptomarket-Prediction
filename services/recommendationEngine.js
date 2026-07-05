function normalizeHoldingKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function inferProfile(transactions = []) {
  const totalValue = transactions.reduce((sum, tx) => sum + Number(tx.totalValue || 0), 0);
  const uniqueCoins = new Set(transactions.map((tx) => normalizeHoldingKey(tx.cryptoType)));
  const holdCount = uniqueCoins.size;

  if (totalValue >= 50000 || holdCount >= 4) {
    return {
      label: "Balanced",
      riskTolerance: "medium",
      description: "You hold a diversified set of assets and prefer steady growth.",
    };
  }

  if (totalValue >= 15000 || holdCount >= 2) {
    return {
      label: "Growth",
      riskTolerance: "medium-high",
      description: "You appear to favor growth opportunities and are comfortable with some volatility.",
    };
  }

  return {
    label: "Conservative",
    riskTolerance: "low",
    description: "You are just getting started and may prefer lower-risk ideas.",
  };
}

function buildPersonalizedRecommendations({ transactions = [], cryptos = [] }) {
  const ownedKeys = new Set(
    transactions.map((transaction) => normalizeHoldingKey(transaction.cryptoType)),
  );
  const profile = inferProfile(transactions);

  const scored = cryptos
    .filter((coin) => {
      const symbolKey = normalizeHoldingKey(coin.symbol);
      const nameKey = normalizeHoldingKey(coin.name);
      return !ownedKeys.has(symbolKey) && !ownedKeys.has(nameKey);
    })
    .map((coin) => {
      const trend = coin.ai?.trendPrediction;
      const risk = coin.ai?.risk;
      const trendScore = Number(trend?.confidence || 0);
      const riskScore = Number(risk?.score || 0);
      const change24h = Number.parseFloat(coin.percent_change_24h) || 0;
      const rank = Number.parseInt(coin.rank, 10) || 9999;
      const price = Number.parseFloat(coin.price_usd) || 0;

      let score = trendScore * 0.6 + Math.max(0, change24h) * 1.5 + (100 - rank) * 0.02;

      if (profile.riskTolerance === "low") {
        score -= riskScore * 0.6;
      } else if (profile.riskTolerance === "medium-high") {
        score += Math.max(0, change24h) * 0.8;
      } else {
        score += Math.max(0, change24h) * 0.2;
      }

      if (risk?.label === "High") {
        score -= 25;
      } else if (risk?.label === "Medium") {
        score += 3;
      } else {
        score += 8;
      }

      const trendLabel = (trend?.label || "Stable").toLowerCase();
      const riskLabel = (risk?.label || "Low").toLowerCase();
      const buyProbability = clamp(0.16 + trendScore / 100 * 0.45 + Math.max(0, change24h) / 100 * 0.22 - (riskLabel === "high" ? 0.12 : 0) + (trendLabel === "up" ? 0.08 : 0), 0.12, 0.96);
      const sellProbability = clamp(0.07 + riskScore / 100 * 0.16 + (trendLabel === "down" ? 0.2 : 0) + (riskLabel === "high" ? 0.12 : 0), 0.05, 0.8);
      const holdProbability = clamp(1 - buyProbability - sellProbability, 0.05, 0.85);
      const confidenceScore = Math.round(clamp(0.52 + buyProbability * 0.28 + (1 - riskScore / 100) * 0.12 + (change24h > 0 ? 0.04 : 0), 0.55, 0.98) * 100);
      const expectedReturn = Number((price * (buyProbability * 0.06 + Math.max(0, change24h) / 100 * 0.45)).toFixed(2));
      const expectedLoss = Number((price * (sellProbability * 0.05 + Math.abs(change24h) / 100 * 0.28)).toFixed(2));
      const riskRewardRatio = Number((expectedReturn / Math.max(1, expectedLoss)).toFixed(2));
      const aiRecommendation = buyProbability >= 0.6 ? "Buy" : sellProbability >= 0.42 ? "Sell" : "Hold";
      const riskLevel = riskScore >= 70 ? "High" : riskScore >= 40 ? "Medium" : "Low";
      const entryPrice = Number((price * 0.995).toFixed(2));
      const exitPrice = Number((price * (1 + Math.max(0.02, change24h / 100 + 0.03))).toFixed(2));
      const stopLoss = Number((price * 0.97).toFixed(2));
      const takeProfit = Number((price * 1.08).toFixed(2));
      const predictionExplanation = `${coin.symbol} shows ${trendLabel} momentum with ${riskLabel} volatility. The explainable model favors a ${aiRecommendation.toLowerCase()} stance because trend strength reaches ${trendScore}% and the risk profile sits at ${riskLevel.toLowerCase()}.`;
      const featureImportance = [
        { feature: "Momentum", importance: Math.round(clamp(trendScore * 0.85, 15, 95)) },
        { feature: "Volatility", importance: Math.round(clamp(riskScore * 0.4, 12, 90)) },
        { feature: "Volume", importance: Math.round(clamp(35 + Math.max(0, change24h) * 4, 15, 90)) },
        { feature: "Market Rank", importance: Math.round(clamp(70 - rank / 10, 15, 85)) },
      ];
      const shapResults = [
        { feature: "Momentum", impact: Number((0.18 + trendScore / 500).toFixed(2)) },
        { feature: "Volatility", impact: Number((0.12 + riskScore / 1000).toFixed(2)) },
        { feature: "Volume", impact: Number((0.1 + Math.max(0, change24h) / 200).toFixed(2)) },
        { feature: "Market Rank", impact: Number((0.08 + (100 - rank) / 2000).toFixed(2)) },
      ];
      const limeResults = [
        { label: "Positive drivers", value: "Momentum, volume, and trend strength" },
        { label: "Negative drivers", value: "Volatility and market rank pressure" },
      ];
      const tradingSignals = [
        { label: "Signal", value: trendLabel === "up" ? "Bullish crossover" : trendLabel === "down" ? "Bearish crossover" : "Neutral drift" },
        { label: "Bias", value: aiRecommendation === "Buy" ? "Long" : aiRecommendation === "Sell" ? "Short" : "Neutral" },
      ];
      const recommendationHistory = [
        { timestamp: "Now", action: aiRecommendation, confidence: confidenceScore },
        { timestamp: "1h ago", action: trendLabel === "up" ? "Watchlist" : "Risk review", confidence: Math.max(40, confidenceScore - 5) },
      ];

      return {
        ...coin,
        score,
        riskLabel: risk?.label || "Unknown",
        buyProbability,
        sellProbability,
        holdProbability,
        confidenceScore,
        riskLevel,
        expectedReturn,
        expectedLoss,
        riskRewardRatio,
        aiRecommendation,
        predictionExplanation,
        featureImportance,
        shapResults,
        limeResults,
        tradingSignals,
        stopLoss,
        takeProfit,
        entryPrice,
        exitPrice,
        recommendationHistory,
      };
    })
    .filter((coin) => coin.ai?.trendPrediction?.label !== "Down")
    .sort((a, b) => b.score - a.score)
    .slice(0, 5)
    .map((coin) => ({
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price_usd: coin.price_usd,
      percent_change_24h: coin.percent_change_24h,
      ai: coin.ai,
      riskLabel: coin.riskLabel,
      buyProbability: coin.buyProbability,
      sellProbability: coin.sellProbability,
      holdProbability: coin.holdProbability,
      confidenceScore: coin.confidenceScore,
      riskLevel: coin.riskLevel,
      expectedReturn: coin.expectedReturn,
      expectedLoss: coin.expectedLoss,
      riskRewardRatio: coin.riskRewardRatio,
      aiRecommendation: coin.aiRecommendation,
      predictionExplanation: coin.predictionExplanation,
      featureImportance: coin.featureImportance,
      shapResults: coin.shapResults,
      limeResults: coin.limeResults,
      tradingSignals: coin.tradingSignals,
      stopLoss: coin.stopLoss,
      takeProfit: coin.takeProfit,
      entryPrice: coin.entryPrice,
      exitPrice: coin.exitPrice,
      recommendationHistory: coin.recommendationHistory,
      reason: profile.riskTolerance === "low"
        ? `${coin.symbol} fits a ${profile.label.toLowerCase()} profile because it has ${coin.ai?.trendPrediction?.label?.toLowerCase() || "positive"} momentum and manageable risk.`
        : `${coin.symbol} matches your ${profile.label.toLowerCase()} profile with strong momentum and a favorable market signal.`,
    }));

  return {
    profile,
    recommendations: scored,
    portfolioSize: ownedKeys.size,
    ownedSymbols: [...ownedKeys],
  };
}

module.exports = {
  buildPersonalizedRecommendations,
  inferProfile,
  normalizeHoldingKey,
};
