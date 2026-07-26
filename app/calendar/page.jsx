"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProCalendarModal from "../components/ProCalendarModal";

export default function CalendarPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem("trades");
      if (stored) {
        setTrades(JSON.parse(stored));
        setLoading(false);
      } else {
        fetch("/api/default-csv")
          .then((res) => res.json())
          .then((data) => {
            if (data.trades) {
              setTrades(data.trades);
            }
          })
          .catch((err) => console.error("Failed loading default trades:", err))
          .finally(() => setLoading(false));
      }
    } catch (e) {
      setLoading(false);
    }
  }, []);

  return (
    <div style={{ background: "#090d12", minHeight: "100vh", color: "#e6edf3", display: "flex", flexDirection: "column" }}>
      {/* Top Header Navigation Bar */}
      <header style={{ background: "#0d1117", borderBottom: "1px solid #21262d", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link
            href="/"
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#10b981",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            ← Back to Backtest Journal
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#e6edf3", display: "flex", alignItems: "center", gap: "8px" }}>
              📅 Pro Trading Calendar &amp; Performance Journal
            </h1>
            <p style={{ margin: "2px 0 0", color: "#8b949e", fontSize: "12px" }}>
              Full Page View • Interactive Monthly Heatmap, Day Details &amp; Market Session Countdowns.
            </p>
          </div>
        </div>

        <div style={{ color: "#10b981", fontSize: "12px", fontWeight: "700", background: "#161b22", padding: "6px 12px", borderRadius: "6px", border: "1px solid #21262d" }}>
          ⚡ Dedicated Page • {trades.length} Trades Synchronized
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "0" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#8b949e" }}>Loading Trading Journal Data...</div>
        ) : (
          <ProCalendarModal isOpen={true} onClose={() => { window.location.href = "/"; }} trades={trades} />
        )}
      </main>
    </div>
  );
}
