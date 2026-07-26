"use client";

import { useEffect, useState } from "react";

export default function KnowledgeHub() {
  const [currentTips, setCurrentTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivedTips, setArchivedTips] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const fetchFreshTips = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge?t=${Date.now()}`);
      const data = await res.json();
      if (data.tricks && data.tricks.length > 0) {
        const fetchedThree = data.tricks;
        setCurrentTips(fetchedThree);

        // Update localStorage history so no past tip is lost
        const savedHistory = JSON.parse(localStorage.getItem("knowledge_history") || "[]");
        const map = new Map(savedHistory.map((item) => [item.title, item]));
        fetchedThree.forEach((item) => map.set(item.title, item));

        const updatedHistory = Array.from(map.values());
        localStorage.setItem("knowledge_history", JSON.stringify(updatedHistory));
        setHistoryCount(updatedHistory.length);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load archived tips from localStorage
    const savedArchived = JSON.parse(localStorage.getItem("archived_knowledge") || "[]");
    setArchivedTips(savedArchived);

    // Fetch 3 fresh tips from web/API on page refresh
    fetchFreshTips();
  }, []);

  const toggleArchive = (tip) => {
    let updated;
    const isArchived = archivedTips.some((item) => item.title === tip.title);
    if (isArchived) {
      updated = archivedTips.filter((item) => item.title !== tip.title);
    } else {
      updated = [...archivedTips, tip];
    }
    setArchivedTips(updated);
    localStorage.setItem("archived_knowledge", JSON.stringify(updated));
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #0d1117, #161b22)", border: "1px solid #21262d", borderRadius: "12px", padding: "18px 22px", marginBottom: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#e6edf3", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>💡</span> 3 Important Things You Should Know As A Trader
          </h3>
          <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>
            Fresh live tips fetched on every refresh · History saved: <strong>{historyCount} tips</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={fetchFreshTips}
            disabled={loading}
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#38bdf8",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <span>🔄</span> {loading ? "Fetching..." : "Get 3 New Tricks"}
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              background: showArchived ? "#6366f1" : "#161b22",
              border: "1px solid #30363d",
              color: "#e6edf3",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>⭐</span> {showArchived ? "View Live Tips" : `Archived (${archivedTips.length})`}
          </button>
        </div>
      </div>

      {loading && currentTips.length === 0 && <p style={{ color: "#38bdf8", fontSize: "13px", margin: 0 }}>⏳ Fetching 3 new updated trader tricks from the web...</p>}

      {!showArchived ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {currentTips.map((tip, idx) => {
            const isBookmarked = archivedTips.some((item) => item.title === tip.title);
            return (
              <div key={tip.id || idx} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px", background: "#38bdf822", color: "#38bdf8", textTransform: "uppercase" }}>
                      Trick #{idx + 1} · {tip.category}
                    </span>
                    <button onClick={() => toggleArchive(tip)} style={{ background: "transparent", border: "none", color: isBookmarked ? "#fbbf24" : "#484f58", fontSize: "16px", cursor: "pointer" }} title={isBookmarked ? "Remove Bookmark" : "Bookmark / Archive Tip"}>
                      {isBookmarked ? "★" : "☆"}
                    </button>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "700", color: "#e6edf3" }}>{tip.title}</h4>
                  <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>{tip.content}</p>
                </div>
                {tip.fetchedAt && <span style={{ color: "#484f58", fontSize: "10px" }}>✨ Updated at {tip.fetchedAt}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {archivedTips.length === 0 && <p style={{ color: "#8b949e", fontSize: "12px", margin: 0 }}>No archived tips yet. Click ☆ to bookmark tips!</p>}
          {archivedTips.map((tip, idx) => (
            <div key={idx} style={{ background: "#0d1117", border: "1px solid #6366f144", borderRadius: "8px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "800", color: "#818cf8", textTransform: "uppercase" }}>{tip.category}</span>
                <h4 style={{ margin: "2px 0 4px", fontSize: "13px", fontWeight: "700", color: "#e6edf3" }}>{tip.title}</h4>
                <p style={{ margin: 0, color: "#8b949e", fontSize: "12px" }}>{tip.content}</p>
              </div>
              <button onClick={() => toggleArchive(tip)} style={{ background: "transparent", border: "none", color: "#fbbf24", fontSize: "18px", cursor: "pointer", marginLeft: "12px" }}>
                ★
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
