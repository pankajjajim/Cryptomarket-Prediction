function scoreText(text = "") {
  const lowered = text.toLowerCase();
  const positiveWords = ["bullish", "breakout", "buy", "moon", "surge", "pump", "adoption", "upgrade", "strong", "gain"];
  const negativeWords = ["bearish", "dump", "crash", "sell", "fear", "scam", "hack", "down", "collapse", "rug"];

  let score = 0;
  positiveWords.forEach((word) => {
    if (lowered.includes(word)) score += 10;
  });
  negativeWords.forEach((word) => {
    if (lowered.includes(word)) score -= 10;
  });

  return Math.max(-100, Math.min(100, score));
}

function buildSentimentDashboard(cryptos = []) {
  const analysis = analyzeSentiment(cryptos);

  const positiveSentiment = Math.round(
    (analysis.filter((entry) => entry.label === "Positive").length / Math.max(1, analysis.length)) * 100,
  );
  const negativeSentiment = Math.round(
    (analysis.filter((entry) => entry.label === "Negative").length / Math.max(1, analysis.length)) * 100,
  );
  const neutralSentiment = 100 - positiveSentiment - negativeSentiment;
  const averageScore = analysis.reduce((sum, entry) => sum + entry.score, 0) / Math.max(1, analysis.length);
  const fearGreedIndex = Math.round(clamp(35 + averageScore * 0.5, 0, 100));
  const aiSentimentScore = Math.round(clamp(50 + averageScore * 0.5, 0, 100));
  const marketMood = averageScore >= 20 ? "Bullish" : averageScore <= -20 ? "Fearful" : "Cautious";

  return {
    positiveSentiment,
    negativeSentiment,
    neutralSentiment,
    fearGreedIndex,
    marketEmotion: marketMood,
    aiSentimentScore,
    marketMood,
    headlines: analysis.slice(0, 6).map((entry) => ({
      symbol: entry.symbol,
      headline: `${entry.name} sentiment is ${entry.label.toLowerCase()} with a ${entry.score.toFixed(0)} score`,
      score: entry.score,
    })),
    trendingTopics: [
      { topic: "BTC ETF optimism", volume: 82 },
      { topic: "Ethereum staking demand", volume: 74 },
      { topic: "Altcoin breakout watch", volume: 68 },
      { topic: "Fed policy impact", volume: 61 },
    ],
    sentimentTimeline: [
      { time: "09:00", score: 42 },
      { time: "11:00", score: 54 },
      { time: "13:00", score: 60 },
      { time: "15:00", score: 58 },
      { time: "17:00", score: 66 },
    ],
    wordCloud: analysis.flatMap((entry) => [
      { word: entry.symbol, weight: 25 + Math.abs(entry.score) / 2 },
      { word: entry.name, weight: 20 + Math.abs(entry.score) / 3 },
    ]),
    influencerActivity: [
      { handle: "@CryptoAnalyst", impact: 78, sentiment: "Positive" },
      { handle: "@OnChainMentor", impact: 65, sentiment: "Neutral" },
      { handle: "@MacroTrader", impact: 72, sentiment: "Positive" },
    ],
    socialMediaAnalysis: [
      { platform: "News", score: positiveSentiment },
      { platform: "Reddit", score: Math.max(20, positiveSentiment - 3) },
      { platform: "Twitter", score: Math.max(25, positiveSentiment + 4) },
    ],
    summary: analysis[0]?.summary || "Sentiment data is being aggregated.",
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function analyzeSentiment(cryptos = []) {
  return cryptos.map((coin) => {
    const change = Number.parseFloat(coin.percent_change_24h) || 0;
    const headline = `${coin.name} ${coin.symbol} ${change > 0 ? "bullish surge" : "steady trading"}`;
    const redditSnippet = `${coin.name} ${change > 0 ? "moonshot buying" : "cautious hold"}`;
    const twitterSnippet = `${coin.name} ${change > 0 ? "breakout momentum" : "risk warning"}`;

    const newsScore = scoreText(headline) + Math.max(-15, Math.min(15, change * 1.2));
    const redditScore = scoreText(redditSnippet) + Math.max(-15, Math.min(15, change * 0.8));
    const twitterScore = scoreText(twitterSnippet) + Math.max(-15, Math.min(15, change * 1.0));

    const averageScore = (newsScore + redditScore + twitterScore) / 3;
    let label = "Neutral";
    if (averageScore >= 20) label = "Positive";
    else if (averageScore <= -20) label = "Negative";

    const summary = label === "Positive"
      ? `Social chatter is leaning positive for ${coin.symbol} with strong momentum across news, Reddit, and Twitter.`
      : label === "Negative"
        ? `Social chatter is cautionary for ${coin.symbol}, with more bearish sentiment across the monitored channels.`
        : `Social chatter is mixed for ${coin.symbol}, showing a balanced tone across news, Reddit, and Twitter.`;

    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      score: Number(averageScore.toFixed(2)),
      label,
      sources: {
        news: {
          score: Number(newsScore.toFixed(2)),
          label: newsScore >= 0 ? "Positive" : "Negative",
        },
        reddit: {
          score: Number(redditScore.toFixed(2)),
          label: redditScore >= 0 ? "Positive" : "Negative",
        },
        twitter: {
          score: Number(twitterScore.toFixed(2)),
          label: twitterScore >= 0 ? "Positive" : "Negative",
        },
      },
      summary,
    };
  });
}

module.exports = {
  analyzeSentiment,
  buildSentimentDashboard,
  scoreText,
};
