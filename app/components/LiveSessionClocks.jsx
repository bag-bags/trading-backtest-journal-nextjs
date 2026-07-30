"use client";

import { useEffect, useState } from "react";

const SESS_TR = {
  en: {
    title: "Live Market Trading Sessions",
    utcTime: "Morocco Time (UTC+1)",
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
    utcTime: "Heure du Maroc (UTC+1)",
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
    utcTime: "توقيت المغرب (UTC+1)",
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

  const getTimezoneOffset = (timeZone, date) => {
    try {
      const tz = date.toLocaleString("en-US", { timeZone, timeZoneName: "longOffset" });
      const match = tz.match(/GMT([+-]\d+)(?::(\d+))?/);
      if (!match) return 0;
      const hours = parseInt(match[1], 10);
      const minutes = match[2] ? parseInt(match[2], 10) : 0;
      return hours + (hours >= 0 ? minutes / 60 : -minutes / 60);
    } catch (e) {
      // Fallback offsets if timezone name lookup fails
      if (timeZone === "Asia/Tokyo") return 9;
      if (timeZone === "Europe/London") return 1; // Summer BST fallback
      if (timeZone === "America/New_York") return -4; // Summer EDT fallback
      if (timeZone === "Australia/Sydney") return 10; // Winter AEST fallback
      return 0;
    }
  };

  const getSessionState = (session) => {
    const offset = getTimezoneOffset(session.timezone, now);
    
    // Calculate startUtc and endUtc dynamically and subtract 1 hour
    const startUtc = (session.localStart - offset - 1 + 24) % 24;
    const endUtc = (session.localEnd - offset - 1 + 24) % 24;

    const utcHours = now.getUTCHours();
    const utcMinutes = now.getUTCMinutes();
    const utcSeconds = now.getUTCSeconds();
    const currentTotalSec = utcHours * 3600 + utcMinutes * 60 + utcSeconds;

    let startSec = startUtc * 3600;
    let endSec = endUtc * 3600;

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
      totalDurationSec = (24 - startUtc + endUtc) * 3600;
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

  const getMoroccoTimeText = () => {
    try {
      return now.toLocaleTimeString("en-US", { timeZone: "Africa/Casablanca", hour12: false });
    } catch (e) {
      return new Date(now.getTime() + 3600000).toUTCString().slice(17, 25);
    }
  };

  const SESSIONS_CONFIG = [
    { name: "Tokyo / Asian", flag: "🌸", timezone: "Asia/Tokyo", localStart: 9, localEnd: 17, color: "#a855f7" },
    { name: "London", flag: "🇬🇧", timezone: "Europe/London", localStart: 8, localEnd: 16, color: "#38bdf8" },
    { name: "New York", flag: "🇺🇸", timezone: "America/New_York", localStart: 8, localEnd: 16, color: "#f97316" },
    { name: "Sydney", flag: "🇦🇺", timezone: "Australia/Sydney", localStart: 8, localEnd: 17, color: "#10b981" },
  ];

  return (
    <div style={{ background: "#111113", border: "1px solid #222225", borderRadius: "12px", padding: "14px 18px", marginBottom: "20px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "16px" }}>🕒</span>
          <span style={{ color: "#888893", fontSize: "11px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "0.5px" }}>{trans.title}</span>
        </div>
        <div suppressHydrationWarning style={{ fontSize: "12px", fontWeight: "700", color: "#a3e635", background: "#050506", padding: "4px 10px", borderRadius: "6px", border: "1px solid #222225" }}>
          🇲🇦 {trans.utcTime}: {mounted ? getMoroccoTimeText() : "--:--:--"}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "10px" }}>
        {SESSIONS_CONFIG.map((session) => {
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
