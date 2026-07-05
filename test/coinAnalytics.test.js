const test = require('node:test');
const assert = require('node:assert/strict');
const { buildCoinAnalyticsMetrics } = require('../react-app/src/utils/coinAnalytics.js');

test('buildCoinAnalyticsMetrics derives premium insights from a coin payload', () => {
  const coin = {
    symbol: 'BTC',
    name: 'Bitcoin',
    price_usd: '65000',
    percent_change_24h: '2.4',
    percent_change_7d: '8.1',
    market_cap_usd: '1300000000000',
    volume24: '35000000000',
    csupply: '19000000',
    rank: '1',
    ai: {
      trendPrediction: { label: 'Up', confidence: 88 },
      risk: { label: 'Medium', score: 48 },
    },
  };

  const metrics = buildCoinAnalyticsMetrics(coin);

  assert.equal(metrics.symbol, 'BTC');
  assert.equal(metrics.aiScore, 88);
  assert.equal(metrics.riskLabel, 'Medium');
  assert.equal(metrics.change24, 2.4);
  assert.equal(metrics.marketCap, 1300000000000);
  assert.ok(metrics.recommendation.label.includes('Buy'));
  assert.equal(metrics.performanceScore > 70, true);
});
