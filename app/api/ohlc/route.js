import { NextResponse } from "next/server";

const BINANCE_INTERVALS = {
  "1m": "1m",
  "5m": "5m",
  "15m": "15m",
  "1h": "1h",
  "1d": "1d",
  "1w": "1w"
};

const TWELVEDATA_INTERVALS = {
  "1m": "1min",
  "5m": "5min",
  "15m": "15min",
  "1h": "1h",
  "1d": "1day",
  "1w": "1week"
};

const TWELVEDATA_EXPLICIT = {
  JJJ: "XAU/USD",
  GOLD: "XAU/USD",
  XAUUSD: "XAU/USD",
  SILVER: "XAG/USD",
  XAGUSD: "XAG/USD",
  US100CASH: "QQQ",
  US100SEP26: "QQQ",
  US100DEC26: "QQQ",
  US100: "QQQ",
  NDX: "QQQ",
  NASDAQ: "QQQ",
  NAS100: "QQQ",
  US30CASH: "DIA",
  US30SEP26: "DIA",
  US30DEC26: "DIA",
  US30: "DIA",
  DJI: "DIA",
  DOW: "DIA",
  WS30: "DIA",
  US500CASH: "SPY",
  US500SEP26: "SPY",
  US500DEC26: "SPY",
  US500: "SPY",
  SPX: "SPY",
  GER30: "DAX",
  GER40: "DAX",
  DAX: "DAX",
  DAX40: "DAX",
  UK100: "FTSE",
  FTSE: "FTSE",
  USOIL: "WTI/USD",
  WTI: "WTI/USD",
  UKOIL: "BRENT/USD",
  BRENT: "BRENT/USD",
  DXY: "UUP",
  USDX: "UUP"
};

const CURRENCIES = new Set(["EUR", "GBP", "USD", "JPY", "AUD", "NZD", "CAD", "CHF", "SEK", "NOK", "MXN", "ZAR", "SGD", "HKD", "TRY", "CNH", "PLN"]);

export function toTwelveDataSymbol(rawSymbol) {
  if (!rawSymbol) return "XAU/USD";

  // 1. Clean broker suffixes (e.g. GOLD.pro -> GOLD, EURUSD.m -> EURUSD, US100CASH -> US100CASH)
  let clean = String(rawSymbol)
    .trim()
    .toUpperCase()
    .replace(/\.(PRO|M|ECN|RAW|STD|VIP|MICRO)$/i, "")
    .replace(/[-_]/g, "");

  // 2. Check explicit mappings
  if (TWELVEDATA_EXPLICIT[clean]) return TWELVEDATA_EXPLICIT[clean];

  // 3. If already formatted with slash (e.g. EUR/USD, XAU/USD)
  if (rawSymbol.includes("/")) return rawSymbol.trim().toUpperCase();

  // 4. Crypto pairs (BTCUSDT -> BTC/USD, ETHUSDT -> ETH/USD)
  if (clean.endsWith("USDT")) {
    const base = clean.slice(0, -4);
    return `${base}/USD`;
  }

  // 5. Standard 6-letter Forex currency pairs (EURUSD -> EUR/USD, GBPUSD -> GBP/USD)
  if (clean.length === 6) {
    const c1 = clean.slice(0, 3);
    const c2 = clean.slice(3, 6);
    if (CURRENCIES.has(c1) || CURRENCIES.has(c2)) {
      return `${c1}/${c2}`;
    }
  }

  // 6. Generic USD ending crypto/forex
  if (clean.length > 3 && clean.endsWith("USD")) {
    const base = clean.slice(0, -3);
    return `${base}/USD`;
  }

  return clean;
}

export async function GET(request) {
  const params = request.nextUrl.searchParams;
  const provider = (params.get("provider") || "twelvedata").toLowerCase();
  const symbol = (params.get("symbol") || "GOLD").toUpperCase().replace(/\s/g, "");
  const interval = params.get("interval") || "1m";
  const limit = clamp(Number(params.get("limit") || 500), 50, 2000);
  const from = Number(params.get("from") || "");
  const to = Number(params.get("to") || "");
  const range = {
    from: Number.isFinite(from) ? from : null,
    to: Number.isFinite(to) ? to : null
  };

  try {
    if (provider === "binance") {
      const candles = await fetchBinance(symbol, interval, limit, range);
      return NextResponse.json({ provider, symbol, interval, candles });
    }

    if (provider === "twelvedata") {
      const apiKey = params.get("apiKey") || process.env.TWELVEDATA_API_KEY;
      if (!apiKey) {
        return NextResponse.json(
          { error: "Missing TwelveData API key. Add TWELVEDATA_API_KEY to .env.local or paste a key in the app." },
          { status: 400 }
        );
      }
      const candles = await fetchTwelveData(symbol, interval, limit, apiKey, range);
      return NextResponse.json({ provider, symbol, interval, candles });
    }

    return NextResponse.json({ error: `Unsupported provider: ${provider}` }, { status: 400 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown market data error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}

async function fetchBinance(symbol, interval, limit, range) {
  const mappedInterval = BINANCE_INTERVALS[interval] || "1m";
  const url = new URL("https://api.binance.com/api/v3/klines");
  url.searchParams.set("symbol", symbol);
  url.searchParams.set("interval", mappedInterval);
  url.searchParams.set("limit", String(limit));
  if (range.from) url.searchParams.set("startTime", String(range.from));
  if (range.to) url.searchParams.set("endTime", String(range.to));

  const response = await fetch(url, { next: { revalidate: 20 } });
  const payload = await response.json();

  if (!response.ok || !Array.isArray(payload)) {
    throw new Error(payload?.msg || "Binance did not return candles for this symbol.");
  }

  return payload.map((row) => ({
    time: Number(row[0]),
    open: Number(row[1]),
    high: Number(row[2]),
    low: Number(row[3]),
    close: Number(row[4]),
    volume: Number(row[5])
  }));
}

async function fetchTwelveData(symbol, interval, limit, apiKey, range) {
  const mappedInterval = TWELVEDATA_INTERVALS[interval] || "1min";
  const mappedSymbol = toTwelveDataSymbol(symbol);
  const url = new URL("https://api.twelvedata.com/time_series");
  url.searchParams.set("symbol", mappedSymbol);
  url.searchParams.set("interval", mappedInterval);
  url.searchParams.set("outputsize", String(limit));
  url.searchParams.set("apikey", apiKey);
  url.searchParams.set("timezone", "UTC"); // Force TwelveData to return dates in UTC timezone
  if (range.from) url.searchParams.set("start_date", formatTwelveDate(range.from));
  if (range.to) url.searchParams.set("end_date", formatTwelveDate(range.to));

  const response = await fetch(url, { next: { revalidate: 60 } });
  const payload = await response.json();

  if (!response.ok || payload.status === "error" || !Array.isArray(payload.values)) {
    throw new Error(payload.message || "TwelveData did not return candles for this symbol.");
  }

  return payload.values
    .map((row) => ({
      time: new Date(row.datetime.replace(" ", "T") + "Z").getTime(), // Parse specifically as UTC
      open: Number(row.open),
      high: Number(row.high),
      low: Number(row.low),
      close: Number(row.close),
      volume: Number(row.volume || 0)
    }))
    .filter((candle) => Number.isFinite(candle.time))
    .sort((a, b) => a.time - b.time);
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function formatTwelveDate(timestamp) {
  const date = new Date(timestamp);
  const pad = (value) => String(value).padStart(2, "0");
  return `${date.getUTCFullYear()}-${pad(date.getUTCMonth() + 1)}-${pad(date.getUTCDate())} ${pad(date.getUTCHours())}:${pad(date.getUTCMinutes())}:${pad(date.getUTCSeconds())}`;
}
