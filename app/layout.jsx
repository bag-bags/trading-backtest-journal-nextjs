import "./globals.css";

export const metadata = {
  title: "Soufiane Trade",
  description: "For easily backtesting — OHLC market data, trade review, and multi-timeframe charting."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
