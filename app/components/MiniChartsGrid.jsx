"use client";

import { useState, useEffect, useMemo } from "react";

// Mock data helper for historical inflation CPI values (past 12 months)
const INFLATION_DATA = {
  US: [3.4, 3.3, 3.2, 3.1, 3.0, 2.9, 3.0, 3.1, 2.9, 2.8, 2.9, 3.0],
  EU: [2.8, 2.6, 2.5, 2.4, 2.4, 2.2, 2.5, 2.6, 2.4, 2.3, 2.2, 2.4],
  UK: [3.2, 3.0, 2.8, 2.3, 2.0, 2.0, 2.2, 2.3, 2.1, 1.9, 2.0, 2.2]
};

// Interest rate timelines for step chart
const INTEREST_RATE_HISTORY = {
  US: [
    { date: "Jan 25", rate: 5.50 },
    { date: "Mar 25", rate: 5.50 },
    { date: "May 25", rate: 5.25 },
    { date: "Jul 25", rate: 5.25 },
    { date: "Sep 25", rate: 5.00 },
    { date: "Nov 25", rate: 4.75 },
    { date: "Dec 25", rate: 4.50 },
    { date: "Jan 26", rate: 4.50 }
  ],
  EU: [
    { date: "Jan 25", rate: 4.00 },
    { date: "Mar 25", rate: 3.75 },
    { date: "May 25", rate: 3.75 },
    { date: "Jul 25", rate: 3.50 },
    { date: "Sep 25", rate: 3.25 },
    { date: "Nov 25", rate: 3.00 },
    { date: "Dec 25", rate: 3.00 },
    { date: "Jan 26", rate: 2.75 }
  ],
  UK: [
    { date: "Jan 25", rate: 5.25 },
    { date: "Mar 25", rate: 5.00 },
    { date: "May 25", rate: 5.00 },
    { date: "Jul 25", rate: 4.75 },
    { date: "Sep 25", rate: 4.75 },
    { date: "Nov 25", rate: 4.50 },
    { date: "Dec 25", rate: 4.25 },
    { date: "Jan 26", rate: 4.25 }
  ]
};

// Forex starting prices and configurations
const FOREX_PAIRS = {
  "EUR/USD": { base: 1.0850, step: 0.0003, decimals: 4 },
  "GBP/USD": { base: 1.2820, step: 0.0004, decimals: 4 },
  "USD/CHF": { base: 0.8810, step: 0.0003, decimals: 4 },
  "Gold/USD": { base: 2420.50, step: 1.2, decimals: 2 }
};

// Economic Calendar Events from Investing.com with country codes and impact assessment
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
  // Chart 1 States: Inflation
  const [selectedInflationCountry, setSelectedInflationCountry] = useState("US");
  const [inflationLiveOffset, setInflationLiveOffset] = useState(0);

  // Chart 2 States: Forex Live
  const [selectedForexPair, setSelectedForexPair] = useState("EUR/USD");
  const [forexPrices, setForexPrices] = useState({});
  const [forexDirections, setForexDirections] = useState({}); // 'up', 'down', 'flat'
  const [forexHistory, setForexHistory] = useState({}); // pair -> array of last 15 prices

  // Chart 3 States: Interest Rates
  const [selectedInterestCountry, setSelectedInterestCountry] = useState("US");

  // Chart 4 States: Economic Calendar News Feed
  const [newsFilterCountry, setNewsFilterCountry] = useState("ALL");

  // Init Forex Prices & Histories
  useEffect(() => {
    const initialPrices = {};
    const initialHistory = {};
    Object.keys(FOREX_PAIRS).forEach(pair => {
      const conf = FOREX_PAIRS[pair];
      initialPrices[pair] = conf.base;
      // Pre-fill history with dummy trending points
      const hist = [];
      for (let i = 0; i < 15; i++) {
        hist.push(conf.base + (Math.random() - 0.5) * conf.step * 4);
      }
      initialHistory[pair] = hist;
    });
    setForexPrices(initialPrices);
    setForexHistory(initialHistory);

    // Live Tickers Simulation interval
    const interval = setInterval(() => {
      setForexPrices(prevPrices => {
        const nextPrices = { ...prevPrices };
        const nextDirs = {};
        const nextHist = { ...forexHistory };

        Object.keys(FOREX_PAIRS).forEach(pair => {
          const conf = FOREX_PAIRS[pair];
          const curr = prevPrices[pair] || conf.base;
          const change = (Math.random() - 0.5) * conf.step;
          const next = parseFloat((curr + change).toFixed(conf.decimals));

          nextPrices[pair] = next;
          nextDirs[pair] = next > curr ? "up" : next < curr ? "down" : "flat";

          // Update History
          if (nextHist[pair]) {
            const updated = [...nextHist[pair].slice(1), next];
            nextHist[pair] = updated;
          }
        });

        setForexDirections(nextDirs);
        setForexHistory(nextHist);
        return nextPrices;
      });

      // Fluctuate live inflation slightly for UI feedback
      setInflationLiveOffset((Math.random() - 0.5) * 0.05);
    }, 1000);

    return () => clearInterval(interval);
  }, [forexHistory]);

  // SVG dimensions
  const svgWidth = 260;
  const svgHeight = 90;

  // Chart calculations for Inflation Tracker
  const inflationPoints = useMemo(() => {
    const data = [...INFLATION_DATA[selectedInflationCountry]];
    if (data.length > 0) {
      // Apply the live offset to the latest month's data
      data[data.length - 1] = parseFloat((data[data.length - 1] + inflationLiveOffset).toFixed(2));
    }
    const min = Math.min(...data) - 0.2;
    const max = Math.max(...data) + 0.2;
    const range = max - min || 1;

    return data.map((val, index) => {
      const x = (index / (data.length - 1)) * (svgWidth - 20) + 10;
      const y = svgHeight - ((val - min) / range) * (svgHeight - 20) - 10;
      return { x, y, value: val };
    });
  }, [selectedInflationCountry, inflationLiveOffset]);

  // Chart calculations for Forex live price history
  const forexPoints = useMemo(() => {
    const data = forexHistory[selectedForexPair] || [];
    if (!data.length) return [];
    const min = Math.min(...data);
    const max = Math.max(...data);
    const range = max - min || 0.0001;

    return data.map((val, index) => {
      const x = (index / (data.length - 1)) * (svgWidth - 20) + 10;
      const y = svgHeight - ((val - min) / range) * (svgHeight - 15) - 7;
      return { x, y, value: val };
    });
  }, [selectedForexPair, forexHistory]);

  // Chart calculations for Interest rates stepped history
  const interestPoints = useMemo(() => {
    const data = INTEREST_RATE_HISTORY[selectedInterestCountry];
    const rates = data.map(d => d.rate);
    const min = Math.min(...rates) - 0.5;
    const max = Math.max(...rates) + 0.5;
    const range = max - min || 1;

    const points = [];
    data.forEach((d, index) => {
      const x = (index / (data.length - 1)) * (svgWidth - 30) + 15;
      const y = svgHeight - ((d.rate - min) / range) * (svgHeight - 30) - 15;
      points.push({ x, y, ...d });
    });
    return points;
  }, [selectedInterestCountry]);

  // Generate step line path for interest rates
  const interestStepPath = useMemo(() => {
    if (interestPoints.length < 2) return "";
    let d = `M ${interestPoints[0].x} ${interestPoints[0].y}`;
    for (let i = 1; i < interestPoints.length; i++) {
      // Move horizontally to next x, then vertically to next y (step effect)
      d += ` H ${interestPoints[i].x} V ${interestPoints[i].y}`;
    }
    return d;
  }, [interestPoints]);

  // Filtered economic calendar news items (limit to 3)
  const filteredNews = useMemo(() => {
    return ECONOMIC_CALENDAR_NEWS.filter(item => {
      if (newsFilterCountry === "ALL") return true;
      return item.country === newsFilterCountry;
    }).slice(0, 3);
  }, [newsFilterCountry]);

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

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
          <div>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>
              {inflationPoints[inflationPoints.length - 1]?.value.toFixed(2)}%
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "6px" }}>
              Year-over-Year
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--good)", fontWeight: "600" }}>
            CPI Index Print
          </span>
        </div>

        <div style={{ flex: 1, position: "relative", minHeight: "90px" }}>
          <svg width="100%" height="90" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            {/* Grid helper lines */}
            <line x1="0" y1="15" x2={svgWidth} y2="15" stroke="#1f1f23" strokeDasharray="3,3" />
            <line x1="0" y1="45" x2={svgWidth} y2="45" stroke="#1f1f23" strokeDasharray="3,3" />
            <line x1="0" y1="75" x2={svgWidth} y2="75" stroke="#1f1f23" strokeDasharray="3,3" />
            
            {/* Smooth SVG Path for line */}
            <path
              d={inflationPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")}
              fill="none"
              stroke="#a3e635"
              strokeWidth="2"
            />
            {/* Dot at latest point */}
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
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--muted)", marginTop: "4px" }}>
          <span>12 Months Ago</span>
          <span>Current</span>
        </div>
      </div>

      {/* CARD 2: Forex & Gold Live Prices */}
      <div className="mini-chart-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>📈</span>
            <span style={cardTitleStyle}>Live Forex & Metals</span>
          </div>
          <div style={tabContainerStyle}>
            {Object.keys(FOREX_PAIRS).map(p => (
              <button
                key={p}
                onClick={() => setSelectedForexPair(p)}
                style={selectedForexPair === p ? activeTabStyle : tabStyle}
              >
                {p.split("/")[0]}
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
                color: forexDirections[selectedForexPair] === "up" ? "var(--good)" : forexDirections[selectedForexPair] === "down" ? "var(--bad)" : "var(--muted)",
                transition: "color 0.2s"
              }}
            >
              {forexDirections[selectedForexPair] === "up" ? "▲ TICK UP" : forexDirections[selectedForexPair] === "down" ? "▼ TICK DOWN" : "■ FLAT"}
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>{selectedForexPair}</span>
        </div>

        <div style={{ flex: 1, position: "relative", minHeight: "90px" }}>
          <svg width="100%" height="90" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <line x1="0" y1="15" x2={svgWidth} y2="15" stroke="#1f1f23" strokeDasharray="3,3" />
            <line x1="0" y1="45" x2={svgWidth} y2="45" stroke="#1f1f23" strokeDasharray="3,3" />
            <line x1="0" y1="75" x2={svgWidth} y2="75" stroke="#1f1f23" strokeDasharray="3,3" />

            <path
              d={forexPoints.reduce((acc, p, i) => `${acc} ${i === 0 ? "M" : "L"} ${p.x} ${p.y}`, "")}
              fill="none"
              stroke="#38bdf8"
              strokeWidth="2"
            />
            {forexPoints.length > 0 && (
              <circle
                cx={forexPoints[forexPoints.length - 1].x}
                cy={forexPoints[forexPoints.length - 1].y}
                r="4"
                fill="#38bdf8"
              />
            )}
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--muted)", marginTop: "4px" }}>
          <span>Recent activity</span>
          <span className="pulse-indicator">Live ticking</span>
        </div>
      </div>

      {/* CARD 3: Central Bank Interest Rates */}
      <div className="mini-chart-card" style={cardStyle}>
        <div style={cardHeaderStyle}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ fontSize: "16px" }}>🏛️</span>
            <span style={cardTitleStyle}>Interest Rates (FED/ECB/BOE)</span>
          </div>
          <div style={tabContainerStyle}>
            {["US", "EU", "UK"].map(c => (
              <button
                key={c}
                onClick={() => setSelectedInterestCountry(c)}
                style={selectedInterestCountry === c ? activeTabStyle : tabStyle}
              >
                {c}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "8px" }}>
          <div>
            <span style={{ fontSize: "20px", fontWeight: "800", color: "#ffffff" }}>
              {INTEREST_RATE_HISTORY[selectedInterestCountry][INTEREST_RATE_HISTORY[selectedInterestCountry].length - 1].rate.toFixed(2)}%
            </span>
            <span style={{ fontSize: "11px", color: "var(--muted)", marginLeft: "6px" }}>
              Policy Rate
            </span>
          </div>
          <span style={{ fontSize: "11px", color: "var(--muted)" }}>
            {selectedInterestCountry === "US" ? "FED Fund Rate" : selectedInterestCountry === "EU" ? "Refinancing Rate" : "Official Bank Rate"}
          </span>
        </div>

        <div style={{ flex: 1, position: "relative", minHeight: "90px" }}>
          <svg width="100%" height="90" viewBox={`0 0 ${svgWidth} ${svgHeight}`} preserveAspectRatio="none">
            <line x1="0" y1="15" x2={svgWidth} y2="15" stroke="#1f1f23" strokeDasharray="3,3" />
            <line x1="0" y1="45" x2={svgWidth} y2="45" stroke="#1f1f23" strokeDasharray="3,3" />
            <line x1="0" y1="75" x2={svgWidth} y2="75" stroke="#1f1f23" strokeDasharray="3,3" />

            <path
              d={interestStepPath}
              fill="none"
              stroke="#fbbf24"
              strokeWidth="2"
            />
            {interestPoints.map((p, i) => (
              <circle
                key={i}
                cx={p.x}
                cy={p.y}
                r="3"
                fill="#fbbf24"
                style={{ cursor: "pointer" }}
                title={`${p.date}: ${p.rate}%`}
              />
            ))}
          </svg>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "var(--muted)", marginTop: "4px" }}>
          <span>{INTEREST_RATE_HISTORY[selectedInterestCountry][0].date}</span>
          <span>{INTEREST_RATE_HISTORY[selectedInterestCountry][INTEREST_RATE_HISTORY[selectedInterestCountry].length - 1].date}</span>
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

        <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", flex: 1, paddingRight: "2px" }}>
          {filteredNews.map(item => (
            <div
              key={item.id}
              style={{
                background: "#161619",
                borderLeft: `3px solid ${item.country === "US" ? "#38bdf8" : item.country === "EU" ? "#a3e635" : "#fbbf24"}`,
                padding: "6px 8px",
                borderRadius: "4px",
                fontSize: "11px",
                display: "flex",
                flexDirection: "column",
                gap: "2px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "700", color: "#ffffff" }}>
                  {item.country === "US" ? "🇺🇸" : item.country === "EU" ? "🇪🇺" : "🇬🇧"} {item.time}
                </span>
                <span
                  style={{
                    fontSize: "8px",
                    background: "rgba(244,63,94,0.15)",
                    color: "var(--bad)",
                    padding: "1px 4px",
                    borderRadius: "3px",
                    fontWeight: "800"
                  }}
                >
                  HIGH IMPACT
                </span>
              </div>
              <div style={{ color: "#e4e4e7", fontWeight: "500", fontSize: "11px", lineHeight: "1.3" }}>
                {item.title}
              </div>
              <div style={{ fontSize: "9.5px", color: "var(--muted)", fontStyle: "italic", marginTop: "2px" }}>
                <strong>Impact target:</strong> {item.probableImpact.asset} ({item.probableImpact.direction})
                <div style={{ color: "#a1a1aa", fontSize: "9px", marginTop: "1px", lineHeight: "1.2", fontStyle: "normal" }}>
                  {item.probableImpact.explanation}
                </div>
              </div>
            </div>
          ))}
          {filteredNews.length === 0 && (
            <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "11px", padding: "16px 0" }}>
              No important news events matching filters.
            </div>
          )}
        </div>
      </div>
      
      {/* CSS details injected for keyframe animations (like pulse indicator and dots) */}
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
  minHeight: "220px",
  boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  transition: "all 0.25s ease"
};

const cardHeaderStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginBottom: "12px",
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
