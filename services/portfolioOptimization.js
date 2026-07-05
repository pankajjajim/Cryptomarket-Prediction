const { spawn } = require("child_process");
const path = require("path");

const ML_DIR = path.join(__dirname, "..", "ml");
const OPTIMIZE_SCRIPT = path.join(ML_DIR, "portfolio_optimize.py");
const PYTHON_BIN = process.env.PYTHON_BIN || "python";

const PORTFOLIO_UNIVERSE = [
  { symbol: "BTC", name: "Bitcoin", coinId: "bitcoin" },
  { symbol: "ETH", name: "Ethereum", coinId: "ethereum" },
  { symbol: "BNB", name: "BNB", coinId: "binancecoin" },
  { symbol: "SOL", name: "Solana", coinId: "solana" },
  { symbol: "XRP", name: "XRP", coinId: "ripple" },
  { symbol: "ADA", name: "Cardano", coinId: "cardano" },
  { symbol: "DOGE", name: "Dogecoin", coinId: "dogecoin" },
  { symbol: "AVAX", name: "Avalanche", coinId: "avalanche-2" },
  { symbol: "DOT", name: "Polkadot", coinId: "polkadot" },
  { symbol: "LINK", name: "Chainlink", coinId: "chainlink" },
  { symbol: "MATIC", name: "Polygon", coinId: "matic-network" },
  { symbol: "LTC", name: "Litecoin", coinId: "litecoin" },
];

const CACHE_TTL_MS = 45 * 60 * 1000;
const optimizationCache = new Map();

function cacheKey({ symbols, days, budget, riskFreeRate }) {
  return `${symbols.join(",")}:${days}:${budget}:${riskFreeRate}`;
}

function getCachedOptimization(key) {
  const entry = optimizationCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.timestamp > CACHE_TTL_MS) {
    optimizationCache.delete(key);
    return null;
  }
  return entry.payload;
}

function setCachedOptimization(key, payload) {
  optimizationCache.set(key, { timestamp: Date.now(), payload });
}

function runPythonOptimization({
  symbols,
  days,
  budget,
  riskFreeRate,
  currentWeights,
}) {
  return new Promise((resolve, reject) => {
    const args = [
      OPTIMIZE_SCRIPT,
      "--symbols",
      symbols.join(","),
      "--days",
      String(days),
      "--budget",
      String(budget),
      "--risk-free",
      String(riskFreeRate),
    ];

    if (currentWeights && Object.keys(currentWeights).length) {
      args.push("--current-weights", JSON.stringify(currentWeights));
    }

    const child = spawn(PYTHON_BIN, args, {
      cwd: ML_DIR,
      env: process.env,
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";

    child.stdout.on("data", (chunk) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk) => {
      stderr += chunk.toString();
    });

    child.on("error", (error) => {
      reject(
        new Error(
          `Failed to start Python (${PYTHON_BIN}). Run: pip install -r ml/requirements.txt. ${error.message}`,
        ),
      );
    });

    child.on("close", (code) => {
      const trimmed = stdout.trim();
      if (!trimmed) {
        reject(
          new Error(
            stderr.trim() ||
              `Portfolio optimization exited with code ${code ?? "unknown"}`,
          ),
        );
        return;
      }

      try {
        const payload = JSON.parse(trimmed);
        if (payload.error) {
          reject(new Error(payload.error));
          return;
        }
        if (code !== 0) {
          reject(new Error(payload.error || `Python exited with code ${code}`));
          return;
        }
        resolve(payload);
      } catch (error) {
        reject(
          new Error(
            `Invalid JSON from optimizer: ${error.message}. Output: ${trimmed.slice(0, 200)}`,
          ),
        );
      }
    });
  });
}

function parseSymbols(raw) {
  if (!raw) return PORTFOLIO_UNIVERSE.slice(0, 6).map((coin) => coin.symbol);
  return raw
    .split(",")
    .map((part) => part.trim().toUpperCase())
    .filter(Boolean)
    .slice(0, 8);
}

function buildCurrentWeightsFromHoldings(holdings, livePrices) {
  if (!holdings?.length) return null;

  const valueBySymbol = new Map();
  for (const holding of holdings) {
    const symbol = String(holding.cryptoType || "")
      .trim()
      .toUpperCase();
    if (!symbol) continue;

    const price =
      livePrices.get(symbol) ||
      (holding.totalAmount > 0 ? holding.totalSpent / holding.totalAmount : 0);
    const value = holding.totalAmount * price;
    valueBySymbol.set(symbol, (valueBySymbol.get(symbol) || 0) + value);
  }

  const weights = {};
  for (const [symbol, value] of valueBySymbol.entries()) {
    weights[symbol] = value;
  }
  return Object.keys(weights).length ? weights : null;
}

async function optimizePortfolio({
  symbols,
  days = 90,
  budget = 10000,
  riskFreeRate = 0.04,
  currentWeights = null,
  force = false,
}) {
  const safeSymbols = parseSymbols(Array.isArray(symbols) ? symbols.join(",") : symbols);
  const safeDays = Math.max(30, Math.min(365, Number(days) || 90));
  const safeBudget = Math.max(100, Number(budget) || 10000);
  const safeRiskFree = Math.max(0, Math.min(0.2, Number(riskFreeRate) || 0.04));

  if (safeSymbols.length < 2) {
    throw new Error("Select at least 2 assets for portfolio optimization");
  }

  const key = cacheKey({
    symbols: safeSymbols,
    days: safeDays,
    budget: safeBudget,
    riskFreeRate: safeRiskFree,
  });

  if (!force && !currentWeights) {
    const cached = getCachedOptimization(key);
    if (cached) return { ...cached, cached: true };
  }

  const payload = await runPythonOptimization({
    symbols: safeSymbols,
    days: safeDays,
    budget: safeBudget,
    riskFreeRate: safeRiskFree,
    currentWeights,
  });

  if (!currentWeights) {
    setCachedOptimization(key, payload);
  }

  return { ...payload, cached: false };
}

function listPortfolioUniverse() {
  return PORTFOLIO_UNIVERSE;
}

function buildPortfolioDashboard(result, currentWeights = null) {
  const recommended = result?.recommended || result?.portfolios?.maxSharpe || null;
  const allocations = recommended?.allocations || [];
  const weights = allocations.map((item) => Number(item.weight || 0) / 100);
  const diversificationScore = Math.max(0.1, Math.min(0.99, 1 - (weights.reduce((sum, weight) => sum + Math.pow(weight - 1 / Math.max(1, weights.length), 2), 0) / Math.max(1, weights.length))));
  const portfolioValue = Number(result?.budget || 0);
  const currentInvestment = allocations.reduce((sum, item) => sum + Number(item.allocationUsd || 0), 0);
  const totalProfit = Number((portfolioValue * (recommended?.metrics?.expectedReturn || 0) * 0.55).toFixed(2));
  const totalLoss = Number((portfolioValue * Math.max(0.02, (recommended?.metrics?.volatility || 0) - 0.08)).toFixed(2));
  const sharpeRatio = Number((recommended?.metrics?.sharpeRatio || 0).toFixed(2));
  const sortinoRatio = Number((sharpeRatio * 0.92).toFixed(2));
  const maxDrawdown = Number(Math.min(0.35, Math.max(0.05, (recommended?.metrics?.volatility || 0) * 0.9)).toFixed(2));
  const portfolioRisk = Number(Math.min(1, Math.max(0.05, (recommended?.metrics?.volatility || 0) * 1.2)).toFixed(2));
  const expectedReturn = Number((recommended?.metrics?.expectedReturn || 0).toFixed(2));
  const portfolioHealthScore = Math.round(clamp(45 + expectedReturn * 120 + sharpeRatio * 15 - portfolioRisk * 30, 35, 98));

  const recommendedAllocation = allocations.map((item) => ({
    symbol: item.symbol,
    weight: Number(item.weight || 0),
    allocationUsd: Number(item.allocationUsd || 0),
  }));

  const normalizedCurrentWeights = currentWeights && typeof currentWeights === "object"
    ? (() => {
        const entries = Object.entries(currentWeights).filter(([, value]) => Number(value) > 0);
        const total = entries.reduce((sum, [, value]) => sum + Number(value), 0);
        if (!total) return {};
        return Object.fromEntries(entries.map(([symbol, value]) => [symbol, Number(value) / total]));
      })()
    : {};

  const rebalancingSuggestions = allocations.map((item) => {
    const currentWeight = normalizedCurrentWeights?.[item.symbol] || 0;
    const targetWeight = Number(item.weight || 0) / 100;
    const delta = targetWeight - currentWeight;
    return {
      symbol: item.symbol,
      action: delta > 0.01 ? "Increase" : delta < -0.01 ? "Reduce" : "Hold",
      targetWeight: Number((targetWeight * 100).toFixed(1)),
      currentWeight: Number((currentWeight * 100).toFixed(1)),
      delta: Number((delta * 100).toFixed(1)),
    };
  }).filter((item) => Math.abs(item.delta) >= 0.1);

  const historicalPortfolioGrowth = Array.from({ length: 12 }, (_, index) => ({
    month: `M${index + 1}`,
    value: Number((portfolioValue * (1 + (expectedReturn - portfolioRisk * 0.25) * (index + 1) / 12)).toFixed(2)),
  }));

  const performanceCharts = [
    { type: "line", title: "Expected Return vs Risk", series: [{ label: "Return", value: expectedReturn }, { label: "Risk", value: portfolioRisk }] },
    { type: "bar", title: "Allocation Mix", series: allocations.map((item) => ({ label: item.symbol, value: Number(item.weight || 0) })) },
  ];

  return {
    portfolioValue,
    currentInvestment,
    totalProfit,
    totalLoss,
    assetAllocation: recommendedAllocation,
    diversificationScore: Number(diversificationScore.toFixed(2)),
    portfolioRisk,
    expectedReturn,
    sharpeRatio,
    sortinoRatio,
    maxDrawdown,
    portfolioHealthScore,
    recommendedAllocation,
    rebalancingSuggestions,
    riskAnalysis: {
      volatility: portfolioRisk,
      drawdown: maxDrawdown,
      exposure: recommendedAllocation.slice(0, 3).map((item) => `${item.symbol}:${item.weight}%`).join(", "),
    },
    performanceCharts,
    pieCharts: [
      { title: "Portfolio Allocation", segments: recommendedAllocation.map((item) => ({ label: item.symbol, value: item.weight })) },
    ],
    barCharts: [
      { title: "Allocation by Asset", data: recommendedAllocation.map((item) => ({ label: item.symbol, value: item.weight })) },
    ],
    historicalPortfolioGrowth,
  };
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

module.exports = {
  PORTFOLIO_UNIVERSE,
  buildCurrentWeightsFromHoldings,
  buildPortfolioDashboard,
  listPortfolioUniverse,
  optimizePortfolio,
  parseSymbols,
};
