import "./globals.css";

export const metadata = {
  title: "#bdl79",
  description: "For easily backtesting — OHLC market data, trade review, and multi-timeframe charting."
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
