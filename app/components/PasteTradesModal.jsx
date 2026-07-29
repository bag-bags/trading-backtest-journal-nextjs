"use client";

import { useState } from "react";

export default function PasteTradesModal({ isOpen, onClose, onImport }) {
  const [text, setText] = useState("");
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);

  if (!isOpen) return null;

  const handlePasteFromClipboard = async () => {
    try {
      const clipboardText = await navigator.clipboard.readText();
      // Replace all newlines with spaces as requested
      const cleaned = clipboardText.replace(/[\r\n]+/g, " ").trim();
      setText(cleaned);
    } catch (err) {
      setErrors(["Could not read clipboard automatically. Please paste manually into the textbox."]);
    }
  };

  const handleParseAndImport = () => {
    setErrors([]);
    setSuccessCount(0);

    if (!text.trim()) {
      setErrors(["Please paste some trade text lines first."]);
      return;
    }

    const rawRows = text.split("\n").map(r => r.trim()).filter(Boolean);
    const validTrades = [];
    const failedLines = [];
    const errorMessages = [];

    // Helper to parse date strings
    const parseDateHelper = (str) => {
      if (!str) throw new Error("Missing date value.");
      const cleaned = str.replace(/,/g, "");
      const d = new Date(cleaned);
      if (isNaN(d.getTime())) {
        throw new Error(`Invalid date format: "${str}".`);
      }
      return d;
    };

    // Determine if it's Vertical Mode (multi-line layout) or Horizontal Mode
    // We check if the rows look like individual fields
    const hasManyFieldsPerRow = rawRows.some(row => row.split("\t").length >= 5 || row.split(/\s{2,}/).length >= 5);

    if (!hasManyFieldsPerRow) {
      // Vertical Mode: Fields are listed one per line
      let i = 0;
      while (i < rawRows.length) {
        const current = rawRows[i];
        
        // Skip header words
        if (
          current.toLowerCase().includes("symbol") ||
          current.toLowerCase().includes("type") ||
          current.toLowerCase().includes("volume") ||
          current.toLowerCase().includes("open time")
        ) {
          i++;
          continue;
        }

        const next = rawRows[i + 1];
        if (current && next && (next.toUpperCase() === "BUY" || next.toUpperCase() === "SELL")) {
          try {
            if (i + 11 >= rawRows.length) {
              throw new Error("Incomplete trade block at the end of text.");
            }

            const symbol = current.replace("/", "").toUpperCase();
            const type = next.toUpperCase();
            
            const volume = parseFloat(rawRows[i + 2]);
            if (isNaN(volume) || volume <= 0) {
              throw new Error(`Invalid volume: "${rawRows[i + 2]}".`);
            }

            const openPrice = parseFloat(rawRows[i + 3].replace(/,/g, ""));
            const closePrice = parseFloat(rawRows[i + 4].replace(/,/g, ""));
            if (isNaN(openPrice) || isNaN(closePrice)) {
              throw new Error(`Invalid prices: Open="${rawRows[i + 3]}", Close="${rawRows[i + 4]}".`);
            }

            // tp = i+5, sl = i+6, position = i+7
            const openTime = parseDateHelper(rawRows[i + 8]);
            const closeTime = parseDateHelper(rawRows[i + 9]);
            // swap = i+10

            // i+11 can be reason ("Take Profit" / "Stop Loss") or Profit value
            let profitStr = rawRows[i + 11];
            let increment = 12;

            const tempProfit = parseFloat(profitStr.replace(/\+/g, "").replace(/,/g, ""));
            if (isNaN(tempProfit)) {
              if (i + 12 >= rawRows.length) {
                throw new Error("Missing profit value (expected after Reason).");
              }
              profitStr = rawRows[i + 12];
              increment = 13;
            }

            const profit = parseFloat(profitStr.replace(/\+/g, "").replace(/,/g, ""));
            if (isNaN(profit)) {
              throw new Error(`Invalid profit value: "${profitStr}".`);
            }

            validTrades.push({
              symbol,
              type,
              volume,
              openPrice,
              closePrice,
              openTime,
              closeTime,
              profit
            });

            i += increment;
          } catch (err) {
            failedLines.push(`Trade Block starting with "${current}": ${err.message}`);
            errorMessages.push(`Block starting at line ${i + 1}: ${err.message}`);
            i++; // skip this line to avoid infinite loop
          }
        } else {
          i++;
        }
      }
    } else {
      // Horizontal Mode: Each line is a full trade (tab or multiple space separated)
      rawRows.forEach((line, index) => {
        const lineNum = index + 1;

        if (
          line.toLowerCase().includes("symbol") ||
          line.toLowerCase().includes("type") ||
          line.toLowerCase().includes("volume")
        ) {
          return; // Ignore headers
        }

        try {
          let parts = line.split("\t");
          if (parts.length < 5) {
            parts = line.split(/\s{2,}/);
          }
          
          // Check if space-joined layout
          if (parts.length < 5) {
            const spaceParts = line.split(" ").filter(Boolean);
            if (spaceParts.length >= 15) {
              parts = spaceParts;
              const symbol = parts[0].replace("/", "").toUpperCase();
              const type = parts[1].toUpperCase();
              if (type !== "BUY" && type !== "SELL") {
                throw new Error(`Invalid type: "${parts[1]}". Expected BUY or SELL.`);
              }
              const volume = parseFloat(parts[2]);
              if (isNaN(volume) || volume <= 0) {
                throw new Error(`Invalid volume: "${parts[2]}".`);
              }
              const openPrice = parseFloat(parts[3].replace(/,/g, ""));
              const closePrice = parseFloat(parts[4].replace(/,/g, ""));
              if (isNaN(openPrice) || isNaN(closePrice)) {
                throw new Error(`Invalid prices: Open="${parts[3]}", Close="${parts[4]}".`);
              }

              // Dates are always 4 words: Month Day Time AM/PM
              const openTime = parseDateHelper(parts.slice(8, 12).join(" "));
              const closeTime = parseDateHelper(parts.slice(12, 16).join(" "));

              const profitStr = parts[parts.length - 1].replace(/\+/g, "").replace(/,/g, "");
              const profit = parseFloat(profitStr);
              if (isNaN(profit)) {
                throw new Error(`Invalid profit: "${parts[parts.length - 1]}".`);
              }

              validTrades.push({ symbol, type, volume, openPrice, closePrice, openTime, closeTime, profit });
              return;
            }
          }

          parts = parts.map(p => p.trim());

          if (parts.length < 8) {
            throw new Error("Line has too few columns (minimum 8 columns needed).");
          }

          const symbol = parts[0].replace("/", "").toUpperCase();
          const type = parts[1].toUpperCase();
          if (type !== "BUY" && type !== "SELL") {
            throw new Error(`Invalid type: "${parts[1]}". Expected BUY or SELL.`);
          }

          const volume = parseFloat(parts[2]);
          if (isNaN(volume) || volume <= 0) {
            throw new Error(`Invalid volume: "${parts[2]}".`);
          }

          const openPrice = parseFloat(parts[3].replace(/,/g, ""));
          const closePrice = parseFloat(parts[4].replace(/,/g, ""));
          if (isNaN(openPrice) || isNaN(closePrice)) {
            throw new Error(`Invalid prices: Open="${parts[3]}", Close="${parts[4]}".`);
          }

          const openTime = parseDateHelper(parts[8]);
          const closeTime = parseDateHelper(parts[9]);

          const profitStr = parts[parts.length - 1].replace(/\+/g, "").replace(/,/g, "");
          const profit = parseFloat(profitStr);
          if (isNaN(profit)) {
            throw new Error(`Invalid profit value: "${parts[parts.length - 1]}".`);
          }

          validTrades.push({
            symbol,
            type,
            volume,
            openPrice,
            closePrice,
            openTime,
            closeTime,
            profit
          });
        } catch (err) {
          failedLines.push(line);
          errorMessages.push(`Line ${lineNum}: ${err.message}`);
        }
      });
    }

    if (validTrades.length > 0) {
      onImport(validTrades);
      setSuccessCount(validTrades.length);
    }

    if (failedLines.length > 0) {
      // Retain failed items for easy correction
      if (!hasManyFieldsPerRow) {
        // In vertical mode, just display error log
        setErrors(errorMessages);
      } else {
        setText(failedLines.join("\n"));
        setErrors(errorMessages);
      }
    } else {
      setText("");
      setTimeout(() => {
        onClose();
        setSuccessCount(0);
      }, 1200);
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: "rgba(0, 0, 0, 0.8)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        zIndex: 1000,
        padding: "20px"
      }}
    >
      <div
        style={{
          background: "#111113",
          border: "1px solid #222225",
          borderRadius: "12px",
          width: "100%",
          maxWidth: "680px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.5)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h2 style={{ margin: 0, fontSize: "18px", fontWeight: "700", color: "#ffffff" }}>
            📝 Paste Text Trades Import (MT4/MT5 Format)
          </h2>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#888893",
              fontSize: "20px",
              cursor: "pointer"
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <p style={{ margin: 0, fontSize: "13px", color: "#888893", lineHeight: "1.4", flex: 1 }}>
            Copy trade history lines directly from MetaTrader and click Paste. The parser will read Symbol, Type, Volume, Prices, Times, and Profit.
          </p>
          <button
            onClick={handlePasteFromClipboard}
            style={{
              background: "#161b22",
              border: "1px solid #30363d",
              color: "#58a6ff",
              padding: "6px 12px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "12px",
              fontWeight: "700",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            📋 Paste Clipboard
          </button>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={`Example:
EUR/USD\tBuy\t0.03\t1.13670\t1.13688\t1.13874\t1.13670\t491625886\tJul 28, 2:12:16 AM\tJul 28, 2:47:10 AM\t0\t+0.54`}
          style={{
            width: "100%",
            height: "220px",
            background: "#070708",
            border: "1px solid #222225",
            borderRadius: "8px",
            color: "#ffffff",
            padding: "12px",
            fontSize: "12px",
            fontFamily: "monospace",
            resize: "vertical"
          }}
        />

        {successCount > 0 && (
          <div
            style={{
              background: "rgba(163, 230, 53, 0.1)",
              border: "1px solid #a3e635",
              color: "#a3e635",
              borderRadius: "6px",
              padding: "10px 12px",
              fontSize: "13px"
            }}
          >
            ✓ Successfully imported <strong>{successCount}</strong> trades.
          </div>
        )}

        {errors.length > 0 && (
          <div
            style={{
              background: "rgba(244, 63, 94, 0.1)",
              border: "1px solid #f43f5e",
              color: "#f43f5e",
              borderRadius: "6px",
              padding: "12px",
              fontSize: "12px",
              maxHeight: "150px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "4px"
            }}
          >
            <strong style={{ fontSize: "13px" }}>⚠️ Parsing issues found:</strong>
            {errors.map((err, i) => (
              <div key={i}>{err}</div>
            ))}
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
          <button
            onClick={onClose}
            style={{
              background: "#1c1c1f",
              border: "1px solid #2d2d30",
              color: "#c9d1d9",
              padding: "8px 16px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px"
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleParseAndImport}
            style={{
              background: "linear-gradient(135deg, #38bdf8, #0284c7)",
              border: "none",
              color: "#000000",
              fontWeight: "700",
              padding: "8px 18px",
              borderRadius: "6px",
              cursor: "pointer",
              fontSize: "13px",
              boxShadow: "0 2px 8px rgba(56, 189, 248, 0.3)"
            }}
          >
            Import Trades
          </button>
        </div>
      </div>
    </div>
  );
}
