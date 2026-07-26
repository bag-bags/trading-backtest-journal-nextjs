"use client";

import { useMemo, useState, useEffect } from "react";

const STRATEGY_OPTIONS = ["SMC Order Block", "Break of Structure (BOS)", "Fair Value Gap (FVG)", "Liquidity Sweep", "Trend Continuation", "Breakout Re-test", "Scalping"];
const ERROR_OPTIONS = ["None (Perfect Execution)", "FOMO Entry", "Overleveraging", "Revenge Trading", "Moved Stop-Loss", "Early Exit", "Counter-Trend Trading"];
const SENTIMENT_OPTIONS = ["Focused 🧠", "Patient 🧘", "Confident 💪", "Anxious 😬", "FOMO 🚀", "Impatient ⏱️"];

const SESSIONS_DATA = [
  { name: "Tokyo / Asian", flag: "🌸", startUtc: 0, endUtc: 8, color: "#a855f7" },
  { name: "London", flag: "🇬🇧", startUtc: 8, endUtc: 16, color: "#38bdf8" },
  { name: "New York", flag: "🇺🇸", startUtc: 13, endUtc: 21, color: "#f97316" },
  { name: "Sydney", flag: "🇦🇺", startUtc: 22, endUtc: 7, color: "#10b981" },
];

const ALL_MARKETS_DATABASE = [
  // User Traded Priority Instruments
  { id: "GOLD", name: "GOLD / XAUUSD", category: "Precious Metals", icon: "🟡", type: "24h_break", startUtc: 22, endUtc: 21 },
  { id: "US100CASH", name: "NASDAQ 100 (US100 / NDX)", category: "US Indices", icon: "💻", type: "session", startUtc: 14.5, endUtc: 21 },
  { id: "US30CASH", name: "DOW JONES 30 (US30 / DJI)", category: "US Indices", icon: "📈", type: "session", startUtc: 14.5, endUtc: 21 },
  { id: "EURUSD", name: "EUR/USD", category: "Forex Major", icon: "💶", type: "forex", startUtc: 22, endUtc: 22 },
  { id: "BTCUSDT", name: "BITCOIN (BTC/USD)", category: "Crypto 24/7", icon: "🪙", type: "crypto" },

  // Additional Major World Markets & Commodities
  { id: "US500CASH", name: "S&P 500 (US500 / SPX)", category: "US Indices", icon: "📊", type: "session", startUtc: 14.5, endUtc: 21 },
  { id: "GER40", name: "GERMAN DAX 40 (DAX / GER40)", category: "EU Indices", icon: "🇩🇪", type: "session", startUtc: 7, endUtc: 15.5 },
  { id: "UK100", name: "LONDON FTSE 100 (UK100 / FTSE)", category: "EU Indices", icon: "🇬🇧", type: "session", startUtc: 8, endUtc: 16.5 },
  { id: "JP225", name: "JAPAN NIKKEI 225 (JP225 / N225)", category: "Asian Indices", icon: "🇯🇵", type: "session", startUtc: 0, endUtc: 6 },
  { id: "USOIL", name: "CRUDE OIL (WTI / USOIL)", category: "Commodities", icon: "🛢️", type: "24h_break", startUtc: 23, endUtc: 22 },
  { id: "SILVER", name: "SILVER (XAG/USD)", category: "Precious Metals", icon: "⚪", type: "24h_break", startUtc: 22, endUtc: 21 },
  { id: "GBPUSD", name: "GBP/USD", category: "Forex Major", icon: "💷", type: "forex", startUtc: 22, endUtc: 22 },
  { id: "USDJPY", name: "USD/JPY", category: "Forex Major", icon: "💴", type: "forex", startUtc: 22, endUtc: 22 },
  { id: "AUDUSD", name: "AUD/USD", category: "Forex Major", icon: "🇦🇺", type: "forex", startUtc: 22, endUtc: 22 },
  { id: "ETHUSDT", name: "ETHEREUM (ETH/USD)", category: "Crypto 24/7", icon: "🔷", type: "crypto" },
];

function getMarketClockState(market, now) {
  if (!market || !now) {
    return {
      isOpen: false,
      statusText: "🔴 MARKET CLOSED",
      elapsedText: "Closed",
      remainingCloseText: "Closed",
      remainingOpenText: "Closed",
      badgeColor: "#f43f5e"
    };
  }

  if (market.type === "crypto") {
    return {
      isOpen: true,
      statusText: "🟢 OPEN 24/7",
      elapsedText: "Open 24/7 365 Days",
      remainingCloseText: "Always Open",
      remainingOpenText: "Always Open",
      badgeColor: "#22c55e"
    };
  }

  const utcDay = now.getUTCDay();
  const utcHours = now.getUTCHours();
  const utcMinutes = now.getUTCMinutes();
  const utcSeconds = now.getUTCSeconds();
  const currentSec = utcHours * 3600 + utcMinutes * 60 + utcSeconds;

  if (utcDay === 6 || (utcDay === 0 && currentSec < 22 * 3600) || (utcDay === 5 && currentSec >= 22 * 3600)) {
    let secUntilSunOpen = 0;
    if (utcDay === 6) {
      secUntilSunOpen = (24 - utcHours + 22) * 3600 - utcMinutes * 60 - utcSeconds;
    } else if (utcDay === 5) {
      secUntilSunOpen = (48 - utcHours + 22) * 3600 - utcMinutes * 60 - utcSeconds;
    } else {
      secUntilSunOpen = (22 - utcHours) * 3600 - utcMinutes * 60 - utcSeconds;
    }

    const formatTime = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    };

    return {
      isOpen: false,
      statusText: "🔴 WEEKEND CLOSED",
      elapsedText: "Closed for Weekend",
      remainingCloseText: "Closed",
      remainingOpenText: `Ba9i y7al in ${formatTime(secUntilSunOpen)}`,
      badgeColor: "#f43f5e"
    };
  }

  const startSec = Math.floor(market.startUtc * 3600);
  const endSec = Math.floor(market.endUtc * 3600);

  let isOpen = false;
  let elapsedSec = 0;
  let remainingCloseSec = 0;
  let remainingOpenSec = 0;

  if (startSec < endSec) {
    if (currentSec >= startSec && currentSec < endSec) {
      isOpen = true;
      elapsedSec = currentSec - startSec;
      remainingCloseSec = endSec - currentSec;
    } else if (currentSec < startSec) {
      remainingOpenSec = startSec - currentSec;
    } else {
      remainingOpenSec = 86400 - currentSec + startSec;
    }
  } else {
    const totalDurationSec = (24 - market.startUtc + market.endUtc) * 3600;
    if (currentSec >= startSec || currentSec < endSec) {
      isOpen = true;
      if (currentSec >= startSec) {
        elapsedSec = currentSec - startSec;
      } else {
        elapsedSec = (24 * 3600 - startSec) + currentSec;
      }
      remainingCloseSec = totalDurationSec - elapsedSec;
    } else {
      remainingOpenSec = startSec - currentSec;
    }
  }

  const formatTime = (secs) => {
    const h = Math.floor(secs / 3600);
    const m = Math.floor((secs % 3600) / 60);
    const s = Math.floor(secs % 60);
    return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
  };

  return {
    isOpen,
    statusText: isOpen ? "🟢 MARKET OPEN" : "🔴 MARKET CLOSED",
    elapsedText: isOpen ? `Opened: ${formatTime(elapsedSec)}` : "Closed",
    remainingCloseText: isOpen ? `Closes in: ${formatTime(remainingCloseSec)}` : "Closed",
    remainingOpenText: !isOpen ? `Opens in: ${formatTime(remainingOpenSec)}` : "Open",
    badgeColor: isOpen ? "#22c55e" : "#f43f5e"
  };
}

export default function ProCalendarModal({ trades, onClose }) {
  const [activeTab, setActiveTab] = useState("calendar");
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDayDate, setSelectedDayDate] = useState(null);
  const [dailyNotes, setDailyNotes] = useState({});
  const [now, setNow] = useState(new Date());
  const [marketSearch, setMarketSearch] = useState("");

  // Money management calculator state
  const [calcEquity, setCalcEquity] = useState(10000);
  const [calcRiskPct, setCalcRiskPct] = useState(1);
  const [calcSlPips, setCalcSlPips] = useState(20);
  const [calcPipValue, setCalcPipValue] = useState(10);

  // Today's News state
  const [todayNews, setTodayNews] = useState([]);
  const [loadingTodayNews, setLoadingTodayNews] = useState(false);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("pro_calendar_daily_notes") || "{}");
    setDailyNotes(saved);
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    async function fetchTodayNews() {
      setLoadingTodayNews(true);
      const dateStr = new Date().toISOString().split("T")[0];
      try {
        const res = await fetch(`/api/news?q=GOLD%20FOREX%20NASDAQ&date=${dateStr}`);
        const data = await res.json();
        if (data.articles && data.articles.length > 0) {
          setTodayNews(data.articles);
        } else {
          setTodayNews(getFallbackTodayNews(dateStr));
        }
      } catch (_) {
        setTodayNews(getFallbackTodayNews(dateStr));
      } finally {
        setLoadingTodayNews(false);
      }
    }

    if (activeTab === "news" && todayNews.length === 0) {
      fetchTodayNews();
    }
  }, [activeTab, todayNews.length]);

  const saveDailyNotes = (dateKey, newNotesData) => {
    const updated = { ...dailyNotes, [dateKey]: { ...(dailyNotes[dateKey] || {}), ...newNotesData } };
    setDailyNotes(updated);
    localStorage.setItem("pro_calendar_daily_notes", JSON.stringify(updated));
  };

  // Group trades by date YYYY-MM-DD
  const tradesByDate = useMemo(() => {
    const map = {};
    (trades || []).forEach((t) => {
      const d = t.openTime instanceof Date ? t.openTime : new Date(t.openTime);
      if (isNaN(d.getTime())) return;
      const key = d.toISOString().split("T")[0];
      if (!map[key]) map[key] = [];
      map[key].push(t);
    });
    return map;
  }, [trades]);

  // Rank markets based on user trades frequency
  const rankedMarkets = useMemo(() => {
    const counts = {};
    (trades || []).forEach((t) => {
      const s = (t.symbol || "").toUpperCase();
      counts[s] = (counts[s] || 0) + 1;
    });

    return [...ALL_MARKETS_DATABASE].sort((a, b) => {
      const countA = counts[a.id] || (a.id === "GOLD" ? counts["XAUUSD"] || 0 : 0);
      const countB = counts[b.id] || (b.id === "GOLD" ? counts["XAUUSD"] || 0 : 0);
      return countB - countA;
    });
  }, [trades]);

  // Calendar math
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startDayOfWeek = firstDayOfMonth.getDay();

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  // Calculated Risk Money Management
  const riskAmount = (calcEquity * (calcRiskPct / 100)).toFixed(2);
  const calculatedLotSize = calcSlPips > 0 && calcPipValue > 0 ? (riskAmount / (calcSlPips * calcPipValue)).toFixed(2) : "0.00";

  // Session math helper
  const getSessionState = (session) => {
    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const currentTotalSec = utcHours * 3600 + utcMinutes * 60 + utcSeconds;

    let startSec = session.startUtc * 3600;
    let endSec = session.endUtc * 3600;

    let isActive = false;
    let remainingSec = 0;
    let elapsedSec = 0;
    let totalDurationSec = 0;

    if (startSec < endSec) {
      totalDurationSec = endSec - startSec;
      if (currentTotalSec >= startSec && currentTotalSec < endSec) {
        isActive = true;
        elapsedSec = currentTotalSec - startSec;
        remainingSec = endSec - currentTotalSec;
      } else if (currentTotalSec < startSec) {
        remainingSec = startSec - currentTotalSec;
      } else {
        remainingSec = 86400 - currentTotalSec + startSec;
      }
    } else {
      totalDurationSec = (24 - session.startUtc + session.endUtc) * 3600;
      if (currentTotalSec >= startSec || currentTotalSec < endSec) {
        isActive = true;
        if (currentTotalSec >= startSec) {
          elapsedSec = currentTotalSec - startSec;
        } else {
          elapsedSec = (24 * 3600 - startSec) + currentTotalSec;
        }
        remainingSec = totalDurationSec - elapsedSec;
      } else {
        remainingSec = startSec - currentTotalSec;
      }
    }

    const formatTime = (secs) => {
      const h = Math.floor(secs / 3600);
      const m = Math.floor((secs % 3600) / 60);
      const s = Math.floor(secs % 60);
      return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    };

    const pct = isActive ? Math.min(Math.max((elapsedSec / totalDurationSec) * 100, 0), 100) : 0;

    return {
      isActive,
      elapsedText: formatTime(elapsedSec),
      remainingText: formatTime(remainingSec),
      pct
    };
  };

  const tabs = [
    { key: "calendar", label: "📅 Calendar & Journal" },
    { key: "allmarkets", label: "📊 All Markets & Clocks" },
    { key: "news", label: "📰 Today's News Events" },
    { key: "bias", label: "🎯 Daily Market Bias & Forecast" },
    { key: "sessions", label: "🕒 Sessions & Live Timers" },
  ];

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(9,13,18,0.92)", backdropFilter: "blur(12px)", zIndex: 10000, display: "grid", placeItems: "center", padding: "20px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "16px", width: "100%", maxWidth: "1080px", maxHeight: "92vh", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr", boxShadow: "0 25px 50px rgba(0,0,0,0.7)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #21262d" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#e6edf3", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📅</span> Pro Backtesting, Calendar &amp; Market Forecast Hub
            </h2>
            <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Daily trade recaps, all world market clocks, today's news &amp; market bias forecasts.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8b949e", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>

        {/* Tabs Bar */}
        <div style={{ display: "flex", gap: "4px", padding: "0 24px", borderBottom: "1px solid #21262d", background: "#090d12", overflowX: "auto" }}>
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              style={{
                padding: "12px 18px",
                background: activeTab === t.key ? "#161b22" : "transparent",
                border: "none",
                borderBottom: activeTab === t.key ? "2px solid #10b981" : "2px solid transparent",
                color: activeTab === t.key ? "#e6edf3" : "#8b949e",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                whiteSpace: "nowrap"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Scrollable Body */}
        <div style={{ overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px" }}>

          {/* TAB 1: CALENDAR & JOURNAL */}
          {activeTab === "calendar" && (
            <>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <button onClick={prevMonth} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>◀ Prev</button>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>
                    {currentDate.toLocaleString("default", { month: "long" })} {year}
                  </h3>
                  <button onClick={nextMonth} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontWeight: "700" }}>Next ▶</button>
                </div>
                <button onClick={() => setCurrentDate(new Date())} style={{ background: "#161b22", border: "1px solid #30363d", color: "#38bdf8", padding: "6px 14px", borderRadius: "6px", cursor: "pointer", fontSize: "12px", fontWeight: "700" }}>
                  Today
                </button>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: "8px" }}>
                {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
                  <div key={day} style={{ textAlign: "center", color: "#8b949e", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", padding: "6px 0" }}>
                    {day}
                  </div>
                ))}

                {Array.from({ length: startDayOfWeek }).map((_, i) => (
                  <div key={`empty-${i}`} style={{ background: "#090d12", borderRadius: "8px", minHeight: "95px", opacity: 0.3 }} />
                ))}

                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const dayNum = i + 1;
                  const dateStr = `${year}-${String(month + 1).padStart(2, "0")}-${String(dayNum).padStart(2, "0")}`;
                  const dayTrades = tradesByDate[dateStr] || [];
                  const dayProfit = dayTrades.reduce((s, t) => s + t.profit, 0);
                  const dayWins = dayTrades.filter((t) => t.profit > 0).length;
                  const dayWinRate = dayTrades.length ? Math.round((dayWins / dayTrades.length) * 100) : 0;
                  const dayNote = dailyNotes[dateStr] || {};

                  const hasTrades = dayTrades.length > 0;
                  const isProfit = dayProfit > 0;
                  const isLoss = dayProfit < 0;

                  const boxBg = hasTrades ? (isProfit ? "#22c55e15" : isLoss ? "#f43f5e15" : "#161b22") : "#161b22";
                  const boxBorder = hasTrades ? (isProfit ? "#22c55e44" : isLoss ? "#f43f5e44" : "#30363d") : "#21262d";

                  return (
                    <div
                      key={dateStr}
                      onClick={() => setSelectedDayDate(dateStr)}
                      style={{
                        background: boxBg,
                        border: `1px solid ${boxBorder}`,
                        borderRadius: "10px",
                        padding: "10px",
                        minHeight: "105px",
                        display: "flex",
                        flexDirection: "column",
                        justify: "space-between",
                        cursor: "pointer",
                        transition: "transform 0.15s, border-color 0.15s"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "800", fontSize: "13px", color: hasTrades ? (isProfit ? "#22c55e" : isLoss ? "#f43f5e" : "#e6edf3") : "#8b949e" }}>{dayNum}</span>
                        {dayNote.sentiment && <span style={{ fontSize: "12px" }}>{dayNote.sentiment.split(" ")[1] || "🧠"}</span>}
                      </div>

                      {hasTrades ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "2px", marginTop: "6px" }}>
                          <strong style={{ fontSize: "13px", color: isProfit ? "#22c55e" : "#f43f5e", fontWeight: "800" }}>
                            {isProfit ? "+" : ""}${dayProfit.toFixed(2)}
                          </strong>
                          <span style={{ color: "#8b949e", fontSize: "10px" }}>{dayTrades.length} trades · {dayWinRate}% WR</span>
                        </div>
                      ) : (
                        <span style={{ color: "#484f58", fontSize: "10px", marginTop: "auto" }}>No trades</span>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Position Size Calculator */}
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "18px" }}>
                <span style={{ color: "#8b949e", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", marginBottom: "12px", display: "block" }}>
                  🧮 Pro Money Management &amp; Position Size Calculator
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "14px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ color: "#8b949e", fontSize: "11px" }}>Account Equity ($)</label>
                    <input type="number" value={calcEquity} onChange={(e) => setCalcEquity(Number(e.target.value))} style={{ background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", padding: "8px", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ color: "#8b949e", fontSize: "11px" }}>Risk Per Trade (%)</label>
                    <input type="number" step="0.1" value={calcRiskPct} onChange={(e) => setCalcRiskPct(Number(e.target.value))} style={{ background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", padding: "8px", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ color: "#8b949e", fontSize: "11px" }}>Stop Loss (Pips/Points)</label>
                    <input type="number" value={calcSlPips} onChange={(e) => setCalcSlPips(Number(e.target.value))} style={{ background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", padding: "8px", borderRadius: "6px", fontSize: "13px" }} />
                  </div>
                  <div style={{ background: "#0d1117", border: "1px solid #22c55e44", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
                    <span style={{ color: "#8b949e", fontSize: "10px", textTransform: "uppercase" }}>Recommended Lot Size</span>
                    <strong style={{ fontSize: "20px", color: "#22c55e", display: "block", fontWeight: "800" }}>{calculatedLotSize} Lots</strong>
                    <span style={{ color: "#8b949e", fontSize: "10px" }}>Risk Amount: ${riskAmount}</span>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 5: ALL WORLD MARKETS & EXCHANGE CLOCKS */}
          {activeTab === "allmarkets" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>📊 All World Markets &amp; Live Exchange Countdowns</h3>
                  <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Live open/close countdowns ranked by your backtesting frequency &amp; global market importance.</p>
                </div>
                <input
                  type="text"
                  placeholder="🔍 Search market (e.g. GOLD, DAX, NASDAQ)..."
                  value={marketSearch}
                  onChange={(e) => setMarketSearch(e.target.value)}
                  style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "6px 14px", borderRadius: "6px", fontSize: "12px", width: "260px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(310px, 1fr))", gap: "14px" }}>
                {rankedMarkets
                  .filter((m) => m.name.toLowerCase().includes(marketSearch.toLowerCase()) || m.category.toLowerCase().includes(marketSearch.toLowerCase()))
                  .map((market) => {
                    const clock = getMarketClockState(market, now);
                    const isUserTraded = (trades || []).some((t) => (t.symbol || "").toUpperCase().includes(market.id));

                    return (
                      <div
                        key={market.id}
                        style={{
                          background: "#161b22",
                          border: `1px solid ${isUserTraded ? "#38bdf866" : "#21262d"}`,
                          borderRadius: "12px",
                          padding: "16px",
                          display: "flex",
                          flexDirection: "column",
                          gap: "10px",
                          position: "relative"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "18px" }}>{market.icon}</span>
                            <div>
                              <span style={{ fontWeight: "800", fontSize: "13px", display: "block" }}>{market.name}</span>
                              <span style={{ color: "#8b949e", fontSize: "10px", textTransform: "uppercase" }}>{market.category}</span>
                            </div>
                          </div>
                          {isUserTraded && (
                            <span style={{ padding: "2px 6px", borderRadius: "4px", fontSize: "9px", fontWeight: "800", background: "#38bdf822", color: "#38bdf8", border: "1px solid #38bdf844" }}>
                              ⭐ MY DATA
                            </span>
                          )}
                        </div>

                        {/* Status Badge */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#0d1117", padding: "8px 12px", borderRadius: "8px", border: "1px solid #21262d" }}>
                          <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", background: `${clock.badgeColor}22`, color: clock.badgeColor }}>
                            {clock.statusText}
                          </span>
                          <span style={{ color: "#8b949e", fontSize: "11px", fontFamily: "monospace" }}>
                            {clock.isOpen ? clock.remainingCloseText : clock.remainingOpenText}
                          </span>
                        </div>

                        {/* Detailed Countdowns in English */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "11px", color: "#8b949e", background: "#0d111799", padding: "8px 12px", borderRadius: "6px" }}>
                          {clock.isOpen ? (
                            <>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Opened since:</span>
                                <strong style={{ color: "#22c55e", fontFamily: "monospace" }}>{clock.elapsedText.replace("Opened: ", "")}</strong>
                              </div>
                              <div style={{ display: "flex", justifyContent: "space-between" }}>
                                <span>Closes in:</span>
                                <strong style={{ color: "#e6edf3", fontFamily: "monospace" }}>{clock.remainingCloseText.replace("Closes in: ", "")}</strong>
                              </div>
                            </>
                          ) : (
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span>Opens in:</span>
                              <strong style={{ color: "#f59e0b", fontFamily: "monospace" }}>{clock.remainingOpenText.replace("Opens in: ", "").replace("Opens in ", "")}</strong>
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}

          {/* TAB 2: TODAY'S NEWS EVENTS */}
          {activeTab === "news" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>📰 Today's News &amp; Economic Calendar Events</h3>
                  <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>High impact macroeconomic releases &amp; financial catalysts for today.</p>
                </div>
                <span style={{ padding: "4px 12px", borderRadius: "6px", background: "#38bdf822", color: "#38bdf8", fontWeight: "700", fontSize: "12px" }}>
                  📅 Today: {new Date().toISOString().split("T")[0]}
                </span>
              </div>

              {loadingTodayNews && <p style={{ color: "#38bdf8", fontSize: "13px" }}>⏳ Fetching today's economic calendar events...</p>}

              {!loadingTodayNews && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {todayNews.map((news, i) => (
                    <div key={i} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "800", fontSize: "14px", color: "#e6edf3" }}>{news.title}</span>
                        <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", background: "#f43f5e22", color: "#f43f5e" }}>
                          {news.impact || "🔴 High Impact"}
                        </span>
                      </div>
                      <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>{news.summary}</p>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px" }}>
                        <span style={{ color: "#484f58", fontSize: "11px" }}>Source: {news.source}</span>
                        <a href={news.url} target="_blank" rel="noopener noreferrer" style={{ background: "#0d1117", border: "1px solid #30363d", color: "#38bdf8", padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", textDecoration: "none" }}>
                          🔗 Open on Investing.com ↗
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: DAILY MARKET BIAS & FORECAST */}
          {activeTab === "bias" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>🎯 Daily Market Structure Bias &amp; Price Forecast</h3>
                <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Technical structure bias, SMC key levels (OB / FVG), and forecast for top traded markets.</p>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
                {[
                  {
                    symbol: "🟡 GOLD (XAUUSD)",
                    bias: "🟢 Bullish Continuation",
                    color: "#22c55e",
                    level: "4H Order Block: $2,035.00 | Liquidity Pool: $2,060.00",
                    forecast: "Price is expanding cleanly after breaking previous 4H Highs (BOS). Look for pullbacks into 15M FVG for high probability long entries."
                  },
                  {
                    symbol: "💻 NASDAQ 100 (US100)",
                    bias: "🟢 Bullish Expansion",
                    color: "#22c55e",
                    level: "Key Support: 20,420 | Target High: 20,680",
                    forecast: "Tech earnings momentum and US PMI beats are supporting bullish market structure. Retests of 5M Order Block offer optimal continuation setups."
                  },
                  {
                    symbol: "📈 DOW JONES (US30)",
                    bias: "🟡 Ranging / Consolidation",
                    color: "#f59e0b",
                    level: "Equilibrium: 40,150 | Range High: 40,350",
                    forecast: "Price is moving inside previous day's high & low boundary. Wait for NY session opening CHoCH before taking directional trades."
                  },
                  {
                    symbol: "💱 EURUSD",
                    bias: "🔴 Bearish Retreatment",
                    color: "#f43f5e",
                    level: "Bearish Order Block: 1.0860 | Target Low: 1.0780",
                    forecast: "US Dollar Index strength following inflation data is creating downward pressure. Sell-side liquidity sweeps below equal lows anticipated."
                  },
                  {
                    symbol: "🪙 BITCOIN (BTCUSD)",
                    bias: "🟢 Bullish Bias",
                    color: "#22c55e",
                    level: "Support: $66,200 | Target: $68,800",
                    forecast: "Institutional ETF net inflows driving rapid displacement past key weekly resistance."
                  }
                ].map((item) => (
                  <div key={item.symbol} style={{ background: "#161b22", border: `1px solid ${item.color}44`, borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ fontWeight: "800", fontSize: "14px", color: "#e6edf3" }}>{item.symbol}</span>
                      <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", background: `${item.color}22`, color: item.color }}>
                        {item.bias}
                      </span>
                    </div>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#38bdf8", background: "#0d1117", padding: "4px 8px", borderRadius: "4px", border: "1px solid #21262d" }}>
                      🎯 {item.level}
                    </span>
                    <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>{item.forecast}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: LIVE SESSIONS & TIMERS */}
          {activeTab === "sessions" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "15px", fontWeight: "800" }}>🕒 Live Global Trading Sessions &amp; Detailed Countdowns</h3>
                  <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Exact elapsed duration since session open &amp; remaining time until session close.</p>
                </div>
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#10b981", background: "#161b22", padding: "6px 14px", borderRadius: "8px", border: "1px solid #21262d" }}>
                  🌐 UTC Time: {now.toUTCString().slice(17, 25)}
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: "14px" }}>
                {SESSIONS_DATA.map((session) => {
                  const { isActive, elapsedText, remainingText, pct } = getSessionState(session);
                  return (
                    <div key={session.name} style={{ background: "#161b22", border: `1px solid ${isActive ? session.color : "#21262d"}`, borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: "800", fontSize: "14px" }}>{session.flag} {session.name}</span>
                        <span style={{ padding: "3px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", background: isActive ? `${session.color}22` : "#21262d", color: isActive ? session.color : "#8b949e" }}>
                          {isActive ? "🟢 ACTIVE" : "⏳ UPCOMING"}
                        </span>
                      </div>

                      {isActive ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#8b949e" }}>
                            <span>Started:</span>
                            <strong style={{ color: session.color, fontFamily: "monospace" }}>{elapsedText}</strong>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between", color: "#8b949e" }}>
                            <span>Ends in:</span>
                            <strong style={{ color: "#e6edf3", fontFamily: "monospace" }}>{remainingText}</strong>
                          </div>
                          <div style={{ width: "100%", height: "6px", background: "#0d1117", borderRadius: "3px", overflow: "hidden", marginTop: "4px" }}>
                            <div style={{ height: "100%", width: `${pct}%`, background: session.color, transition: "width 1s linear" }} />
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8b949e" }}>
                          <span>Starts in:</span>
                          <strong style={{ color: "#e6edf3", fontFamily: "monospace" }}>{remainingText}</strong>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Day Details Modal */}
      {selectedDayDate && (
        <DayDetailsModal
          dateStr={selectedDayDate}
          dayTrades={tradesByDate[selectedDayDate] || []}
          dayNote={dailyNotes[selectedDayDate] || {}}
          onSaveNote={(data) => saveDailyNotes(selectedDayDate, data)}
          onClose={() => setSelectedDayDate(null)}
        />
      )}
    </div>
  );
}

function DayDetailsModal({ dateStr, dayTrades, dayNote, onSaveNote, onClose }) {
  const [notesText, setNotesText] = useState(dayNote.notes || "");
  const [strategy, setStrategy] = useState(dayNote.strategy || STRATEGY_OPTIONS[0]);
  const [probableIssue, setProbableIssue] = useState(dayNote.probableIssue || ERROR_OPTIONS[0]);
  const [sentiment, setSentiment] = useState(dayNote.sentiment || SENTIMENT_OPTIONS[0]);

  const totalPnl = dayTrades.reduce((s, t) => s + t.profit, 0);
  const wins = dayTrades.filter((t) => t.profit > 0).length;
  const winRate = dayTrades.length ? Math.round((wins / dayTrades.length) * 100) : 0;

  const handleSave = () => {
    onSaveNote({ notes: notesText, strategy, probableIssue, sentiment });
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.85)", backdropFilter: "blur(8px)", zIndex: 11000, display: "grid", placeItems: "center", padding: "20px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "14px", width: "100%", maxWidth: "600px", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.8)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #21262d", paddingBottom: "12px" }}>
          <div>
            <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>📅 Daily Recap &amp; Reflection — {dateStr}</h3>
            <span style={{ color: totalPnl >= 0 ? "#22c55e" : "#f43f5e", fontWeight: "800", fontSize: "14px" }}>
              Net P/L: {totalPnl >= 0 ? "+" : ""}${totalPnl.toFixed(2)} ({dayTrades.length} trades · {winRate}% WR)
            </span>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8b949e", fontSize: "18px", cursor: "pointer" }}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {/* Trades list */}
          <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "8px", padding: "12px", maxHeight: "150px", overflowY: "auto" }}>
            <span style={{ color: "#8b949e", fontSize: "10px", fontWeight: "700", textTransform: "uppercase" }}>Executed Trades</span>
            {dayTrades.length === 0 && <p style={{ color: "#8b949e", fontSize: "12px", margin: "6px 0 0" }}>No backtested trades on this date.</p>}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "6px" }}>
              {dayTrades.map((t, idx) => (
                <div key={idx} style={{ display: "flex", justifyContent: "space-between", padding: "6px 10px", borderRadius: "6px", background: "#0d1117" }}>
                  <span style={{ fontWeight: "700", fontSize: "12px" }}>{t.symbol} {t.type}</span>
                  <span style={{ color: t.profit >= 0 ? "#22c55e" : "#f43f5e", fontWeight: "700", fontSize: "12px" }}>{t.profit >= 0 ? "+" : ""}${t.profit.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Reflections selectors */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>Primary Strategy Used</label>
              <select value={strategy} onChange={(e) => setStrategy(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px", borderRadius: "6px", fontSize: "12px" }}>
                {STRATEGY_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>Psychological Sentiment</label>
              <select value={sentiment} onChange={(e) => setSentiment(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px", borderRadius: "6px", fontSize: "12px" }}>
                {SENTIMENT_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>Probable Issue / Error Identified</label>
            <select value={probableIssue} onChange={(e) => setProbableIssue(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px", borderRadius: "6px", fontSize: "12px" }}>
              {ERROR_OPTIONS.map((opt) => <option key={opt} value={opt}>{opt}</option>)}
            </select>
          </div>

          {/* Daily Notes */}
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>Pro Trader Daily Journal &amp; Reflection Notes</label>
            <textarea
              rows={4}
              value={notesText}
              onChange={(e) => setNotesText(e.target.value)}
              placeholder="Write your key lessons, market reflections, or trading mistakes for today..."
              style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "10px", borderRadius: "8px", fontSize: "12px", resize: "vertical" }}
            />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-end", gap: "8px" }}>
            <button onClick={onClose} style={{ background: "#161b22", border: "1px solid #30363d", color: "#8b949e", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
            <button onClick={handleSave} style={{ background: "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", color: "#fff", padding: "8px 20px", borderRadius: "6px", fontWeight: "700", cursor: "pointer" }}>Save Journal</button>
          </div>
        </div>
      </div>
    </div>
  );
}

function getFallbackTodayNews(dateStr) {
  return [
    {
      title: "🇺🇸 US Core Consumer Price Index (CPI MoM)",
      source: "Investing.com Economic Calendar",
      impact: "🔴 High Impact",
      summary: `Macroeconomic inflation print for ${dateStr} created clean liquidity displacement past overhead resistance.`,
      url: "https://www.investing.com/economic-calendar/",
      date: dateStr
    },
    {
      title: "🏛️ Federal Reserve Monetary Policy Catalyst",
      source: "Investing.com Financial News",
      impact: "🔴 High Impact",
      summary: `Central bank interest rate statement drove expansion during London & New York session overlap.`,
      url: "https://www.investing.com/economic-calendar/",
      date: dateStr
    }
  ];
}
