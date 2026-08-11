"use client";

import { useState, useEffect, useRef } from "react";

const LOCAL_KNOW = {
  en: {
    backToJournal: "← Back to Backtest Journal",
    pageTitle: "📚 Pro Trader Knowledge & Strategy Master Hub",
    pageDesc: "Improve your system. Learn structures, psychological control, macro correlations, and save personal rules.",
    close: "Close Hub",
    tabs: {
      strategies: "📖 Pro Strategies Encyclopedia",
      checklist: "✅ Strategy-Specific Pre-Trade Checklist",
      chartsetups: "📐 14 Chart Patterns & Setups Guide",
      psychology: "🧠 Master Psychology & Wisdom",
      fundamental: "📰 Fundamental News & Liquidity Impact",
      indicators: "📊 Markets & Key Correlation Matrix",
      candlesticks: "🕯️ Candlesticks & Meanings",
      custom: "📝 Personal Notes"
    }
  },
  fr: {
    backToJournal: "← Retour au journal de backtest",
    pageTitle: "📚 Bibliothèque du Pro Trader & Stratégies",
    pageDesc: "Améliorez votre système. Apprenez les structures, la psychologie, les corrélations et enregistrez vos règles.",
    close: "Fermer la Bibliothèque",
    tabs: {
      strategies: "📖 Encyclopédie des Stratégies Pro",
      checklist: "✅ Liste de Contrôle Pré-Transaction",
      chartsetups: "📐 Guide des 14 Modèles de Graphiques",
      psychology: "🧠 Maîtrise de la Psychologie",
      fundamental: "📰 Nouvelles Fondamentales & Impact",
      indicators: "📊 Matrice de Corrélation des Marchés",
      candlesticks: "🕯️ Bougies & Significations",
      custom: "📝 Notes Personnelles"
    }
  },
  ar: {
    backToJournal: "← العودة إلى مجلة الاختبار الخلفي",
    pageTitle: "📚 مركز المعرفة واستراتيجيات التداول الاحترافية",
    pageDesc: "حسن نظامك. تعلم الهياكل، التحكم النفسي، الارتباطات الماكرو واحفظ قواعدك الشخصية.",
    close: "إغلاق المركز",
    tabs: {
      strategies: "📖 موسوعة استراتيجيات التداول الاحترافية",
      checklist: "✅ قائمة التحقق قبل فتح الصفقة",
      chartsetups: "📐 دليل 14 نمطاً وتنسيقاً للرسم البياني",
      psychology: "🧠 السيطرة النفسية وحكمة التداول",
      fundamental: "📰 الأخبار الأساسية وتأثير السيولة",
      indicators: "📊 مصفوفة ارتباط الأسواق الرئيسية",
      candlesticks: "🕯️ الشموع اليابانية ومعانيها",
      custom: "📝 الملاحظات الشخصية"
    }
  }
};

// Candlestick Icon Helper
function CandleIcon({ type, name = "" }) {
  const isBull = type === "bullish";
  const isBear = type === "bearish";

  const color = isBull ? "#22c55e" : isBear ? "#f43f5e" : "#f59e0b";
  const bgFill = isBull ? "#22c55e" : isBear ? "#f43f5e" : "transparent";

  let bodyHeight = 12;
  let bodyY = 6;

  if (name.includes("Hammer") && !name.includes("Inverted")) {
    bodyHeight = 6; bodyY = 4;
  } else if (name.includes("Inverted Hammer") || name.includes("Shooting Star")) {
    bodyHeight = 6; bodyY = 13;
  } else if (name.includes("Pin Bar")) {
    if (isBull) { bodyHeight = 5; bodyY = 3; }
    else { bodyHeight = 5; bodyY = 14; }
  } else if (name.includes("Marubozu")) {
    bodyHeight = 20; bodyY = 2;
  } else if (name.includes("Doji") || name.includes("Spinning")) {
    bodyHeight = 2; bodyY = 11;
  }

  return (
    <svg width="20" height="24" viewBox="0 0 20 24" style={{ display: "block", flexShrink: 0 }}>
      <line x1="10" y1={2} x2="10" y2={22} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect x="5" y={bodyY} width="10" height={bodyHeight} fill={bgFill} stroke={color} strokeWidth="1.5" rx="1" />
    </svg>
  );
}

// Candlestick Detailed Demonstration Engine
function CandleDemonstration({ name, type }) {
  const isBull = type === "bullish";
  const isBear = type === "bearish";
  const green = "#22c55e";
  const red = "#f43f5e";
  const orange = "#fbbf24";
  const lineC = "#21262d";
  
  if (name.includes("Morning Star")) {
    return (
      <svg width="100%" height="70" viewBox="0 0 160 70" style={{ background: "#0d1117", borderRadius: "8px", border: "1px solid #21262d" }}>
        {/* Prior Trend Arrow (Down) */}
        <path d="M 10 15 L 22 40" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
        <polygon points="22,40 16,38 21,32" fill="#f43f5e" />
        <text x="8" y="10" fill="#f43f5e" fontSize="7" fontWeight="bold">PREV DOWN</text>

        {/* Expected Trend Arrow (Up) */}
        <path d="M 138 45 L 150 20" fill="none" stroke="#22c55e" strokeWidth="2" />
        <polygon points="150,20 142,22 147,28" fill="#22c55e" />
        <text x="124" y="55" fill="#22c55e" fontSize="7" fontWeight="bold">REVERSAL UP</text>

        {/* Center line */}
        <line x1="28" y1="55" x2="132" y2="55" stroke={lineC} strokeWidth="1" strokeDasharray="2 2" />
        {/* Candle 1: Bearish */}
        <line x1="45" y1="15" x2="45" y2="55" stroke={red} strokeWidth="1.5" />
        <rect x="38" y="22" width="14" height="28" fill={red} rx="1" />
        {/* Candle 2: Doji */}
        <line x1="80" y1="45" x2="80" y2="63" stroke="#8b949e" strokeWidth="1.5" />
        <rect x="73" y="52" width="14" height="3" fill="#8b949e" />
        {/* Candle 3: Bullish */}
        <line x1="115" y1="12" x2="115" y2="50" stroke={green} strokeWidth="1.5" />
        <rect x="108" y="16" width="14" height="30" fill={green} rx="1" />
      </svg>
    );
  }
  
  if (name.includes("Evening Star")) {
    return (
      <svg width="100%" height="70" viewBox="0 0 160 70" style={{ background: "#0d1117", borderRadius: "8px", border: "1px solid #21262d" }}>
        {/* Prior Trend Arrow (Up) */}
        <path d="M 10 40 L 22 15" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="2 2" />
        <polygon points="22,15 20,21 15,17" fill="#22c55e" />
        <text x="8" y="50" fill="#22c55e" fontSize="7" fontWeight="bold">PREV UP</text>

        {/* Expected Trend Arrow (Down) */}
        <path d="M 138 20 L 150 45" fill="none" stroke="#f43f5e" strokeWidth="2" />
        <polygon points="150,45 147,38 142,43" fill="#f43f5e" />
        <text x="120" y="12" fill="#f43f5e" fontSize="7" fontWeight="bold">REVERSAL DOWN</text>

        <line x1="28" y1="55" x2="132" y2="55" stroke={lineC} strokeWidth="1" strokeDasharray="2 2" />
        {/* Candle 1: Bullish */}
        <line x1="45" y1="15" x2="45" y2="50" stroke={green} strokeWidth="1.5" />
        <rect x="38" y="20" width="14" height="28" fill={green} rx="1" />
        {/* Candle 2: Doji */}
        <line x1="80" y1="10" x2="80" y2="30" stroke="#8b949e" strokeWidth="1.5" />
        <rect x="73" y="18" width="14" height="3" fill="#8b949e" />
        {/* Candle 3: Bearish */}
        <line x1="115" y1="22" x2="115" y2="60" stroke={red} strokeWidth="1.5" />
        <rect x="108" y="26" width="14" height="30" fill={red} rx="1" />
      </svg>
    );
  }

  if (name.includes("Bullish Engulfing")) {
    return (
      <svg width="100%" height="70" viewBox="0 0 160 70" style={{ background: "#0d1117", borderRadius: "8px", border: "1px solid #21262d" }}>
        {/* Prior Trend (Down) */}
        <path d="M 12 15 L 24 40" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
        <polygon points="24,40 18,38 23,32" fill="#f43f5e" />
        <text x="8" y="10" fill="#f43f5e" fontSize="7" fontWeight="bold">PREV DOWN</text>

        {/* Expected Trend (Up) */}
        <path d="M 136 45 L 148 20" fill="none" stroke="#22c55e" strokeWidth="2" />
        <polygon points="148,20 140,22 145,28" fill="#22c55e" />
        <text x="122" y="55" fill="#22c55e" fontSize="7" fontWeight="bold">REVERSAL UP</text>

        <line x1="30" y1="55" x2="130" y2="55" stroke={lineC} strokeWidth="1" strokeDasharray="2 2" />
        {/* Candle 1: Bearish */}
        <line x1="55" y1="28" x2="55" y2="50" stroke={red} strokeWidth="1.5" />
        <rect x="49" y="32" width="12" height="15" fill={red} rx="1" />
        {/* Candle 2: Bullish (Engulfing) */}
        <line x1="100" y1="12" x2="100" y2="58" stroke={green} strokeWidth="1.5" />
        <rect x="92" y="16" width="16" height="38" fill={green} rx="1" />
      </svg>
    );
  }

  if (name.includes("Bearish Engulfing")) {
    return (
      <svg width="100%" height="70" viewBox="0 0 160 70" style={{ background: "#0d1117", borderRadius: "8px", border: "1px solid #21262d" }}>
        {/* Prior Trend (Up) */}
        <path d="M 12 40 L 24 15" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="2 2" />
        <polygon points="24,15 22,21 17,17" fill="#22c55e" />
        <text x="8" y="50" fill="#22c55e" fontSize="7" fontWeight="bold">PREV UP</text>

        {/* Expected Trend (Down) */}
        <path d="M 136 20 L 148 45" fill="none" stroke="#f43f5e" strokeWidth="2" />
        <polygon points="148,45 145,38 140,43" fill="#f43f5e" />
        <text x="120" y="12" fill="#f43f5e" fontSize="7" fontWeight="bold">REVERSAL DOWN</text>

        <line x1="30" y1="55" x2="130" y2="55" stroke={lineC} strokeWidth="1" strokeDasharray="2 2" />
        {/* Candle 1: Bullish */}
        <line x1="55" y1="28" x2="55" y2="50" stroke={green} strokeWidth="1.5" />
        <rect x="49" y="32" width="12" height="15" fill={green} rx="1" />
        {/* Candle 2: Bearish (Engulfing) */}
        <line x1="100" y1="12" x2="100" y2="58" stroke={red} strokeWidth="1.5" />
        <rect x="92" y="16" width="16" height="38" fill={red} rx="1" />
      </svg>
    );
  }

  const color = isBull ? green : isBear ? red : orange;
  const bg = isBull ? green : isBear ? red : "transparent";
  let bodyY = 22;
  let bodyH = 26;
  let topWickY1 = 8;
  let topWickY2 = 22;
  let botWickY1 = 48;
  let botWickY2 = 62;

  if (name.includes("Hammer") && !name.includes("Inverted")) {
    bodyY = 12;
    bodyH = 12;
    topWickY1 = 10;
    topWickY2 = 12;
    botWickY1 = 24;
    botWickY2 = 60;
  } else if (name.includes("Inverted Hammer") || name.includes("Shooting Star")) {
    bodyY = 46;
    bodyH = 12;
    topWickY1 = 10;
    topWickY2 = 46;
    botWickY1 = 58;
    botWickY2 = 60;
  } else if (name.includes("Pin Bar")) {
    if (isBull) {
      bodyY = 12;
      bodyH = 10;
      topWickY1 = 10;
      topWickY2 = 12;
      botWickY1 = 22;
      botWickY2 = 62;
    } else {
      bodyY = 48;
      bodyH = 10;
      topWickY1 = 8;
      topWickY2 = 48;
      botWickY1 = 58;
      botWickY2 = 60;
    }
  } else if (name.includes("Marubozu")) {
    bodyY = 8;
    bodyH = 54;
    topWickY1 = 8;
    topWickY2 = 8;
    botWickY1 = 62;
    botWickY2 = 62;
  } else if (name.includes("Doji") || name.includes("Spinning")) {
    bodyY = 34;
    bodyH = 3;
    topWickY1 = 10;
    topWickY2 = 34;
    botWickY1 = 37;
    botWickY2 = 60;
  }

  // Determine trend labels dynamically
  let isReversalUp = type === "bullish";
  let isReversalDown = type === "bearish";
  let isContinuationUp = false;
  let isContinuationDown = false;
  let isNeutral = type === "neutral";

  if (name.includes("Marubozu")) {
    if (type === "bullish") {
      isContinuationUp = true;
      isReversalUp = false;
    } else {
      isContinuationDown = true;
      isReversalDown = false;
    }
  }

  return (
    <svg width="100%" height="70" viewBox="0 0 160 70" style={{ background: "#0d1117", borderRadius: "8px", border: "1px solid #21262d" }}>
      {/* Prior Trend Arrow */}
      {isReversalUp && (
        <>
          <path d="M 12 15 L 24 40" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
          <polygon points="24,40 18,38 23,32" fill="#f43f5e" />
          <text x="8" y="10" fill="#f43f5e" fontSize="7" fontWeight="bold">PREV DOWN</text>
        </>
      )}
      {isContinuationUp && (
        <>
          <path d="M 12 40 L 24 15" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="2 2" />
          <polygon points="24,15 22,21 17,17" fill="#22c55e" />
          <text x="8" y="50" fill="#22c55e" fontSize="7" fontWeight="bold">PREV UP</text>
        </>
      )}
      {isReversalDown && (
        <>
          <path d="M 12 40 L 24 15" fill="none" stroke="#22c55e" strokeWidth="1.5" strokeDasharray="2 2" />
          <polygon points="24,15 22,21 17,17" fill="#22c55e" />
          <text x="8" y="50" fill="#22c55e" fontSize="7" fontWeight="bold">PREV UP</text>
        </>
      )}
      {isContinuationDown && (
        <>
          <path d="M 12 15 L 24 40" fill="none" stroke="#f43f5e" strokeWidth="1.5" strokeDasharray="2 2" />
          <polygon points="24,40 18,38 23,32" fill="#f43f5e" />
          <text x="8" y="10" fill="#f43f5e" fontSize="7" fontWeight="bold">PREV DOWN</text>
        </>
      )}
      {isNeutral && (
        <>
          <path d="M 10 28 L 22 28" fill="none" stroke="#fbbf24" strokeWidth="1.5" strokeDasharray="2 2" />
          <polygon points="22,28 17,24 17,32" fill="#fbbf24" />
          <text x="8" y="20" fill="#fbbf24" fontSize="7" fontWeight="bold">INCOMING</text>
        </>
      )}

      {/* Expected Result Arrow */}
      {isReversalUp && (
        <>
          <path d="M 136 45 L 148 20" fill="none" stroke="#22c55e" strokeWidth="2" />
          <polygon points="148,20 140,22 145,28" fill="#22c55e" />
          <text x="122" y="55" fill="#22c55e" fontSize="7" fontWeight="bold">REVERSAL UP</text>
        </>
      )}
      {isContinuationUp && (
        <>
          <path d="M 136 45 L 148 20" fill="none" stroke="#22c55e" strokeWidth="2" />
          <polygon points="148,20 140,22 145,28" fill="#22c55e" />
          <text x="122" y="55" fill="#22c55e" fontSize="7" fontWeight="bold">CONTINUE UP</text>
        </>
      )}
      {isReversalDown && (
        <>
          <path d="M 136 20 L 148 45" fill="none" stroke="#f43f5e" strokeWidth="2" />
          <polygon points="148,45 145,38 140,43" fill="#f43f5e" />
          <text x="120" y="12" fill="#f43f5e" fontSize="7" fontWeight="bold">REVERSAL DOWN</text>
        </>
      )}
      {isContinuationDown && (
        <>
          <path d="M 136 20 L 148 45" fill="none" stroke="#f43f5e" strokeWidth="2" />
          <polygon points="148,45 145,38 140,43" fill="#f43f5e" />
          <text x="120" y="12" fill="#f43f5e" fontSize="7" fontWeight="bold">CONTINUE DOWN</text>
        </>
      )}
      {isNeutral && (
        <>
          <text x="134" y="32" fill="#fbbf24" fontSize="16" fontWeight="bold">?</text>
          <text x="120" y="50" fill="#fbbf24" fontSize="7" fontWeight="bold">INDECISION</text>
        </>
      )}

      <line x1="30" y1="35" x2="130" y2="35" stroke={lineC} strokeWidth="1" strokeDasharray="2 2" />
      <line x1="80" y1={topWickY1} x2="80" y2={botWickY2} stroke={color} strokeWidth="2" strokeLinecap="round" />
      <rect x="70" y={bodyY} width="20" height={bodyH} fill={bg} stroke={color} strokeWidth="2" rx="1" />
    </svg>
  );
}

// Custom SVG Pattern Diagram Engine
function PatternDiagram({ type }) {
  const c = "#38bdf8"; // Line color
  const neckC = "#f59e0b"; // Neckline color
  const arrowC = "#22c55e"; // Arrow color

  switch (type) {
    case "headShoulders":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="55" x2="140" y2="55" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 15 55 L 35 30 L 55 55 L 80 15 L 105 55 L 125 35 L 140 55" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 140 55 L 155 72" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="155,72 145,70 152,62" fill="#f43f5e" />
        </svg>
      );

    case "rectangles":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="25" x2="140" y2="25" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="20" y1="55" x2="140" y2="55" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 20 25 L 40 55 L 60 25 L 80 55 L 100 25 L 120 55" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 120 55 L 140 70" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="140,70 130,68 138,60" fill="#f43f5e" />
        </svg>
      );

    case "channels":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="50" x2="130" y2="20" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="30" y1="70" x2="140" y2="40" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 25 65 L 45 35 L 65 58 L 85 28 L 105 50 L 125 22" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 125 22 L 145 10" fill="none" stroke={arrowC} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="145,10 135,12 142,20" fill={arrowC} />
        </svg>
      );

    case "flags":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <path d="M 15 70 L 45 25" fill="none" stroke={arrowC} strokeWidth="3" />
          <line x1="45" y1="20" x2="115" y2="45" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="45" y1="35" x2="115" y2="60" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 45 25 L 65 50 L 80 32 L 95 55 L 110 38" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 110 38 L 135 15" fill="none" stroke={arrowC} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="135,15 124,18 130,26" fill={arrowC} />
        </svg>
      );

    case "symmetricalTriangles":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="15" x2="130" y2="45" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="20" y1="70" x2="130" y2="45" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 25 20 L 50 62 L 75 30 L 95 52 L 115 42" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 115 42 L 140 65" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="140,65 128,63 137,55" fill="#f43f5e" />
        </svg>
      );

    case "ascendingTriangles":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="25" x2="130" y2="25" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="20" y1="70" x2="130" y2="25" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 25 65 L 45 25 L 65 52 L 85 25 L 105 40 L 120 25" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 120 25 L 138 10" fill="none" stroke={arrowC} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="138,10 127,12 134,20" fill={arrowC} />
        </svg>
      );

    case "descendingTriangles":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="55" x2="130" y2="55" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="20" y1="15" x2="130" y2="55" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 25 20 L 45 55 L 65 30 L 85 55 L 105 42 L 120 55" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 120 55 L 138 72" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="138,72 127,70 134,62" fill="#f43f5e" />
        </svg>
      );

    case "wedgeContinuation":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="15" x2="130" y2="55" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="40" y1="35" x2="130" y2="65" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 25 20 L 50 40 L 70 30 L 90 50 L 110 42 L 125 60" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 125 60 L 142 75" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="142,75 131,73 138,65" fill="#f43f5e" />
        </svg>
      );

    case "wedgeReversal":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="65" x2="125" y2="20" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="40" y1="75" x2="125" y2="35" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 30 70 L 50 48 L 70 60 L 90 38 L 110 48 L 122 28" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 122 28 L 140 10" fill="none" stroke={arrowC} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="140,10 129,12 136,20" fill={arrowC} />
        </svg>
      );

    case "doubleTop":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="20" x2="140" y2="20" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="20" y1="55" x2="140" y2="55" stroke="#484f58" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 20 65 L 50 20 L 80 55 L 110 20 L 130 55" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 130 55 L 145 72" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="145,72 135,70 142,62" fill="#f43f5e" />
        </svg>
      );

    case "doubleBottom":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="20" y1="60" x2="140" y2="60" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="20" y1="25" x2="140" y2="25" stroke="#484f58" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 20 15 L 50 60 L 80 25 L 110 60 L 130 25" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 130 25 L 145 10" fill="none" stroke={arrowC} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="145,10 134,12 141,20" fill={arrowC} />
        </svg>
      );

    case "tripleTop":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="15" y1="20" x2="145" y2="20" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="15" y1="55" x2="145" y2="55" stroke="#484f58" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 15 65 L 40 20 L 65 55 L 90 20 L 115 55 L 135 20 L 145 55" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 145 55 L 155 70" fill="none" stroke="#f43f5e" strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="155,70 145,68 152,60" fill="#f43f5e" />
        </svg>
      );

    case "tripleBottom":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <line x1="15" y1="60" x2="145" y2="60" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="15" y1="25" x2="145" y2="25" stroke="#484f58" strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 15 15 L 40 60 L 65 25 L 90 60 L 115 25 L 135 60 L 145 25" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 145 25 L 155 10" fill="none" stroke={arrowC} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="155,10 144,12 151,20" fill={arrowC} />
        </svg>
      );

    case "pennants":
      return (
        <svg width="100%" height="80" viewBox="0 0 160 80" style={{ background: "#090d12", borderRadius: "8px" }}>
          <path d="M 15 70 L 45 25" fill="none" stroke={arrowC} strokeWidth="3" />
          <line x1="45" y1="25" x2="115" y2="45" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <line x1="45" y1="65" x2="115" y2="45" stroke={neckC} strokeWidth="1.5" strokeDasharray="3 3" />
          <path d="M 45 25 L 65 60 L 80 32 L 95 52 L 110 43" fill="none" stroke={c} strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 110 43 L 135 22" fill="none" stroke={arrowC} strokeWidth="2.5" strokeLinecap="round" />
          <polygon points="135,22 124,25 130,33" fill={arrowC} />
        </svg>
      );

    default:
      return null;
  }
}

const MASTER_TRADER_WISDOM = [
  {
    author: "Warren Buffett",
    title: "The Oracle of Omaha",
    badge: "🏛️ INVESTMENT & RISK WISDOM",
    badgeColor: "#fbbf24",
    quote: "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.",
    coreLessons: [
      "Risk comes from not knowing what you're doing. Master your setup before taking risk.",
      "Be fearful when others are greedy, and greedy when others are fearful (contrarian liquidity mindset).",
      "The stock market is a device for transferring money from the impatient to the patient."
    ],
    psychologyRule: "Patience is your edge. Wait for the market to pitch the exact ball in your strike zone before swinging."
  },
  {
    author: "Thomas Wade",
    title: "Master of Pure Price Action & PATs Trading",
    badge: "🎯 2ND ENTRY & INSTITUTIONAL FOOTPRINTS",
    badgeColor: "#06b6d4",
    quote: "Stop overcomplicating your charts with lagging indicators. Read the bar-by-bar story and follow the footprints left by institutional money.",
    coreLessons: [
      "Follow the Big Players: Retail traders don't move the market. Train your eyes to spot institutional traps, 2nd entries, and trendline bounces.",
      "The 2nd Entry Rule (2E): First pullbacks often fail as traps (1st entry); high-probability trades happen on the 2nd entry attempt in line with the trend.",
      "Signal Bar Quality: Never enter without a high-quality signal bar that closes strongly on its extreme near the 21 EMA."
    ],
    psychologyRule: "Do not counter-trend trade. The highest win-rate setups come from patience: waiting for a clean 2nd entry pullback to the 21 EMA in a strong trend."
  },
  {
    author: "Mark Douglas",
    title: "Author of 'Trading in the Zone'",
    badge: "🧠 THE PROBABILISTIC MINDSET",
    badgeColor: "#38bdf8",
    quote: "Anything can happen. You don't need to know what is going to happen next in order to make money.",
    coreLessons: [
      "5 Fundamental Truths: 1. Anything can happen. 2. You don't need to know what happens next. 3. There is a random distribution between wins and losses for any set of variables. 4. An edge is an indication of a higher probability of one thing happening over another. 5. Every moment in the market is unique.",
      "Accept the risk completely before opening a trade. If you fear loss, you will hesitate or break your rules."
    ],
    psychologyRule: "Think in probabilities, not individual trade outcomes. Evaluate your performance over a sample size of 20-50 trades."
  },
  {
    author: "Paul Tudor Jones",
    title: "Founder of Tudor Investment Corp",
    badge: "🛡️ CAPITAL PRESERVATION & R:R",
    badgeColor: "#22c55e",
    quote: "I look for 5:1 Risk:Reward. 5:1 means I can be wrong 80% of the time and still not lose money.",
    coreLessons: [
      "Don't focus on making money; focus on protecting what you have.",
      "Never average down into losing positions (no revenge trading).",
      "Play great defense, not just offense. If you have a bad streak, cut your position size by 50% immediately."
    ],
    psychologyRule: "Always cap your risk at 1% of equity. Use asymmetric Risk:Reward (minimum 1:2 to 1:5) to build compound wealth."
  },
  {
    author: "Jesse Livermore",
    title: "Legendary Market Speculator",
    badge: "📈 PATIENCE & TREND FOLLOWING",
    badgeColor: "#a855f7",
    quote: "It was never my thinking that made the big money for me. It was always my sitting. Got that? My sitting tight!",
    coreLessons: [
      "Markets are never wrong; opinions often are.",
      "Do not trade every day. There are times to go long, times to go short, and times to go fishing.",
      "The big money is in the big swing. Cut losses fast and let your winners run."
    ],
    psychologyRule: "Avoid overtrading (FOMO). Sitting on your hands is an active, profitable trading decision."
  },
  {
    author: "Ray Dalio",
    title: "Founder of Bridgewater Associates",
    badge: "⚖️ RADICAL TRANSPARENCY & SYSTEMS",
    badgeColor: "#6366f1",
    quote: "Pain + Reflection = Progress.",
    coreLessons: [
      "If you don't look back at your trades and feel embarrassed by your mistakes, you haven't learned anything.",
      "Systematize your trading decision-making rules so emotion never controls your execution.",
      "Diversify across uncorrelated assets and setups to survive macro regime shifts."
    ],
    psychologyRule: "Treat your backtest journal as your personal laboratory. Log every trade error without emotional denial."
  },
  {
    author: "Dr. Brett Steenbarger",
    title: "Author of 'The Psychology of Trading'",
    badge: "🧘 EMOTIONAL SELF-REGULATION",
    badgeColor: "#f43f5e",
    quote: "Successful traders don't eliminate stress; they build resilience and control their physiological response.",
    coreLessons: [
      "Revenge trading happens when a loss triggers an ego threat instead of a business cost.",
      "Take 3 deep box breaths before entering a trade to shift from reactive amygdala to rational prefrontal cortex.",
      "Set a Daily Stop-Loss Limit (e.g. 2 consecutive losses = close laptop for the day)."
    ],
    psychologyRule: "Implement the '2-Loss Circuit Breaker Rule': Stop trading for the day after 2 consecutive losses to protect mental capital."
  }
];

const FUNDAMENTAL_NEWS_GUIDE = [
  {
    name: "CPI - Consumer Price Index",
    impactRating: "🔴 HIGH IMPACT (3 BULLS)",
    frequency: "Monthly (Usually 2nd Tuesday/Wednesday)",
    meaning: "Measures inflation in the price of goods and services. It is the primary filter for central banks to determine interest rates.",
    higherThanExpected: "🟢 USD Strong (Fed likely to raise rates) | 🔴 GOLD / NASDAQ / EUR USD Down",
    lowerThanExpected: "🔴 USD Weak (Inflation slowing) | 🟢 GOLD / NASDAQ / EUR USD Up",
    liquidityBehavior: "First volatility spike triggers stop losses on both sides (Judas Swing), then the true institutional trend begins after 15-30 minutes.",
    biasRule: "If CPI is higher than expected ↗️ -> seek SELL setups on Gold/stocks and BUY USD. If lower than expected ↘️ -> seek BUY setups on Gold/stocks."
  },
  {
    name: "NFP - Non-Farm Payrolls",
    impactRating: "🔴 HIGH IMPACT (First Friday of Month)",
    frequency: "Monthly (First Friday at 13:30 UTC / 8:30 EST)",
    meaning: "Measures the health and strength of the US labor market and the number of new jobs added, excluding the agricultural sector.",
    higherThanExpected: "🟢 USD Bullish (Strong economy supports higher rates) | 🔴 GOLD / NASDAQ Bearish",
    lowerThanExpected: "🔴 USD Bearish (Weak employment and economic concerns) | 🟢 GOLD / NASDAQ Bullish",
    liquidityBehavior: "The biggest liquidity driver of the month. Avoid trading in the first 10 minutes to prevent getting caught in stop hunts on both sides.",
    biasRule: "Rising NFP and falling Unemployment Rate = USD strength and decline in opposing assets."
  },
  {
    name: "FOMC Interest Rate Decision & Press Conference",
    impactRating: "🔴 CRITICAL MAXIMUM IMPACT",
    frequency: "8 times per year (Wednesdays at 19:00 UTC)",
    meaning: "US Federal Reserve decision to determine interest rates, followed by a press conference by Chairman Jerome Powell.",
    higherThanExpected: "🟢 Rate Hike / Hawkish Stance = Rocket surge in USD, decline in Gold and stocks.",
    lowerThanExpected: "🔴 Rate Cut / Dovish Stance = Sharp decline in USD, breakout in Gold and stocks.",
    liquidityBehavior: "Liquidity peaks to the highest levels of the year. During the press conference, each statement from the Chairman triggers high volatility and sweeps liquidity above and below support/resistance levels.",
    biasRule: "Listen to Powell's tone: Hawkish tone = USD rally, Dovish tone = USD decline."
  },
  {
    name: "ISM Manufacturing & Services PMI",
    impactRating: "🟠 MEDIUM - HIGH IMPACT",
    frequency: "Monthly (First 3 business days)",
    meaning: "Reflects the health of economic activity in the manufacturing and services sectors. Any reading above 50.0 represents expansion, while below 50.0 represents contraction.",
    higherThanExpected: "🟢 > 50.0 Expansion: Positive for USD and stocks, negative for Gold.",
    lowerThanExpected: "🔴 < 50.0 Contraction: Negative for USD and stocks, positive for Gold (safe-haven).",
    liquidityBehavior: "Defines the trend direction during the New York session of the same day.",
    biasRule: "PMI higher than expected and above 50 = launch of a bullish trend in the same direction."
  },
  {
    name: "Retail Sales",
    impactRating: "🟠 HIGH IMPACT",
    frequency: "Monthly",
    meaning: "Measures spending by individual consumers, which is the primary driver of over 70% of the US economy.",
    higherThanExpected: "🟢 Higher spending = Strong economic growth = Positive for USD and stocks.",
    lowerThanExpected: "🔴 Lower spending = Slowdown = Negative for USD.",
    liquidityBehavior: "Moves the price directly during the first 15 minutes of release.",
    biasRule: "Correlate Retail Sales with CPI to see if consumers can withstand rising prices."
  },
  {
    name: "Core PCE Price Index",
    impactRating: "🔴 HIGH IMPACT (Fed's Favorite Inflation Metric)",
    frequency: "Monthly (Last Friday of Month)",
    meaning: "The US Federal Reserve's preferred inflation metric to measure the change in prices of goods excluding food and energy.",
    higherThanExpected: "🟢 High PCE = Pressure on Fed to raise/hold high rates = USD strength.",
    lowerThanExpected: "🔴 Low PCE = Slowing inflation = USD decline and gold/stocks breakout.",
    liquidityBehavior: "Triggers structural moves throughout the day (Daily Bias Changer).",
    biasRule: "If PCE is low with declining NFP -> confirmed bullish structural breakout on Gold."
  }
];

const MARKET_INDICATORS_MATRIX = [
  {
    market: "🥇 GOLD (XAU/USD)",
    category: "Precious Metal / Safe Haven",
    badgeColor: "#fbbf24",
    description: "The ultimate precious metal and primary global safe haven. Moves inversely with US Dollar strength and treasury yields.",
    keyCorrelations: [
      "📉 DXY (US Dollar Index): Strong inverse correlation (-0.85). Dollar strength weakens Gold and vice versa.",
      "📉 US10Y (10-Year Treasury Yield): Sharp inverse correlation (-0.80). When bond yields rise, investors rotate out of non-yielding Gold.",
      "📈 Real Interest Rates: Falling real rates support buying interest in Gold."
    ],
    primaryIndicators: [
      "1. DXY Index (US Dollar Index): Track DXY structural breaks to confirm Gold direction.",
      "2. US10Y Bond Yields: Monitor 10-year treasury yields.",
      "3. US CPI & Core PCE Inflation: Core inflation indicators.",
      "4. Geopolitical Risk Index: Rising global tensions increase safe-haven demand."
    ],
    proTradingTip: "Never buy Gold (XAU/USD) unless DXY and US10Y yields are breaking down below structural support levels (BOS Downward)!"
  },
  {
    market: "💻 NASDAQ 100 (US100 / QQQ)",
    category: "Tech Equities Index",
    badgeColor: "#38bdf8",
    description: "Index of the top 100 technology and growth companies in the US (Apple, Nvidia, Microsoft, Amazon, Tesla, Meta). Highly sensitive to interest rates and momentum.",
    keyCorrelations: [
      "📉 US 10-Year Treasury Yields: Strong inverse correlation (-0.75). Tech companies rely on future growth, pressured by high interest rates.",
      "📈 VIX Index (Fear & Volatility Index): Strong inverse correlation (-0.85). VIX rising above 25 signals deep pullbacks in Nasdaq.",
      "📈 Big Tech Mega-Caps (NVDA, AAPL, MSFT): Make up over 40% of the index weight."
    ],
    primaryIndicators: [
      "1. VIX Volatility Index: Measures market fear and expected volatility.",
      "2. Big Tech Earnings Reports: Earnings performance of mega-cap tech stocks.",
      "3. Federal Reserve Interest Rate: Fed interest rate decisions.",
      "4. ISM Services & Manufacturing PMI: Purchasing Managers Index surveys."
    ],
    proTradingTip: "Track NVDA and Apple at the New York Open (14:30 UTC) - if they open with a Gap Up, US100 is highly likely to establish a strong bullish trend!"
  },
  {
    market: "📈 DOW JONES (US30 / DIA)",
    category: "Industrial & Blue-Chip Equities",
    badgeColor: "#6366f1",
    description: "Index of the top 30 blue-chip industrial and financial giants in the US economy (Boeing, Goldman Sachs, Caterpillar, Home Depot).",
    keyCorrelations: [
      "📈 US Industrial Production & GDP: Direct reflection of industrial growth and consumer spending.",
      "📉 Crude Oil Prices: Higher energy prices increase production costs, putting negative pressure on Dow components.",
      "📈 Financial Sector Performance (XLF / Banks): Bank stock rallies directly support US30 gains."
    ],
    primaryIndicators: [
      "1. ISM Manufacturing PMI: Health of the industrial sector.",
      "2. US GDP Growth Rate: US economic growth metric.",
      "3. Retail Sales & Consumer Confidence: Real spending power and consumer outlook.",
      "4. Crude Oil WTI: Oil prices and energy cost trends."
    ],
    proTradingTip: "US30 consistently respects previous day high/low levels during the first hour of the NY Open (14:30 - 15:30 UTC), often printing a Judas Swing before starting its real move!"
  },
  {
    market: "💶 EUR/USD",
    category: "Major Forex Currency Pair",
    badgeColor: "#10b981",
    description: "The most traded currency pair in the world, representing the balance of trade and growth between the EU and the US.",
    keyCorrelations: [
      "📉 DXY (US Dollar Index): High inverse correlation (-0.95) since EUR/USD constitutes 57.6% of the DXY basket.",
      "📈 ECB vs Fed Interest Rate Differential: Yield spread differences between the European Central Bank and the US Federal Reserve.",
      "📈 German 10Y Bund Yields: Benchmarked European bond yield yields."
    ],
    primaryIndicators: [
      "1. DXY Index: If the DXY is bullish, EUR/USD is structurally bearish and vice versa.",
      "2. ECB Rate Decision & Lagarde Speeches: Central bank policy releases and press conferences.",
      "3. German IFO Business Climate & EU CPI: Economic climate and inflation indicators for Europe.",
      "4. US NFP & US CPI: US macroeconomic data prints."
    ],
    proTradingTip: "Track the London Open (07:00 UTC) - a breakout of the Asian Range High/Low typically sets the directional bias for EUR/USD for the entire day!"
  },
  {
    market: "🪙 BITCOIN (BTC/USD)",
    category: "Crypto Asset / Digital Gold",
    badgeColor: "#f59e0b",
    description: "The premier digital asset and high-momentum market leader, sensitive to global fiat liquidity and risk appetite (Risk-On / Risk-Off).",
    keyCorrelations: [
      "📈 Global M2 Money Supply Growth: High positive correlation (+0.80) with global liquidity injections.",
      "📈 Nasdaq 100 (US100): High positive correlation during risk-on environments.",
      "📉 DXY (Dollar Index): Dollar weakening allows room for explosive rallies in BTC."
    ],
    primaryIndicators: [
      "1. BTC Dominance (%): Market share of BTC relative to altcoins.",
      "2. Bitcoin Spot ETF Net Inflows: Capital flows into institutional spot ETFs.",
      "3. Derivatives Funding Rates & Open Interest: Leverage levels and funding costs indicating liquidation risks.",
      "4. US Fed Liquidity Injection / Balance Sheet: Federal Reserve system balance sheet expansion."
    ],
    proTradingTip: "When funding rates turn negative (shorts paying longs) while price consolidates at a daily Order Block, it suggests retail shorts are trapped and a short squeeze breakout is imminent!"
  },
  {
    market: "🛢️ WTI CRUDE OIL (USOIL)",
    category: "Energy Commodity",
    badgeColor: "#e11d48",
    description: "The most widely consumed energy commodity, directly impacting global inflation and transportation costs.",
    keyCorrelations: [
      "📉 DXY (US Dollar Index): Inverse relationship as oil is globally priced in USD.",
      "📈 Global Industrial Activity & Airline Travel: Increased transport and manufacturing directly boost crude demand.",
      "📉 Strategic Petroleum Reserve (SPR): US government releases from reserve downwardly pressure prices."
    ],
    primaryIndicators: [
      "1. EIA Weekly Crude Oil Inventories: US supply report (Wednesdays at 14:30 UTC).",
      "2. OPEC+ Production Quotas & Meetings: Cartel decisions on output adjustments.",
      "3. Baker Hughes Rig Count: Active drilling rig metrics.",
      "4. Geopolitical Supply Disruptions: Supply disruptions in producing nations."
    ],
    proTradingTip: "Crude oil exhibits strong trend continuation behavior. Re-tests of broken daily high/low levels during the NY session are high probability setups."
  }
];

const CHART_SETUPS_GUIDE = [
  {
    id: "headShoulders",
    name: "Head & Shoulders",
    type: "Bearish Reversal",
    color: "#f43f5e",
    meaning: "A bearish reversal pattern characterized by three peaks (Left Shoulder, Head, Right Shoulder). The Head is the highest peak, and the shoulders are roughly equal. Indicates the buyers' exhaustion.",
    howToTrade: "1. Wait for a breakout below the Neckline with a strong momentum candle.\n2. Enter a SELL position upon the re-test of the Neckline.\n3. Place the Stop Loss above the Right Shoulder.\n4. Take Profit Target: The vertical height between the Head and the Neckline.",
    conditions: "High accuracy when formed after an extended Uptrend on higher timeframes (4H/1H) near key institutional resistance zones."
  },
  {
    id: "rectangles",
    name: "Rectangles",
    type: "Consolidation & Breakdown/Breakout",
    color: "#38bdf8",
    meaning: "Price consolidation between parallel horizontal support and resistance levels. Represents silent institutional accumulation or distribution before a breakout.",
    howToTrade: "1. Avoid trading inside the range midpoint.\n2. Wait for a strong candle close outside the rectangle boundaries.\n3. Enter in the direction of the breakout on a successful re-test.\n4. Place Stop Loss inside the rectangle range, target equal to the range width.",
    conditions: "Success rate increases when the breakout aligns with the Higher Timeframe (HTF) trend, accompanied by a volume spike."
  },
  {
    id: "channels",
    name: "Channels",
    type: "Trend Continuation",
    color: "#10b981",
    meaning: "Price movement within two parallel sloping support and resistance lines. Represents an organized ascending or descending trend.",
    howToTrade: "1. Buy at the lower support line in an ascending channel; sell at the upper resistance line in a descending channel.\n2. Place Stop Loss just below the previous swing low/high.\n3. Take profit at the opposite channel boundary or upon a breakout.",
    conditions: "Requires at least three contact points on both upper and lower boundaries to confirm channel validity."
  },
  {
    id: "flags",
    name: "Flags",
    type: "Trend Continuation",
    color: "#22c55e",
    meaning: "A sharp, rapid impulse move (Pole) followed by a tight consolidation channel sloping against the trend (Flag). High-probability continuation pattern.",
    howToTrade: "1. Wait for a breakout above/below the flag channel in the direction of the pole.\n2. Enter immediately on the breakout candle close or upon a re-test.\n3. Place Stop Loss below the lowest point of the flag.\n4. Take Profit Target: The height of the original flag pole.",
    conditions: "Consolidation must be tight and brief, showing low volume during flag formation and a surge on breakout."
  },
  {
    id: "symmetricalTriangles",
    name: "Symmetrical Triangles",
    type: "Bilateral Consolidation",
    color: "#f59e0b",
    meaning: "Converging sloping support and resistance lines (lower highs and higher lows). Represents contracting volatility prior to an explosive breakout.",
    howToTrade: "1. Wait for a decisive breakout and candle close above resistance (buy) or below support (sell).\n2. Enter on the re-test of the broken line.\n3. Place Stop Loss inside the opposite side of the triangle, target base height.",
    conditions: "Breakout typically occurs between 50% and 75% of the triangle's length, accompanied by volume expansion."
  },
  {
    id: "ascendingTriangles",
    name: "Ascending Triangles",
    type: "Bullish Accumulation",
    color: "#22c55e",
    meaning: "Flat horizontal resistance matched with consecutive higher lows. Indicates buyers are absorbing supply ahead of an upward breakout.",
    howToTrade: "1. Enter a BUY position on a candle close above the horizontal resistance.\n2. Place Stop Loss below the most recent higher low inside the triangle.\n3. Take Profit Target: The vertical height of the triangle base.",
    conditions: "Higher success rate when forming in an established uptrend or near daily/4H institutional support."
  },
  {
    id: "descendingTriangles",
    name: "Descending Triangles",
    type: "Bearish Distribution",
    color: "#f43f5e",
    meaning: "Flat horizontal support matched with consecutive lower highs. Indicates sellers are pressing down on buyers ahead of a breakdown.",
    howToTrade: "1. Enter a SELL position on a candle close below the horizontal support.\n2. Place Stop Loss above the most recent lower high inside the triangle.\n3. Take Profit Target: The vertical height of the triangle base.",
    conditions: "High probability when forming in a downtrend or near major timeframe resistance zones."
  },
  {
    id: "wedgeContinuation",
    name: "Wedge Continuation",
    type: "Trend Continuation",
    color: "#38bdf8",
    meaning: "A converging channel sloping against the major trend (e.g., falling wedge in an uptrend). Represents a temporary correction before continuation.",
    howToTrade: "1. Enter when price breaks the wedge boundary in the direction of the dominant trend.\n2. Place Stop Loss below/above the extreme point of the wedge.\n3. Take Profit Target: The origin of the wedge pattern.",
    conditions: "Declining volume during wedge formation followed by a volume spike on breakout."
  },
  {
    id: "wedgeReversal",
    name: "Wedge Reversal",
    type: "Reversal Pattern",
    color: "#a855f7",
    meaning: "A sloping wedge in the direction of the trend with narrowing price waves. Indicates weakening momentum and impending reversal.",
    howToTrade: "1. Enter opposite to the wedge direction upon breakout of the boundary line.\n2. Place Stop Loss above the highest peak (rising wedge) or below the lowest bottom (falling wedge).\n3. Take Profit Target: The origin of the wedge structure.",
    conditions: "Presence of clear bullish/bearish divergence on RSI or MACD indicators at the wedge extremes."
  },
  {
    id: "doubleTop",
    name: "Double Top (M)",
    type: "Bearish Reversal",
    color: "#f43f5e",
    meaning: "Price attempts to breach resistance twice, fails both times, and prints two equal peaks (M). Signals exhaustion of buying momentum.",
    howToTrade: "1. Wait for a breakout below the neckline (the swing low between the peaks).\n2. Enter a SELL position on the neckline re-test.\n3. Place Stop Loss above the second peak.\n4. Take Profit Target: The vertical height between the peaks and the neckline.",
    conditions: "Second peak should ideally show a bearish reversal candle (Pin Bar or Engulfing) with bearish divergence."
  },
  {
    id: "doubleBottom",
    name: "Double Bottom (W)",
    type: "Bullish Reversal",
    color: "#22c55e",
    meaning: "Price attempts to breach support twice, fails both times, and prints two equal troughs (W). Signals absorption of supply and new uptrend.",
    howToTrade: "1. Wait for a breakout above the neckline (the swing high between the troughs).\n2. Enter a BUY position on the neckline re-test.\n3. Place Stop Loss below the second trough.\n4. Take Profit Target: The vertical height of the double bottom base.",
    conditions: "Second trough formed at an Order Block or liquidity pool with a bullish Doji or Engulfing candle."
  },
  {
    id: "tripleTop",
    name: "Triple Top (MMM)",
    type: "Major Bearish Reversal",
    color: "#f43f5e",
    meaning: "Price fails three consecutive times to breach a major institutional resistance zone. High-probability reversal pattern showing complete seller control.",
    howToTrade: "1. Enter a SELL position on a breakout below the neckline lows or upon re-test.\n2. Place Stop Loss above the highest of the three peaks.\n3. Take Profit Target: The vertical distance from resistance to the neckline.",
    conditions: "Third peak should show weak volume, confirming the exhaustion of buying interest."
  },
  {
    id: "tripleBottom",
    name: "Triple Bottom (WWW)",
    type: "Major Bullish Reversal",
    color: "#22c55e",
    meaning: "Price fails three times to break a major support level, indicating massive institutional demand preventing further decline.",
    howToTrade: "1. Enter a BUY position on a breakout above the neckline peaks.\n2. Place Stop Loss below the lowest of the three troughs.\n3. Take Profit Target: The vertical height of the pattern.",
    conditions: "Significant volume expansion on the breakout from the third trough."
  },
  {
    id: "pennants",
    name: "Pennants",
    type: "Fast Trend Continuation",
    color: "#38bdf8",
    meaning: "A clear impulse move (Pole) followed by a tiny symmetrical triangle consolidation. Represents a brief pause before resuming the trend.",
    howToTrade: "1. Enter immediately on the breakout in the direction of the pole.\n2. Place Stop Loss below the pennant low.\n3. Take Profit Target: The height of the flag pole.",
    conditions: "Commonly found on lower timeframes (1M/5M/15M) during high-impact news or rapid momentum rallies."
  }
];

const ENCYCLOPEDIA_STRATEGIES = [
  {
    name: "Reda System (Macro & Orderflow Execution)",
    category: "Fundamental & Technical Institutional Trading",
    authorSource: "Reda Souhail (Trader & Mentor - www.ismashprofit.com)",
    description: "A comprehensive professional trading framework combining fundamental macroeconomic news bias analysis, technical bias verification, institutional orderflow mapping, POI classification, and rule-based execution.",
    rules: [
      "Step 1: Understanding the Bias (Fundamental) — Divide news into Programmed News (CPI, NFP, Unemployment, Inflation) which establish medium-to-long-term BIAS, and Headlines (Geopolitical, wars, unexpected speeches) which trigger rapid sentiment shifts and high volatility.",
      "Step 2: Technical Bias Verification — Verify direction via three candle/level structures: Normal HTF Candle Close (uses HTF Pivot Points as key zones), CRT Close (Pivot Points become secondary; bias relies on CRT candle behavior), and Special Engulfing Bar Close (strong engulfing bar close overrides Pivot Points; bias is determined solely by the candle close).",
      "Step 3: Orderflow Mapping — Do not guess direction. Perform Liquidity Mapping (Sell-side & Buy-side Liquidity, Equal Highs/Lows), define Supply & Demand Zones, and identify Valid Breakouts (Trendline or S/R Breakouts). Flow sequence: Liquidity → Reaction → Continuation.",
      "Step 4: Identifying Points of Interest (POI) — If Market Structure matches Bias: Use Continuation Strategies (Order Block (OB), Fair Value Gap (FVG), Fibonacci levels, BOS & Liquidity Sweep). If Market Structure opposes Bias: Wait for a Reversal Move (CHoCH, BOS & Liquidity Sweep).",
      "Step 5: Timing the Trade — Wait patiently. Identify session Killzones with high liquidity, institutional volume, and clean movements to avoid market manipulations.",
      "Step 6: Execution & Risk Management — Read price action before entry. Observe how price approaches levels to avoid Fake Breakouts and False Entries. Apply strict risk management to preserve capital. Final rule: Analysis without disciplined execution is worthless."
    ],
    winRateExpectation: "70% - 80%",
    avgRiskReward: "1:3 to 1:6",
    citations: ["Reda System Manual (2026)", "Ismashprofit Research"]
  },
  {
    name: "Heikin Ashi + 100 EMA 6-Step Scalping Strategy",
    category: "Trend Scalping & Doji Reversal",
    authorSource: "Pro Scalping Framework (Image Checklist)",
    description: "A 6-step precision scalping system combining Heikin Ashi smooth candles, 100 EMA trend filtering, pullback validation, and high-volume Doji entries.",
    rules: [
      "Step 1: Chart Setup — Heikin Ashi candles + 100 EMA. Active Trading Window: 10am - 12pm EST (15:00 - 17:00 UTC).",
      "Step 2: Market Structure — Buys strictly above the 100 EMA. Sells strictly below the 100 EMA.",
      "Step 3: Clean Pullback — 2 flat-bottom Heikin Ashi candles for sells; 2 flat-top Heikin Ashi candles for buys.",
      "Step 4: High-Volume Doji — Small candle body with long wicks, noticeably bigger than the prior candle.",
      "Step 5: Enter on Close — Enter position at Doji candle close. Place Stop-Loss past the wick.",
      "Step 6: Take Profit 1:1 — Minimum 1:1 R:R target (can stretch to 2:1 or 3:1). In and out fast!"
    ],
    winRateExpectation: "72% - 80%",
    avgRiskReward: "1:1 to 1:3",
    citations: ["Pro Scalping Checklist", "Heikin Ashi Technical Analysis"]
  },
  {
    name: "Smart Money Concepts (SMC) & ICT Inner Circle",
    category: "Institutional Order Flow",
    authorSource: "Michael J. Huddleston (The Inner Circle Trader - ICT)",
    description: "Tracks institutional liquidity injection, market maker displacement, and order block mitigation rather than retail indicators.",
    rules: [
      "Identify 4H/1H Higher Timeframe Directional Bias via Break of Structure (BOS).",
      "Wait for liquidity sweep above Previous Day High (PDH) or below Previous Day Low (PDL).",
      "Locate unmitigated Order Blocks (OB) or Fair Value Gaps (FVG) in Discount zone for Buy / Premium zone for Sell.",
      "Enter on 5M/1M Change of Character (CHoCH) with Stop-Loss below the Order Block wick."
    ],
    winRateExpectation: "68% - 78%",
    avgRiskReward: "1:3 to 1:5",
    citations: ["ICT Mentorship Series (2022/2023)", "Investopedia Institutional Trading Guide"]
  },
  {
    name: "Wyckoff Accumulation & Distribution Schematics",
    category: "Market Structure & Volume",
    authorSource: "Richard D. Wyckoff (Wyckoff Method Institute)",
    description: "Analyzes smart money accumulation and distribution phases using price action, volume spread, and institutional testing.",
    rules: [
      "Phase A: Preliminary Support (PS), Selling Climax (SC), Automatic Rally (AR), and Secondary Test (ST).",
      "Phase B: Building cause and absorbing floating supply.",
      "Phase C: The Spring or Shakeout (liquidity sweep below SC lows).",
      "Phase D: Sign of Strength (SOS) & Last Point of Support (LPS) for high-probability entry."
    ],
    winRateExpectation: "65% - 75%",
    avgRiskReward: "1:4+",
    citations: ["Studies in Tape Reading - Richard D. Wyckoff", "Wyckoff Analytics Research"]
  },
  {
    name: "Al Brooks Price Action & Trend Continuation",
    category: "Pure Price Action",
    authorSource: "Dr. Al Brooks (Brooks Price Action)",
    description: "Focuses on reading every single bar, trend channel lines, breakout pullbacks, and high-probability Always In Direction.",
    rules: [
      "Identify strong breakout bar closing on its extreme high/low.",
      "Wait for First Pullback (High 1 / Low 1) or Second Pullback (High 2 / Low 2).",
      "Enter on signal bar close above/below previous bar high.",
      "Maintain Stop-Loss beyond the swing pivot."
    ],
    winRateExpectation: "60% - 70%",
    avgRiskReward: "1:2 to 1:3",
    citations: ["Trading Price Action Trends - Al Brooks (Wiley Trading)"]
  },
  {
    name: "Supply & Demand Zone Imbalance Trading",
    category: "Market Dynamics",
    authorSource: "Sam Seiden & Market Profile Research",
    description: "Trades sharp price displacement originating from origin consolidation zones where unfilled institutional orders remain.",
    rules: [
      "Locate Drop-Base-Rally (DBR) or Rally-Base-Drop (RBD) formations.",
      "Ensure the departure candle is strong displacement with zero wicks.",
      "Place Limit orders at proximal line (edge of zone) with Stop-Loss beyond distal line."
    ],
    winRateExpectation: "62% - 72%",
    avgRiskReward: "1:3+",
    citations: ["Online Trading Academy Supply & Demand Framework"]
  },
  {
    name: "@SkillzTrading 4-Step Institutional System (System Summary)",
    category: "Institutional Framework",
    authorSource: "@SkillzTrading Institutional System",
    description: "Summary of the 4-step institutional system: Identify structure and zone, check traps and liquidity, confirm CHoCH on lower timeframe, and secure profits smartly.",
    rules: [
      "1. Structure & Zone Identification: Search for a candle that created a clear imbalance (momentum) and broke a major market structure (BOS) with a Fair Value Gap (FVG).",
      "2. Check the Trap: Ensure there is no liquidity (equal lows/highs) below your zone acting as inducement. Identify the real Order Block below the liquidity.",
      "3. No Blind Trading: Do not place pending orders blindly. Go down to the lower timeframe and wait for a Change of Character (CHoCH) as confirmation of smart money entry.",
      "4. Smart Profit Securing: Once price moves in your favor and forms higher lows (in buy setups), move your stop-loss below each new low to protect profits."
    ],
    winRateExpectation: "75% - 85%",
    avgRiskReward: "1:3 to 1:6",
    citations: ["@SkillzTrading Official Institutional System", "Smart Money Concept Rules"]
  },
  {
    name: "Thomas Wade 2nd Entry & Pure Price Action System",
    category: "Pure Price Action & Futures Scalping",
    authorSource: "Thomas Wade (Wade Trading Academy / PATs Methodology)",
    description: "High-probability price action scalping system focused on reading 21 EMA trend bias, micro-trendline breaks, 2nd entries (2EL/2ES), and high-quality signal bar closes.",
    rules: [
      "Chart Setup & Context — Clean chart with 21 EMA (Exponential Moving Average). Trend bias confirmed by 21 EMA slope and price position.",
      "Strict Rule: No Counter-Trend Trading — Only take 2nd entries (2EL for long, 2ES for short) aligning with the primary trend.",
      "Wait for 2nd Entry Setup — Count 1st pullback attempt (which often fails as a trap), then wait for the 2nd pullback to complete near the 21 EMA.",
      "Signal Bar Validation — Signal bar must close near its extreme in trade direction (bullish close for buys, bearish close for sells).",
      "Execution — Place Buy Stop 1 tick above signal bar high (or Sell Stop 1 tick below for shorts). Stop-Loss 1 tick past signal bar wick.",
      "Risk & Take Profit — Minimum 1:1.5 to 1:3 Risk:Reward or scale out partials at key trendline resistance."
    ],
    winRateExpectation: "70% - 80%",
    avgRiskReward: "1:1.5 to 1:3",
    citations: ["Wade Trading Academy", "Al Brooks & PATs Price Action Methodology"]
  }
];

const STRATEGY_CHECKLISTS = {
  redaSystem: {
    id: "redaSystem",
    title: "Reda System Macro & Orderflow Checklist",
    badge: "✨ REDA SYSTEM",
    color: "#facc15",
    description: "Multi-layered confluence system incorporating fundamental bias, candle close technicals, orderflow liquidity mapping, and strict Killzone execution rules.",
    items: [
      { key: "reda1", num: 1, title: "1. Fundamental Bias Confirmation", desc: "Identify if Programmed News (CPI/NFP/Inflation) or Headline news is active, and confirm the current macro direction bias." },
      { key: "reda2", num: 2, title: "2. Technical Bias Close State", desc: "Analyze the HTF candle close. Validate the level structure: Normal close (Pivot Points), CRT Close (Theory behavior), or Engulfing Bar Close (dominates level)." },
      { key: "reda3", num: 3, title: "3. Institutional Orderflow Mapping", desc: "Map liquidity pools (Buy-side/Sell-side liquidity, Equal Highs/Lows), define Supply/Demand zones, and check for valid structural breakouts." },
      { key: "reda4", num: 4, title: "4. Point of Interest (POI) & Zone Alignment", desc: "Align with structure. If matching bias, locate OB/FVG for Continuation. If opposing bias, wait for LTF Reversal (CHoCH)." },
      { key: "reda5", num: 5, title: "5. Killzone Session Timing Check", desc: "Verify that execution is happening strictly within high-liquidity session windows (London/New York Killzones) to avoid manipulation." },
      { key: "reda6", num: 6, title: "6. Execution Quality & Risk Management", desc: "Observe price action arrival at the level to avoid Fake Breakouts. Verify Stop Loss placement and limit risk to ≤1% of capital." }
    ]
  },
  thomasWade: {
    id: "thomasWade",
    title: "Thomas Wade 2nd Entry (2E) & Price Action Checklist",
    badge: "🎯 THOMAS WADE PRICE ACTION",
    color: "#06b6d4",
    description: "2nd Entry Long/Short, 21 EMA trend context, and Signal Bar validation.",
    items: [
      { key: "tw1", num: 1, title: "1. Trend Context & 21 EMA Slope", desc: "Market has clear trend bias with price holding cleanly above (for Buys) or below (for Sells) the 21 EMA." },
      { key: "tw2", num: 2, title: "2. Micro-Trendline & Channel Check", desc: "Micro trendline drawn to confirm slope and ensure price is not slamming into major key support/resistance." },
      { key: "tw3", num: 3, title: "3. First Entry Count (1st Attempt)", desc: "Initial counter-trend pullback attempted and failed (1st entry trap identified)." },
      { key: "tw4", num: 4, title: "4. Second Entry Confirmation (2EL / 2ES)", desc: "High-probability 2nd entry setup formed at or near the 21 EMA dynamic zone." },
      { key: "tw5", num: 5, title: "5. Signal Bar Quality Validation", desc: "Signal bar is a solid trend bar closing near its extreme in the trade direction." },
      { key: "tw6", num: 6, title: "6. Order Execution & Stop Placement", desc: "Stop entry order placed 1 tick past signal bar with Stop-Loss 1 tick beyond opposite wick." }
    ]
  },
  skillzTrading: {
    id: "skillzTrading",
    title: "@SkillzTrading 4-Step Institutional System (System Summary)",
    badge: "🔮 SKILLZTRADING SYSTEM",
    color: "#a855f7",
    description: "Institutional 4-step trading system: Identify structure, check trap and liquidity, confirm CHoCH, and secure profits smartly.",
    items: [
      { key: "sk1", num: 1, title: "1. Identify Structure & Zone", desc: "Search for a candle that created a clear imbalance (momentum) and broke a major market structure (BOS) with a Fair Value Gap (FVG)." },
      { key: "sk2", num: 2, title: "2. Liquidity Trap Check", desc: "Ensure there is no liquidity (equal lows/highs) below your zone acting as inducement. Identify the real Order Block below the liquidity." },
      { key: "sk3", num: 3, title: "3. LTF Confirmation (CHoCH)", desc: "Do not place pending orders blindly. Go down to the lower timeframe and wait for a Change of Character (CHoCH) as confirmation of smart money entry." },
      { key: "sk4", num: 4, title: "4. Smart Breakeven", desc: "Once price moves in your favor and forms higher lows (in buy setups), move your stop-loss below each new low to protect profits." }
    ]
  },
  heikinAshi: {
    id: "heikinAshi",
    title: "Heikin Ashi + 100 EMA 6-Step Strategy",
    badge: "🔥 TRENDING IMAGE STRATEGY",
    color: "#10b981",
    description: "6-step precision scalping strategy using Heikin Ashi candles & 100 EMA trend filter.",
    items: [
      { key: "step1", num: 1, title: "1. Chart Setup", desc: "Heikin Ashi + 100 EMA. Active Trading Window: 10am - 12pm EST (15:00 - 17:00 UTC)." },
      { key: "step2", num: 2, title: "2. Market Structure", desc: "Buys strictly above the 100 EMA. Sells strictly below the 100 EMA." },
      { key: "step3", num: 3, title: "3. Clean Pullback", desc: "2 flat-bottom Heikin Ashi candles for sells; 2 flat-top Heikin Ashi candles for buys." },
      { key: "step4", num: 4, title: "4. High-Volume Doji", desc: "Small candle body with long wicks, noticeably bigger than the prior candle." },
      { key: "step5", num: 5, title: "5. Enter on Close", desc: "Enter position at Doji candle close. Place Stop-Loss past the wick." },
      { key: "step6", num: 6, title: "6. Take Profit 1:1", desc: "Min 1:1 R:R target (can stretch to 2:1 or 3:1). In and out fast!" }
    ]
  },
  smc: {
    id: "smc",
    title: "Smart Money Concepts (SMC / ICT) 6-Step Checklist",
    badge: "🧠 INSTITUTIONAL ORDER FLOW",
    color: "#6366f1",
    description: "Institutional liquidity sweep & order block mitigation checklist.",
    items: [
      { key: "smc1", num: 1, title: "1. HTF Directional Bias", desc: "4H & 1H Break of Structure (BOS) pointing cleanly in your trade direction." },
      { key: "smc2", num: 2, title: "2. Liquidity Sweep", desc: "Asian High/Low, Previous Day High/Low (PDH/PDL), or Equal Highs (EQH) swept." },
      { key: "smc3", num: 3, title: "3. Unmitigated OB / FVG", desc: "Price tapping an unmitigated 15M/1H Order Block or filling 50% Fair Value Gap." },
      { key: "smc4", num: 4, title: "4. LTF CHoCH & Displacement", desc: "5M/1M Change of Character with explosive institutional momentum candle." },
      { key: "smc5", num: 5, title: "5. News Calendar Safety", desc: "Clear of high-impact NFP, CPI, or FOMC news releases in the next 30 minutes." },
      { key: "smc6", num: 6, title: "6. Risk & R:R Optimization", desc: "Risk capped at ≤1% with Stop-Loss beyond OB wick and minimum 1:3 R:R target." }
    ]
  },
  wyckoff: {
    id: "wyckoff",
    title: "Wyckoff Method Accumulation & Distribution Checklist",
    badge: "📊 MARKET PROFILE & VOLUME",
    color: "#38bdf8",
    description: "Phase C Spring / Shakeout and Phase D Sign of Strength entry validation.",
    items: [
      { key: "wyck1", num: 1, title: "1. Phase Identification", desc: "Market is clearly in Phase C or D Accumulation or Distribution schematic." },
      { key: "wyck2", num: 2, title: "2. Climax & Boundary Definition", desc: "Selling Climax (SC) and Automatic Rally (AR) boundaries clearly established." },
      { key: "wyck3", num: 3, title: "3. Spring / Shakeout Sweep", desc: "False breakdown below SC low with immediate high-volume recovery." },
      { key: "wyck4", num: 4, title: "4. Volume Expansion", desc: "Volume surge on Sign of Strength (SOS) displacement bar." },
      { key: "wyck5", num: 5, title: "5. Last Point of Support (LPS)", desc: "Low volume pullback into LPS for optimal entry placement." },
      { key: "wyck6", num: 6, title: "6. Target Liquidity Range", desc: "Stop-Loss beyond Spring low, targeting Phase D Trading Range Highs." }
    ]
  },
  albrooks: {
    id: "albrooks",
    title: "Al Brooks Price Action & Trend Channel Checklist",
    badge: "📈 PURE PRICE ACTION",
    color: "#a855f7",
    description: "Always In Direction, High 2 / Low 2 pullbacks, and breakout bar validation.",
    items: [
      { key: "ab1", num: 1, title: "1. Trend Channel Context", desc: "Strong Always In Direction with tight trend channel and no major resistance." },
      { key: "ab2", num: 2, title: "2. Breakout Bar Quality", desc: "Strong trend bar closing on its extreme high/low in trade direction." },
      { key: "ab3", num: 3, title: "3. Pullback Count (High 2 / Low 2)", desc: "Second pullback attempt in direction of the primary trend." },
      { key: "ab4", num: 4, title: "4. Signal Bar Quality", desc: "Quality signal bar closing near extreme in the direction of the trade." },
      { key: "ab5", num: 5, title: "5. Stop Entry Order", desc: "Place buy/sell stop order 1 tick above/below signal bar high/low." },
      { key: "ab6", num: 6, title: "6. Managed Risk & Scale", desc: "Initial Stop-Loss beyond signal bar; partial profit scale-out at 1:2 R:R." }
    ]
  },
  supplyDemand: {
    id: "supplyDemand",
    title: "Supply & Demand Imbalance Entry Checklist",
    badge: "⚖️ DISPLACEMENT & IMBALANCE",
    color: "#f59e0b",
    description: "Un-tested Drop-Base-Rally or Rally-Base-Drop imbalance zones.",
    items: [
      { key: "sd1", num: 1, title: "1. Fresh Un-tested Zone", desc: "Imbalance zone has 0 previous touches or mitigations." },
      { key: "sd2", num: 2, title: "2. Explosive Departure", desc: "Departure candle is large displacement body with zero wicks." },
      { key: "sd3", num: 3, title: "3. Discount / Premium Alignment", desc: "Buy in Discount (<50% range); Sell in Premium (>50% range)." },
      { key: "sd4", num: 4, title: "4. Time at Base", desc: "Consolidation base contains ≤3 candles (fast institutional fill)." },
      { key: "sd5", num: 5, title: "5. Limit Order Entry", desc: "Place limit order at proximal line of the zone." },
      { key: "sd6", num: 6, title: "6. Distal Line Stop-Loss", desc: "Stop-Loss placed beyond distal line with minimum 1:3 R:R target." }
    ]
  }
};

const CANDLESTICK_PATTERNS_GUIDE = [
  {
    name: "Hammer",
    type: "bullish",
    importance: "⭐ HIGH",
    meaning: "Bullish rejection pattern showing sellers pushed price low, but buyers stepped in aggressively to close near top.",
    significance: "High probability reversal signal when forming at 1H/4H Bullish Order Blocks or Discount Liquidity Pools."
  },
  {
    name: "Inverted Hammer / Shooting Star",
    type: "bearish",
    importance: "⭐ HIGH",
    meaning: "Bearish rejection pattern with a long upper wick. Buyers pushed higher but institutional supply dumped price down.",
    significance: "Key reversal signal when occurring after a liquidity sweep of Equal Highs (EQH)."
  },
  {
    name: "Bullish Engulfing",
    type: "bullish",
    importance: "⭐⭐ VERY HIGH",
    meaning: "A large green candle body completely swallows the previous red candle's body.",
    significance: "Demonstrates overwhelming buyer momentum. Confirms 5M CHoCH or BOS."
  },
  {
    name: "Bearish Engulfing",
    type: "bearish",
    importance: "⭐⭐ VERY HIGH",
    meaning: "A large red candle body completely swallows the previous green candle's body.",
    significance: "Demonstrates overwhelming seller momentum. Confirms distribution and Bearish FVG creation."
  },
  {
    name: "Pin Bar (Bullish / Bearish)",
    type: "bullish",
    importance: "⭐⭐ VERY HIGH",
    meaning: "Small body with a wick at least 2-3x the size of the body, signifying instant rejection.",
    significance: "Classic liquidity hunt bar. Indicates smart money stop-runs before trend reversal."
  },
  {
    name: "Marubozu (Bullish / Bearish)",
    type: "bullish",
    importance: "⭐⭐ VERY HIGH",
    meaning: "Solid full candle body with virtually zero top or bottom wicks.",
    significance: "Pure institutional displacement. Creates Fair Value Gaps (FVG) for entry re-tests."
  },
  {
    name: "Doji / Spinning Top",
    type: "neutral",
    importance: "MEDIUM",
    meaning: "Open and Close prices are nearly identical, showing indecision between buyers and sellers.",
    significance: "Signals potential pause or trend reversal. Wait for next candle confirmation."
  },
  {
    name: "Morning Star (3-Bar Reversal)",
    type: "bullish",
    importance: "⭐⭐⭐ CRITICAL",
    meaning: "Bearish candle followed by a small Doji/Spinning top, followed by a strong Bullish engulfing candle.",
    significance: "One of the most reliable 3-candle reversal patterns in financial markets."
  },
  {
    name: "Evening Star (3-Bar Reversal)",
    type: "bearish",
    importance: "⭐⭐⭐ CRITICAL",
    meaning: "Bullish candle followed by a small Doji/Spinning top, followed by a strong Bearish engulfing candle.",
    significance: "Top reversal pattern indicating complete exhaustion of buyers."
  }
];

export default function KnowledgeModal({ isOpen, onClose, mode = "modal", lang = "en" }) {
  const isPageMode = mode === "page";
  const [activeTab, setActiveTab] = useState("strategies");
  const [personalNotes, setPersonalNotes] = useState([]);
  const tabsNavRef = useRef(null);

  const [langState, setLangState] = useState(lang);
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedLang = localStorage.getItem("preferred_language");
      if (savedLang) {
        setLangState(savedLang);
      }
    }
  }, [lang]);

  // Strategy Checklist selection state
  const [selectedStrategyKey, setSelectedStrategyKey] = useState("redaSystem");
  const [checklistState, setChecklistState] = useState({});
  
  // Custom Strategy Form
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("Custom Strategy");
  const [newContent, setNewContent] = useState("");
  const [newRulesText, setNewRulesText] = useState("");

  useEffect(() => {
    const savedNotes = JSON.parse(localStorage.getItem("pro_trader_custom_knowledge") || "[]");
    setPersonalNotes(savedNotes);

    const savedChecklist = JSON.parse(localStorage.getItem("pro_trader_strategy_checklists") || "{}");
    setChecklistState(savedChecklist);
  }, []);

  if (!isPageMode && !isOpen) return null;

  const handleAddCustomNote = (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const rulesArray = newRulesText.split("\n").filter((r) => r.trim().length > 0);
    const item = {
      id: Date.now(),
      title: newTitle,
      category: newCategory,
      content: newContent,
      rules: rulesArray,
      createdAt: new Date().toLocaleDateString()
    };

    const updated = [item, ...personalNotes];
    setPersonalNotes(updated);
    localStorage.setItem("pro_trader_custom_knowledge", JSON.stringify(updated));

    setNewTitle("");
    setNewContent("");
    setNewRulesText("");
  };

  const handleDeleteNote = (id) => {
    const updated = personalNotes.filter((n) => n.id !== id);
    setPersonalNotes(updated);
    localStorage.setItem("pro_trader_custom_knowledge", JSON.stringify(updated));
  };

  const toggleChecklistItem = (stratKey, itemKey) => {
    const updated = {
      ...checklistState,
      [stratKey]: {
        ...(checklistState[stratKey] || {}),
        [itemKey]: !((checklistState[stratKey] || {})[itemKey])
      }
    };
    setChecklistState(updated);
    localStorage.setItem("pro_trader_strategy_checklists", JSON.stringify(updated));
  };

  const currentStratData = STRATEGY_CHECKLISTS[selectedStrategyKey] || STRATEGY_CHECKLISTS.skillzTrading;
  const currentCheckedMap = checklistState[selectedStrategyKey] || {};
  const currentScore = currentStratData.items.filter((item) => currentCheckedMap[item.key]).length;
  const isStrategyReady = currentScore >= currentStratData.items.length - 1;

  const l = LOCAL_KNOW[langState] || LOCAL_KNOW.en;

  const tabs = [
    { key: "strategies", label: l.tabs.strategies },
    { key: "checklist", label: l.tabs.checklist },
    { key: "chartsetups", label: l.tabs.chartsetups },
    { key: "psychology", label: l.tabs.psychology },
    { key: "fundamental", label: l.tabs.fundamental },
    { key: "indicators", label: l.tabs.indicators },
    { key: "candlesticks", label: l.tabs.candlesticks },
    { key: "custom", label: `${l.tabs.custom} (${personalNotes.length})` },
  ];

  // Page mode: full-page layout, no overlay
  const outerStyle = isPageMode
    ? { background: "#050506", minHeight: "100vh", display: "flex", flexDirection: "column" }
    : { position: "fixed", inset: 0, background: "rgba(5,5,6,0.92)", backdropFilter: "blur(12px)", zIndex: 10000, display: "grid", placeItems: "center", padding: "20px" };

  const innerStyle = isPageMode
    ? { background: "#09090b", flex: 1, display: "flex", flexDirection: "column", overflow: "visible" }
    : { background: "#09090b", border: "1px solid #222225", borderRadius: "16px", width: "100%", maxWidth: "1180px", maxHeight: "94vh", overflow: "hidden", display: "grid", gridTemplateRows: "auto auto 1fr", boxShadow: "0 25px 50px rgba(0,0,0,0.7)" };

  return (
    <div style={outerStyle} onClick={isPageMode ? undefined : onClose}>
      <div onClick={isPageMode ? undefined : (e) => e.stopPropagation()} style={innerStyle}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderBottom: "1px solid #222225", ...(isPageMode ? { position: "sticky", top: 0, zIndex: 100, background: "#09090b" } : {}) }}>
          <div>
            <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              <span>📚</span> {l.pageTitle}
            </h2>
            <p style={{ margin: "4px 0 0", color: "#888893", fontSize: "12px" }}>{l.pageDesc}</p>
          </div>
          {isPageMode ? (
            <a href="/" style={{ background: "#111113", border: "1px solid #222225", color: "#a3e635", padding: "8px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "6px", flexShrink: 0, boxShadow: "0 2px 8px rgba(163,230,53,0.05)" }}>
              {l.backToJournal}
            </a>
          ) : (
            <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#888893", fontSize: "20px", cursor: "pointer" }}>✕</button>
          )}
        </div>

        {/* Tech Glass Tabs Navigation Bar */}
        <div style={{ position: isPageMode ? "sticky" : "relative", top: isPageMode ? "68px" : undefined, zIndex: isPageMode ? 99 : undefined, background: "#090d12", borderBottom: "1px solid #21262d", padding: "10px 16px", display: "flex", alignItems: "center", gap: "8px" }}>
          
          {/* Scroll Left Control Arrow */}
          <button
            onClick={() => tabsNavRef.current?.scrollBy({ left: -300, behavior: "smooth" })}
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              border: "1px solid #38bdf8",
              color: "#38bdf8",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "900",
              flexShrink: 0,
              boxShadow: "0 0 10px rgba(56, 189, 248, 0.3)",
              userSelect: "none"
            }}
            title="Scroll Left"
          >
            ‹
          </button>

          {/* Smooth Scrollable Container with Mouse Wheel Support */}
          <div
            ref={tabsNavRef}
            onWheel={(e) => {
              if (tabsNavRef.current) {
                tabsNavRef.current.scrollLeft += e.deltaY;
              }
            }}
            style={{
              display: "flex",
              gap: "8px",
              overflowX: "auto",
              scrollBehavior: "smooth",
              scrollbarWidth: "none",
              msOverflowStyle: "none",
              padding: "4px 2px",
              flex: 1
            }}
          >
            {tabs.map((t) => {
              const isActive = activeTab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => setActiveTab(t.key)}
                  style={{
                    padding: "10px 18px",
                    background: isActive
                      ? "linear-gradient(135deg, rgba(99, 102, 241, 0.28), rgba(59, 130, 246, 0.18))"
                      : "rgba(22, 27, 34, 0.6)",
                    border: isActive ? "1px solid #6366f1" : "1px solid #21262d",
                    borderRadius: "10px",
                    color: isActive ? "#38bdf8" : "#8b949e",
                    cursor: "pointer",
                    fontSize: "13px",
                    fontWeight: "800",
                    whiteSpace: "nowrap",
                    boxShadow: isActive ? "0 0 14px rgba(99, 102, 241, 0.4)" : "none",
                    transition: "all 0.2s ease-in-out",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    flexShrink: 0
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Scroll Right Control Arrow */}
          <button
            onClick={() => tabsNavRef.current?.scrollBy({ left: 300, behavior: "smooth" })}
            style={{
              background: "linear-gradient(135deg, #1e293b, #0f172a)",
              border: "1px solid #38bdf8",
              color: "#38bdf8",
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              display: "grid",
              placeItems: "center",
              cursor: "pointer",
              fontSize: "18px",
              fontWeight: "900",
              flexShrink: 0,
              boxShadow: "0 0 10px rgba(56, 189, 248, 0.3)",
              userSelect: "none"
            }}
            title="Scroll Right"
          >
            ›
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div style={{ overflowY: isPageMode ? "visible" : "auto", padding: "24px", display: "flex", flexDirection: "column", gap: "24px", ...(isPageMode ? { flex: 1 } : {}) }}>

          {/* TAB 1: PRO STRATEGIES ENCYCLOPEDIA */}
          {activeTab === "strategies" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>📖 Master Trading Strategies &amp; Institutional Rules</h3>
                <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>In-depth breakdown of high-win-rate world strategies backed by professional sources &amp; books.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {ENCYCLOPEDIA_STRATEGIES.map((strat, i) => (
                  <div key={i} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: "800", padding: "3px 8px", borderRadius: "4px", background: "#6366f122", color: "#818cf8", textTransform: "uppercase" }}>
                          {strat.category}
                        </span>
                        <h4 style={{ margin: "6px 0 2px", fontSize: "16px", fontWeight: "800", color: "#e6edf3" }}>{strat.name}</h4>
                        <span style={{ color: "#38bdf8", fontSize: "11px", fontWeight: "600" }}>Source / Originator: {strat.authorSource}</span>
                      </div>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: "#22c55e22", color: "#22c55e" }}>
                          Win Rate: {strat.winRateExpectation}
                        </span>
                        <span style={{ padding: "4px 10px", borderRadius: "6px", fontSize: "11px", fontWeight: "700", background: "#f59e0b22", color: "#fbbf24" }}>
                          Risk:Reward: {strat.avgRiskReward}
                        </span>
                      </div>
                    </div>

                    <p style={{ margin: 0, color: "#8b949e", fontSize: "13px", lineHeight: "1.5" }}>{strat.description}</p>

                    <div style={{ background: "#0d1117", borderRadius: "8px", padding: "14px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#e6edf3", fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "8px" }}>📋 Execution Rules &amp; Entry Criteria:</span>
                      <ul style={{ margin: 0, paddingLeft: "18px", color: "#8b949e", fontSize: "12px", lineHeight: "1.6" }}>
                        {strat.rules.map((rule, idx) => (
                          <li key={idx} style={{ marginBottom: "4px" }}>{rule}</li>
                        ))}
                      </ul>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#484f58", fontSize: "11px" }}>
                      <span>📚 References:</span>
                      {strat.citations.map((c, idx) => (
                        <span key={idx} style={{ background: "#0d1117", padding: "2px 8px", borderRadius: "4px", border: "1px solid #21262d" }}>{c}</span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: STRATEGY-SPECIFIC PRE-TRADE CHECKLIST */}
          {activeTab === "checklist" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
              
              {/* Strategy Selector Header */}
              <div style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px", width: "100%" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>
                      🎯 Select Trading Strategy for Pre-Flight Validation
                    </label>
                    <select
                      value={selectedStrategyKey}
                      onChange={(e) => setSelectedStrategyKey(e.target.value)}
                      style={{ background: "#0d1117", border: "1px solid #38bdf8", color: "#e6edf3", padding: "10px 14px", borderRadius: "8px", fontSize: "14px", fontWeight: "700", width: "340px" }}
                    >
                      <option value="redaSystem">✨ Reda System (Macro &amp; Orderflow)</option>
                      <option value="thomasWade">🎯 Thomas Wade 2nd Entry (2E) Price Action</option>
                      <option value="skillzTrading">🔮 @SkillzTrading 4-Step System (System Summary)</option>
                      <option value="heikinAshi">🟢 Heikin Ashi + 100 EMA (Trending Image Strategy)</option>
                      <option value="smc">🔵 Smart Money Concepts (SMC / ICT)</option>
                      <option value="wyckoff">🩵 Wyckoff Accumulation &amp; Distribution</option>
                      <option value="albrooks">🟣 Al Brooks Price Action &amp; Trend Channel</option>
                      <option value="supplyDemand">🟡 Supply &amp; Demand Imbalance</option>
                    </select>
                  </div>

                  <div style={{ padding: "10px 20px", borderRadius: "10px", background: isStrategyReady ? "#22c55e22" : "#f59e0b22", border: `1px solid ${isStrategyReady ? "#22c55e" : "#f59e0b"}`, textAlign: "center" }}>
                    <span style={{ color: isStrategyReady ? "#22c55e" : "#fbbf24", fontWeight: "800", fontSize: "15px" }}>
                      Checklist Score: {currentScore} / {currentStratData.items.length} {isStrategyReady ? "🚀 EXECUTION READY" : "⚠️ NEED MORE CONFLUENCE"}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "4px" }}>
                  <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "11px", fontWeight: "800", background: `${currentStratData.color}22`, color: currentStratData.color }}>
                    {currentStratData.badge}
                  </span>
                  <p style={{ margin: 0, color: "#8b949e", fontSize: "12px" }}>{currentStratData.description}</p>
                </div>
              </div>

              {/* Unique Checklist Grid */}
              <div className="checklistGrid">
                {currentStratData.items.map((item) => {
                  const isChecked = !!currentCheckedMap[item.key];
                  return (
                    <div
                      key={item.key}
                      onClick={() => toggleChecklistItem(selectedStrategyKey, item.key)}
                      style={{
                        background: isChecked ? `${currentStratData.color}15` : "#161b22",
                        border: `1px solid ${isChecked ? currentStratData.color : "#21262d"}`,
                        borderRadius: "12px",
                        padding: "20px",
                        cursor: "pointer",
                        display: "grid",
                        gridTemplateColumns: "auto 1fr auto",
                        gap: "14px",
                        alignItems: "start",
                        transition: "all 0.15s",
                        width: "100%",
                        boxSizing: "border-box"
                      }}
                    >
                      <div
                        style={{
                          width: "28px",
                          height: "28px",
                          borderRadius: "50%",
                          background: isChecked ? currentStratData.color : "#21262d",
                          color: isChecked ? "#fff" : "#8b949e",
                          display: "grid",
                          placeItems: "center",
                          fontWeight: "800",
                          fontSize: "13px"
                        }}
                      >
                        {item.num}
                      </div>

                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: isChecked ? currentStratData.color : "#e6edf3", lineHeight: "1.4" }}>
                          {item.title}
                        </h4>
                        <p style={{ margin: 0, color: "#b1bac4", fontSize: "13.5px", lineHeight: "1.6" }}>{item.desc}</p>
                      </div>

                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => {}}
                        style={{ marginTop: "4px", transform: "scale(1.2)", cursor: "pointer" }}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 3: 14 CHART PATTERNS & SETUPS GUIDE */}
          {activeTab === "chartsetups" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>📐 14 Essential Chart Setups &amp; Price Action Patterns</h3>
                <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Complete guide for all 14 classical chart patterns with vector diagrams, execution rules, and optimal market conditions.</p>
              </div>

              <div className="checklistGrid">
                {CHART_SETUPS_GUIDE.map((setup) => (
                  <div key={setup.id} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#e6edf3" }}>{setup.name}</h4>
                      <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "800", background: `${setup.color}22`, color: setup.color, textTransform: "uppercase" }}>
                        {setup.type}
                      </span>
                    </div>

                    {/* Vector Pattern SVG Diagram */}
                    <PatternDiagram type={setup.id} />

                    {/* What it Means */}
                    <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#38bdf8", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>💡 Price Meaning & Logic (Meaning):</span>
                      <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>{setup.meaning}</p>
                    </div>

                    {/* How to Trade */}
                    <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>🎯 Trading Execution (How to Trade):</span>
                      <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.6", whiteSpace: "pre-line" }}>{setup.howToTrade}</p>
                    </div>

                    {/* Optimal Conditions */}
                    <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#fbbf24", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>⚡ High Success Conditions (Optimal Conditions):</span>
                      <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>{setup.conditions}</p>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: MASTER TRADER PSYCHOLOGY & WISDOM */}
          {activeTab === "psychology" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>🧠 Master Trader Psychology &amp; Wisdom</h3>
                <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Iconic wisdom, probabilistic mindset rules, and emotion control principles from world-renowned master traders.</p>
              </div>

              <div className="checklistGrid">
                {MASTER_TRADER_WISDOM.map((w, idx) => (
                  <div key={idx} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "14px" }}>
                    
                    {/* Author & Badge */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#e6edf3" }}>{w.author}</h4>
                        <span style={{ color: "#38bdf8", fontSize: "11px", fontWeight: "600" }}>{w.title}</span>
                      </div>
                      <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "800", background: `${w.badgeColor}22`, color: w.badgeColor, textTransform: "uppercase" }}>
                        {w.badge}
                      </span>
                    </div>

                    {/* Iconic Quote */}
                    <div style={{ background: "#0d1117", padding: "12px 14px", borderRadius: "8px", borderLeft: `3px solid ${w.badgeColor}`, fontStyle: "italic" }}>
                      <p style={{ margin: 0, color: "#e6edf3", fontSize: "13px", lineHeight: "1.5" }}>"{w.quote}"</p>
                    </div>

                    {/* Core Lessons */}
                    <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#38bdf8", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px" }}>💡 Core Mindset Lessons:</span>
                      <ul style={{ margin: 0, paddingLeft: "16px", color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>
                        {w.coreLessons.map((lesson, i) => (
                          <li key={i} style={{ marginBottom: "4px" }}>{lesson}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Golden Rule */}
                    <div style={{ background: `${w.badgeColor}15`, padding: "12px", borderRadius: "8px", border: `1px solid ${w.badgeColor}44` }}>
                      <span style={{ color: w.badgeColor, fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>🔑 Golden Rule for Profitability:</span>
                      <p style={{ margin: 0, color: "#e6edf3", fontSize: "12px", lineHeight: "1.4", fontWeight: "600" }}>{w.psychologyRule}</p>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 5: FUNDAMENTAL NEWS & LIQUIDITY IMPACT */}
          {activeTab === "fundamental" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>📰 Macroeconomic Fundamental Analysis &amp; Liquidity Impact</h3>
                <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Learn how economic news events drive market liquidity, institutional bias, and explosive trend direction.</p>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {FUNDAMENTAL_NEWS_GUIDE.map((item, idx) => (
                  <div key={idx} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "20px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#e6edf3" }}>{item.name}</h4>
                        <span style={{ color: "#38bdf8", fontSize: "11px" }}>Frequency: {item.frequency}</span>
                      </div>
                      <span style={{ padding: "4px 12px", borderRadius: "6px", fontSize: "11px", fontWeight: "800", background: "#f43f5e22", color: "#f43f5e", border: "1px solid #f43f5e44" }}>
                        {item.impactRating}
                      </span>
                    </div>

                    <p style={{ margin: 0, color: "#8b949e", fontSize: "13px", lineHeight: "1.5" }}>{item.meaning}</p>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #22c55e44" }}>
                        <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>📈 Higher Than Expected:</span>
                        <p style={{ margin: 0, color: "#e6edf3", fontSize: "12px", lineHeight: "1.4" }}>{item.higherThanExpected}</p>
                      </div>

                      <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #f43f5e44" }}>
                        <span style={{ color: "#f43f5e", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>📉 Lower Than Expected:</span>
                        <p style={{ margin: 0, color: "#e6edf3", fontSize: "12px", lineHeight: "1.4" }}>{item.lowerThanExpected}</p>
                      </div>
                    </div>

                    <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#fbbf24", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>💧 Institutional Liquidity Behavior:</span>
                      <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>{item.liquidityBehavior}</p>
                    </div>

                    <div style={{ background: "#6366f115", padding: "12px", borderRadius: "8px", border: "1px solid #6366f144" }}>
                      <span style={{ color: "#818cf8", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>🧠 Directional Bias Rule:</span>
                      <p style={{ margin: 0, color: "#e6edf3", fontSize: "12px", lineHeight: "1.5", fontWeight: "600" }}>{item.biasRule}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 6: MARKETS & KEY CORRELATION MATRIX */}
          {activeTab === "indicators" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>📊 Market Correlations &amp; Key Technical / Macro Matrix</h3>
                <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Primary indicators, asset correlations, and confirmation tools required for each market before trading.</p>
              </div>

              <div className="checklistGrid">
                {MARKET_INDICATORS_MATRIX.map((m, idx) => (
                  <div key={idx} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                    
                    {/* Header */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <h4 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#e6edf3" }}>{m.market}</h4>
                      <span style={{ padding: "3px 10px", borderRadius: "4px", fontSize: "10px", fontWeight: "800", background: `${m.badgeColor}22`, color: m.badgeColor, textTransform: "uppercase" }}>
                        {m.category}
                      </span>
                    </div>

                    <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.4" }}>{m.description}</p>

                    {/* Correlations */}
                    <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#38bdf8", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px" }}>🔗 Key Market Correlations:</span>
                      <ul style={{ margin: 0, paddingLeft: "16px", color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>
                        {m.keyCorrelations.map((corr, i) => (
                          <li key={i} style={{ marginBottom: "4px" }}>{corr}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Primary Indicators */}
                    <div style={{ background: "#0d1117", padding: "12px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "6px" }}>📊 Essential Indicators to Watch:</span>
                      <ul style={{ margin: 0, paddingLeft: "16px", color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>
                        {m.primaryIndicators.map((ind, i) => (
                          <li key={i} style={{ marginBottom: "4px" }}>{ind}</li>
                        ))}
                      </ul>
                    </div>

                    {/* Pro Tip */}
                    <div style={{ background: "#f59e0b15", padding: "12px", borderRadius: "8px", border: "1px solid #f59e0b44" }}>
                      <span style={{ color: "#fbbf24", fontSize: "11px", fontWeight: "800", display: "block", marginBottom: "4px" }}>💡 Pro Execution Tip:</span>
                      <p style={{ margin: 0, color: "#e6edf3", fontSize: "12px", lineHeight: "1.4", fontWeight: "600" }}>{m.proTradingTip}</p>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 7: CANDLESTICK PATTERNS & MEANINGS */}
          {activeTab === "candlesticks" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>🕯️ Complete Candlestick Patterns &amp; Trading Importance</h3>
                <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Visual candle shapes, market context meanings, and institutional trading significance.</p>
              </div>

              <div className="checklistGrid">
                {CANDLESTICK_PATTERNS_GUIDE.map((pattern, idx) => (
                  <div key={idx} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <CandleIcon type={pattern.type} name={pattern.name} />
                        <strong style={{ fontSize: "14px", color: "#e6edf3" }}>{pattern.name}</strong>
                      </div>
                      <span style={{ padding: "2px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: "800", background: "#6366f122", color: "#818cf8" }}>
                        {pattern.importance}
                      </span>
                    </div>

                    <div style={{ background: "#0d1117", padding: "10px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#38bdf8", fontSize: "11px", fontWeight: "700", display: "block", marginBottom: "2px" }}>Meaning:</span>
                      <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.4" }}>{pattern.meaning}</p>
                    </div>

                    <div style={{ background: "#0d1117", padding: "10px", borderRadius: "8px", border: "1px solid #21262d" }}>
                      <span style={{ color: "#22c55e", fontSize: "11px", fontWeight: "700", display: "block", marginBottom: "2px" }}>Trading Significance:</span>
                      <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.4" }}>{pattern.significance}</p>
                    </div>

                    <div style={{ marginTop: "4px" }}>
                      <span style={{ color: "#a855f7", fontSize: "11px", fontWeight: "700", display: "block", marginBottom: "6px" }}>Visual Demonstration:</span>
                      <CandleDemonstration name={pattern.name} type={pattern.type} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 8: PERSONAL NOTES & CUSTOM STRATEGIES */}
          {activeTab === "custom" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800" }}>📝 Personal Trading Notes &amp; Custom Strategy Builder</h3>
                <p style={{ margin: "4px 0 0", color: "#8b949e", fontSize: "12px" }}>Add your custom trading setups, personal rules, and market observations.</p>
              </div>

              <form onSubmit={handleAddCustomNote} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "12px", padding: "18px", display: "flex", flexDirection: "column", gap: "12px" }}>
                <span style={{ color: "#8b949e", fontSize: "11px", fontWeight: "700", textTransform: "uppercase" }}>➕ Add New Strategy / Personal Note</span>
                
                <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "12px" }}>
                  <input
                    type="text"
                    placeholder="Title (e.g. Gold 15M FVG Retest Rule)"
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    style={{ background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", padding: "8px 12px", borderRadius: "6px", fontSize: "13px" }}
                  />
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    style={{ background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", padding: "8px 12px", borderRadius: "6px", fontSize: "13px" }}
                  >
                    <option value="Custom Strategy">Custom Strategy</option>
                    <option value="SMC Rule">SMC Rule</option>
                    <option value="Risk Management">Risk Management</option>
                    <option value="Psychology Tip">Psychology Tip</option>
                    <option value="Market Lesson">Market Lesson</option>
                  </select>
                </div>

                <textarea
                  rows={3}
                  placeholder="Detailed Description / Explanation..."
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  style={{ background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", padding: "10px", borderRadius: "6px", fontSize: "12px", resize: "vertical" }}
                />

                <textarea
                  rows={3}
                  placeholder="Execution Rules (one rule per line)..."
                  value={newRulesText}
                  onChange={(e) => setNewRulesText(e.target.value)}
                  style={{ background: "#0d1117", border: "1px solid #30363d", color: "#e6edf3", padding: "10px", borderRadius: "6px", fontSize: "12px", resize: "vertical" }}
                />

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  <button type="submit" style={{ background: "linear-gradient(135deg, #6366f1, #4f46e5)", border: "none", color: "#fff", padding: "8px 20px", borderRadius: "6px", fontWeight: "700", cursor: "pointer", fontSize: "13px" }}>
                    Save Note to Library
                  </button>
                </div>
              </form>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {personalNotes.length === 0 && <p style={{ color: "#8b949e", fontSize: "12px" }}>No personal notes added yet. Use the form above to build your custom strategy library!</p>}
                {personalNotes.map((note) => (
                  <div key={note.id} style={{ background: "#161b22", border: "1px solid #21262d", borderRadius: "10px", padding: "16px", display: "flex", flexDirection: "column", gap: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div>
                        <span style={{ fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px", background: "#38bdf822", color: "#38bdf8", textTransform: "uppercase" }}>
                          {note.category}
                        </span>
                        <h4 style={{ margin: "4px 0 0", fontSize: "14px", fontWeight: "800", color: "#e6edf3" }}>{note.title}</h4>
                      </div>
                      <button onClick={() => handleDeleteNote(note.id)} style={{ background: "transparent", border: "none", color: "#f43f5e", fontSize: "14px", cursor: "pointer" }}>🗑️ Delete</button>
                    </div>

                    <p style={{ margin: 0, color: "#8b949e", fontSize: "12px", lineHeight: "1.5" }}>{note.content}</p>

                    {note.rules && note.rules.length > 0 && (
                      <div style={{ background: "#0d1117", padding: "10px", borderRadius: "6px", border: "1px solid #21262d" }}>
                        <span style={{ color: "#e6edf3", fontSize: "11px", fontWeight: "700" }}>Rules:</span>
                        <ul style={{ margin: "4px 0 0", paddingLeft: "16px", color: "#8b949e", fontSize: "11px" }}>
                          {note.rules.map((r, idx) => (
                            <li key={idx}>{r}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    <span style={{ color: "#484f58", fontSize: "10px" }}>Added on {note.createdAt}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
