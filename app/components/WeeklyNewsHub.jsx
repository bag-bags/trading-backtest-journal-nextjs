"use client";

import { useEffect, useState } from "react";

// Impact color mapping
const impactColors = {
  "🔴 Extreme High Impact": { bg: "#f43f5e18", border: "#f43f5e44", text: "#f43f5e", glow: "0 0 20px #f43f5e22" },
  "🔴 High Impact": { bg: "#f9731618", border: "#f9731644", text: "#f97316", glow: "0 0 20px #f9731622" },
  "🟠 High Impact": { bg: "#f59e0b18", border: "#f59e0b44", text: "#f59e0b", glow: "0 0 20px #f59e0b22" },
  "🟡 Medium-High Impact": { bg: "#eab30818", border: "#eab30844", text: "#eab308", glow: "0 0 15px #eab30818" },
  "🟡 Medium Impact": { bg: "#a3e63518", border: "#a3e63544", text: "#a3e635", glow: "0 0 15px #a3e63518" },
};

function getImpactStyle(importance) {
  return impactColors[importance] || impactColors["🟡 Medium Impact"];
}

export default function WeeklyNewsHub() {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekLabel, setWeekLabel] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [savedNews, setSavedNews] = useState([]);

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("saved_weekly_news") || "[]");
    setSavedNews(saved);
    fetchNews();
  }, []);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-news?t=${Date.now()}`);
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        setNews(data.news);
        setWeekLabel(`Week ${data.weekNumber} of ${data.year}`);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (item) => {
    let updated;
    const isSaved = savedNews.some((n) => n.title === item.title);
    if (isSaved) {
      updated = savedNews.filter((n) => n.title !== item.title);
    } else {
      updated = [...savedNews, item];
    }
    setSavedNews(updated);
    localStorage.setItem("saved_weekly_news", JSON.stringify(updated));
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #0d1117, #111827)",
        border: "1px solid #1e293b",
        borderRadius: "12px",
        padding: "18px 22px",
        marginBottom: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Subtle animated gradient accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, #f43f5e, #f59e0b, #22c55e, #3b82f6, #8b5cf6, #f43f5e)",
          backgroundSize: "200% 100%",
          animation: "newsGradientSlide 4s linear infinite"
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#e6edf3", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📰</span> Most Important News This Week For Traders
          </h3>
          <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>
            High-impact economic events & indicators · <strong style={{ color: "#f59e0b" }}>{weekLabel}</strong> · {news.length} key events
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={fetchNews}
            disabled={loading}
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#f59e0b",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px",
              transition: "all 0.2s"
            }}
          >
            <span>🔄</span> {loading ? "Loading..." : "Refresh News"}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && news.length === 0 && (
        <p style={{ color: "#f59e0b", fontSize: "13px", margin: 0, textAlign: "center", padding: "20px 0" }}>
          ⏳ Fetching this week&apos;s most important economic news & events...
        </p>
      )}

      {/* News Cards Grid */}
      {!loading && news.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
          {news.map((item, idx) => {
            const impactStyle = getImpactStyle(item.importance);
            const isSaved = savedNews.some((n) => n.title === item.title);
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id || idx}
                style={{
                  background: "#0d1117",
                  border: `1px solid ${impactStyle.border}`,
                  borderRadius: "10px",
                  padding: "0",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: impactStyle.glow,
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                  cursor: "pointer"
                }}
                onClick={() => toggleExpand(item.id)}
              >
                {/* Card Header with importance badge */}
                <div style={{ padding: "14px 16px 10px", borderBottom: isExpanded ? `1px solid ${impactStyle.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "3px 10px",
                        borderRadius: "4px",
                        background: impactStyle.bg,
                        color: impactStyle.text,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        border: `1px solid ${impactStyle.border}`
                      }}
                    >
                      {item.importance}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(item); }}
                        style={{ background: "transparent", border: "none", color: isSaved ? "#fbbf24" : "#484f58", fontSize: "16px", cursor: "pointer", padding: "0 2px" }}
                        title={isSaved ? "Remove from saved" : "Save this news"}
                      >
                        {isSaved ? "★" : "☆"}
                      </button>
                      <span style={{ color: "#484f58", fontSize: "14px", transition: "transform 0.3s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </div>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "700", color: "#e6edf3", lineHeight: "1.4" }}>
                    {item.title}
                  </h4>
                  <p style={{ margin: 0, color: "#8b949e", fontSize: "11.5px", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: isExpanded ? "unset" : 2, WebkitBoxOrient: "vertical", overflow: isExpanded ? "visible" : "hidden" }}>
                    {item.summary}
                  </p>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: "12px 16px 14px", display: "flex", flexDirection: "column", gap: "10px", animation: "fadeSlideIn 0.3s ease" }}>
                    {/* Impact Section */}
                    <div style={{ background: "#161b2299", borderRadius: "8px", padding: "10px 12px", border: "1px solid #21262d" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#f43f5e", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                        💥 Market Impact
                      </span>
                      <p style={{ margin: 0, color: "#c9d1d9", fontSize: "12px", lineHeight: "1.5" }}>{item.impact}</p>
                    </div>

                    {/* Indicator & Market Info */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ background: "#161b2266", borderRadius: "6px", padding: "8px 10px", border: "1px solid #21262d" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#38bdf8", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>📊 Indicator</span>
                        <span style={{ color: "#e6edf3", fontSize: "11px", fontWeight: "600" }}>{item.indicator}</span>
                      </div>
                      <div style={{ background: "#161b2266", borderRadius: "6px", padding: "8px 10px", border: "1px solid #21262d" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#22c55e", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>🌍 Economy</span>
                        <span style={{ color: "#e6edf3", fontSize: "11px", fontWeight: "600" }}>{item.economy}</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ background: "#161b2266", borderRadius: "6px", padding: "8px 10px", border: "1px solid #21262d" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#a855f7", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>💹 Markets Affected</span>
                        <span style={{ color: "#e6edf3", fontSize: "11px", fontWeight: "600" }}>{item.market}</span>
                      </div>
                      <div style={{ background: "#161b2266", borderRadius: "6px", padding: "8px 10px", border: "1px solid #21262d" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#f59e0b", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>⏰ Frequency</span>
                        <span style={{ color: "#e6edf3", fontSize: "11px", fontWeight: "600" }}>{item.frequency}</span>
                      </div>
                    </div>

                    {/* Source Link */}
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        background: "linear-gradient(135deg, #161b22, #1a1f2e)",
                        border: "1px solid #30363d",
                        color: "#38bdf8",
                        fontSize: "11px",
                        fontWeight: "700",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        alignSelf: "flex-start"
                      }}
                    >
                      🔗 {item.sourceLabel} ↗
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes newsGradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
