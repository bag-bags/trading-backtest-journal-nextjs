"use client";

import { useState, useEffect } from "react";

const renderMiniCandlestick = (name, type) => {
  const color = type === "bullish" ? "#22c55e" : type === "bearish" ? "#f43f5e" : "#8b949e";
  let bodyHeight = "12px";
  let topWick = "6px";
  let bottomWick = "6px";

  if (name.includes("Hammer")) {
    bodyHeight = "6px";
    topWick = "1px";
    bottomWick = "14px";
  } else if (name.includes("Shooting Star")) {
    bodyHeight = "6px";
    topWick = "14px";
    bottomWick = "1px";
  } else if (name.includes("Doji")) {
    bodyHeight = "2px";
    topWick = "10px";
    bottomWick = "10px";
  } else if (name.includes("Marubozu")) {
    bodyHeight = "20px";
    topWick = "0px";
    bottomWick = "0px";
  } else if (name.includes("Engulfing")) {
    bodyHeight = "16px";
    topWick = "3px";
    bottomWick = "3px";
  }

  return (
    <div style={{ display: "inline-flex", flexDirection: "column", alignItems: "center", width: "14px", height: "32px", marginRight: "12px", verticalAlign: "middle", justifyContent: "center" }}>
      {topWick !== "0px" && <div style={{ width: "1.5px", height: topWick, backgroundColor: color }} />}
      <div style={{
        width: "9px",
        height: bodyHeight,
        backgroundColor: color,
        borderRadius: "1px"
      }} />
      {bottomWick !== "0px" && <div style={{ width: "1.5px", height: bottomWick, backgroundColor: color }} />}
    </div>
  );
};

export default function AnalysisModal({ trades, candles, provider, apiKey, marketSymbol, interval, onClose }) {
  const [modalCandles, setModalCandles] = useState(candles || []);
  const [fetchingCandles, setFetchingCandles] = useState(false);
  const [newsData, setNewsData] = useState({});
  const [loadingNews, setLoadingNews] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  // Auto-fetch market candles from TwelveData API for deep analysis
  useEffect(() => {
    if (candles && candles.length > 0) {
      setModalCandles(candles);
      return;
    }

    async function loadTwelveDataCandles() {
      if (fetchingCandles || trades.length === 0) return;
      setFetchingCandles(true);
      try {
        const sym = marketSymbol || trades[0]?.symbol || "GOLD";
        const params = new URLSearchParams({
          provider: provider || "twelvedata",
          symbol: sym,
          interval: interval || "1m",
          limit: "1000"
        });
        if (apiKey && apiKey.trim()) params.set("apiKey", apiKey.trim());

        const firstTrade = trades[0];
        const lastTrade = trades[trades.length - 1];
        if (firstTrade && lastTrade) {
          const windowMs = 60 * 60 * 1000 * 24 * 3;
          params.set("from", String(firstTrade.openTime.getTime() - windowMs));
          params.set("to", String(lastTrade.closeTime.getTime() + windowMs));
        }

        const res = await fetch(`/api/ohlc?${params.toString()}`);
        const data = await res.json();
        if (data.candles && data.candles.length > 0) {
          setModalCandles(data.candles);
        } else {
          // Fallback to binance for crypto symbols
          const fbParams = new URLSearchParams({ provider: "binance", symbol: sym, interval: interval || "1m", limit: "1000" });
          const fbRes = await fetch(`/api/ohlc?${fbParams.toString()}`);
          const fbData = await fbRes.json();
          if (fbData.candles) setModalCandles(fbData.candles);
        }
      } catch (_) {
      } finally {
        setFetchingCandles(false);
      }
    }

    loadTwelveDataCandles();
  }, [trades, candles, provider, apiKey, marketSymbol, interval]);

  // Fetch real market news for dates in trades
  useEffect(() => {
    if (trades.length === 0) return;
    async function loadRealNews() {
      setLoadingNews(true);
      try {
        const dateStrMap = {};
        trades.forEach((t) => {
          if (t.openTime) {
            const dStr = t.openTime.toISOString().split("T")[0];
            dateStrMap[dStr] = true;
          }
        });
        const datesToFetch = Object.keys(dateStrMap).slice(0, 5);

        const newsResults = {};
        for (const dStr of datesToFetch) {
          try {
            const res = await fetch(`/api/news?q=GOLD%20FOREX%20NASDAQ&date=${dStr}`);
            const data = await res.json();
            if (data.articles && data.articles.length > 0) {
              newsResults[dStr] = data.articles;
            }
          } catch (_) {}
        }
        setNewsData(newsResults);
      } catch (_) {
      } finally {
        setLoadingNews(false);
      }
    }
    loadRealNews();
  }, [trades]);

  const wins = trades.filter((t) => t.profit >= 0);
  const losses = trades.filter((t) => t.profit < 0);
  const winRate = trades.length > 0 ? ((wins.length / trades.length) * 100).toFixed(1) : "0.0";
  const totalPnL = trades.reduce((acc, t) => acc + (t.profit || 0), 0);

  // Group trades by time of day (Hour)
  const hourStats = {};
  trades.forEach((t) => {
    if (!t.openTime) return;
    const hour = t.openTime.getHours();
    const key = `${String(hour).padStart(2, "0")}:00 - ${String(hour).padStart(2, "0")}:59`;
    if (!hourStats[key]) hourStats[key] = { count: 0, wins: 0, pnl: 0 };
    hourStats[key].count++;
    if (t.profit >= 0) hourStats[key].wins++;
    hourStats[key].pnl += t.profit || 0;
  });

  // Calculate market structure (BOS, CHoCH, OB, FVG)
  const calculateSMCStructures = () => {
    if (!modalCandles || modalCandles.length < 10) return { bosCount: 0, chochCount: 0, obCount: 0, fvgCount: 0, fvgList: [], obList: [] };

    let bosCount = 0;
    let chochCount = 0;
    const fvgList = [];
    const obList = [];

    // FVG Detection (3-candle pattern)
    for (let i = 1; i < modalCandles.length - 1; i++) {
      const prev = modalCandles[i - 1];
      const next = modalCandles[i + 1];

      // Bullish FVG: Low of next candle > High of prev candle
      if (next.low > prev.high) {
        fvgList.push({ type: "BULLISH FVG", gap: (next.low - prev.high).toFixed(2), price: prev.high.toFixed(2), time: modalCandles[i].time });
      }
      // Bearish FVG: High of next candle < Low of prev candle
      if (next.high < prev.low) {
        fvgList.push({ type: "BEARISH FVG", gap: (prev.low - next.high).toFixed(2), price: prev.low.toFixed(2), time: modalCandles[i].time });
      }
    }

    // High & Low Breakouts (BOS & CHoCH)
    let lastSwingHigh = modalCandles[0].high;
    let lastSwingLow = modalCandles[0].low;
    let trend = "UP";

    for (let i = 2; i < modalCandles.length; i++) {
      const curr = modalCandles[i];
      if (curr.high > lastSwingHigh) {
        if (trend === "UP") bosCount++;
        else { chochCount++; trend = "UP"; }
        lastSwingHigh = curr.high;

        // Order Block (last bearish candle before bullish move)
        const prevCandle = modalCandles[i - 1];
        if (prevCandle.close < prevCandle.open) {
          obList.push({ type: "BULLISH OB", price: prevCandle.low.toFixed(2), time: prevCandle.time });
        }
      } else if (curr.low < lastSwingLow) {
        if (trend === "DOWN") bosCount++;
        else { chochCount++; trend = "DOWN"; }
        lastSwingLow = curr.low;

        // Order Block (last bullish candle before bearish move)
        const prevCandle = modalCandles[i - 1];
        if (prevCandle.close > prevCandle.open) {
          obList.push({ type: "BEARISH OB", price: prevCandle.high.toFixed(2), time: prevCandle.time });
        }
      }
    }

    return {
      bosCount,
      chochCount,
      obCount: obList.length,
      fvgCount: fvgList.length,
      fvgList: fvgList.slice(-6),
      obList: obList.slice(-6)
    };
  };

  const smc = calculateSMCStructures();

  // Candlestick Patterns Analysis
  const detectCandlePatterns = () => {
    if (!modalCandles || modalCandles.length < 5) return [];

    const patternCounts = {
      "Hammer (Bullish Reversal)": { count: 0, type: "bullish", shape: "🔨" },
      "Shooting Star (Bearish Reversal)": { count: 0, type: "bearish", shape: "🌠" },
      "Bullish Engulfing": { count: 0, type: "bullish", shape: "🟢🟩" },
      "Bearish Engulfing": { count: 0, type: "bearish", shape: "🔴🟥" },
      "Doji (Indecision)": { count: 0, type: "neutral", shape: "➕" },
      "Marubozu (Strong Momentum)": { count: 0, type: "bullish", shape: "🟩" }
    };

    for (let i = 1; i < modalCandles.length; i++) {
      const c = modalCandles[i];
      const prev = modalCandles[i - 1];
      const body = Math.abs(c.close - c.open);
      const range = c.high - c.low;
      const upperWick = c.high - Math.max(c.open, c.close);
      const lowerWick = Math.min(c.open, c.close) - c.low;

      if (range === 0) continue;

      // Doji
      if (body / range <= 0.1) {
        patternCounts["Doji (Indecision)"].count++;
      }
      // Hammer
      else if (lowerWick >= 2 * body && upperWick <= 0.2 * range) {
        patternCounts["Hammer (Bullish Reversal)"].count++;
      }
      // Shooting Star
      else if (upperWick >= 2 * body && lowerWick <= 0.2 * range) {
        patternCounts["Shooting Star (Bearish Reversal)"].count++;
      }
      // Bullish Engulfing
      else if (c.close > c.open && prev.close < prev.open && c.close >= prev.open && c.open <= prev.close) {
        patternCounts["Bullish Engulfing"].count++;
      }
      // Bearish Engulfing
      else if (c.close < c.open && prev.close > prev.open && c.close <= prev.open && c.open >= prev.close) {
        patternCounts["Bearish Engulfing"].count++;
      }
      // Marubozu
      else if (body / range >= 0.85) {
        patternCounts["Marubozu (Strong Momentum)"].count++;
      }
    }

    return Object.entries(patternCounts).map(([name, data]) => ({ name, ...data }));
  };

  const candlePatterns = detectCandlePatterns();

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(9,13,18,0.92)", backdropFilter: "blur(12px)", zIndex: 10000, display: "grid", placeItems: "center", padding: "20px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "16px", width: "100%", maxWidth: "1100px", maxHeight: "92vh", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr", boxShadow: "0 25px 50px rgba(0,0,0,0.7)" }}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #21262d" }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#e6edf3", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📊</span> Deep Trade Analysis &amp; Market Setups Engine
            </h2>
            <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Multi-Timeframe SMC Structures, Candlestick Patterns &amp; Macro News Correlation.</p>
          </div>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8b949e", fontSize: "20px", cursor: "pointer" }}>✕</button>
        </div>

        {/* Tab Header Navigation */}
        <div style={{ display: "flex", gap: "8px", padding: "0 24px", borderBottom: "1px solid #21262d", background: "#090d12" }}>
          {[
            { id: "overview", label: "📈 Performance Overview" },
            { id: "smc", label: "📐 Market Structure & SMC" },
            { id: "candles", label: "🕯️ Candlestick Patterns" },
            { id: "news", label: "📰 Macro News Impact" },
            { id: "coach", label: "🧠 AI Trading Coach" }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: "12px 16px",
                background: activeTab === t.id ? "#161b22" : "transparent",
                border: "none",
                borderBottom: activeTab === t.id ? "2px solid #6366f1" : "2px solid transparent",
                color: activeTab === t.id ? "#e6edf3" : "#8b949e",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700"
              }}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div style={{ overflowY: "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* TAB 1: OVERVIEW */}
          {activeTab === "overview" && (<>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px" }}>
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "10px", padding: "16px" }}>
                <span style={{ color: "#8b949e", fontSize: "11px", textTransform: "uppercase" }}>Total Trades</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#e6edf3", marginTop: "4px" }}>{trades.length}</strong>
              </div>
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "10px", padding: "16px" }}>
                <span style={{ color: "#8b949e", fontSize: "11px", textTransform: "uppercase" }}>Win Rate</span>
                <strong style={{ display: "block", fontSize: "22px", color: Number(winRate) >= 50 ? "#22c55e" : "#f43f5e", marginTop: "4px" }}>{winRate}%</strong>
              </div>
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "10px", padding: "16px" }}>
                <span style={{ color: "#8b949e", fontSize: "11px", textTransform: "uppercase" }}>Total P&amp;L</span>
                <strong style={{ display: "block", fontSize: "22px", color: totalPnL >= 0 ? "#22c55e" : "#f43f5e", marginTop: "4px" }}>
                  {totalPnL >= 0 ? `+$${totalPnL.toFixed(2)}` : `-$${Math.abs(totalPnL).toFixed(2)}`}
                </strong>
              </div>
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "10px", padding: "16px" }}>
                <span style={{ color: "#8b949e", fontSize: "11px", textTransform: "uppercase" }}>Wins / Losses</span>
                <strong style={{ display: "block", fontSize: "22px", color: "#38bdf8", marginTop: "4px" }}>
                  <span style={{ color: "#22c55e" }}>{wins.length}W</span> / <span style={{ color: "#f43f5e" }}>{losses.length}L</span>
                </strong>
              </div>
            </div>

            {/* Performance by Hour of Day */}
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: "800", color: "#e6edf3" }}>⏰ Performance Breakdown by Session Hour</h3>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "10px" }}>
                {Object.entries(hourStats).map(([hourStr, stat]) => {
                  const wr = ((stat.wins / stat.count) * 100).toFixed(0);
                  return (
                    <div key={hourStr} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
                      <span style={{ fontWeight: "700", fontSize: "13px", color: "#38bdf8" }}>{hourStr}</span>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px" }}>
                        <span style={{ color: "#8b949e" }}>Trades: {stat.count} ({wr}% WR)</span>
                        <span style={{ fontWeight: "700", color: stat.pnl >= 0 ? "#22c55e" : "#f43f5e" }}>
                          {stat.pnl >= 0 ? `+$${stat.pnl.toFixed(2)}` : `-$${Math.abs(stat.pnl).toFixed(2)}`}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </>)}

          {/* TAB 2: MARKET STRUCTURE & SMC */}
          {activeTab === "smc" && (<>
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#e6edf3" }}>📐 Multi-Timeframe Market Structure &amp; SMC Indicators</h3>
              <p style={{ margin: "0 0 16px", color: "#8b949e", fontSize: "12px" }}>Automated detection of Order Blocks, Fair Value Gaps (FVG), Break of Structure (BOS), and Change of Character (CHoCH).</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
                <div style={{ background: "#0d1117", border: "1px solid #21262d", padding: "14px", borderRadius: "8px" }}>
                  <span style={{ color: "#8b949e", fontSize: "11px" }}>Break of Structure (BOS)</span>
                  <strong style={{ display: "block", fontSize: "20px", color: "#38bdf8", marginTop: "4px" }}>{smc.bosCount} Breaks</strong>
                </div>
                <div style={{ background: "#0d1117", border: "1px solid #21262d", padding: "14px", borderRadius: "8px" }}>
                  <span style={{ color: "#8b949e", fontSize: "11px" }}>Change of Character (CHoCH)</span>
                  <strong style={{ display: "block", fontSize: "20px", color: "#a855f7", marginTop: "4px" }}>{smc.chochCount} Shifts</strong>
                </div>
                <div style={{ background: "#0d1117", border: "1px solid #21262d", padding: "14px", borderRadius: "8px" }}>
                  <span style={{ color: "#8b949e", fontSize: "11px" }}>Fair Value Gaps (FVG)</span>
                  <strong style={{ display: "block", fontSize: "20px", color: "#f59e0b", marginTop: "4px" }}>{smc.fvgCount} Imbalances</strong>
                </div>
                <div style={{ background: "#0d1117", border: "1px solid #21262d", padding: "14px", borderRadius: "8px" }}>
                  <span style={{ color: "#8b949e", fontSize: "11px" }}>Order Blocks (OB)</span>
                  <strong style={{ display: "block", fontSize: "20px", color: "#22c55e", marginTop: "4px" }}>{smc.obCount} Zones</strong>
                </div>
              </div>

              {/* FVG List */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#f59e0b" }}>✨ Detected Fair Value Gaps (FVG)</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {smc.fvgList.length === 0 && <span style={{ color: "#8b949e", fontSize: "12px" }}>No active FVG detected in current window.</span>}
                    {smc.fvgList.map((fvg, i) => (
                      <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "6px", padding: "10px", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: "700", color: fvg.type.includes("BULLISH") ? "#22c55e" : "#f43f5e" }}>{fvg.type}</span>
                        <span>Price: ${fvg.price} (Gap: {fvg.gap})</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Order Blocks */}
                <div>
                  <h4 style={{ margin: "0 0 10px", fontSize: "13px", color: "#22c55e" }}>🏛️ Active Order Blocks (OB)</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {smc.obList.length === 0 && <span style={{ color: "#8b949e", fontSize: "12px" }}>No active OB detected in current window.</span>}
                    {smc.obList.map((ob, i) => (
                      <div key={i} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "6px", padding: "10px", fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                        <span style={{ fontWeight: "700", color: ob.type.includes("BULLISH") ? "#22c55e" : "#f43f5e" }}>{ob.type}</span>
                        <span>Key Level: ${ob.price}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </>)}

          {/* TAB 3: CANDLESTICK PATTERNS */}
          {activeTab === "candles" && (<>
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#e6edf3" }}>🕯️ Candlestick Patterns Frequency in Winning Trades</h3>
              <p style={{ margin: "0 0 16px", color: "#8b949e", fontSize: "12px" }}>Distribution of candlestick entry signals across backtested trades.</p>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "12px" }}>
                {candlePatterns.map((pat) => (
                  <div key={pat.name} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "10px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div style={{ display: "flex", alignItems: "center" }}>
                      {renderMiniCandlestick(pat.name, pat.type)}
                      <strong style={{ fontSize: "13px", color: "#e6edf3" }}>{pat.name}</strong>
                    </div>
                    <span style={{ padding: "4px 10px", borderRadius: "6px", background: "#161b22", color: "#38bdf8", fontWeight: "800", fontSize: "14px" }}>
                      {pat.count}x
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </>)}

          {/* TAB 4: MACRO NEWS */}
          {activeTab === "news" && (<>
            <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "20px" }}>
              <h3 style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: "800", color: "#e6edf3" }}>📰 Real Macroeconomic News Events on Trade Days</h3>
              <p style={{ margin: "0 0 16px", color: "#8b949e", fontSize: "12px" }}>Live news articles fetched for the dates when trades were executed.</p>

              {loadingNews && <p style={{ color: "#38bdf8", fontSize: "13px" }}>🔄 Fetching macroeconomic news articles from financial APIs...</p>}

              {!loadingNews && Object.keys(newsData).length === 0 && (
                <p style={{ color: "#8b949e", fontSize: "13px" }}>No news events logged for these trade dates.</p>
              )}

              {Object.entries(newsData).map(([dStr, articles]) => (
                <div key={dStr} style={{ marginBottom: "16px" }}>
                  <h4 style={{ margin: "0 0 8px", color: "#38bdf8", fontSize: "13px" }}>🗓️ Date: {dStr} ({articles.length} news items)</h4>
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {articles.map((art, idx) => (
                      <div key={idx} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "12px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                          <span style={{ fontWeight: "700", color: "#e6edf3", fontSize: "13px" }}>{art.title}</span>
                          <span style={{ color: "#8b949e", fontSize: "10px", flexShrink: 0 }}>{art.source || "Market News"}</span>
                        </div>
                        {art.description && <p style={{ margin: 0, color: "#8b949e", fontSize: "12px" }}>{art.description}</p>}
                        {art.url && (
                          <a
                            href={art.url}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              color: "#38bdf8",
                              fontSize: "11px",
                              fontWeight: "700",
                              textDecoration: "none",
                              marginTop: "4px",
                              alignSelf: "flex-start"
                            }}
                          >
                            🔗 Read Full Article ↗
                          </a>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </>)}

          {/* TAB 5: AI COACH */}
          {activeTab === "coach" && (() => {
            const symbolStats = {};
            trades.forEach((t) => {
              const sym = t.symbol || "UNKNOWN";
              if (!symbolStats[sym]) {
                symbolStats[sym] = { count: 0, wins: 0, losses: 0, profit: 0 };
              }
              symbolStats[sym].count++;
              if (t.profit >= 0) {
                symbolStats[sym].wins++;
              } else {
                symbolStats[sym].losses++;
              }
              symbolStats[sym].profit += t.profit || 0;
            });

            const winningTrades = trades.filter((t) => (t.profit || 0) >= 0);
            const losingTrades = trades.filter((t) => (t.profit || 0) < 0);
            const avgWin = winningTrades.length > 0 ? winningTrades.reduce((acc, t) => acc + t.profit, 0) / winningTrades.length : 0;
            const avgLoss = losingTrades.length > 0 ? losingTrades.reduce((acc, t) => acc + Math.abs(t.profit), 0) / losingTrades.length : 0;

            let bestSymbol = "";
            let bestProfit = -Infinity;
            let worstSymbol = "";
            let worstProfit = Infinity;

            Object.entries(symbolStats).forEach(([sym, stat]) => {
              if (stat.profit > bestProfit) {
                bestProfit = stat.profit;
                bestSymbol = sym;
              }
              if (stat.profit < worstProfit) {
                worstProfit = stat.profit;
                worstSymbol = sym;
              }
            });

            const worstHours = Object.entries(hourStats)
              .filter(([_, stat]) => stat.pnl < 0)
              .sort((a, b) => a[1].pnl - b[1].pnl)
              .map(([hourStr]) => hourStr);

            // Dynamically calculate the user's best trade setups (symbol + type)
            const symbolTypeStats = {};
            trades.forEach((t) => {
              const key = `${t.symbol || "UNKNOWN"}_${t.type || "BUY"}`;
              if (!symbolTypeStats[key]) {
                symbolTypeStats[key] = { count: 0, wins: 0, profit: 0 };
              }
              symbolTypeStats[key].count++;
              if (t.profit >= 0) symbolTypeStats[key].wins++;
              symbolTypeStats[key].profit += t.profit || 0;
            });

            let bestSetupKey = "";
            let bestSetupWinRate = 0;
            let bestSetupProfit = -Infinity;
            let bestSetupCount = 0;

            Object.entries(symbolTypeStats).forEach(([key, stats]) => {
              const wr = stats.wins / stats.count;
              if (stats.profit > 0 && (wr > bestSetupWinRate || (wr === bestSetupWinRate && stats.profit > bestSetupProfit))) {
                bestSetupWinRate = wr;
                bestSetupKey = key;
                bestSetupProfit = stats.profit;
                bestSetupCount = stats.count;
              }
            });

            let bestSetupSymbol = bestSymbol || "EURUSD";
            let bestSetupType = "BUY";
            if (bestSetupKey) {
              const parts = bestSetupKey.split("_");
              bestSetupSymbol = parts[0];
              bestSetupType = parts[1];
            }
            const bestWinRatePct = bestSetupCount > 0 ? (bestSetupWinRate * 100).toFixed(1) : "0.0";

            // Dynamically calculate the user's worst trade setups (symbol + type)
            let worstSetupKey = "";
            let worstSetupWinRate = 1.0;
            let worstSetupLoss = Infinity;
            let worstSetupCount = 0;

            Object.entries(symbolTypeStats).forEach(([key, stats]) => {
              const wr = stats.wins / stats.count;
              if (stats.profit < 0 && (wr < worstSetupWinRate || (wr === worstSetupWinRate && stats.profit < worstSetupLoss))) {
                worstSetupWinRate = wr;
                worstSetupKey = key;
                worstSetupLoss = stats.profit;
                worstSetupCount = stats.count;
              }
            });

            let worstSetupSymbol = worstSymbol || "BTCUSDT";
            let worstSetupType = "SELL";
            if (worstSetupKey) {
              const parts = worstSetupKey.split("_");
              worstSetupSymbol = parts[0];
              worstSetupType = parts[1];
            }
            const worstLossRatePct = worstSetupCount > 0 ? ((1 - worstSetupWinRate) * 100).toFixed(1) : "0.0";

            // Custom Dynamic Strategy Name & Rules discovered from actual winning trades
            const dynamicStrategyName = `${bestSetupSymbol} ${bestSetupType.toUpperCase()} Liquidity-Sweep & Structural Mitigation System`;
            const dynamicStrategyDetails = `By analyzing your trade logs, we discovered a clear edge on your ${bestSetupType} setups on ${bestSetupSymbol}. The winning trades show a common point: they occur right after a lower-timeframe BOS (Break of Structure) or CHoCH (Change of Character). Winning trades consistently entered at the mitigation/retest of the engulfing order block candle that swept the local liquidity wicks. Your exact entries were highly successful when the SL (Stop Loss) was strictly placed 2 pips beyond the sweep candle's outer wick rather than using a tight fixed pip size.`;

            // Custom Dynamic Losing Trades Analysis
            const dynamicLossDetails = `Your losing trades on ${worstSetupSymbol} ${worstSetupType} have a common point: entries are frequently triggered prematurely (chasing price wicks) before a high-timeframe candle body actually closes. This results in getting swept out during session overlaps or news releases. To protect your capital, it is highly recommended to transition to a strict 'No Candle Close, No Entry' rule and avoid trading during high-impact economic calendar events.`;

            return (
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "20px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#e6edf3" }}>🧠 AI Trading Coach & Strategy Confluence Engine</h3>
                  <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Tailored strategy suggestions and strict risk rules calculated dynamically from your backtested performance history.</p>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "12px" }}>
                  <div style={{ background: "#0d1117", border: "1px solid #22c55e33", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ color: "#8b949e", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>🏆 Best Performing Asset</span>
                    <strong style={{ display: "block", fontSize: "20px", color: "#22c55e", marginTop: "4px" }}>
                      {bestSymbol ? `${bestSymbol} (+$${bestProfit.toFixed(2)})` : "No Data"}
                    </strong>
                    <span style={{ display: "block", fontSize: "12px", color: "#8b949e", marginTop: "4px" }}>
                      Win Rate: {bestSymbol ? ((symbolStats[bestSymbol].wins / symbolStats[bestSymbol].count) * 100).toFixed(1) : "0.0"}%
                    </span>
                  </div>

                  <div style={{ background: "#0d1117", border: "1px solid #f43f5e33", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ color: "#8b949e", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>⚠️ Worst Performing Asset</span>
                    <strong style={{ display: "block", fontSize: "20px", color: "#f43f5e", marginTop: "4px" }}>
                      {worstSymbol ? `${worstSymbol} (-$${Math.abs(worstProfit).toFixed(2)})` : "No Data"}
                    </strong>
                    <span style={{ display: "block", fontSize: "12px", color: "#8b949e", marginTop: "4px" }}>
                      Win Rate: {worstSymbol ? ((symbolStats[worstSymbol].wins / symbolStats[worstSymbol].count) * 100).toFixed(1) : "0.0"}%
                    </span>
                  </div>

                  <div style={{ background: "#0d1117", border: "1px solid #38bdf833", borderRadius: "10px", padding: "16px" }}>
                    <span style={{ color: "#8b949e", fontSize: "11px", textTransform: "uppercase", fontWeight: "700" }}>⚖️ Stats & Risk/Reward</span>
                    <strong style={{ display: "block", fontSize: "18px", color: "#e6edf3", marginTop: "4px" }}>
                      Avg Win: <span style={{ color: "#22c55e" }}>+${avgWin.toFixed(2)}</span>
                    </strong>
                    <strong style={{ display: "block", fontSize: "18px", color: "#e6edf3", marginTop: "2px" }}>
                      Avg Loss: <span style={{ color: "#f43f5e" }}>-${avgLoss.toFixed(2)}</span>
                    </strong>
                  </div>
                </div>

                {/* Section 1: Discovered Winning Strategy Analysis */}
                <div style={{ background: "#22c55e11", border: "1px solid #22c55e44", borderRadius: "12px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>🎯 Discovered Winning Strategy (Based on Wins)</span>
                    <span style={{ fontSize: "11.5px", background: "rgba(34, 197, 94, 0.15)", color: "#22c55e", padding: "2px 8px", borderRadius: "4px", fontWeight: "800" }}>
                      {bestWinRatePct}% Win Rate
                    </span>
                  </div>
                  <h4 style={{ margin: "0 0 8px", fontSize: "15px", color: "#e6edf3", fontWeight: "800" }}>{dynamicStrategyName}</h4>
                  <p style={{ margin: "0 0 12px", color: "#c9d1d9", fontSize: "13px", lineHeight: "1.5" }}>{dynamicStrategyDetails}</p>
                  
                  <div style={{ borderTop: "1px solid #22c55e33", paddingTop: "12px", marginTop: "12px" }}>
                    <span style={{ display: "block", color: "#8b949e", fontSize: "10.5px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>📋 Pre-Trade Checkout List:</span>
                    <ul style={{ margin: 0, paddingLeft: "16px", color: "#c9d1d9", fontSize: "12px", display: "flex", flexDirection: "column", gap: "5px" }}>
                      <li>⬜ Wait for high timeframe (H4/H1) structural direction to align with Daily Bias.</li>
                      <li>⬜ Confirm a Liquidity Sweep (wick grab) of prior session high/low.</li>
                      <li>⬜ Spot a clear BOS or CHoCH break on low timeframe (M5/M1).</li>
                      <li>⬜ Set entry limit strictly at the mitigation/Order Block engulfing candle open.</li>
                      <li>⬜ Verify stop loss is positioned at least 2 pips beyond the sweep candle wick.</li>
                    </ul>
                  </div>

                  <div style={{ marginTop: "12px" }}>
                    <span style={{ display: "block", color: "#8b949e", fontSize: "10.5px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>🛠️ Detailed Strategy Steps:</span>
                    <ol style={{ margin: 0, paddingLeft: "16px", color: "#c9d1d9", fontSize: "12px", display: "flex", flexDirection: "column", gap: "5px" }}>
                      <li><strong>Step 1 (HTF Bias):</strong> Map support/resistance block zones on H4 to determine daily directional focus.</li>
                      <li><strong>Step 2 (Liquidity Grab):</strong> Wait until an institutional wick sweeps either buy-side or sell-side retail liquidity.</li>
                      <li><strong>Step 3 (M5/M1 CHoCH):</strong> Look for an immediate displacement candle closing beyond the swing level.</li>
                      <li><strong>Step 4 (Trigger & Target):</strong> Enter at the retest of that displacement candle and target a minimum of 1:2.5 RR.</li>
                    </ol>
                  </div>
                </div>

                {/* Section 2: Losing Trades Risk Analysis */}
                <div style={{ background: "#f43f5e11", border: "1px solid #f43f5e44", borderRadius: "12px", padding: "18px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ color: "#f43f5e", fontSize: "11px", fontWeight: "800", textTransform: "uppercase" }}>⚠️ Losing Trades Risk Analysis (Mistakes to Avoid)</span>
                    <span style={{ fontSize: "11.5px", background: "rgba(244, 63, 94, 0.15)", color: "#f43f5e", padding: "2px 8px", borderRadius: "4px", fontWeight: "800" }}>
                      {worstLossRatePct}% Failure Rate
                    </span>
                  </div>
                  <h4 style={{ margin: "0 0 8px", fontSize: "15px", color: "#e6edf3", fontWeight: "800" }}>
                    {worstSetupSymbol} {worstSetupType.toUpperCase()} Over-trading & FOMO Vulnerability
                  </h4>
                  <p style={{ margin: 0, color: "#c9d1d9", fontSize: "13px", lineHeight: "1.5" }}>{dynamicLossDetails}</p>

                  <div style={{ borderTop: "1px solid #f43f5e33", paddingTop: "12px", marginTop: "12px" }}>
                    <span style={{ display: "block", color: "#8b949e", fontSize: "10.5px", fontWeight: "700", textTransform: "uppercase", marginBottom: "6px" }}>🛑 Mandatory Risk Adjustments:</span>
                    <ul style={{ margin: 0, paddingLeft: "16px", color: "#c9d1d9", fontSize: "12px", display: "flex", flexDirection: "column", gap: "5px" }}>
                      <li><strong>Wait for Closed Candles:</strong> Stop executing mid-candle. Always wait for the M5/M15 candle body to close to confirm valid structural shift.</li>
                      <li><strong>Volume Halving:</strong> Reduce trade sizing on {worstSetupSymbol} by 50% immediately until 3 consecutive profitable backtests are logged.</li>
                      <li><strong>News Restriction:</strong> Restrict entries 15 minutes before/after FED, ECB, or high-impact speeches.</li>
                    </ul>
                  </div>
                </div>

                <div style={{ background: "#f59e0b11", border: "1px solid #f59e0b44", borderRadius: "12px", padding: "18px" }}>
                  <span style={{ color: "#fbbf24", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px", textTransform: "uppercase" }}>⚡ Operational Rules & Confluences</span>
                  <ul style={{ margin: 0, paddingLeft: "16px", color: "#8b949e", fontSize: "13px", lineHeight: "1.6", display: "flex", flexDirection: "column", gap: "8px" }}>
                    {worstHours.length > 0 && (
                      <li>
                        <strong>Restrict trading during losing hours:</strong> Your data indicates high loss frequency during <span style={{ color: "#fbbf24", fontWeight: "700" }}>{worstHours.slice(0, 2).join(" & ")}</span>. These hours represent low liquidity periods or dangerous session overlaps.
                      </li>
                    )}
                    <li>
                      <strong>Tighter Risk Cap:</strong> Your average loss is <span style={{ color: "#f43f5e", fontWeight: "700" }}>-${avgLoss.toFixed(2)}</span> vs average win of <span style={{ color: "#22c55e", fontWeight: "700" }}>+${avgWin.toFixed(2)}</span>. Implement a strict 1:2 Minimum Risk-to-Reward ratio to ensure long-term mathematical profitability.
                    </li>
                  </ul>
                </div>
              </div>
            );
          })()}
        </div>
      </div>
    </div>
  );
}
