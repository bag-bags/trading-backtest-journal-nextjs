"use client";

import { useState, useEffect, useMemo } from "react";

// Mock data helper for historical monthly CPI values (past 12 months)
const INFLATION_DATA = {
  US: {
    history: [3.4, 3.3, 3.2, 3.1, 3.0, 2.9, 3.0, 3.1, 2.9, 2.8, 2.9, 3.0],
    lastMonth: 2.90
  },
  EU: {
    history: [2.8, 2.6, 2.5, 2.4, 2.4, 2.2, 2.5, 2.6, 2.4, 2.3, 2.2, 2.4],
    lastMonth: 2.20
  },
  UK: {
    history: [3.2, 3.0, 2.8, 2.3, 2.0, 2.0, 2.2, 2.3, 2.1, 1.9, 2.0, 2.2],
    lastMonth: 2.00
  }
};

// Interest rate histories
const INTEREST_RATE_DATA = {
  US: {
    history: [
      { date: "Jan 25", rate: 5.50 },
      { date: "Mar 25", rate: 5.50 },
      { date: "May 25", rate: 5.25 },
      { date: "Jul 25", rate: 5.25 },
      { date: "Sep 25", rate: 5.00 },
      { date: "Nov 25", rate: 4.75 },
      { date: "Dec 25", rate: 4.50 },
      { date: "Jan 26", rate: 4.50 }
    ],
    lastMonth: 4.75
  },
  EU: {
    history: [
      { date: "Jan 25", rate: 4.00 },
      { date: "Mar 25", rate: 3.75 },
      { date: "May 25", rate: 3.75 },
      { date: "Jul 25", rate: 3.50 },
      { date: "Sep 25", rate: 3.25 },
      { date: "Nov 25", rate: 3.00 },
      { date: "Dec 25", rate: 3.00 },
      { date: "Jan 26", rate: 2.75 }
    ],
    lastMonth: 3.00
  },
  UK: {
    history: [
      { date: "Jan 25", rate: 5.25 },
      { date: "Mar 25", rate: 5.00 },
      { date: "May 25", rate: 5.00 },
      { date: "Jul 25", rate: 4.75 },
      { date: "Sep 25", rate: 4.75 },
      { date: "Nov 25", rate: 4.50 },
      { date: "Dec 25", rate: 4.25 },
      { date: "Jan 26", rate: 4.25 }
    ],
    lastMonth: 4.50
  }
};

// Forex starting configurations
const FOREX_PAIRS = {
  "EUR/USD": { base: 1.0850, step: 0.0001, decimals: 4, unit: "" },
  "GBP/USD": { base: 1.2820, step: 0.0001, decimals: 4, unit: "" },
  "USD/CHF": { base: 0.8810, step: 0.0001, decimals: 4, unit: "" },
  "Gold/USD": { base: 2420.50, step: 0.4, decimals: 2, unit: " USD" }
};

// Economic Calendar Events
const ECONOMIC_CALENDAR_NEWS = [
  {
    id: 1,
    title: "FOMC Press Conference: Fed Chair Powell speaks on policy outlook",
    country: "US",
    time: "18:30",
    importance: "High",
    topic: "Interest Rates",
    details: "Fed Chairman Jerome Powell signals dovish posture, hinting at potential cuts if inflation approaches 2.0% target.",
    probableImpact: {
      asset: "Gold/USD & Indices",
      direction: "Bullish",
      explanation: "Dovish speech decreases bond yields, pushing money out of USD into Gold and US100/US30 equities."
    }
  },
  {
    id: 2,
    title: "ECB President Christine Lagarde speech on Eurozone economic outlook",
    country: "EU",
    time: "14:00",
    importance: "High",
    topic: "Central Bank Speeches",
    details: "President Lagarde emphasizes persistent services inflation, indicating rates may remain higher for longer.",
    probableImpact: {
      asset: "EUR/USD",
      direction: "Bullish",
      explanation: "Hawkish bias by ECB head supports Euro yields against foreign currencies in the short term."
    }
  },
  {
    id: 3,
    title: "US Federal Funds Rate & FOMC Statement Announcement",
    country: "US",
    time: "18:00",
    importance: "High",
    topic: "Interest Rates",
    details: "The Federal Reserve kept interest rates at 4.50% but the statement showed progress towards core CPI targets.",
    probableImpact: {
      asset: "EUR/USD & Gold",
      direction: "Highly Volatile",
      explanation: "Holding rates with a soft bias generally creates temporary dips in USD, allowing Gold to retest high liquidity."
    }
  },
  {
    id: 4,
    title: "ECB Refinancing Rate Decision & Policy Statement",
    country: "EU",
    time: "12:45",
    importance: "High",
    topic: "Interest Rates",
    details: "ECB announces 25bps rate cut down to 2.75%, aligning with market expectation.",
    probableImpact: {
      asset: "EUR/USD",
      direction: "Bearish / Neutral",
      explanation: "A pre-priced rate cut generally triggers a sell-the-news pullback in Euro value."
    }
  },
  {
    id: 5,
    title: "BOE Governor Andrew Bailey speaks on UK monetary policy stance",
    country: "UK",
    time: "10:30",
    importance: "High",
    topic: "Central Bank Speeches",
    details: "Governor Bailey expresses optimism about inflation dropping below BOE target, paving way for autumn rate cuts.",
    probableImpact: {
      asset: "GBP/USD",
      direction: "Bearish",
      explanation: "Indication of fast-tracked BOE cuts reduces pound sterling yield attractiveness."
    }
  },
  {
    id: 6,
    title: "US Core CPI Month-on-Month (Inflation Data)",
    country: "US",
    time: "13:30",
    importance: "High",
    topic: "Inflation",
    details: "US Core Consumer Price Index MoM came in at 0.1%, below the consensus estimate of 0.2%.",
    probableImpact: {
      asset: "Gold/USD & Indices",
      direction: "Strongly Bullish",
      explanation: "Lower CPI prints fuel rate-cut bets, triggering immediate buy flows in indices and safe havens."
    }
  }
];

export default function MiniChartsGrid() {
  // Chart 1: Inflation
  const [selectedInflationCountry, setSelectedInflationCountry] = useState("US");
  const [inflationLiveOffset, setInflationLiveOffset] = useState(0);

  // Chart 2: Forex Live
  const [selectedForexPair, setSelectedForexPair] = useState("EUR/USD");
  const [forexPrices, setForexPrices] = useState({});
  const [forexDirections, setForexDirections] = useState({});
  const [forexHistory, setForexHistory] = useState({});

  // Chart 3: Interest Rates
  const [selectedInterestCountry, setSelectedInterestCountry] = useState("US");
  const [interestPrices, setInterestPrices] = useState({ US: 4.50, EU: 2.75, UK: 4.25 });
  const [interestDirections, setInterestDirections] = useState({ US: "flat", EU: "flat", UK: "flat" });
  const [interestHistory, setInterestHistory] = useState({});

  // Chart 4: Economic Calendar News Feed
  const [newsFilterCountry, setNewsFilterCountry] = useState("ALL");

  // Timeframe selector states
  const [forexTimeframe, setForexTimeframe] = useState("30s");
  const [secondsCounter, setSecondsCounter] = useState(0);

  const TIMEFRAME_SECONDS = {
    "1s": 1,
    "30s": 30,
    "1m": 60,
    "5m": 300,
    "15m": 900,
    "1h": 3600,
    "4h": 14400
  };

  // Re-generate histories on timeframe change to keep price chart scaling realistic
  useEffect(() => {
    const nextHistory = {};
    const tfSec = TIMEFRAME_SECONDS[forexTimeframe] || 30;
    const volFactor = Math.sqrt(tfSec);

    // Forex Initial History
    Object.keys(FOREX_PAIRS).forEach(pair => {
      const conf = FOREX_PAIRS[pair];
      const startPrice = forexPrices[pair] || conf.base;
      const hist = [];
      let tempPrice = startPrice - (Math.random() - 0.5) * conf.step * 15 * volFactor;
      
      for (let i = 0; i < 60; i++) {
        tempPrice += (Math.random() - 0.5) * conf.step * 2 * volFactor;
        hist.push(parseFloat(tempPrice.toFixed(conf.decimals)));
      }
      nextHistory[pair] = hist;
    });

    // Interest Rates Initial History
    Object.keys(INTEREST_RATE_DATA).forEach(c => {
      const baseRate = INTEREST_RATE_DATA[c].history[INTEREST_RATE_DATA[c].history.length - 1].rate;
      const hist = [];
      let tempRate = baseRate - (Math.random() - 0.5) * 0.05 * volFactor;
      
      for (let i = 0; i < 60; i++) {
        tempRate += (Math.random() - 0.5) * 0.01 * volFactor;
        hist.push(parseFloat(tempRate.toFixed(2)));
      }
      nextHistory[c] = hist;
    });

    setForexHistory(nextHistory);
    setInterestHistory(nextHistory);
    setSecondsCounter(0);
  }, [forexTimeframe]);

  // Live Tickers Simulation interval (Updates every 1 second)
  useEffect(() => {
    const interval = setInterval(() => {
      setSecondsCounter(prev => prev + 1);

      // Forex Tickers
      setForexPrices(prevPrices => {
        const nextPrices = { ...prevPrices };
        const nextDirs = {};
        const nextHist = { ...forexHistory };
        const tfSec = TIMEFRAME_SECONDS[forexTimeframe] || 30;

        Object.keys(FOREX_PAIRS).forEach(pair => {
          const conf = FOREX_PAIRS[pair];
          const curr = prevPrices[pair] || conf.base;
          const change = (Math.random() - 0.5) * conf.step * 1.5 * Math.sqrt(tfSec);
          const next = parseFloat((curr + change).toFixed(conf.decimals));

          nextPrices[pair] = next;
          nextDirs[pair] = next > curr ? "up" : next < curr ? "down" : "flat";

          if (nextHist[pair] && nextHist[pair].length > 0) {
            const hist = [...nextHist[pair]];
            if ((secondsCounter + 1) % tfSec === 0) {
              nextHist[pair] = [...hist.slice(1), next];
            } else {
              hist[hist.length - 1] = next;
              nextHist[pair] = hist;
            }
          }
        });

        setForexDirections(nextDirs);
        setForexHistory(nextHist);
        return nextPrices;
      });

      // Interest Rate Tickers (fluctuates live like Forex)
      setInterestPrices(prevPrices => {
        const nextPrices = { ...prevPrices };
        const nextDirs = {};
        const nextHist = { ...interestHistory };
        const tfSec = TIMEFRAME_SECONDS[forexTimeframe] || 30;

        Object.keys(INTEREST_RATE_DATA).forEach(c => {
          const curr = prevPrices[c] || 4.50;
          const change = (Math.random() - 0.5) * 0.005 * Math.sqrt(tfSec);
          const next = parseFloat((curr + change).toFixed(2));

          nextPrices[c] = next;
          nextDirs[c] = next > curr ? "up" : next < curr ? "down" : "flat";

          if (nextHist[c] && nextHist[c].length > 0) {
            const hist = [...nextHist[c]];
            if ((secondsCounter + 1) % tfSec === 0) {
              nextHist[c] = [...hist.slice(1), next];
            } else {
              hist[hist.length - 1] = next;
              nextHist[c] = hist;
            }
          }
        });

        setInterestDirections(nextDirs);
        setInterestHistory(nextHist);
        return nextPrices;
      });

      // Minor fluctuations for live values of CPI
      setInflationLiveOffset((Math.random() - 0.5) * 0.02);
    }, 1000);

    return () => clearInterval(interval);
  }, [forexHistory, interestHistory, forexTimeframe, secondsCounter]);

  // SVG grid config
  const svgWidth = 300;
  const svgHeight = 90;
  const chartAreaWidth = 230; // leaves 70px on the right for Y-axis labels

  // CPI Live & Last Month comparisons
  const inflationStats = useMemo(() => {
    const data = INFLATION_DATA[selectedInflationCountry];
    const latestBase = data.history[data.history.length - 1];
    const liveVal = parseFloat((latestBase + inflationLiveOffset).toFixed(2));
    const lastMonth = data.lastMonth;
    const diff = parseFloat((liveVal - lastMonth).toFixed(2));
    return { liveVal, lastMonth, diff };
  }, [selectedInflationCountry, inflationLiveOffset]);

  // CPI Min/Max for Y-axis scaling
  const inflationMinMax = useMemo(() => {
    const data = [...INFLATION_DATA[selectedInflationCountry].history];
    data[data.length - 1] = inflationStats.liveVal;
    return { min: Math.min(...data) - 0.1, max: Math.max(...data) + 0.1 };
  }, [selectedInflationCountry, inflationStats.liveVal]);

  // CPI Line Coordinates
  const inflationPoints = useMemo(() => {
    const data = [...INFLATION_DATA[selectedInflationCountry].history];
    data[data.length - 1] = inflationStats.liveVal;
    const { min, max } = inflationMinMax;
    const range = max - min || 1;

    return data.map((val, index) => {
      const x = (index / (data.length - 1)) * chartAreaWidth + 10;
      const y = svgHeight - ((val - min) / range) * (svgHeight - 24) - 15;
      return { x, y, value: val };
    });
  }, [selectedInflationCountry, inflationStats.liveVal, inflationMinMax]);

  // Central Bank Rates Live & Last Month comparisons
  const interestStats = useMemo(() => {
    const liveVal = interestPrices[selectedInterestCountry] || 4.50;
    const lastMonth = INTEREST_RATE_DATA[selectedInterestCountry].lastMonth;
    const diff = parseFloat((liveVal - lastMonth).toFixed(2));
    const diffPct = parseFloat(((diff / lastMonth) * 100).toFixed(2));
    return { liveVal, lastMonth, diff, diffPct };
  }, [selectedInterestCountry, interestPrices]);

  // Min/Max of Interest History
  const interestMinMax = useMemo(() => {
    const data = interestHistory[selectedInterestCountry] || [];
    if (!data.length) return { min: 4.0, max: 5.0 };
    return { min: Math.min(...data), max: Math.max(...data) };
  }, [selectedInterestCountry, interestHistory]);

  // Stepped chart points replaced with rolling live points
  const interestPoints = useMemo(() => {
    const data = interestHistory[selectedInterestCountry] || [];
    if (!data.length) return [];
    const { min, max } = interestMinMax;
    const range = max - min || 0.01;

    return data.map((val, index) => {
      const x = (index / (data.length - 1)) * chartAreaWidth + 10;
      const y = svgHeight - ((val - min) / range) * (svgHeight - 24) - 15;
      return { x, y, value: val };
    });
  }, [selectedInterestCountry, interestHistory, interestMinMax]);

  const interestAreaPath = useMemo(() => {
    if (interestPoints.length < 2) return "";
    const first = interestPoints[0];
    const last = interestPoints[interestPoints.length - 1];
    const linePath = interestPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
    return `${linePath} L ${last.x} ${svgHeight - 10} L ${first.x} ${svgHeight - 10} Z`;
  }, [interestPoints]);

  // Min/Max of Forex History
  const forexMinMax = useMemo(() => {
    const data = forexHistory[selectedForexPair] || [];
    if (!data.length) return { min: 0, max: 0 };
    return { min: Math.min(...data), max: Math.max(...data) };
  }, [selectedForexPair, forexHistory]);

  // Enhanced Forex Area Chart Coordinates
  const forexPoints = useMemo(() => {
    const data = forexHistory[selectedForexPair] || [];
    if (!data.length) return [];
    const { min, max } = forexMinMax;
    const range = max - min || 0.0001;

    return data.map((val, index) => {
      const x = (index / (data.length - 1)) * chartAreaWidth + 10;
      const y = svgHeight - ((val - min) / range) * (svgHeight - 24) - 15;
      return { x, y, value: val };
    });
  }, [selectedForexPair, forexHistory, forexMinMax]);

  // Area path generator
  const forexAreaPath = useMemo(() => {
    if (forexPoints.length < 2) return "";
    const first = forexPoints[0];
    const last = forexPoints[forexPoints.length - 1];
    const linePath = forexPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "");
    return `${linePath} L ${last.x} ${svgHeight - 10} L ${first.x} ${svgHeight - 10} Z`;
  }, [forexPoints]);

  // Filtered news items
  const filteredNews = useMemo(() => {
    return ECONOMIC_CALENDAR_NEWS.filter(item => {
      if (newsFilterCountry === "ALL") return true;
      return item.country === newsFilterCountry;
    });
  }, [newsFilterCountry]);

  // Helper to format currency values or symbols on Y-axis
  const formatYValue = (val, type) => {
    if (type === "forex") {
      const conf = FOREX_PAIRS[selectedForexPair];
      if (selectedForexPair === "Gold/USD") {
        return `$${val.toFixed(2)}`;
      }
      return val.toFixed(conf.decimals);
    }
    return `${val.toFixed(2)}%`;
  };

  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "16px", marginBottom: "20px" }}>
      
      {/* CARD 1: Real-time Inflation Rate */}
      <div className="mini-chart-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>🎈</span>
            <span style={cardTitleStyle}>Real-time Inflation (CPI)</span>
            <span style={liveIndicatorStyle} className="pulse-indicator">● LIVE</span>
          </div>
          <div style={tabContainerStyle}>
            {["US", "EU", "UK"].map(c => (
              <button
                key={c}
                onClick={() => setSelectedInflationCountry(c)}
                style={selectedInflationCountry === c ? activeTabStyle : tabStyle}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* COMPARISON FIGURES SECTION */}
        <div style={comparisonGridStyle}>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Live Rate (t)</span>
            <strong style={{ fontSize: "17px", color: "#ffffff", display: "flex", alignItems: "center", gap: "4px" }}>
              {inflationStats.liveVal.toFixed(2)}%
              <span className="pulse-indicator" style={{ color: "var(--good)", fontSize: "12px" }}>●</span>
            </strong>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Last Month</span>
            <strong style={{ fontSize: "17px", color: "#e4e4e7" }}>
              {inflationStats.lastMonth.toFixed(2)}%
            </strong>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>MoM Change</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "800",
                color: inflationStats.diff >= 0 ? "var(--bad)" : "var(--good)"
              }}
            >
              {inflationStats.diff >= 0 ? `+${inflationStats.diff.toFixed(2)}%` : `${inflationStats.diff.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Inflation SVG Chart with Grid and Y-axis Labels */}
        <div style={{ flex: 1, position: "relative", minHeight: "85px", marginTop: "4px" }}>
          <svg width="100%" height="85" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            {/* Grid Lines */}
            <line x1="10" y1="15" x2={chartAreaWidth} y2="15" stroke="#1f1f23" strokeDasharray="3,3" />
            <line x1="10" y1="45" x2={chartAreaWidth} y2="45" stroke="#1f1f23" strokeDasharray="3,3" />
            <line x1="10" y1="75" x2={chartAreaWidth} y2="75" stroke="#1f1f23" strokeDasharray="3,3" />
            
            {/* Y-Axis Value Labels */}
            <text x={chartAreaWidth + 8} y="18" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue(inflationMinMax.max, "inflation")}
            </text>
            <text x={chartAreaWidth + 8} y="48" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue((inflationMinMax.max + inflationMinMax.min) / 2, "inflation")}
            </text>
            <text x={chartAreaWidth + 8} y="78" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue(inflationMinMax.min, "inflation")}
            </text>

            <path
              d={inflationPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")}
              fill="none"
              stroke="#a3e635"
              strokeWidth="2"
            />
            {inflationPoints.length > 0 && (
              <circle
                cx={inflationPoints[inflationPoints.length - 1].x}
                cy={inflationPoints[inflationPoints.length - 1].y}
                r="4"
                fill="#a3e635"
                className="glowing-dot"
              />
            )}
          </svg>
        </div>
        <div style={{ display: "flex", width: `${chartAreaWidth}px`, justifyContent: "space-between", fontSize: "9px", color: "var(--muted)", marginTop: "4px" }}>
          <span>12 Months Ago</span>
          <span>Current (t)</span>
        </div>
      </div>

      {/* CARD 2: Forex & Gold Live Prices */}
      <div className="mini-chart-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>📈</span>
            <span style={cardTitleStyle}>Live Forex & Metals</span>
            <span style={liveIndicatorStyle} className="pulse-indicator">● {forexTimeframe.toUpperCase()}</span>
          </div>
          <div style={tabContainerStyle}>
            {Object.keys(FOREX_PAIRS).map(p => {
              const dir = forexDirections[p];
              const color = dir === "up" ? "var(--good)" : dir === "down" ? "var(--bad)" : "var(--muted)";
              return (
                <button
                  key={p}
                  onClick={() => setSelectedForexPair(p)}
                  style={{
                    ...(selectedForexPair === p ? activeTabStyle : tabStyle),
                    color: selectedForexPair === p ? "#ffffff" : color,
                    borderBottom: selectedForexPair === p ? `2px solid ${color}` : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {p.split("/")[0]}
                </button>
              );
            })}
          </div>
        </div>

        {/* Timeframe Selector Row */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", background: "#161619", padding: "4px 8px", borderRadius: "6px", border: "1px solid #222225" }}>
          <span style={{ fontSize: "10.5px", color: "var(--muted)", fontWeight: "600" }}>Timeframe:</span>
          <div style={tabContainerStyle} className="timeframe-tabs">
            {["1s", "30s", "1m", "5m", "15m", "1h", "4h"].map(tf => (
              <button
                key={tf}
                onClick={() => setForexTimeframe(tf)}
                style={{
                  ...tabStyle,
                  ...(forexTimeframe === tf ? activeTabStyle : {}),
                  padding: "3px 6px",
                  fontSize: "9px"
                }}
              >
                {tf}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
          <div>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>
              {forexPrices[selectedForexPair]?.toFixed(FOREX_PAIRS[selectedForexPair].decimals) || "..."}
            </span>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                marginLeft: "8px",
                color: forexDirections[selectedForexPair] === "up" ? "var(--good)" : forexDirections[selectedForexPair] === "down" ? "var(--bad)" : "var(--muted)"
              }}
            >
              {forexDirections[selectedForexPair] === "up" ? "▲ TICK UP" : forexDirections[selectedForexPair] === "down" ? "▼ TICK DOWN" : "■ FLAT"}
            </span>
          </div>
          <span
            style={{
              fontSize: "11px",
              color: forexDirections[selectedForexPair] === "up" ? "var(--good)" : forexDirections[selectedForexPair] === "down" ? "var(--bad)" : "var(--muted)",
              fontWeight: "800",
              transition: "color 0.15s ease"
            }}
          >
            {selectedForexPair}
          </span>
        </div>

        {/* Forex SVG Chart with Grid and Y-axis Labels */}
        <div style={{ flex: 1, position: "relative", minHeight: "85px" }}>
          <svg width="100%" height="85" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="forexAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="10" y1="15" x2={chartAreaWidth} y2="15" stroke="#1c1c22" strokeWidth="0.5" />
            <line x1="10" y1="45" x2={chartAreaWidth} y2="45" stroke="#1c1c22" strokeWidth="0.5" />
            <line x1="10" y1="75" x2={chartAreaWidth} y2="75" stroke="#1c1c22" strokeWidth="0.5" />

            {/* Y-Axis Value Labels */}
            <text x={chartAreaWidth + 8} y="18" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue(forexMinMax.max, "forex")}
            </text>
            <text x={chartAreaWidth + 8} y="48" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue((forexMinMax.max + forexMinMax.min) / 2, "forex")}
            </text>
            <text x={chartAreaWidth + 8} y="78" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue(forexMinMax.min, "forex")}
            </text>

            {/* Area Path */}
            {forexPoints.length > 0 && (
              <path d={forexAreaPath} fill="url(#forexAreaGrad)" />
            )}

            {/* Line Path */}
            <path
              d={forexPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />

            {/* Live Ticking Horizontal Guideline */}
            {forexPoints.length > 0 && (
              <>
                <line
                  x1="10"
                  y1={forexPoints[forexPoints.length - 1].y}
                  x2={chartAreaWidth}
                  y2={forexPoints[forexPoints.length - 1].y}
                  stroke="rgba(56, 189, 248, 0.4)"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                />
                <circle
                  cx={forexPoints[forexPoints.length - 1].x}
                  cy={forexPoints[forexPoints.length - 1].y}
                  r="4.5"
                  fill="#38bdf8"
                  style={{ filter: "drop-shadow(0 0 3px #38bdf8)" }}
                />
              </>
            )}
          </svg>
        </div>
        <div style={{ display: "flex", width: `${chartAreaWidth}px`, justifyContent: "space-between", fontSize: "9px", color: "var(--muted)", marginTop: "2px" }}>
          {forexTimeframe === "1s" && (
            <>
              <span>-60s</span>
              <span>-30s</span>
              <span>Now (1s)</span>
            </>
          )}
          {forexTimeframe === "30s" && (
            <>
              <span>-30m</span>
              <span>-15m</span>
              <span>Now (30s)</span>
            </>
          )}
          {forexTimeframe === "1m" && (
            <>
              <span>-60m</span>
              <span>-30m</span>
              <span>Now (1m)</span>
            </>
          )}
          {forexTimeframe === "5m" && (
            <>
              <span>-5h</span>
              <span>-2.5h</span>
              <span>Now (5m)</span>
            </>
          )}
          {forexTimeframe === "15m" && (
            <>
              <span>-15h</span>
              <span>-7.5h</span>
              <span>Now (15m)</span>
            </>
          )}
          {forexTimeframe === "1h" && (
            <>
              <span>-60h</span>
              <span>-30h</span>
              <span>Now (1h)</span>
            </>
          )}
          {forexTimeframe === "4h" && (
            <>
              <span>-10d</span>
              <span>-5d</span>
              <span>Now (4h)</span>
            </>
          )}
        </div>
      </div>

      {/* CARD 3: Central Bank Interest Rates */}
      <div className="mini-chart-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>🏛️</span>
            <span style={cardTitleStyle}>Interest Rates (FED/ECB/BOE)</span>
            <span style={liveIndicatorStyle} className="pulse-indicator">● {forexTimeframe.toUpperCase()}</span>
          </div>
          <div style={tabContainerStyle}>
            {["US", "EU", "UK"].map(c => {
              const dir = interestDirections[c];
              const color = dir === "up" ? "var(--good)" : dir === "down" ? "var(--bad)" : "var(--muted)";
              return (
                <button
                  key={c}
                  onClick={() => setSelectedInterestCountry(c)}
                  style={{
                    ...(selectedInterestCountry === c ? activeTabStyle : tabStyle),
                    color: selectedInterestCountry === c ? "#ffffff" : color,
                    borderBottom: selectedInterestCountry === c ? `2px solid ${color}` : "none",
                    transition: "all 0.15s ease"
                  }}
                >
                  {c}
                </button>
              );
            })}
          </div>
        </div>

        {/* COMPARISON FIGURES SECTION */}
        <div style={comparisonGridStyle}>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Live Rate (t)</span>
            <strong
              style={{
                fontSize: "17px",
                color: interestDirections[selectedInterestCountry] === "up" ? "var(--good)" : interestDirections[selectedInterestCountry] === "down" ? "var(--bad)" : "#ffffff",
                display: "flex",
                alignItems: "center",
                gap: "4px",
                transition: "color 0.15s ease"
              }}
            >
              {interestStats.liveVal.toFixed(2)}%
              <span className="pulse-indicator" style={{ fontSize: "12px" }}>●</span>
            </strong>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>Last Month</span>
            <strong style={{ fontSize: "17px", color: "#e4e4e7" }}>
              {interestStats.lastMonth.toFixed(2)}%
            </strong>
          </div>
          <div style={statBoxStyle}>
            <span style={statLabelStyle}>MoM Change</span>
            <span
              style={{
                fontSize: "14px",
                fontWeight: "800",
                color: interestStats.diff > 0 ? "var(--good)" : interestStats.diff < 0 ? "var(--bad)" : "var(--muted)"
              }}
            >
              {interestStats.diff > 0 ? `+${interestStats.diff.toFixed(2)}%` : `${interestStats.diff.toFixed(2)}%`}
            </span>
          </div>
        </div>

        {/* Dynamic Status bar showing TICK details */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "6px" }}>
          <div>
            <span
              style={{
                fontSize: "11px",
                fontWeight: "700",
                color: interestDirections[selectedInterestCountry] === "up" ? "var(--good)" : interestDirections[selectedInterestCountry] === "down" ? "var(--bad)" : "var(--muted)"
              }}
            >
              {interestDirections[selectedInterestCountry] === "up" ? `▲ TICK UP (+${interestStats.diffPct.toFixed(2)}%)` : interestDirections[selectedInterestCountry] === "down" ? `▼ TICK DOWN (${interestStats.diffPct.toFixed(2)}%)` : "■ FLAT"}
            </span>
          </div>
          <span
            style={{
              fontSize: "11px",
              color: interestDirections[selectedInterestCountry] === "up" ? "var(--good)" : interestDirections[selectedInterestCountry] === "down" ? "var(--bad)" : "var(--muted)",
              fontWeight: "800",
              transition: "color 0.15s ease"
            }}
          >
            {selectedInterestCountry === "US" ? "FED Fund Rate" : selectedInterestCountry === "EU" ? "Refinancing Rate" : "BOE Bank Rate"}
          </span>
        </div>

        {/* Interest Rates SVG Chart with Grid and Y-axis Labels */}
        <div style={{ flex: 1, position: "relative", minHeight: "85px" }}>
          <svg width="100%" height="85" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <defs>
              <linearGradient id="interestAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid Lines */}
            <line x1="10" y1="15" x2={chartAreaWidth} y2="15" stroke="#1c1c22" strokeWidth="0.5" />
            <line x1="10" y1="45" x2={chartAreaWidth} y2="45" stroke="#1c1c22" strokeWidth="0.5" />
            <line x1="10" y1="75" x2={chartAreaWidth} y2="75" stroke="#1c1c22" strokeWidth="0.5" />

            {/* Y-Axis Value Labels */}
            <text x={chartAreaWidth + 8} y="18" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue(interestMinMax.max, "interest")}
            </text>
            <text x={chartAreaWidth + 8} y="48" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue((interestMinMax.max + interestMinMax.min) / 2, "interest")}
            </text>
            <text x={chartAreaWidth + 8} y="78" fill="var(--muted)" fontSize="9" fontWeight="600">
              {formatYValue(interestMinMax.min, "interest")}
            </text>

            {/* Area Path */}
            {interestPoints.length > 0 && (
              <path d={interestAreaPath} fill="url(#interestAreaGrad)" />
            )}

            {/* Line Path */}
            <path
              d={interestPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
            />

            {/* Live Ticking Horizontal Guideline */}
            {interestPoints.length > 0 && (
              <>
                <line
                  x1="10"
                  y1={interestPoints[interestPoints.length - 1].y}
                  x2={chartAreaWidth}
                  y2={interestPoints[interestPoints.length - 1].y}
                  stroke="rgba(251, 191, 36, 0.4)"
                  strokeDasharray="2,2"
                  strokeWidth="1"
                />
                <circle
                  cx={interestPoints[interestPoints.length - 1].x}
                  cy={interestPoints[interestPoints.length - 1].y}
                  r="4.5"
                  fill="#fbbf24"
                  style={{ filter: "drop-shadow(0 0 3px #fbbf24)" }}
                />
              </>
            )}
          </svg>
        </div>
        <div style={{ display: "flex", width: `${chartAreaWidth}px`, justifyContent: "space-between", fontSize: "9px", color: "var(--muted)", marginTop: "2px" }}>
          {forexTimeframe === "1s" && (
            <>
              <span>-60s</span>
              <span>-30s</span>
              <span>Now (1s)</span>
            </>
          )}
          {forexTimeframe === "30s" && (
            <>
              <span>-30m</span>
              <span>-15m</span>
              <span>Now (30s)</span>
            </>
          )}
          {forexTimeframe === "1m" && (
            <>
              <span>-60m</span>
              <span>-30m</span>
              <span>Now (1m)</span>
            </>
          )}
          {forexTimeframe === "5m" && (
            <>
              <span>-5h</span>
              <span>-2.5h</span>
              <span>Now (5m)</span>
            </>
          )}
          {forexTimeframe === "15m" && (
            <>
              <span>-15h</span>
              <span>-7.5h</span>
              <span>Now (15m)</span>
            </>
          )}
          {forexTimeframe === "1h" && (
            <>
              <span>-60h</span>
              <span>-30h</span>
              <span>Now (1h)</span>
            </>
          )}
          {forexTimeframe === "4h" && (
            <>
              <span>-10d</span>
              <span>-5d</span>
              <span>Now (4h)</span>
            </>
          )}
        </div>
      </div>

      {/* CARD 4: Economic Calendar News Feed */}
      <div className="mini-chart-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>📅</span>
            <span style={cardTitleStyle}>Economic Calendar Feed</span>
          </div>
          <div style={tabContainerStyle}>
            {["ALL", "US", "EU", "UK"].map(c => (
              <button
                key={c}
                onClick={() => setNewsFilterCountry(c)}
                style={newsFilterCountry === c ? activeTabStyle : tabStyle}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div className="custom-news-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", height: "145px", paddingRight: "4px" }}>
          {filteredNews.map(item => (
            <div
              key={item.id}
              style={{
                background: "#161619",
                borderLeft: `3px solid ${item.country === "US" ? "#38bdf8" : item.country === "EU" ? "#a3e635" : "#fbbf24"}`,
                padding: "8px",
                borderRadius: "4px",
                fontSize: "11px",
                display: "flex",
                flexDirection: "column",
                gap: "3px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "700", color: "#ffffff" }}>
                  {item.country === "US" ? "🇺🇸" : item.country === "EU" ? "🇪🇺" : "🇬🇧"} {item.time}
                </span>
                <span
                  style={{
                    fontSize: "8.5px",
                    background: "rgba(244,63,94,0.12)",
                    color: "var(--bad)",
                    padding: "1px 5px",
                    borderRadius: "3px",
                    fontWeight: "800"
                  }}
                >
                  HIGH IMPACT
                </span>
              </div>
              <div style={{ color: "#e4e4e7", fontWeight: "600", fontSize: "11px", lineHeight: "1.3" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "9.5px", color: "var(--muted)", fontStyle: "italic", marginTop: "2px" }}>
                <strong>Impact target:</strong> {item.probableImpact.asset} ({item.probableImpact.direction})
                <div style={{ color: "#a1a1aa", fontSize: "9px", marginTop: "2.5px", lineHeight: "1.2", fontStyle: "normal" }}>
                  {item.probableImpact.explanation}
                </div>
              </div>
            </div>
          ))}
          {filteredNews.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "11.5px", padding: "24px 0" }}>
              No important news events matching filters.
            </div>
          )}
        </div>
      </div>
      
      {/* CSS details injected for keyframe animations & scrollbar */}
      <style jsx global>{`
        .pulse-indicator {
          animation: pulse 1.8s infinite;
        }
        @keyframes pulse {
          0% { opacity: 0.3; }
          50% { opacity: 1; }
          100% { opacity: 0.3; }
        }
        .glowing-dot {
          animation: glow 1.5s infinite alternate;
        }
        @keyframes glow {
          from { filter: drop-shadow(0 0 1px #a3e635); }
          to { filter: drop-shadow(0 0 4px #a3e635); }
        }
        /* Custom scrollbar for news hub */
        .custom-news-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-news-scrollbar::-webkit-scrollbar-track {
          background: #111113;
        }
        .custom-news-scrollbar::-webkit-scrollbar-thumb {
          background: #27272a;
          border-radius: 4px;
        }
        .custom-news-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #38bdf8;
        }
      `}</style>
    </div>
  );
}

// Styling definitions
const cardStyle = {
  background: "var(--panel)",
  border: "1px solid var(--line)",
  borderRadius: "10px",
  padding: "16px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "space-between",
  minHeight: "240px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  transition: "all 0.25s ease"
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "10px",
  flexWrap: "wrap",
  gap: "6px"
};

const cardTitleStyle = {
  fontSize: "12px",
  fontWeight: "700",
  color: "var(--muted)",
  textTransform: "uppercase",
  letterSpacing: "0.5px"
};

const liveIndicatorStyle = {
  fontSize: "9px",
  color: "var(--good)",
  fontWeight: "800",
  background: "rgba(163, 230, 53, 0.1)",
  padding: "2px 6px",
  borderRadius: "4px"
};

const tabContainerStyle = {
  display: "flex",
  background: "#17171a",
  padding: "2px",
  borderRadius: "6px",
  border: "1px solid #222225"
};

const tabStyle = {
  background: "transparent",
  border: "none",
  color: "var(--muted)",
  padding: "3px 8px",
  borderRadius: "4px",
  fontSize: "10px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "all 0.15s ease"
};

const activeTabStyle = {
  ...tabStyle,
  background: "#27272a",
  color: "#ffffff"
};

const comparisonGridStyle = {
  display: "grid",
  gridTemplateColumns: "repeat(3, 1fr)",
  gap: "8px",
  background: "#161619",
  borderRadius: "6px",
  padding: "8px",
  marginBottom: "6px",
  border: "1px solid #222225"
};

const statBoxStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "2px"
};

const statLabelStyle = {
  fontSize: "9.5px",
  color: "var(--muted)",
  textTransform: "uppercase",
  fontWeight: "600"
};
