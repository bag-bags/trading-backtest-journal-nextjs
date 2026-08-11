"use client";

import { useEffect, useState } from "react";
import { evaluateRedaSystem, calculateLotSize } from "../chart/redaSystem";

const TR_DICT = {
  en: {
    bannerTitle: "✨ Reda System Live Signal Engine & Pre-Trade Checklist",
    macroBias: "Fundamental Macro Bias:",
    accountBudget: "Account Balance ($):",
    riskPercent: "Risk Per Trade (%):",
    statusScore: "Pre-Trade Checklist Confluence:",
    executionReady: "🚀 ALL 5 RULES VALIDATED — EXECUTION READY!",
    needConfluence: "⏳ WAITING FOR ALL PRE-TRADE RULES TO ALIGN",
    entryLabel: "Exact Entry Price",
    slLabel: "Stop Loss (SL)",
    tp1Label: "Take Profit 1 (1:2 R:R)",
    tp2Label: "Take Profit 2 (1:3 R:R)",
    tp3Label: "Take Profit 3 (1:5 R:R)",
    lotSizeLabel: "Recommended Lot Size",
    riskAmountLabel: "Risk Amount ($)",
    copySignal: "📋 Copy Signal Parameters",
    copied: "✓ Copied to Clipboard!",
    symbolLabel: "Active Symbol:",
    feedSource: "🟢 TwelveData Real-Time Feed"
  },
  fr: {
    bannerTitle: "✨ Moteur de Signaux Reda System & Liste de Contrôle en Direct",
    macroBias: "Biais Macro Fondamental :",
    accountBudget: "Solde du Compte ($) :",
    riskPercent: "Risque par Transaction (%) :",
    statusScore: "Score de Confluence Pré-Transaction :",
    executionReady: "🚀 TOUTES LES 5 RÈGLES VALIDÉES — PRÊT À EXÉCUTER !",
    needConfluence: "⏳ EN ATTENTE DE L'ALIGNEMENT DES RÈGLES",
    entryLabel: "Prix d'Entrée Exact",
    slLabel: "Stop Loss (SL)",
    tp1Label: "Take Profit 1 (1:2 R:R)",
    tp2Label: "Take Profit 2 (1:3 R:R)",
    tp3Label: "Take Profit 3 (1:5 R:R)",
    lotSizeLabel: "Taille de Lot Recommandée",
    riskAmountLabel: "Montant du Risque ($)",
    copySignal: "📋 Copier les Paramètres du Signal",
    copied: "✓ Copié dans le Presse-papiers !",
    symbolLabel: "Symbole Actif :",
    feedSource: "🟢 Flux Temps Réel TwelveData"
  },
  ar: {
    bannerTitle: "✨ محرك إشارات رضا سيستم وقائمة التحقق المباشرة",
    macroBias: "الانحياز الماكرو الأساسي:",
    accountBudget: "رأس المال ($):",
    riskPercent: "نسبة المخاطرة (%):",
    statusScore: "درجة توافق قائمة التحقق:",
    executionReady: "🚀 تم استيفاء جميع الشروط الـ 5 — جاهز للتنفيذ!",
    needConfluence: "⏳ في انتظار اكتمال شروط قائمة التحقق",
    entryLabel: "سعر الدخول المباشر (TwelveData)",
    slLabel: "وقف الخسارة (SL)",
    tp1Label: "الهدف الأول TP1 (1:2)",
    tp2Label: "الهدف الثاني TP2 (1:3)",
    tp3Label: "الهدف الثالث TP3 (1:5)",
    lotSizeLabel: "حجم اللوت الموصى به (Lot Size)",
    riskAmountLabel: "قيمة المخاطرة ($)",
    copySignal: "📋 نسخ تفاصيل الصفقة",
    copied: "✓ تم النسخ بنجاح!",
    symbolLabel: "الرمز الحالي:",
    feedSource: "🟢 بيانات TwelveData الحية"
  }
};

export default function RedaLiveSignalBanner({ symbol = "GOLD", candles: externalCandles = [], lang = "en" }) {
  const [fundamentalBias, setFundamentalBias] = useState("Bullish");
  const [budget, setBudget] = useState(10000);
  const [riskPercent, setRiskPercent] = useState(1);
  const [useKillzone, setUseKillzone] = useState(true);
  const [evalResult, setEvalResult] = useState(null);
  const [liveCandles, setLiveCandles] = useState([]);
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const t = TR_DICT[lang] || TR_DICT.en;

  // 1. Fetch live TwelveData market candles if externalCandles is empty
  useEffect(() => {
    let isMounted = true;

    async function loadTwelveDataFeed() {
      if (externalCandles && externalCandles.length > 0) {
        setLiveCandles(externalCandles);
        return;
      }

      try {
        const querySymbol = (symbol || "GOLD").toUpperCase() === "GOLD" ? "GOLD" : symbol;
        const res = await fetch(`/api/ohlc?symbol=${encodeURIComponent(querySymbol)}&interval=1m&provider=twelvedata`);
        if (res.ok) {
          const data = await res.json();
          if (data.candles && data.candles.length > 0 && isMounted) {
            setLiveCandles(data.candles);
          }
        }
      } catch (err) {
        console.error("Failed to fetch TwelveData live candles:", err);
      }
    }

    loadTwelveDataFeed();

    // Auto-refresh feed every 15 seconds for live TwelveData updates
    const interval = setInterval(loadTwelveDataFeed, 15000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, [symbol, externalCandles]);

  // 2. Run dynamic Reda System evaluation whenever inputs or candles update
  useEffect(() => {
    const activeCandles = (externalCandles && externalCandles.length > 0) ? externalCandles : liveCandles;
    
    const numBudget = parseFloat(budget) || 10000;
    const numRisk = parseFloat(riskPercent) || 1;

    const result = evaluateRedaSystem(activeCandles, symbol, fundamentalBias, useKillzone, numBudget, numRisk);
    setEvalResult(result);
  }, [symbol, externalCandles, liveCandles, fundamentalBias, budget, riskPercent, useKillzone]);

  if (!evalResult) return null;

  const handleCopySignal = () => {
    const text = `🚨 REDA SYSTEM ${evalResult.signal || "SIGNAL"} ALERT (${symbol})
───────────────────────────────
🎯 Bias: ${fundamentalBias}
📍 Entry Price: ${evalResult.entry.toFixed(2)}
🛑 Stop Loss: ${evalResult.stopLoss.toFixed(2)}
🎯 TP1 (1:2): ${evalResult.takeProfit1.toFixed(2)}
🎯 TP2 (1:3): ${evalResult.takeProfit2.toFixed(2)}
🎯 TP3 (1:5): ${evalResult.takeProfit3.toFixed(2)}
💰 Account Budget: $${budget} | Risk: ${riskPercent}% ($${evalResult.lotInfo.riskAmount})
📊 Recommended Lot Size: ${evalResult.lotInfo.lotSize} Lots
───────────────────────────────
Checklist Score: ${evalResult.score}/5`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const isBull = evalResult.signal === "BUY" || (fundamentalBias === "Bullish" && evalResult.isReady);
  const isBear = evalResult.signal === "SELL" || (fundamentalBias === "Bearish" && evalResult.isReady);

  return (
    <div
      style={{
        background: evalResult.isReady
          ? isBull
            ? "linear-gradient(135deg, rgba(34, 197, 94, 0.12), rgba(16, 185, 129, 0.04))"
            : "linear-gradient(135deg, rgba(239, 68, 68, 0.12), rgba(225, 29, 72, 0.04))"
          : "linear-gradient(135deg, rgba(250, 204, 21, 0.06), rgba(202, 138, 4, 0.02))",
        border: `1px solid ${evalResult.isReady ? (isBull ? "#22c55e" : "#ef4444") : "rgba(250, 204, 21, 0.25)"}`,
        borderRadius: "12px",
        padding: "16px 20px",
        marginBottom: "16px",
        boxShadow: evalResult.isReady ? `0 0 25px ${isBull ? "rgba(34, 197, 94, 0.25)" : "rgba(239, 68, 68, 0.25)"}` : "0 8px 25px rgba(0,0,0,0.3)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Top Banner Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <span style={{ fontSize: "22px", animation: evalResult.isReady ? "pulseGlow 1.5s infinite" : "none" }}>
            {evalResult.isReady ? (isBull ? "🚀" : "🔻") : "⚡"}
          </span>
          <div>
            <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
              {t.bannerTitle}
              <span
                style={{
                  fontSize: "10px",
                  padding: "3px 8px",
                  borderRadius: "4px",
                  background: evalResult.isReady ? (isBull ? "#22c55e" : "#ef4444") : "#facc1522",
                  color: evalResult.isReady ? "#ffffff" : "#facc15",
                  fontWeight: "800"
                }}
              >
                {symbol}
              </span>
              <span style={{ fontSize: "10px", color: "#22c55e", background: "rgba(34, 197, 94, 0.1)", padding: "2px 6px", borderRadius: "4px", border: "1px solid rgba(34, 197, 94, 0.3)" }}>
                {t.feedSource}
              </span>
            </h4>
            <p style={{ margin: "2px 0 0", fontSize: "11.5px", color: evalResult.isReady ? (isBull ? "#4ade80" : "#f87171") : "#facc15" }}>
              {evalResult.isReady ? t.executionReady : t.needConfluence} ({evalResult.score}/5 Rules Met)
            </p>
          </div>
        </div>

        {/* Quick Controls */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          {/* Fundamental Bias Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "4px", background: "#090d16", padding: "4px 8px", borderRadius: "6px", border: "1px solid #21262d" }}>
            <span style={{ fontSize: "11px", color: "#8b949e", fontWeight: "700" }}>{t.macroBias}</span>
            <select
              value={fundamentalBias}
              onChange={(e) => setFundamentalBias(e.target.value)}
              style={{
                background: "#161b22",
                border: "1px solid #30363d",
                color: fundamentalBias === "Bullish" ? "#22c55e" : fundamentalBias === "Bearish" ? "#ef4444" : "#facc15",
                fontSize: "12px",
                fontWeight: "800",
                padding: "3px 8px",
                borderRadius: "4px",
                cursor: "pointer"
              }}
            >
              <option value="Bullish">🟢 Bullish (Buy Only)</option>
              <option value="Bearish">🔴 Bearish (Sell Only)</option>
              <option value="Neutral">🟡 Neutral (Auto)</option>
            </select>
          </div>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#c9d1d9",
              padding: "5px 10px",
              borderRadius: "6px",
              fontSize: "11px",
              fontWeight: "700",
              cursor: "pointer"
            }}
          >
            {isExpanded ? "▲ Hide Details" : "▼ Show Parameters"}
          </button>
        </div>
      </div>

      {/* Expanded Parameters & Calculations Dashboard */}
      {isExpanded && (
        <div style={{ marginTop: "16px", paddingTop: "14px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", flexDirection: "column", gap: "14px" }}>
          
          {/* Budget & Risk Controls Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "10px", background: "#090d16", padding: "12px", borderRadius: "8px", border: "1px solid #21262d" }}>
            <div>
              <label style={{ fontSize: "11px", color: "#8b949e", fontWeight: "700", display: "block", marginBottom: "4px" }}>{t.accountBudget}</label>
              <input
                type="number"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", color: "#ffffff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#8b949e", fontWeight: "700", display: "block", marginBottom: "4px" }}>{t.riskPercent}</label>
              <input
                type="number"
                step="0.5"
                value={riskPercent}
                onChange={(e) => setRiskPercent(e.target.value)}
                style={{ width: "100%", background: "#161b22", border: "1px solid #30363d", color: "#ffffff", padding: "6px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "700" }}
              />
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#8b949e", fontWeight: "700", display: "block", marginBottom: "4px" }}>{t.riskAmountLabel}</label>
              <div style={{ padding: "6px 10px", background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "6px", color: "#ef4444", fontWeight: "800", fontSize: "13px" }}>
                ${evalResult.lotInfo.riskAmount} ({riskPercent}%)
              </div>
            </div>
            <div>
              <label style={{ fontSize: "11px", color: "#8b949e", fontWeight: "700", display: "block", marginBottom: "4px" }}>{t.lotSizeLabel}</label>
              <div style={{ padding: "6px 10px", background: "rgba(34, 197, 94, 0.15)", border: "1px solid rgba(34, 197, 94, 0.4)", borderRadius: "6px", color: "#22c55e", fontWeight: "900", fontSize: "14px" }}>
                🎯 {evalResult.lotInfo.lotSize} Lots
              </div>
            </div>
          </div>

          {/* Exact TwelveData Entry, Stop-Loss & Take-Profit Targets Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "10px" }}>
            {/* Entry */}
            <div style={{ background: "#090d16", border: "1px solid #21262d", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#38bdf8", fontWeight: "800", textTransform: "uppercase" }}>{t.entryLabel}</span>
              <div style={{ fontSize: "15px", fontWeight: "900", color: "#ffffff", marginTop: "4px" }}>
                ${evalResult.entry.toFixed(2)}
              </div>
            </div>

            {/* Stop Loss */}
            <div style={{ background: "rgba(239, 68, 68, 0.08)", border: "1px solid rgba(239, 68, 68, 0.3)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#ef4444", fontWeight: "800", textTransform: "uppercase" }}>{t.slLabel}</span>
              <div style={{ fontSize: "15px", fontWeight: "900", color: "#ef4444", marginTop: "4px" }}>
                ${evalResult.stopLoss.toFixed(2)}
              </div>
            </div>

            {/* TP1 */}
            <div style={{ background: "rgba(34, 197, 94, 0.08)", border: "1px solid rgba(34, 197, 94, 0.2)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#4ade80", fontWeight: "700", textTransform: "uppercase" }}>{t.tp1Label}</span>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#4ade80", marginTop: "4px" }}>
                ${evalResult.takeProfit1.toFixed(2)}
              </div>
            </div>

            {/* TP2 */}
            <div style={{ background: "rgba(34, 197, 94, 0.12)", border: "1px solid rgba(34, 197, 94, 0.3)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#22c55e", fontWeight: "700", textTransform: "uppercase" }}>{t.tp2Label}</span>
              <div style={{ fontSize: "14px", fontWeight: "800", color: "#22c55e", marginTop: "4px" }}>
                ${evalResult.takeProfit2.toFixed(2)}
              </div>
            </div>

            {/* TP3 */}
            <div style={{ background: "rgba(34, 197, 94, 0.18)", border: "1px solid rgba(34, 197, 94, 0.4)", borderRadius: "8px", padding: "10px", textAlign: "center" }}>
              <span style={{ fontSize: "10px", color: "#a3e635", fontWeight: "800", textTransform: "uppercase" }}>{t.tp3Label}</span>
              <div style={{ fontSize: "14px", fontWeight: "900", color: "#a3e635", marginTop: "4px" }}>
                ${evalResult.takeProfit3.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Checklist Items Status Bar */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "8px" }}>
            {evalResult.checklist.map((item, i) => (
              <div
                key={i}
                style={{
                  background: item.valid ? "rgba(34, 197, 94, 0.08)" : "rgba(255, 255, 255, 0.02)",
                  border: `1px solid ${item.valid ? "rgba(34, 197, 94, 0.25)" : "#21262d"}`,
                  borderRadius: "6px",
                  padding: "6px 10px",
                  fontSize: "11px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <span style={{ color: "#c9d1d9", fontWeight: "600" }}>{item.name}</span>
                <span style={{ color: item.valid ? "#22c55e" : "#8b949e", fontWeight: "800" }}>
                  {item.valid ? "✓ PASS" : "⏳ WAIT"}
                </span>
              </div>
            ))}
          </div>

          {/* Copy Signal Button */}
          <button
            onClick={handleCopySignal}
            style={{
              background: copied ? "#22c55e" : "linear-gradient(135deg, #1f6beb, #238636)",
              border: "none",
              color: "#ffffff",
              padding: "8px 16px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "800",
              cursor: "pointer",
              transition: "all 0.2s",
              alignSelf: "flex-end"
            }}
          >
            {copied ? t.copied : t.copySignal}
          </button>
        </div>
      )}

      {/* CSS Pulse Animation */}
      <style>{`
        @keyframes pulseGlow {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
