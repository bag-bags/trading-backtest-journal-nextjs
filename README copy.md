# Trading Backtest Journal

Next.js prototype for reviewing backtest trades with OHLC market data.

## Market data choices

- Binance: free public klines, no API key, crypto only. Use symbols such as `BTCUSDT`.
- TwelveData: free API key, useful for `GOLD`, `XAUUSD`, `EURUSD`, and `BTCUSD`.

## Run locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000`.

## What changed in this version

- Trade CSV import accepts comma, semicolon, tab, quoted CSV, and common broker-style column names.
- Importing trades automatically switches the market symbol to the first trade symbol.
- `Load candles` asks the provider for candles around the selected trade time, so old trades can appear on the chart when the data provider supports that history.
- Chart controls include timeframe buttons, zoom in/out, left/right pan, fit selected trade, and latest.

## TwelveData setup

Create `.env.local`:

```bash
TWELVEDATA_API_KEY=your_free_key_here
```

You can also paste the key in the app UI while testing.

## Trade CSV columns

```csv
symbol,type,volume,open price,close price,open time,close time,profit
GOLD,BUY,0.1,4058.57,4055.95,23/07/2026 15:39,23/07/2026 15:44,-26.20
```
