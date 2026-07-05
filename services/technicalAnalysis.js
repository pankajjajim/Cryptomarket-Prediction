function calculateSma(prices) {
  if (!prices.length) return 0;
  return prices.reduce((sum, value) => sum + value, 0) / prices.length;
}

function calculateEma(prices, period = 14) {
  if (!prices.length) return 0;
  const multiplier = 2 / (period + 1);
  let ema = prices[0];
  for (let i = 1; i < prices.length; i += 1) {
    ema = prices[i] * multiplier + ema * (1 - multiplier);
  }
  return ema;
}

function calculateRsi(prices) {
  if (!prices.length || prices.length < 2) return 50;

  let gains = 0;
  let losses = 0;

  for (let i = 1; i < prices.length; i += 1) {
    const change = prices[i] - prices[i - 1];
    if (change >= 0) gains += change;
    else losses -= change;
  }

  const avgGain = gains / (prices.length - 1);
  const avgLoss = losses / (prices.length - 1);

  if (avgLoss === 0) return 100;
  const rs = avgGain / avgLoss;
  return 100 - 100 / (1 + rs);
}

function calculateMacd(prices) {
  if (!prices.length) return 0;
  const ema12 = calculateEma(prices.slice(-12), 12);
  const ema26 = calculateEma(prices.slice(-26), 26);
  return ema12 - ema26;
}

function calculateBollinger(prices, period = 14) {
  if (!prices.length) return { upper: 0, middle: 0, lower: 0 };
  const window = prices.slice(-period);
  const middle = calculateSma(window);
  const variance = window.reduce((sum, value) => sum + (value - middle) ** 2, 0) / window.length;
  const stdDev = Math.sqrt(variance);
  return {
    upper: middle + stdDev * 2,
    middle,
    lower: middle - stdDev * 2,
  };
}

function calculateVwap(prices, volumes) {
  if (!prices.length || !volumes.length) return 0;
  const totalVolume = volumes.reduce((sum, value) => sum + value, 0);
  if (!totalVolume) return calculateSma(prices);
  const weighted = prices.reduce((sum, value, index) => sum + value * (volumes[index] || 0), 0);
  return weighted / totalVolume;
}

function calculateAtr(prices) {
  if (!prices.length || prices.length < 2) return 0;
  const changes = [];
  for (let i = 1; i < prices.length; i += 1) {
    const prev = prices[i - 1];
    const current = prices[i];
    changes.push(Math.abs(current - prev));
  }
  return calculateSma(changes);
}

function calculateAdx(prices) {
  if (!prices.length || prices.length < 2) return 0;
  const changes = [];
  for (let i = 1; i < prices.length; i += 1) {
    const diff = Math.abs(prices[i] - prices[i - 1]);
    changes.push(diff);
  }
  return calculateSma(changes) / Math.max(1, prices[prices.length - 1]) * 100;
}

function buildHistorySeries(price, ema, sma, vwap) {
  return [
    { label: "1D", price: price * 0.97, ema: ema * 0.985, sma: sma * 0.988, vwap: vwap * 0.989 },
    { label: "3D", price: price * 1.0, ema: ema * 1.0, sma: sma * 1.0, vwap: vwap * 1.0 },
    { label: "1W", price: price * 1.03, ema: ema * 1.02, sma: sma * 1.01, vwap: vwap * 1.015 },
    { label: "1M", price: price * 1.06, ema: ema * 1.04, sma: sma * 1.03, vwap: vwap * 1.035 },
  ];
}

function analyzeTechnicalIndicators(cryptos = []) {
  return cryptos.map((coin) => {
    const price = Number.parseFloat(coin.price_usd) || 0;
    const prices = [price * 0.95, price * 0.98, price, price * 1.02, price * 1.04, price * 1.06];
    const volumes = [1.1e6, 1.4e6, 1.3e6, 1.6e6, 1.8e6, 2.0e6];
    const rsi = calculateRsi(prices);
    const macd = calculateMacd(prices);
    const sma = calculateSma(prices);
    const ema = calculateEma(prices, 14);
    const bollinger = calculateBollinger(prices, 6);
    const vwap = calculateVwap(prices, volumes);
    const atr = calculateAtr(prices);
    const adx = calculateAdx(prices);
    const support = Math.min(price, sma) * 0.985;
    const resistance = Math.max(price, sma) * 1.015;
    const ichimoku = (ema + sma) / 2;
    const trendStrength = Math.min(100, Math.max(0, 50 + (rsi - 50) * 0.8 + (macd > 0 ? 10 : -10)));
    const momentum = Math.min(100, Math.max(0, 50 + (price - sma) / Math.max(1, sma) * 1000));
    const volatility = Math.min(100, Math.max(0, Math.abs(price - bollinger.middle) / Math.max(1, bollinger.middle) * 1000));

    let signal = "Neutral";
    if (rsi > 70) signal = "Overbought";
    else if (rsi < 30) signal = "Oversold";
    else if (macd > 0 && price > ema) signal = "Bullish";
    else if (macd < 0 && price < ema) signal = "Bearish";

    return {
      id: coin.id,
      name: coin.name,
      symbol: coin.symbol,
      price_usd: coin.price_usd,
      rsi: Number(rsi.toFixed(2)),
      macd: Number(macd.toFixed(2)),
      ema: Number(ema.toFixed(2)),
      sma: Number(sma.toFixed(2)),
      vwap: Number(vwap.toFixed(2)),
      atr: Number(atr.toFixed(2)),
      adx: Number(adx.toFixed(2)),
      bollinger: {
        upper: Number(bollinger.upper.toFixed(2)),
        middle: Number(bollinger.middle.toFixed(2)),
        lower: Number(bollinger.lower.toFixed(2)),
      },
      support: Number(support.toFixed(2)),
      resistance: Number(resistance.toFixed(2)),
      ichimoku: Number(ichimoku.toFixed(2)),
      trendStrength: Number(trendStrength.toFixed(2)),
      momentum: Number(momentum.toFixed(2)),
      volatility: Number(volatility.toFixed(2)),
      signal,
      history: buildHistorySeries(price, ema, sma, vwap),
    };
  });
}

module.exports = {
  analyzeTechnicalIndicators,
  calculateAtr,
  calculateAdx,
  calculateBollinger,
  calculateEma,
  calculateMacd,
  calculateRsi,
  calculateSma,
  calculateVwap,
};
