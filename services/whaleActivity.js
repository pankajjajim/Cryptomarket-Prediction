function buildWhaleActivityDashboard(cryptos = []) {
  const base = cryptos.slice(0, 6).map((coin, index) => ({
    symbol: coin.symbol,
    name: coin.name,
    largeTransactions: 120 + index * 20,
    whaleWallets: 18 + index * 3,
    exchangeInflows: 2500000 + index * 180000,
    exchangeOutflows: 1900000 + index * 140000,
    walletDistribution: 62 + index * 3,
    tokenTransfers: 780 + index * 60,
    buyingPressure: 72 + index * 2,
    sellingPressure: 24 + index * 2,
    liquidity: 84 + index * 2,
    smartMoney: 68 + index * 3,
    exchangeReserves: 9100000 + index * 220000,
    onChainScore: 74 + index * 2,
  }));

  return {
    summary: {
      largeTransactions: base.reduce((sum, item) => sum + item.largeTransactions, 0),
      whaleWallets: base.reduce((sum, item) => sum + item.whaleWallets, 0),
      exchangeInflows: base.reduce((sum, item) => sum + item.exchangeInflows, 0),
      exchangeOutflows: base.reduce((sum, item) => sum + item.exchangeOutflows, 0),
      buyingPressure: Math.round(base.reduce((sum, item) => sum + item.buyingPressure, 0) / Math.max(1, base.length)),
      sellingPressure: Math.round(base.reduce((sum, item) => sum + item.sellingPressure, 0) / Math.max(1, base.length)),
      liquidity: Math.round(base.reduce((sum, item) => sum + item.liquidity, 0) / Math.max(1, base.length)),
      smartMoney: Math.round(base.reduce((sum, item) => sum + item.smartMoney, 0) / Math.max(1, base.length)),
    },
    assets: base,
    alerts: [
      { title: "Whale accumulation spike", severity: "High", asset: "BTC", message: "Large wallets increased exposure by 12% in the last 6 hours." },
      { title: "Exchange outflow surge", severity: "Medium", asset: "ETH", message: "Exchange reserves declined as wallets moved funds to cold storage." },
    ],
    orderBook: [
      { price: 60000, bids: 82, asks: 71 },
      { price: 61000, bids: 74, asks: 69 },
      { price: 62000, bids: 63, asks: 58 },
      { price: 63000, bids: 57, asks: 65 },
    ],
    walletDistribution: [
      { label: "Whales", value: 42 },
      { label: "Institutions", value: 28 },
      { label: "Retail", value: 30 },
    ],
    marketIntelligence: [
      { label: "Liquidity depth", value: "High" },
      { label: "Risk regime", value: "Elevated" },
      { label: "Momentum", value: "Bullish" },
    ],
    timeline: [
      { time: "08:00", value: 44 },
      { time: "10:00", value: 56 },
      { time: "12:00", value: 62 },
      { time: "14:00", value: 68 },
      { time: "16:00", value: 71 },
    ],
  };
}

module.exports = {
  buildWhaleActivityDashboard,
};
