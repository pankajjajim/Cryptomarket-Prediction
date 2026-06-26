require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const cors = require("cors");
const path = require("path");

const User = require("./models/User");
const Transaction = require("./models/Transaction");

const app = express();
const PORT = process.env.PORT || 8080;
const COINLORE_API_URL = "https://api.coinlore.net/api/tickers/";
const JWT_SECRET = process.env.JWT_SECRET || "local-dev-secret-change-me";
let isMongoReady = false;

mongoose.set("bufferCommands", false);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Connect to MongoDB
mongoose
  .connect(process.env.MONGODB_URI, {
    serverSelectionTimeoutMS: 3000,
  })
  .then(() => {
    isMongoReady = true;
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    isMongoReady = false;
    console.error("MongoDB connection error:", err);
  });

mongoose.connection.on("connected", () => {
  isMongoReady = true;
});

mongoose.connection.on("disconnected", () => {
  isMongoReady = false;
  console.warn("MongoDB disconnected. Auth and portfolio features are temporarily unavailable.");
});

function requireDatabase(req, res, next) {
  if (isMongoReady) {
    next();
    return;
  }

  res.status(503).json({
    error:
      "Database is unavailable right now. Market data still works, but login, buying, and portfolio recommendations need MongoDB.",
  });
}

function toNumber(value) {
  const number = Number.parseFloat(value);
  return Number.isFinite(number) ? number : 0;
}

function normalizeCoin(coin) {
  return {
    ...coin,
    symbol: (coin.symbol || "").toUpperCase(),
    price: toNumber(coin.price_usd),
    change1h: toNumber(coin.percent_change_1h),
    change24h: toNumber(coin.percent_change_24h),
    change7d: toNumber(coin.percent_change_7d),
    marketCap: toNumber(coin.market_cap_usd),
    volume24: toNumber(coin.volume24),
    circulatingSupply: toNumber(coin.csupply),
    rankNumber: Number.parseInt(coin.rank, 10) || 9999,
  };
}

function normalizeHoldingKey(value) {
  return String(value || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "");
}

function getTrendPrediction(coin) {
  let score = 0;
  score += coin.change1h * 0.2;
  score += coin.change24h * 0.45;
  score += coin.change7d * 0.25;

  if (coin.volume24 > 0 && coin.marketCap > 0) {
    score += Math.min((coin.volume24 / coin.marketCap) * 100, 10) * 0.1;
  }

  let label = "Stable";
  if (score >= 1.5) label = "Up";
  if (score <= -1.5) label = "Down";

  const confidence = Math.max(52, Math.min(94, Math.round(55 + Math.abs(score) * 6)));

  return {
    label,
    confidence,
    score: Number(score.toFixed(2)),
  };
}

function getRiskScore(coin) {
  let score = 0;
  const volatility = Math.abs(coin.change24h) + Math.abs(coin.change7d) * 0.55;

  score += Math.min(volatility * 4, 45);
  if (coin.rankNumber > 100) score += 20;
  else if (coin.rankNumber > 50) score += 12;
  else if (coin.rankNumber > 20) score += 6;

  if (coin.marketCap < 100000000) score += 18;
  else if (coin.marketCap < 1000000000) score += 10;

  if (coin.volume24 < 1000000) score += 12;
  else if (coin.volume24 < 10000000) score += 6;

  const normalizedScore = Math.max(0, Math.min(100, Math.round(score)));
  let label = "Low";
  if (normalizedScore >= 65) label = "High";
  else if (normalizedScore >= 35) label = "Medium";

  return { label, score: normalizedScore };
}

function addAiInsights(coin) {
  const normalized = normalizeCoin(coin);

  return {
    ...coin,
    ai: {
      trendPrediction: getTrendPrediction(normalized),
      risk: getRiskScore(normalized),
    },
  };
}

async function fetchCryptoData() {
  const fetchClient =
    globalThis.fetch || ((...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args)));
  const response = await fetchClient(COINLORE_API_URL);
  if (!response.ok) {
    throw new Error(`CoinLore request failed with status ${response.status}`);
  }

  const payload = await response.json();
  if (!payload.data || !Array.isArray(payload.data)) {
    throw new Error("CoinLore returned an invalid data format");
  }

  return payload.data.map(addAiInsights);
}

// Routes
app.post("/api/register", requireDatabase, async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, email, password: hashedPassword });
    await user.save();
    res.status(201).json({ message: "User registered successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.post("/api/login", requireDatabase, async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ error: "Invalid credentials" });
    }
    const token = jwt.sign({ userId: user._id }, JWT_SECRET, {
      expiresIn: "1h",
    });
    res.json({ token });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/cryptos", async (req, res) => {
  try {
    const cryptos = await fetchCryptoData();
    res.json({ data: cryptos });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

app.get("/api/ai/market-insights", async (req, res) => {
  try {
    const cryptos = await fetchCryptoData();
    const predictedGainers = [...cryptos]
      .filter((coin) => coin.ai.trendPrediction.label === "Up")
      .sort(
        (a, b) =>
          b.ai.trendPrediction.confidence - a.ai.trendPrediction.confidence,
      )
      .slice(0, 5);

    const highRiskCoins = [...cryptos]
      .filter((coin) => coin.ai.risk.label === "High")
      .sort((a, b) => b.ai.risk.score - a.ai.risk.score)
      .slice(0, 5);

    const lowRiskCoins = [...cryptos]
      .filter((coin) => coin.ai.risk.label === "Low")
      .filter((coin) => coin.ai.trendPrediction.label !== "Down")
      .sort((a, b) => {
        const trendGap =
          b.ai.trendPrediction.confidence - a.ai.trendPrediction.confidence;
        if (trendGap !== 0) return trendGap;
        return (Number.parseInt(a.rank, 10) || 9999) - (Number.parseInt(b.rank, 10) || 9999);
      })
      .slice(0, 5);

    const marketSummary = cryptos.reduce(
      (summary, coin) => {
        if (coin.ai.trendPrediction.label === "Up") summary.up += 1;
        if (coin.ai.trendPrediction.label === "Down") summary.down += 1;
        if (coin.ai.trendPrediction.label === "Stable") summary.stable += 1;
        return summary;
      },
      { up: 0, down: 0, stable: 0 },
    );

    res.json({
      marketSummary,
      predictedGainers,
      highRiskCoins,
      lowRiskCoins,
    });
  } catch (error) {
    res.status(502).json({ error: error.message });
  }
});

// Middleware to verify JWT
const authenticate = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Access denied" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    res.status(401).json({ error: "Invalid token" });
  }
};

app.post("/api/buy", requireDatabase, authenticate, async (req, res) => {
  try {
    const { cryptoType, amount, price } = req.body;
    const totalValue = amount * price;
    const transaction = new Transaction({
      buyer: req.userId,
      cryptoType,
      amount,
      price,
      totalValue,
    });
    await transaction.save();
    res.status(201).json({ message: "Purchase recorded successfully" });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});
// Verify token endpoint
app.get("/api/verify", requireDatabase, authenticate, async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.json({
      user: { id: user._id, username: user.username, email: user.email },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/recommendations", requireDatabase, authenticate, async (req, res) => {
  try {
    const [transactions, cryptos] = await Promise.all([
      Transaction.find({ buyer: req.userId }).sort({ timestamp: -1 }).limit(25),
      fetchCryptoData(),
    ]);

    const ownedKeys = new Set(
      transactions.map((transaction) =>
        normalizeHoldingKey(transaction.cryptoType),
      ),
    );

    const recommendations = cryptos
      .filter((coin) => {
        const symbolKey = normalizeHoldingKey(coin.symbol);
        const nameKey = normalizeHoldingKey(coin.name);
        return !ownedKeys.has(symbolKey) && !ownedKeys.has(nameKey);
      })
      .filter((coin) => coin.ai.trendPrediction.label !== "Down")
      .filter((coin) => coin.ai.risk.label !== "High")
      .sort((a, b) => {
        const trendGap =
          b.ai.trendPrediction.confidence - a.ai.trendPrediction.confidence;
        if (trendGap !== 0) return trendGap;
        return (Number.parseInt(a.rank, 10) || 9999) - (Number.parseInt(b.rank, 10) || 9999);
      })
      .slice(0, 5)
      .map((coin) => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        price_usd: coin.price_usd,
        percent_change_24h: coin.percent_change_24h,
        ai: coin.ai,
        reason: ownedKeys.size
          ? `${coin.symbol} has a ${coin.ai.trendPrediction.label.toLowerCase()} trend signal with ${coin.ai.risk.label.toLowerCase()} risk and is not already in your portfolio.`
          : `${coin.symbol} has a ${coin.ai.trendPrediction.label.toLowerCase()} trend signal with ${coin.ai.risk.label.toLowerCase()} risk, making it a good starter watchlist coin.`,
      }));

    res.json({
      portfolioSize: ownedKeys.size,
      ownedSymbols: [...ownedKeys],
      recommendations,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/purchases", requireDatabase, authenticate, async (req, res) => {
  try {
    const purchases = await Transaction.find({ buyer: req.userId })
      .sort({ timestamp: -1 })
      .limit(20);

    const summaryMap = new Map();
    for (const purchase of purchases) {
      const key = normalizeHoldingKey(purchase.cryptoType);
      const current = summaryMap.get(key) || {
        cryptoType: purchase.cryptoType,
        totalAmount: 0,
        totalSpent: 0,
      };

      current.totalAmount += purchase.amount;
      current.totalSpent += purchase.totalValue;
      summaryMap.set(key, current);
    }

    res.json({
      purchases,
      holdings: [...summaryMap.values()],
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
// Serve React app
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

app.listen(PORT, () => {
  console.log(`Cryptomarket server running on port ${PORT}`);
  console.log(`Backend API: http://localhost:${PORT}`);
});

// Add error handling for port conflicts
process.on("uncaughtException", (err) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `Port ${PORT} is already in use. Please close the process or use a different port.`,
    );
  }
  process.exit(1);
});
