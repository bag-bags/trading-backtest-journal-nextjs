"use client";

import { useEffect, useState } from "react";

const SESSIONS = [
  { name: "Tokyo / Asian", flag: "🌸", startUtc: 0, endUtc: 8, color: "#a855f7" },
  { name: "London", flag: "🇬🇧", startUtc: 8, endUtc: 16, color: "#38bdf8" },
  { name: "New York", flag: "🇺🇸", startUtc: 13, endUtc: 21, color: "#f97316" },
  { name: "Sydney", flag: "🇦🇺", startUtc: 22, endUtc: 7, color: "#10b981" },
];

const SESS_TR = {
  en: {
    title: "Live Market Trading Sessions",
    utcTime: "UTC Time",
    active: "ACTIVE",
    upcoming: "UPCOMING",
    endsIn: "Ends in",
    startsIn: "Starts in",
    tokyo: "Tokyo / Asian",
    london: "London",
    newYork: "New York",
    sydney: "Sydney"
  },
  fr: {
    title: "Sessions de Trading en Direct",
    utcTime: "Heure UTC",
    active: "ACTIF",
    upcoming: "À VENIR",
    endsIn: "Se termine dans",
    startsIn: "Commence dans",
    tokyo: "Tokyo / Asie",
    london: "Londres",
    newYork: "New York",
    sydney: "Sydney"
  },
  ar: {
    title: "جلسات التداول الحية في السوق",
    utcTime: "توقيت UTC",
    active: "نشط",
    upcoming: "قادم",
    endsIn: "ينتهي في",
    startsIn: "يبدأ في",
    tokyo: "طوكيو / آسيا",
    london: "لندن",
    newYork: "نيويورك",
    sydney: "سيدني"
  }
};

export default function LiveSessionClocks({ lang = "en" }) {
  const [now, setNow] = useState(new Date());
  const [mounted, setMounted] = useState(false);

  const trans = SESS_TR[lang] || SESS_TR.en;

  const getSessionName = (name) => {
    if (name === "Tokyo / Asian") return trans.tokyo;
    if (name === "London") return trans.london;
    if (name === "New York") return trans.newYork;
    if (name === "Sydney") return trans.sydney;
    return name;
  };

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
      
      if (lang === "ar") {
        return `${String(h).padStart(2, "0")} س ${String(m).padStart(2, "0")} د ${String(s).padStart(2, "0")} ث`;
      }
      return `${String(h).padStart(2, "0")}h ${String(m).padStart(2, "0")}m ${String(s).padStart(2, "0")}s`;
    };

    const pct = isActive ? Math.min(Math.max((elapsedSec / totalDurationSec) * 100, 0), 100) : 0;

    return { isActive, remainingText: formatTime(remainingSec), pct };
  };

  return (
    <div style={{ background: "#111113", border: "1px solid #222225", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🕒</span>
          <span style={{ color: "#888893", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{trans.title}</span>
        </div>
        <div suppressHydrationWarning style={{ fontSize: "12px", fontWeight: "700", color: "#a3e635", background: "#050506", padding: "4px 10px", borderRadius: "6px", border: "1px solid #222225" }}>
          🌐 {trans.utcTime}: {mounted ? now.toUTCString().slice(17, 25) : "--:--:--"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        {SESSIONS.map((session) => {
          const { isActive, remainingText, pct } = mounted 
            ? getSessionState(session) 
            : { isActive: false, remainingText: "--h --m --s", pct: 0 };
          return (
            <div key={session.name} style={{ background: "#050506", border: `1px solid ${isActive ? session.color + "66" : "#222225"}`, borderRadius: "8px", padding: "10px 12px", display: "flex", flexDirection: "column", gap: "6px", position: "relative", overflow: "hidden" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontWeight: "700", fontSize: "13px" }}>{session.flag} {getSessionName(session.name)}</span>
                <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "800", background: isActive ? `${session.color}22` : "#222225", color: isActive ? session.color : "#888893" }}>
                  {isActive ? `🟢 ${trans.active}` : `⏳ ${trans.upcoming}`}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#888893" }}>
                <span>{isActive ? `${trans.endsIn}:` : `${trans.startsIn}:`}</span>
                <strong style={{ color: isActive ? "#ffffff" : "#888893", fontFamily: "monospace" }}>{remainingText}</strong>
              </div>
              {isActive && (
                <div style={{ width: "100%", height: "4px", background: "#222225", borderRadius: "2px", overflow: "hidden", marginTop: "2px" }}>
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
