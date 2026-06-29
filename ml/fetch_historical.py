"""Fetch historical cryptocurrency prices from CoinGecko."""

from __future__ import annotations

import time
from datetime import datetime, timezone

import pandas as pd
import requests

COINGECKO_BASE = "https://api.coingecko.com/api/v3"
REQUEST_TIMEOUT = 30


def fetch_market_chart(coin_id: str, days: int = 90) -> pd.DataFrame:
    url = f"{COINGECKO_BASE}/coins/{coin_id}/market_chart"
    params = {
        "vs_currency": "usd",
        "days": str(days),
        "interval": "daily",
    }

    last_error: Exception | None = None
    for attempt in range(3):
        try:
            response = requests.get(url, params=params, timeout=REQUEST_TIMEOUT)
            if response.status_code == 429:
                time.sleep(2 ** attempt)
                continue
            response.raise_for_status()
            payload = response.json()
            break
        except Exception as exc:  # noqa: BLE001
            last_error = exc
            time.sleep(1.5 * (attempt + 1))
    else:
        raise RuntimeError(
            f"Failed to fetch historical data for {coin_id}: {last_error}"
        )

    prices = payload.get("prices") or []
    volumes = payload.get("total_volumes") or []

    if len(prices) < 30:
        raise RuntimeError(
            f"Not enough historical data for {coin_id} ({len(prices)} points)"
        )

    frame = pd.DataFrame(prices, columns=["timestamp", "price"])
    volume_frame = pd.DataFrame(volumes, columns=["timestamp", "volume"])
    frame = frame.merge(volume_frame, on="timestamp", how="left")
    frame["volume"] = frame["volume"].fillna(0.0)

    frame["date"] = pd.to_datetime(frame["timestamp"], unit="ms", utc=True)
    frame = frame.sort_values("date").drop_duplicates("date", keep="last")
    frame = frame.reset_index(drop=True)

    frame["return_1d"] = frame["price"].pct_change()
    frame["ma_7"] = frame["price"].rolling(7, min_periods=1).mean()
    frame["ma_14"] = frame["price"].rolling(14, min_periods=1).mean()
    frame["volatility_7"] = frame["return_1d"].rolling(7, min_periods=1).std().fillna(0.0)

    frame = frame.dropna(subset=["price"]).reset_index(drop=True)
    return frame


def latest_price(frame: pd.DataFrame) -> float:
    return float(frame["price"].iloc[-1])


def iso_timestamp() -> str:
    return datetime.now(timezone.utc).isoformat()
