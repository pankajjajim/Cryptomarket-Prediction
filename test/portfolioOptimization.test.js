const test = require("node:test");
const assert = require("node:assert/strict");
const { buildPortfolioDashboard } = require("../services/portfolioOptimization");

test("buildPortfolioDashboard returns risk, health, and rebalancing insights", () => {
  const result = {
    budget: 10000,
    recommended: {
      metrics: { expectedReturn: 0.14, volatility: 0.38, sharpeRatio: 1.2 },
      allocations: [
        { symbol: "BTC", weight: 40, allocationUsd: 4000 },
        { symbol: "ETH", weight: 35, allocationUsd: 3500 },
        { symbol: "SOL", weight: 25, allocationUsd: 2500 },
      ],
    },
    portfolios: {
      current: {
        allocations: [
          { symbol: "BTC", weight: 70, allocationUsd: 7000 },
          { symbol: "ETH", weight: 30, allocationUsd: 3000 },
        ],
      },
    },
  };

  const dashboard = buildPortfolioDashboard(result, { BTC: 0.7, ETH: 0.3 });

  assert.equal(dashboard.portfolioValue, 10000);
  assert.equal(typeof dashboard.diversificationScore, "number");
  assert.equal(typeof dashboard.portfolioHealthScore, "number");
  assert.equal(dashboard.rebalancingSuggestions.length > 0, true);
  assert.equal(dashboard.historicalPortfolioGrowth.length, 12);
  assert.equal(Array.isArray(dashboard.performanceCharts), true);
});
