"use client";

import { useEffect, useState } from "react";

const SESSIONS = [
  { name: "Tokyo / Asian", flag: "🌸", startUtc: 0, endUtc: 8, color: "#a855f7" },
  { name: "London", flag: "🇬🇧", startUtc: 8, endUtc: 16, color: "#38bdf8" },
  { name: "New York", flag: "🇺🇸", startUtc: 13, endUtc: 21, color: "#f97316" },
  { name: "Sydney", flag: "🇦🇺", startUtc: 22, endUtc: 7, color: "#10b981" },
];

export default function LiveSessionClocks() {
  const [now, setNow] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

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
      // Overnight session (e.g. Sydney 22:00 - 07:00)
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

    return { isActive, remainingText: formatTime(remainingSec), pct };
  };

  return (
    <div style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🕒</span>
          <span style={{ color: "#8b949e", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>Live Market Trading Sessions</span>
        </div>
        <div suppressHydrationWarning style={{ fontSize: "12px", fontWeight: "700", color: "#38bdf8", background: "#161b22", padding: "4px 10px", borderRadius: "6px", border: "1px solid #21262d" }}>
          🌐 UTC Time: {mounted ? now.toUTCString().slice(17, 25) : "--:--:--"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        {SESSIONS.map((session) => {
          const { isActive, remainingText, pct } = mounted 
            ? getSessionState(session) 
            : { isActive: false, remainingText: "--h --m --s", pct: 0 };
          return (
            <div key={session.name} style={{ background: "#161b22", border: `1px solid ${isActive ? session.color + "66" : "#21262d"}`, borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "700", fontSize: "13px" }}>{session.flag} {session.name}</span>
                <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "800", background: isActive ? `${session.color}22` : "#21262d", color: isActive ? session.color : "#8b949e" }}>
                  {isActive ? "🟢 ACTIVE" : "⏳ UPCOMING"}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8b949e" }}>
                <span>{isActive ? "Ends in:" : "Starts in:"}</span>
                <strong style={{ color: isActive ? "#e6edf3" : "#8b949e", fontFamily: "monospace" }}>{remainingText}</strong>
              </div>
              {isActive && (
                <div style={{ width: "100%", height: "4px", background: "#21262d", borderRadius: "2px", overflow: "hidden", marginTop: "2px" }}>
                  <div style={{ height: "100%", width: `${pct}%`, background: session.color, transition: "width 1s linear" }} />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
