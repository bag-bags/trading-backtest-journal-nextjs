import "./globals.css";

export const metadata = {
  title: "TradingBacktesters - Professional Trading Backtest & Journal Platform",
  description: "TradingBacktesters - Professional backtesting platform with OHLC market data, trade review, Reda System signals, and multi-timeframe charting."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
