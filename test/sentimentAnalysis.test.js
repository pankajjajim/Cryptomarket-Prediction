const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzeSentiment, buildSentimentDashboard } = require("../services/sentimentAnalysis");

test("analyzeSentiment returns social sentiment with source breakdowns", () => {
  const result = analyzeSentiment([
    {
      id: 1,
      name: "Bitcoin",
      symbol: "BTC",
      price_usd: "30000",
      percent_change_24h: "2.4",
      rank: "1",
    },
  ]);

  assert.equal(result[0].symbol, "BTC");
  assert.ok(result[0].score >= -100 && result[0].score <= 100);
  assert.ok(["Positive", "Neutral", "Negative"].includes(result[0].label));
  assert.ok(result[0].sources.news.score !== undefined);
  assert.ok(result[0].sources.reddit.score !== undefined);
  assert.ok(result[0].sources.twitter.score !== undefined);
  assert.ok(result[0].summary.length > 0);
});

test("buildSentimentDashboard returns the requested dashboard metrics", () => {
  const result = buildSentimentDashboard([
    { id: 1, name: "Bitcoin", symbol: "BTC", percent_change_24h: "3.2" },
    { id: 2, name: "Ethereum", symbol: "ETH", percent_change_24h: "-1.1" },
  ]);

  assert.equal(typeof result.positiveSentiment, "number");
  assert.equal(typeof result.negativeSentiment, "number");
  assert.equal(typeof result.neutralSentiment, "number");
  assert.equal(typeof result.fearGreedIndex, "number");
  assert.equal(typeof result.aiSentimentScore, "number");
  assert.equal(Array.isArray(result.headlines), true);
  assert.equal(Array.isArray(result.trendingTopics), true);
  assert.equal(Array.isArray(result.sentimentTimeline), true);
  assert.equal(Array.isArray(result.wordCloud), true);
  assert.equal(Array.isArray(result.influencerActivity), true);
  assert.equal(typeof result.marketMood, "string");
});
