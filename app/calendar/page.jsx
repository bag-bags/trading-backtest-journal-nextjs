"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import ProCalendarModal from "../components/ProCalendarModal";
import { translations } from "../translations";

export default function CalendarPage() {
  const [trades, setTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language");
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  }, [lang]);

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

  const t = translations[lang] || translations.en;
  const isAr = lang === "ar";

  return (
    <div style={{ background: "#050506", minHeight: "100vh", color: "#ffffff", display: "flex", flexDirection: "column" }}>
      {/* Top Header Navigation Bar */}
      <header style={{ background: "#09090b", borderBottom: "1px solid #222225", padding: "14px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", position: "sticky", top: 0, zIndex: 100, flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          <Link
            href="/"
            style={{
              background: "#111113",
              border: "1px solid #222225",
              color: "#a3e635",
              padding: "8px 16px",
              borderRadius: "8px",
              fontSize: "13px",
              fontWeight: "700",
              textDecoration: "none",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(163, 230, 53, 0.05)"
            }}
          >
            {isAr ? "← " : ""}{t.backToJournal}{isAr ? "" : " →"}
          </Link>
          <div>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              {t.calendarPageTitle}
            </h1>
            <p style={{ margin: "2px 0 0", color: "#888893", fontSize: "12px" }}>
              {t.calendarPageDesc}
            </p>
          </div>
        </div>

        <div style={{ color: "#a3e635", fontSize: "12px", fontWeight: "700", background: "#111113", padding: "6px 12px", borderRadius: "6px", border: "1px solid #222225" }}>
          {t.tradesSynchronized.replace("{count}", trades.length)}
        </div>
      </header>

      {/* Main Content Area */}
      <main style={{ flex: 1, padding: "0" }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center", color: "#888893" }}>{t.loading}</div>
        ) : (
          <ProCalendarModal isOpen={true} onClose={() => { window.location.href = "/"; }} trades={trades} lang={lang} />
        )}
      </main>
    </div>
  );
}
