"use client";

import { useEffect, useMemo, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { deepAnalyzeTrade, generateRecommendation } from "./chart/patterns";
import LiveSessionClocks from "./components/LiveSessionClocks";
import KnowledgeHub from "./components/KnowledgeHub";
import WeeklyNewsHub from "./components/WeeklyNewsHub";
import ProCalendarModal from "./components/ProCalendarModal";
import KnowledgeModal from "./components/KnowledgeModal";
import AnalysisModal from "./components/AnalysisModal";
import MiniChartsGrid from "./components/MiniChartsGrid";
import { translations } from "./translations";

const defaultTrade = {
  symbol: "GOLD",
  type: "BUY",
  volume: 0.1,
  openPrice: 4058.57,
  closePrice: 4055.95,
  openTime: parseDate("23/07/2026 15:39") || new Date(),
  closeTime: parseDate("23/07/2026 15:44") || new Date(),
  profit: -26.2
};

const symbols = ["BTCUSDT", "BTCUSD", "GOLD", "XAUUSD", "EURUSD", "US100CASH", "US30CASH", "US500CASH", "US100", "US30", "US500"];
const intervals = ["1m", "5m", "15m", "1h", "1d", "1w"];
const minVisibleCandles = 35;
const maxVisibleCandles = 500;

export default function Home() {
  const router = useRouter();
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const [provider, setProvider] = useState("twelvedata");
  const [marketSymbol, setMarketSymbol] = useState("GOLD");
  const [interval, setInterval] = useState("1m");
  const [apiKey, setApiKey] = useState("");
  const [candles, setCandles] = useState([]);
  const [visibleCount, setVisibleCount] = useState(170);
  const [windowEndIndex, setWindowEndIndex] = useState(null);
  const [trades, setTrades] = useState([defaultTrade]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [googleSheetsError, setGoogleSheetsError] = useState("");
  const [importMessage, setImportMessage] = useState("Loading journal...");
  const [journalFiles, setJournalFiles] = useState([]);
  const [activeFileName, setActiveFileName] = useState("");
  const [filterPL, setFilterPL] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSymbols, setFilterSymbols] = useState([]);
  const [filterDate, setFilterDate] = useState("");
  const [filterDurationMin, setFilterDurationMin] = useState("");
  const [filterDurationMax, setFilterDurationMax] = useState("");
  const [isFullscreenTrades, setIsFullscreenTrades] = useState(false);
  const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [showChart, setShowChart] = useState(true);
  const [isKnowledgeOpen, setIsKnowledgeOpen] = useState(false);
  const [editingTrade, setEditingTrade] = useState(null);
  const [isAddTradeOpen, setIsAddTradeOpen] = useState(false);
  const [renamingFileName, setRenamingFileName] = useState("");
  const [renameInputVal, setRenameInputVal] = useState("");
  const [lang, setLang] = useState("en");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language");
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  }, [lang]);

  const t = translations[lang] || translations.en;

  const saveTradesToStorage = async (updatedTrades, customFileName = null) => {
    try {
      localStorage.setItem("chart_trades", JSON.stringify(updatedTrades));
      const targetFileName = customFileName || activeFileName || "manual-trades.csv";
      const headers = "Symbol,Type,Volume,Open Price,Close Price,Open Time,Close Time,Profit\n";
      const rows = updatedTrades.map((t) =>
        `${t.symbol},${t.type},${t.volume},${t.openPrice},${t.closePrice},${formatCsvDate(t.openTime)},${formatCsvDate(t.closeTime)},${t.profit}`
      ).join("\n");
      const rawContent = headers + rows;
      const saved = JSON.parse(localStorage.getItem("journal_files") || "[]");
      let updatedFiles = saved.map((f) => f.name === targetFileName ? { ...f, content: rawContent } : f);
      if (!saved.some(f => f.name === targetFileName)) {
        updatedFiles.push({ name: targetFileName, content: rawContent });
      }
      localStorage.setItem("journal_files", JSON.stringify(updatedFiles));
      
      // Save to filesystem on the server
      const res = await fetch("/api/journal-files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: targetFileName, content: rawContent })
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.files && !payload.isReadOnly) {
          setJournalFiles(payload.files);
        }
        if (payload.googleDrive && payload.googleDrive.success) {
          setImportMessage(`Saved successfully! Synced to Google Sheets tab "${payload.googleDrive.tabName}".`);
          setError("");
        } else if (payload.googleDrive) {
          setImportMessage(`Saved locally to ${targetFileName}.`);
          setError(`Google Sheets Sync Error: ${payload.googleDrive.reason}`);
        }
      }
    } catch (e) {
      setError(`Save Error: ${e.message}`);
    }
  };

  const handleDeleteTrade = (tradeToDelete, e) => {
    e.stopPropagation();
    const updated = trades.filter((t) => t !== tradeToDelete);
    setTrades(updated);
    saveTradesToStorage(updated);
  };

  const handleSaveTrade = async (newTrade, originalTrade) => {
    let updated;
    if (originalTrade) {
      updated = trades.map((t) => (t === originalTrade ? newTrade : t));
      setTrades(updated);
      saveTradesToStorage(updated);
    } else {
      // Create or append to manual-trades.csv on server
      try {
        const res = await fetch("/api/journal-files", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ trade: newTrade })
        });
        if (res.ok) {
          const payload = await res.json();
          if (payload.isReadOnly) {
            // Read-only filesystem (Vercel) fallback!
            const activeName = "manual-trades.csv";
            const savedFiles = JSON.parse(localStorage.getItem("journal_files") || "[]");
            let manualFile = savedFiles.find(f => f.name === activeName);
            const headers = "Symbol,Type,Volume,Open Price,Close Price,Open Time,Close Time,Profit\n";
            const row = `${newTrade.symbol},${newTrade.type},${newTrade.volume},${newTrade.openPrice},${newTrade.closePrice},${formatCsvDate(newTrade.openTime)},${formatCsvDate(newTrade.closeTime)},${newTrade.profit}\n`;
            
            if (!manualFile) {
              manualFile = { name: activeName, content: headers + row };
              savedFiles.push(manualFile);
            } else {
              manualFile.content += row;
            }
            
            localStorage.setItem("journal_files", JSON.stringify(savedFiles));
            setJournalFiles(savedFiles);
            setActiveFileName(activeName);
            localStorage.setItem("active_journal_file_name", activeName);
            
            const imported = parseCsvToTrades(manualFile.content);
            setTrades(imported);
            setSelectedIndex(0);
            const firstSymbol = normalizeSymbol(newTrade.symbol);
            setMarketSymbol(firstSymbol);
            setProvider(isCryptoSymbol(firstSymbol) ? "binance" : "twelvedata");
            setImportMessage(`Added trade to browser local storage (server read-only).`);
          } else if (payload.files) {
            setJournalFiles(payload.files);
            const activeName = "manual-trades.csv";
            setActiveFileName(activeName);
            localStorage.setItem("active_journal_file_name", activeName);

            const manualFile = payload.files.find(f => f.name === activeName);
            if (manualFile) {
              const imported = parseCsvToTrades(manualFile.content);
              setTrades(imported);
              setSelectedIndex(0);
              const firstSymbol = normalizeSymbol(imported[0]?.symbol || newTrade.symbol);
              setMarketSymbol(firstSymbol);
              setProvider(isCryptoSymbol(firstSymbol) ? "binance" : "twelvedata");
              setImportMessage(`Added trade and switched to manual-trades.csv.`);
              setError("");
            }
          }
        } else {
          const errPayload = await res.json();
          setError(errPayload.error || "Failed to save trade to server.");
        }
      } catch (e) {
        console.error(e);
        setError("Error saving manual trade.");
      }
    }
  };

  const handlePasteClipboardDirect = async () => {
    setError("");
    try {
      const clipboardText = await navigator.clipboard.readText();
      if (!clipboardText.trim()) {
        setError("Clipboard is empty.");
        return;
      }

      // 0. Strip hidden Unicode directional formatting/isolate characters (e.g. \u2066, \u2069, \u200e)
      // that MetaTrader copies, which cause parseFloat to return NaN
      let cleaned = clipboardText.replace(/[\u200e\u200f\u2066\u2067\u2068\u2069]/g, "");

      // 1. Remove thousands separators from numbers (e.g. 64,318.42 -> 64318.42)
      // so that they don't break the comma-separated splitting structure.
      cleaned = cleaned.replace(/(\d),(\d{3})/g, "$1$2");

      // 2. Convert newlines (\r, \n), tabs (\t), or big spaces (2 or more spaces) to commas
      cleaned = cleaned
        .replace(/[\r\n]+/g, ",")
        .replace(/\t+/g, ",")
        .replace(/\s{2,}/g, ",")
        .trim();

      // Clean up consecutive commas
      cleaned = cleaned.replace(/,+/g, ",");

      // Parse this as a comma-separated string
      const parts = cleaned.split(",").map(p => p.trim()).filter(Boolean);

      if (parts.length < 14) {
        throw new Error("Invalid clipboard layout. Expected at least 14 fields.");
      }

      const parseDateHelper = (str) => {
        const d = new Date(str);
        if (isNaN(d.getTime())) {
          throw new Error(`Invalid date: "${str}".`);
        }
        return d;
      };

      const validTrades = [];
      let k = 0;
      while (k < parts.length) {
        const current = parts[k];
        
        // Skip header fields
        if (
          current.toLowerCase().includes("symbol") ||
          current.toLowerCase().includes("type") ||
          current.toLowerCase().includes("volume")
        ) {
          k++;
          continue;
        }

        const next = parts[k + 1];
        if (current && next && (next.toUpperCase() === "BUY" || next.toUpperCase() === "SELL")) {
          try {
            if (k + 12 >= parts.length) {
              throw new Error("Incomplete trade block.");
            }

            const symbol = current.replace(/[^a-zA-Z0-9]/g, "").toUpperCase();
            const type = next.toUpperCase();
            
            const volume = parseFloat(parts[k + 2]);
            if (isNaN(volume) || volume <= 0) {
              throw new Error(`Invalid volume: "${parts[k + 2]}".`);
            }

            const openPrice = parseFloat(parts[k + 3].replace(/,/g, ""));
            const closePrice = parseFloat(parts[k + 4].replace(/,/g, ""));
            if (isNaN(openPrice) || isNaN(closePrice)) {
              throw new Error(`Invalid prices: Open="${parts[k + 3]}", Close="${parts[k + 4]}".`);
            }

            // Dates contain a single comma and were split into two parts: index k+8 & k+9, index k+10 & k+11
            const openTime = parseDateHelper(`${parts[k + 8]}, ${parts[k + 9]}`);
            const closeTime = parseDateHelper(`${parts[k + 10]}, ${parts[k + 11]}`);

            // Swap is at k+12
            // Reason can be at k+13, profit at k+14, or profit at k+13
            let profitStr = parts[k + 13];
            let increment = 14;

            const tempProfit = parseFloat(profitStr.replace(/\+/g, "").replace(/,/g, ""));
            if (isNaN(tempProfit)) {
              if (k + 14 >= parts.length) {
                throw new Error("Missing profit value.");
              }
              profitStr = parts[k + 14];
              increment = 15;
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

            k += increment;
          } catch (err) {
            throw new Error(`Trade block starting with "${current}": ${err.message}`);
          }
        } else {
          k++;
        }
      }

      if (validTrades.length > 0) {
        // Load existing trades from manual-trades.csv specifically
        const saved = JSON.parse(localStorage.getItem("journal_files") || "[]");
        const manualFile = saved.find(f => f.name === "manual-trades.csv");
        let existingTrades = [];
        if (manualFile) {
          existingTrades = parseCsvToTrades(manualFile.content);
        } else {
          existingTrades = trades;
        }

        const updated = [...validTrades, ...existingTrades];
        
        // 1. Save specifically to manual-trades.csv
        await saveTradesToStorage(updated, "manual-trades.csv");
        
        // 2. Switch view to manual-trades.csv
        setActiveFileName("manual-trades.csv");
        localStorage.setItem("active_journal_file_name", "manual-trades.csv");
        setTrades(updated);

        setImportMessage(`Imported ${validTrades.length} trade(s) directly into manual-trades.csv.`);
        setError("");
      } else {
        throw new Error("No valid trades found in clipboard.");
      }
    } catch (err) {
      setError(`Clipboard Import Error: ${err.message}`);
    }
  };

  const handleSaveCurrentListAsCsv = async () => {
    setError("");
    const rawName = window.prompt("Save current trade list as a new CSV backtest file. Enter name (e.g. backtest_gold):");
    if (!rawName) return;
    
    let fileName = rawName.trim();
    if (!fileName) return;
    
    if (!fileName.toLowerCase().endsWith(".csv")) {
      fileName += ".csv";
    }

    try {
      const headers = "Symbol,Type,Volume,Open Price,Close Price,Open Time,Close Time,Profit\n";
      const rows = trades.map((t) =>
        `${t.symbol},${t.type},${t.volume},${t.openPrice},${t.closePrice},${formatCsvDate(t.openTime)},${formatCsvDate(t.closeTime)},${t.profit}`
      ).join("\n");
      const rawContent = headers + rows;

      const res = await fetch("/api/journal-files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: fileName, content: rawContent })
      });
      
      if (res.ok) {
        const payload = await res.json();
        if (payload.files) {
          setJournalFiles(payload.files);
          setActiveFileName(fileName);
          localStorage.setItem("active_journal_file_name", fileName);
          
          const saved = JSON.parse(localStorage.getItem("journal_files") || "[]");
          const updatedFiles = [...saved.filter(f => f.name !== fileName), { name: fileName, content: rawContent }];
          localStorage.setItem("journal_files", JSON.stringify(updatedFiles));
          
          if (payload.googleDrive && payload.googleDrive.success) {
            setImportMessage(`Saved new backtest file "${fileName}" and Synced to Google Sheets tab "${payload.googleDrive.tabName}"!`);
            setError("");
          } else if (payload.googleDrive) {
            setImportMessage(`Saved new backtest file "${fileName}" locally.`);
            setError(`Google Sheets Sync Error: ${payload.googleDrive.reason}`);
          }
        }
      } else {
        throw new Error("Failed to write file to server.");
      }
    } catch (err) {
      setError(`Save Error: ${err.message}`);
    }
  };

  const handleWheel = (e) => {
    e.preventDefault();
    if (e.deltaY < 0) {
      zoomIn();
    } else {
      zoomOut();
    }
  };

  const handleChartClick = () => {
    try {
      localStorage.setItem("chart_trades", JSON.stringify(trades));
    } catch (_) {}
    router.push(`/chart?symbol=${marketSymbol}&interval=${interval}&selectedIndex=${selectedIndex}&provider=${provider}`);
  };

  const uniqueSymbols = useMemo(() => {
    const set = new Set(trades.map((t) => normalizeSymbol(t.symbol)));
    return Array.from(set).filter(Boolean);
  }, [trades]);

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      // 1. P/L filter
      if (filterPL === "win" && t.profit <= 0) return false;
      if (filterPL === "loss" && t.profit > 0) return false;

      // 2. Type filter
      if (filterType === "buy" && t.type.toUpperCase() !== "BUY") return false;
      if (filterType === "sell" && t.type.toUpperCase() !== "SELL") return false;

      // 3. Symbol filter
      const normSym = normalizeSymbol(t.symbol);
      if (filterSymbols.length > 0 && !filterSymbols.includes(normSym)) return false;

      // 4. Date filter
      if (filterDate) {
        try {
          const tDate = t.openTime.toISOString().split("T")[0];
          if (tDate !== filterDate) return false;
        } catch (_) {
          return false;
        }
      }

      // 5. Duration filter
      const dur = duration(t);
      if (filterDurationMin && dur < Number(filterDurationMin)) return false;
      if (filterDurationMax && dur > Number(filterDurationMax)) return false;

      return true;
    });
  }, [trades, filterPL, filterType, filterSymbols, filterDate, filterDurationMin, filterDurationMax]);

  const selectedTrade = filteredTrades[selectedIndex] || filteredTrades[0];

  const visibleCandles = useMemo(() => {
    if (!candles.length) return [];
    const end = clamp(windowEndIndex ?? candles.length, minVisibleCandles, candles.length);
    const start = Math.max(0, end - visibleCount);
    return candles.slice(start, end);
  }, [candles, visibleCount, windowEndIndex]);

  const stats = useMemo(() => {
    const total = filteredTrades.reduce((sum, trade) => sum + trade.profit, 0);
    const wins = filteredTrades.filter((trade) => trade.profit > 0).length;
    const avg = filteredTrades.length ? total / filteredTrades.length : 0;
    return { total, wins, avg, winRate: filteredTrades.length ? Math.round((wins / filteredTrades.length) * 100) : 0 };
  }, [filteredTrades]);

  useEffect(() => {
    fetchCandles();
  }, [marketSymbol, provider]);

  useEffect(() => {
    drawChart();
  }, [visibleCandles, selectedTrade, loading]);

  useEffect(() => {
    const onResize = () => drawChart();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [visibleCandles, selectedTrade, loading]);

  useEffect(() => {
    if (candles.length) {
      if (selectedTrade) {
        fitTrade();
      } else {
        setWindowEndIndex(candles.length);
      }
    }
  }, [candles, selectedTrade]);

  async function fetchCandles(nextInterval = interval) {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        provider,
        symbol: marketSymbol,
        interval: nextInterval,
        limit: "1000"
      });
      if (selectedTrade && normalizeSymbol(selectedTrade.symbol) === normalizeSymbol(marketSymbol)) {
        const windowMs = intervalMs(nextInterval) * 420;
        params.set("from", String(selectedTrade.openTime.getTime() - windowMs));
        params.set("to", String(selectedTrade.closeTime.getTime() + windowMs));
      }
      if (provider === "twelvedata" && apiKey.trim()) params.set("apiKey", apiKey.trim());
      const response = await fetch(`/api/ohlc?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Market data request failed.");
      setCandles(payload.candles || []);
      setWindowEndIndex((payload.candles || []).length);
    } catch (requestError) {
      setCandles([]);
      setError(requestError instanceof Error ? requestError.message : "Could not load market data.");
    } finally {
      setLoading(false);
    }
  }

  const parseCsvToTrades = (text) => {
    try {
      const rows = parseCsv(text);
      return rows.map(normalizeTrade).filter(Boolean);
    } catch (_) {
      return [];
    }
  };

  // Load journal files on mount
  useEffect(() => {
    const init = async () => {
      try {
        const res = await fetch("/api/journal-files");
        const payload = await res.json();
        let files = [];
        const stored = JSON.parse(localStorage.getItem("journal_files") || "[]");

        if (res.ok) {
          if (payload.googleSheetsError) {
            setGoogleSheetsError(payload.googleSheetsError);
          } else {
            setGoogleSheetsError("");
          }
          const serverFiles = payload.files || [];
          
          // Merge local stored files and server files, prioritizing server files
          const mergedMap = new Map();
          stored.forEach(f => mergedMap.set(f.name, f));
          serverFiles.forEach(f => mergedMap.set(f.name, f));
          files = Array.from(mergedMap.values());
          
          if (files.length > 0) {
            localStorage.setItem("journal_files", JSON.stringify(files));
          }
        } else {
          if (stored.length > 0) {
            files = stored;
          } else {
            const defaultRes = await fetch("/api/default-csv");
            const defaultPayload = await defaultRes.json();
            if (defaultRes.ok && defaultPayload.content) {
              files = [{ name: defaultPayload.name, content: defaultPayload.content }];
              localStorage.setItem("journal_files", JSON.stringify(files));
            }
          }
        }

        if (files.length > 0) {
          setJournalFiles(files);
          const activeName = localStorage.getItem("active_journal_file_name") || files[0].name;
          const activeFile = files.find(f => f.name === activeName) || files[0];
          setActiveFileName(activeFile.name);
          localStorage.setItem("active_journal_file_name", activeFile.name);

          // Parse and set trades
          const imported = parseCsvToTrades(activeFile.content);
          if (imported.length > 0) {
            setTrades(imported);
            setSelectedIndex(0);
            const firstSymbol = normalizeSymbol(imported[0].symbol);
            setMarketSymbol(firstSymbol);
            setProvider(isCryptoSymbol(firstSymbol) ? "binance" : "twelvedata");
            setImportMessage(`Loaded ${activeFile.name}.`);
          } else {
            setTrades([defaultTrade]);
            setImportMessage("Loaded default template.");
          }
        } else {
          setTrades([defaultTrade]);
          setImportMessage("Loaded default template.");
        }
      } catch (e) {
        console.error("Failed to load journal files", e);
        setTrades([defaultTrade]);
        setImportMessage("Loaded default template.");
      }
    };
    init();
  }, []);

  const handleSelectFile = (fileName) => {
    const file = journalFiles.find((f) => f.name === fileName);
    if (!file) return;

    setActiveFileName(file.name);
    localStorage.setItem("active_journal_file_name", file.name);

    const imported = parseCsvToTrades(file.content);
    if (imported.length > 0) {
      setTrades(imported);
      setSelectedIndex(0);
      const firstSymbol = normalizeSymbol(imported[0].symbol);
      setMarketSymbol(firstSymbol);
      setProvider(isCryptoSymbol(firstSymbol) ? "binance" : "twelvedata");
      setImportMessage(`Switched to file ${file.name}.`);
      setError("");
    } else {
      setTrades([]);
      setError("This file does not contain valid trades.");
    }
  };

  const handleRenameFile = async (oldName, newName) => {
    if (!newName || newName.trim() === "" || newName === oldName) {
      setRenamingFileName("");
      return;
    }
    try {
      const res = await fetch("/api/journal-files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName, newName })
      });
      if (res.ok) {
        const payload = await res.json();
        let targetName = newName.endsWith(".csv") ? newName : `${newName}.csv`;
        
        if (payload.isReadOnly) {
          const saved = JSON.parse(localStorage.getItem("journal_files") || "[]");
          const updated = saved.map(f => f.name === oldName ? { ...f, name: targetName } : f);
          localStorage.setItem("journal_files", JSON.stringify(updated));
          setJournalFiles(updated);
          if (activeFileName === oldName) {
            setActiveFileName(targetName);
            localStorage.setItem("active_journal_file_name", targetName);
          }
        } else if (payload.files) {
          setJournalFiles(payload.files);
          if (activeFileName === oldName) {
            setActiveFileName(targetName);
            localStorage.setItem("active_journal_file_name", targetName);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
    setRenamingFileName("");
  };

  const handleArchiveFile = async (file, e) => {
    e.stopPropagation();
    try {
      const isArchiving = !file.isArchived;
      const res = await fetch("/api/journal-files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: file.name, archive: isArchiving })
      });
      if (res.ok) {
        const payload = await res.json();
        const targetName = isArchiving
          ? (file.name.startsWith("[ARCHIVE] ") ? file.name : `[ARCHIVE] ${file.name}`)
          : file.name.replace("[ARCHIVE] ", "");

        if (payload.isReadOnly) {
          const saved = JSON.parse(localStorage.getItem("journal_files") || "[]");
          const updated = saved.map(f => f.name === file.name ? { ...f, name: targetName, isArchived: isArchiving } : f);
          localStorage.setItem("journal_files", JSON.stringify(updated));
          setJournalFiles(updated);
          if (activeFileName === file.name) {
            setActiveFileName(targetName);
            localStorage.setItem("active_journal_file_name", targetName);
          }
        } else if (payload.files) {
          setJournalFiles(payload.files);
          if (activeFileName === file.name) {
            setActiveFileName(targetName);
            localStorage.setItem("active_journal_file_name", targetName);
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDownloadFile = (file, e) => {
    e.stopPropagation();
    const blob = new Blob([file.content], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", file.name);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDeleteFile = async (fileName, e) => {
    e.stopPropagation();
    if (!confirm(`Are you sure you want to delete ${fileName}?`)) return;
    try {
      const res = await fetch(`/api/journal-files?name=${encodeURIComponent(fileName)}`, {
        method: "DELETE"
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.isReadOnly) {
          const saved = JSON.parse(localStorage.getItem("journal_files") || "[]");
          const updated = saved.filter(f => f.name !== fileName);
          localStorage.setItem("journal_files", JSON.stringify(updated));
          setJournalFiles(updated);
          if (activeFileName === fileName) {
            const remaining = updated.filter(f => f.name !== fileName);
            if (remaining.length > 0) {
              handleSelectFile(remaining[0].name);
            } else {
              setTrades([defaultTrade]);
              setActiveFileName("");
              localStorage.removeItem("active_journal_file_name");
            }
          }
        } else if (payload.files) {
          setJournalFiles(payload.files);
          if (activeFileName === fileName) {
            const remaining = payload.files.filter(f => f.name !== fileName);
            if (remaining.length > 0) {
              handleSelectFile(remaining[0].name);
            } else {
              setTrades([defaultTrade]);
              setActiveFileName("");
              localStorage.removeItem("active_journal_file_name");
            }
          }
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  async function importTrades(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const imported = parseCsvToTrades(text);

    if (!imported.length) {
      setImportMessage(`No trades found in ${file.name}. Check column names.`);
      setError("CSV imported, but no valid trades were detected.");
      return;
    }

    // Add to journal files list locally first
    let updatedFiles = [];
    setJournalFiles((prev) => {
      const filtered = prev.filter((f) => f.name !== file.name);
      updatedFiles = [...filtered, { name: file.name, content: text }];
      localStorage.setItem("journal_files", JSON.stringify(updatedFiles));
      return updatedFiles;
    });

    // Try to save to backend server filesystem
    try {
      const res = await fetch("/api/journal-files", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldName: file.name, content: text })
      });
      if (res.ok) {
        const payload = await res.json();
        if (payload.files && !payload.isReadOnly) {
          setJournalFiles(payload.files);
          localStorage.setItem("journal_files", JSON.stringify(payload.files));
        }
      }
    } catch (e) {
      console.error("Failed to save imported file to server", e);
    }

    setActiveFileName(file.name);
    localStorage.setItem("active_journal_file_name", file.name);

    const firstSymbol = normalizeSymbol(imported[0].symbol);
    setTrades(imported);
    setSelectedIndex(0);
    setMarketSymbol(firstSymbol);
    setProvider(isCryptoSymbol(firstSymbol) ? "binance" : "twelvedata");
    setImportMessage(`${imported.length} trades saved in ${file.name}.`);
    setError("");
  }

  function changeInterval(nextInterval) {
    setInterval(nextInterval);
    fetchCandles(nextInterval);
  }

  function zoomIn() {
    setVisibleCount((count) => Math.max(minVisibleCandles, Math.round(count * 0.65)));
  }

  function zoomOut() {
    setVisibleCount((count) => Math.min(maxVisibleCandles, Math.round(count * 1.45)));
  }

  function pan(direction) {
    setWindowEndIndex((end) => {
      const currentEnd = end ?? candles.length;
      const step = Math.max(8, Math.round(visibleCount * 0.35));
      return clamp(currentEnd + direction * step, minVisibleCandles, candles.length);
    });
  }

  function showLatest() {
    setWindowEndIndex(candles.length);
  }

  function fitTrade() {
    if (!selectedTrade || !candles.length) return;
    const open = selectedTrade.openTime.getTime();
    const close = selectedTrade.closeTime.getTime();
    const center = (open + close) / 2;
    const nearestIndex = candles.reduce((best, candle, index) => {
      const bestDistance = Math.abs(candles[best].time - center);
      const distance = Math.abs(candle.time - center);
      return distance < bestDistance ? index : best;
    }, 0);
    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    const nextVisible = Math.min(maxVisibleCandles, Math.max(minVisibleCandles, isMobile ? 35 : 75));
    setVisibleCount(nextVisible);
    setWindowEndIndex(clamp(nearestIndex + Math.round(nextVisible / 2), minVisibleCandles, candles.length));
  }

  function drawChart() {
    const canvas = canvasRef.current;
    const wrap = wrapRef.current;
    if (!canvas || !wrap) return;
    const context = canvas.getContext("2d");
    if (!context) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = wrap.getBoundingClientRect();
    canvas.width = Math.max(320, Math.floor(rect.width * dpr));
    canvas.height = Math.max(360, Math.floor(rect.height * dpr));
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    const width = canvas.width / dpr;
    const height = canvas.height / dpr;
    context.clearRect(0, 0, width, height);
    context.fillStyle = "#050506";
    context.fillRect(0, 0, width, height);

    if (!visibleCandles.length) {
      drawEmpty(context, width, height, loading ? "Loading candles..." : "No candles loaded yet.");
      return;
    }

    const pad = { left: 58, right: 76, top: 28, bottom: 34 };
    const targetTrade = selectedTrade && normalizeSymbol(selectedTrade.symbol) === normalizeSymbol(marketSymbol) ? selectedTrade : null;
    const activeTrades = targetTrade ? [targetTrade] : [];
    const visibleStart = visibleCandles[0].time;
    const visibleEnd = visibleCandles[visibleCandles.length - 1].time;
    const visibleTrades = activeTrades.filter((trade) => trade.closeTime.getTime() >= visibleStart && trade.openTime.getTime() <= visibleEnd);
    const tradePrices = visibleTrades.flatMap((trade) => [trade.openPrice, trade.closePrice]);
    const minPrice = Math.min(...visibleCandles.map((c) => c.low), ...tradePrices);
    const maxPrice = Math.max(...visibleCandles.map((c) => c.high), ...tradePrices);
    const buffer = Math.max((maxPrice - minPrice) * 0.12, 0.0001);
    const low = minPrice - buffer;
    const high = maxPrice + buffer;
    const chartW = width - pad.left - pad.right;
    const chartH = height - pad.top - pad.bottom;
    const xStep = chartW / Math.max(visibleCandles.length, 1);
    const candleW = Math.max(3, Math.min(13, xStep * 0.58));
    const yFor = (value) => pad.top + ((high - value) / (high - low)) * chartH;
    const xFor = (index) => pad.left + index * xStep + xStep / 2;

    drawGrid(context, width, height, pad, low, high, yFor);

    visibleCandles.forEach((candle, index) => {
      const x = xFor(index);
      const yOpen = yFor(candle.open);
      const yClose = yFor(candle.close);
      const up = candle.close >= candle.open;
      context.strokeStyle = up ? "#a3e635" : "#f43f5e";
      context.fillStyle = up ? "#a3e635" : "#f43f5e";
      context.lineWidth = 1;
      context.beginPath();
      context.moveTo(x, yFor(candle.high));
      context.lineTo(x, yFor(candle.low));
      context.stroke();
      context.fillRect(x - candleW / 2, Math.min(yOpen, yClose), candleW, Math.max(2, Math.abs(yClose - yOpen)));
    });

    activeTrades.forEach((trade) => drawTrade(context, trade, visibleCandles, pad, chartW, yFor, true));
    drawTimeLabels(context, visibleCandles, pad, chartW, height);
  }

  return (
    <main className="shell">
      <div className={`sidebarOverlay ${mobileMenuOpen ? "open" : ""}`} onClick={() => setMobileMenuOpen(false)} />
      <aside className={`sidebar ${mobileMenuOpen ? "open" : ""}`}>
        <div className="brand" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", position: "relative" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span className="mark">BDL</span>
            <div>
              <h1>#bdl79</h1>
              <p style={{ margin: 0, fontSize: "11px", color: "#888893" }}>{t.forEasilyBacktesting}</p>
            </div>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <select 
              value={lang} 
              onChange={(e) => {
                setLang(e.target.value);
                localStorage.setItem("preferred_language", e.target.value);
              }}
              style={{
                background: "#111113",
                border: "1px solid #222225",
                color: "#ffffff",
                padding: "4px 8px",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer"
              }}
            >
              <option value="en">🇬🇧 EN</option>
              <option value="fr">🇫🇷 FR</option>
              <option value="ar">🇲🇦 AR</option>
            </select>
            <button className="sidebarCloseBtn" onClick={() => setMobileMenuOpen(false)}>✕</button>
          </div>
        </div>

        <section className="section">
          <h2>{t.chartSettings}</h2>
          <label>
            {t.provider}
            <select value={provider} onChange={(event) => setProvider(event.target.value)}>
              <option value="binance">{t.binanceOption}</option>
              <option value="twelvedata">{t.twelveDataOption}</option>
            </select>
          </label>
          <label>
            {t.symbol}
            <input value={marketSymbol} onChange={(event) => setMarketSymbol(event.target.value.toUpperCase())} list="symbols" />
          </label>
          <datalist id="symbols">
            {symbols.map((symbol) => <option value={symbol} key={symbol} />)}
          </datalist>
          {provider === "twelvedata" && (
            <label>
              {t.twelveDataKey}
              <input value={apiKey} onChange={(event) => setApiKey(event.target.value)} placeholder={t.twelveDataPlaceholder} />
            </label>
          )}
          <button className="primary" onClick={() => fetchCandles()} disabled={loading}>{loading ? t.loading : t.loadCandles}</button>
          {error && <p className="error">{error}</p>}
        </section>

        <section className="section">
          <h2>{t.savedJournals}</h2>
          {googleSheetsError && (
            <p className="error" style={{ color: "#ef4444", fontSize: "11px", margin: "0 0 8px 0", background: "rgba(239, 68, 68, 0.08)", padding: "6px", borderRadius: "4px", border: "1px solid rgba(239, 68, 68, 0.2)" }}>
              ⚠️ Google Sheet Sync: {googleSheetsError}
            </p>
          )}
          <div className="fileList" style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "160px", overflowY: "auto", paddingRight: "4px" }}>
            {journalFiles.length === 0 && <p className="muted" style={{ fontSize: "11px" }}>{t.noSavedFiles}</p>}
            {journalFiles.map((file) => {
              const isRenaming = renamingFileName === file.name;
              return (
                <div
                  key={file.name}
                  onClick={() => !isRenaming && handleSelectFile(file.name)}
                  className={`fileItem ${file.name === activeFileName ? "active" : ""} ${file.isArchived ? "archived" : ""}`}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "6px 10px",
                    borderRadius: "6px",
                    background: file.name === activeFileName
                      ? "rgba(56, 189, 248, 0.12)"
                      : file.isArchived
                      ? "rgba(139, 148, 158, 0.05)"
                      : "#0f151d",
                    border: file.name === activeFileName
                      ? "1px solid #38bdf8"
                      : file.isArchived
                      ? "1px dashed #30363d"
                      : "1px solid #26313d",
                    cursor: isRenaming ? "default" : "pointer",
                    fontSize: "12px",
                    color: file.name === activeFileName
                      ? "#38bdf8"
                      : file.isArchived
                      ? "#484f58"
                      : "#8b949e",
                    transition: "all 0.15s",
                    opacity: file.isArchived && file.name !== activeFileName ? 0.6 : 1
                  }}
                >
                  {isRenaming ? (
                    <input
                      value={renameInputVal}
                      onChange={(e) => setRenameInputVal(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRenameFile(file.name, renameInputVal);
                        if (e.key === "Escape") setRenamingFileName("");
                      }}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                      style={{
                        background: "#161b22",
                        border: "1px solid #30363d",
                        color: "#e6edf3",
                        fontSize: "12px",
                        padding: "2px 6px",
                        borderRadius: "4px",
                        width: "80%"
                      }}
                    />
                  ) : (
                    <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", marginRight: "8px" }} title={file.name}>
                      {file.isArchived ? "📦 " : "📄 "}
                      {file.name}
                    </span>
                  )}

                  {!isRenaming && (
                    <div style={{ display: "flex", gap: "6px", alignItems: "center" }} onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setRenamingFileName(file.name);
                          setRenameInputVal(file.name.replace(".csv", ""));
                        }}
                        style={{ background: "transparent", border: 0, color: "#8b949e", cursor: "pointer", fontSize: "11px", padding: "0 2px" }}
                        title={t.renameFile}
                      >
                        ✏️
                      </button>
                      <button
                        onClick={(e) => handleArchiveFile(file, e)}
                        style={{ background: "transparent", border: 0, color: "#8b949e", cursor: "pointer", fontSize: "11px", padding: "0 2px" }}
                        title={file.isArchived ? t.unarchiveFile : t.archiveFile}
                      >
                        {file.isArchived ? "📤" : "📦"}
                      </button>
                      <button
                        onClick={(e) => handleDownloadFile(file, e)}
                        style={{ background: "transparent", border: 0, color: "#8b949e", cursor: "pointer", fontSize: "11px", padding: "0 2px" }}
                        title={t.downloadFile}
                      >
                        📥
                      </button>
                      <button
                        onClick={(e) => handleDeleteFile(file.name, e)}
                        style={{ background: "transparent", border: 0, color: "#f43f5e", cursor: "pointer", fontSize: "11px", padding: "0 2px" }}
                        title={t.deleteFile}
                      >
                        ✕
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        <section className="section">
          <h2>{t.trades}</h2>
          <label className="file">
            {t.importTrades}
            <input type="file" accept=".csv,text/csv" onChange={importTrades} />
          </label>
          <p className="muted">{importMessage}</p>
          <p className="muted">{t.acceptedFormat}</p>
        </section>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button className="menuToggleBtn" onClick={() => setMobileMenuOpen(true)}>☰</button>
            <div>
              <h2>{marketSymbol} <span>{interval}</span></h2>
              <p>{provider === "binance" ? t.binanceDesc : t.twelveDataDesc}</p>
            </div>
          </div>
          <div className="stats">
            <Stat label={t.netProfit} value={money(stats.total)} tone={stats.total >= 0 ? "good" : "bad"} />
            <Stat label={t.winRate} value={`${stats.winRate}%`} />
            <Stat label={t.trades} value={String(filteredTrades.length)} />
            <Stat label={t.avgTrade} value={money(stats.avg)} tone={stats.avg >= 0 ? "good" : "bad"} />
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <a
              href="/knowledge"
              target="_blank"
              rel="noreferrer"
              style={{
                background: "linear-gradient(135deg, #3b82f6, #2563eb)",
                border: "none",
                color: "#fff",
                padding: "8px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.3px",
                boxShadow: "0 2px 8px rgba(59, 130, 246, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                textDecoration: "none"
              }}
            >
              <span>📚</span> {t.knowledge} ↗
            </a>
            <button
              onClick={() => setIsCalendarOpen(true)}
              style={{
                background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none",
                color: "#fff",
                padding: "8px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.3px",
                boxShadow: "0 2px 8px rgba(16, 185, 129, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>📅</span> {t.calendar}
            </button>
            <button
              onClick={() => setIsAnalysisOpen(true)}
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
                border: "none",
                color: "#fff",
                padding: "8px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.3px",
                boxShadow: "0 2px 8px rgba(99, 102, 241, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>📊</span> {t.analysis}
            </button>
            <button
              onClick={() => setShowChart(!showChart)}
              style={{
                background: "linear-gradient(135deg, #475569, #334155)",
                border: "none",
                color: "#fff",
                padding: "8px 18px",
                borderRadius: "8px",
                cursor: "pointer",
                fontSize: "13px",
                fontWeight: "700",
                letterSpacing: "0.3px",
                boxShadow: "0 2px 8px rgba(71, 85, 105, 0.35)",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>{showChart ? "👁️‍🗨️" : "👁️"}</span> {showChart ? t.hideChart : t.showChart}
            </button>
          </div>
        </header>

        {/* Live Session Clocks & Pro Knowledge Hub Banner */}
        <div style={{ display: "flex", flexDirection: "column", gap: "0px", padding: "0 0 10px 0" }}>
          <LiveSessionClocks lang={lang} />
          <KnowledgeHub lang={lang} />
          <WeeklyNewsHub lang={lang} />
        </div>

        {showChart && <MiniChartsGrid />}

        <section className={`tableWrap ${isFullscreenTrades ? "fullscreen" : ""}`}>
          <div className="tableHeaderActions" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "12px", padding: "10px 0" }}>
            <h3 style={{ margin: 0, fontSize: "14px", fontWeight: "700" }}>{t.trades} ({filteredTrades.length} / {trades.length})</h3>
            <div style={{ display: "flex", gap: "8px" }}>
              <button
                onClick={() => setIsAddTradeOpen(true)}
                style={{
                  background: "linear-gradient(135deg, #22c55e, #16a34a)",
                  border: "none",
                  color: "#fff",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "0.2px",
                  boxShadow: "0 2px 8px rgba(34, 197, 94, 0.3)"
                }}
              >
                ➕ {t.addTrade}
              </button>
              <button
                onClick={handlePasteClipboardDirect}
                style={{
                  background: "linear-gradient(135deg, #38bdf8, #0284c7)",
                  border: "none",
                  color: "#000",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "0.2px",
                  boxShadow: "0 2px 8px rgba(56, 189, 248, 0.3)"
                }}
              >
                📋 Paste Clipboard
              </button>
              <button
                onClick={handleSaveCurrentListAsCsv}
                style={{
                  background: "linear-gradient(135deg, #fbbf24, #d97706)",
                  border: "none",
                  color: "#000",
                  padding: "6px 14px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "700",
                  letterSpacing: "0.2px",
                  boxShadow: "0 2px 8px rgba(251, 191, 36, 0.3)"
                }}
              >
                💾 Save CSV
              </button>
              <button 
                onClick={() => setIsFullscreenTrades(!isFullscreenTrades)}
                style={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  color: "#c9d1d9",
                  padding: "6px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px"
                }}
              >
                {isFullscreenTrades ? "✕" : "📺"}
              </button>
            </div>
          </div>

          {/* Filters Panel */}
          <div className="filterPanel" style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "8px", padding: "14px", marginBottom: "16px", display: "flex", flexWrap: "wrap", gap: "16px", fontSize: "12px" }}>
            {/* P/L Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ color: "#8b949e", fontWeight: "600", fontSize: "11px" }}>P/L</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {["all", "win", "loss"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setFilterPL(val)}
                    style={{
                      background: filterPL === val ? "#38bdf8" : "#161b22",
                      color: filterPL === val ? "#0d1117" : "#c9d1d9",
                      border: "1px solid #30363d",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                      textTransform: "capitalize"
                    }}
                  >
                    {val === "all" ? t.all : val === "win" ? t.wins : t.losses}
                  </button>
                ))}
              </div>
            </div>

            {/* Type Filter */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ color: "#8b949e", fontWeight: "600", fontSize: "11px" }}>{t.type}</span>
              <div style={{ display: "flex", gap: "4px" }}>
                {["all", "buy", "sell"].map((val) => (
                  <button
                    key={val}
                    onClick={() => setFilterType(val)}
                    style={{
                      background: filterType === val ? "#38bdf8" : "#161b22",
                      color: filterType === val ? "#0d1117" : "#c9d1d9",
                      border: "1px solid #30363d",
                      padding: "4px 10px",
                      borderRadius: "4px",
                      cursor: "pointer",
                      fontSize: "11px",
                      textTransform: "capitalize"
                    }}
                  >
                    {val === "all" ? t.all : val === "buy" ? t.buy : t.sell}
                  </button>
                ))}
              </div>
            </div>

            {/* Symbol Multi-select */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "150px" }}>
              <span style={{ color: "#8b949e", fontWeight: "600", fontSize: "11px" }}>{t.symbols}</span>
              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", maxHeight: "60px", overflowY: "auto", paddingRight: "4px" }}>
                {uniqueSymbols.map((sym) => {
                  const active = filterSymbols.includes(sym);
                  return (
                    <button
                      key={sym}
                      onClick={() => {
                        setFilterSymbols((prev) =>
                          active ? prev.filter((s) => s !== sym) : [...prev, sym]
                        );
                      }}
                      style={{
                        background: active ? "#38bdf8" : "#161b22",
                        color: active ? "#0d1117" : "#c9d1d9",
                        border: "1px solid #30363d",
                        padding: "3px 8px",
                        borderRadius: "4px",
                        cursor: "pointer",
                        fontSize: "11px"
                      }}
                    >
                      {sym}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date Picker */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ color: "#8b949e", fontWeight: "600", fontSize: "11px" }}>{t.startDate}</span>
              <input
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                style={{
                  background: "#161b22",
                  border: "1px solid #30363d",
                  color: "#c9d1d9",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  height: "26px",
                  fontSize: "11px"
                }}
              />
            </div>

            {/* Duration Range */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <span style={{ color: "#8b949e", fontWeight: "600", fontSize: "11px" }}>{t.avgDuration}</span>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <input
                  type="number"
                  placeholder="Min"
                  value={filterDurationMin}
                  onChange={(e) => setFilterDurationMin(e.target.value)}
                  style={{
                    background: "#161b22",
                    border: "1px solid #30363d",
                    color: "#c9d1d9",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    width: "60px",
                    height: "26px",
                    fontSize: "11px"
                  }}
                />
                <span style={{ color: "#8b949e" }}>to</span>
                <input
                  type="number"
                  placeholder="Max"
                  value={filterDurationMax}
                  onChange={(e) => setFilterDurationMax(e.target.value)}
                  style={{
                    background: "#161b22",
                    border: "1px solid #30363d",
                    color: "#c9d1d9",
                    padding: "4px 8px",
                    borderRadius: "4px",
                    width: "60px",
                    height: "26px",
                    fontSize: "11px"
                  }}
                />
              </div>
            </div>

            {/* Reset Filters */}
            <div style={{ display: "flex", alignItems: "flex-end" }}>
              <button
                onClick={() => {
                  setFilterPL("all");
                  setFilterType("all");
                  setFilterSymbols([]);
                  setFilterDate("");
                  setFilterDurationMin("");
                  setFilterDurationMax("");
                }}
                style={{
                  background: "transparent",
                  border: "1px solid #f43f5e",
                  color: "#f43f5e",
                  padding: "4px 10px",
                  borderRadius: "4px",
                  cursor: "pointer",
                  height: "26px",
                  fontSize: "11px"
                }}
              >
                Reset
              </button>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th>{t.type}</th>
                <th>{t.symbol}</th>
                <th>{t.entryPrice}</th>
                <th>{t.exitPrice}</th>
                <th>{t.openTime}</th>
                <th>P/L</th>
                <th>{t.avgDuration}</th>
                <th style={{ textAlign: "right", paddingRight: "16px" }}>{t.actions}</th>
              </tr>
            </thead>
            <tbody>
              {filteredTrades.map((trade, index) => (
                <tr
                  key={`${trade.symbol}-${trade.openTime.getTime()}-${index}`}
                  className={filteredTrades[selectedIndex] === trade ? "selected" : ""}
                  onClick={() => {
                    const realIndex = trades.indexOf(trade);
                    setSelectedIndex(realIndex >= 0 ? realIndex : 0);
                    const sym = normalizeSymbol(trade.symbol);
                    if (sym && sym !== marketSymbol) {
                      setMarketSymbol(sym);
                      if (isCryptoSymbol(sym)) setProvider("binance");
                    }
                    try {
                      localStorage.setItem("chart_trades", JSON.stringify(trades));
                    } catch (_) {}
                    setIsFullscreenTrades(false);
                    router.push(`/chart?symbol=${sym}&interval=${interval}&selectedIndex=${realIndex >= 0 ? realIndex : 0}&provider=${provider}`);
                  }}
                >
                  <td><span className={`pill ${trade.type.toLowerCase()}`}>{trade.type}</span></td>
                  <td>{trade.symbol}</td>
                  <td>{price(trade.openPrice)}</td>
                  <td>{price(trade.closePrice)}</td>
                  <td>{formatDate(trade.openTime)}</td>
                  <td className={trade.profit >= 0 ? "goodText" : "badText"}>{money(trade.profit)}</td>
                  <td>{duration(trade)}m</td>
                  <td style={{ textAlign: "right", paddingRight: "16px" }} onClick={(e) => e.stopPropagation()}>
                    <div style={{ display: "inline-flex", gap: "6px" }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setEditingTrade(trade);
                        }}
                        style={{
                          background: "#161b22",
                          border: "1px solid #38bdf844",
                          color: "#38bdf8",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}
                        title="Edit trade"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={(e) => handleDeleteTrade(trade, e)}
                        style={{
                          background: "#161b22",
                          border: "1px solid #f43f5e44",
                          color: "#f43f5e",
                          padding: "4px 8px",
                          borderRadius: "4px",
                          cursor: "pointer",
                          fontSize: "11px",
                          fontWeight: "600"
                        }}
                        title="Delete trade"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </section>

      {/* Analyse & Setups Modal */}
      {isAnalysisOpen && (
        <AnalysisModal
          trades={trades}
          candles={candles}
          provider={provider}
          apiKey={apiKey}
          marketSymbol={marketSymbol}
          interval={interval}
          onClose={() => setIsAnalysisOpen(false)}
        />
      )}

      {/* Pro Trading Calendar Modal */}
      {isCalendarOpen && (
        <ProCalendarModal
          trades={trades}
          onClose={() => setIsCalendarOpen(false)}
        />
      )}

      {/* Pro Knowledge Master Library Modal */}
      <KnowledgeModal
        isOpen={isKnowledgeOpen}
        onClose={() => setIsKnowledgeOpen(false)}
        lang={lang}
      />

      {/* Add / Edit Trade Modal */}
      {(isAddTradeOpen || editingTrade) && (
        <TradeEditModal
          trade={editingTrade}
          trades={trades}
          onSave={handleSaveTrade}
          onClose={() => {
            setIsAddTradeOpen(false);
            setEditingTrade(null);
          }}
          t={t}
        />
      )}

    </main>
  );
}

function Stat({ label, value, tone }) {
  return (
    <div className="stat">
      <span>{label}</span>
      <strong className={tone === "good" ? "goodText" : tone === "bad" ? "badText" : ""}>{value}</strong>
    </div>
  );
}





function Review({ selectedTrade, candles }) {
  if (!selectedTrade) return <p className="muted">Select a trade to generate a coaching note.</p>;
  const fastLoss = selectedTrade.profit < 0 && duration(selectedTrade) <= 5;
  const hasCandles = candles.length > 20;
  return (
    <div className="reviewList">
      <div>
        <span>Bias</span>
        <p>{hasCandles ? "Compare trade direction with the candles around the entry. If the higher timeframe is opposite, reduce confidence." : "Load candles first. Trade data alone cannot prove structure."}</p>
      </div>
      <div>
        <span>Execution</span>
        <p>{fastLoss ? "Fast loss: treat it as a timing problem until chart confirms otherwise. Check if the second entry signal really appeared." : "Check whether entry came after pullback and rejection, not only after momentum."}</p>
      </div>
      <div>
        <span>Invalidation</span>
        <p>Mark the last swing that should not break. If price breaks it, the idea is invalid, not just temporarily negative.</p>
      </div>
    </div>
  );
}

function drawEmpty(context, width, height, text) {
  context.fillStyle = "#8b949e";
  context.font = "14px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.fillText(text, width / 2, height / 2);
}

function drawGrid(context, width, height, pad, low, high, yFor) {
  context.strokeStyle = "#232b35";
  context.fillStyle = "#8b949e";
  context.font = "11px Inter, system-ui, sans-serif";
  context.textAlign = "right";
  context.textBaseline = "middle";
  for (let i = 0; i <= 5; i++) {
    const value = low + ((high - low) / 5) * i;
    const y = yFor(value);
    context.beginPath();
    context.moveTo(pad.left, y);
    context.lineTo(width - pad.right, y);
    context.stroke();
    context.fillText(price(value), width - 12, y);
  }
  context.strokeStyle = "#303946";
  context.strokeRect(pad.left, pad.top, width - pad.left - pad.right, height - pad.top - pad.bottom);
}

function drawTimeLabels(context, visible, pad, chartW, height) {
  context.fillStyle = "#8b949e";
  context.font = "11px Inter, system-ui, sans-serif";
  context.textAlign = "center";
  context.textBaseline = "top";
  const count = Math.min(5, visible.length);
  for (let i = 0; i < count; i++) {
    const index = Math.floor((visible.length - 1) * (i / Math.max(count - 1, 1)));
    const x = pad.left + (index / Math.max(visible.length - 1, 1)) * chartW;
    context.fillText(formatTime(new Date(visible[index].time)), x, height - 24);
  }
}

function drawTrade(context, trade, visible, pad, chartW, yFor, selected) {
  const start = visible[0].time;
  const end = visible[visible.length - 1].time;
  const span = Math.max(end - start, 1);
  const xForTime = (time) => pad.left + ((time - start) / span) * chartW;
  const entryX = xForTime(trade.openTime.getTime());
  const exitX = xForTime(trade.closeTime.getTime());
  if (entryX < pad.left - 30 || entryX > pad.left + chartW + 30) return;
  const entryY = yFor(trade.openPrice);
  const exitY = yFor(trade.closePrice);
  const color = trade.type === "BUY" ? "#22c55e" : "#f43f5e";
  const resultColor = trade.profit >= 0 ? "#22c55e" : "#f43f5e";

  context.save();
  context.globalAlpha = selected ? 1 : 0.5;
  context.strokeStyle = color;
  context.lineWidth = selected ? 1.8 : 1;
  context.setLineDash(selected ? [] : [5, 4]);
  context.beginPath();
  context.moveTo(pad.left, entryY);
  context.lineTo(pad.left + chartW, entryY);
  context.stroke();
  context.setLineDash([]);

  context.strokeStyle = resultColor;
  context.lineWidth = selected ? 2.2 : 1.4;
  context.beginPath();
  context.moveTo(entryX, entryY);
  context.lineTo(exitX, exitY);
  context.stroke();

  context.fillStyle = color;
  context.beginPath();
  context.arc(entryX, entryY, selected ? 7 : 5, 0, Math.PI * 2);
  context.fill();
  context.strokeStyle = "#e6edf3";
  context.stroke();

  context.fillStyle = resultColor;
  context.beginPath();
  context.arc(exitX, exitY, selected ? 7 : 5, 0, Math.PI * 2);
  context.fill();
  context.restore();
}

function parseCsv(text) {
  const cleanText = text.replace(/^\uFEFF/, "").trim();
  if (!cleanText) return [];
  const delimiter = detectDelimiter(cleanText);
  const rawRows = [];
  let row = [];
  let cell = "";
  let quoted = false;

  for (let i = 0; i < cleanText.length; i++) {
    const char = cleanText[i];
    const next = cleanText[i + 1];
    if (char === '"' && quoted && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i++;
      row.push(cell.trim());
      if (row.some(Boolean)) rawRows.push(row);
      row = [];
      cell = "";
    } else {
      cell += char;
    }
  }

  row.push(cell.trim());
  if (row.some(Boolean)) rawRows.push(row);

  if (!rawRows.length) return [];

  if (hasVerticalBlocks(rawRows)) {
    return parseVerticalCsv(rawRows);
  } else {
    const headers = rawRows.shift()?.map(cleanKey) || [];
    return rawRows.map((values) => Object.fromEntries(headers.map((header, index) => [header, values[index] || ""])));
  }
}

function isKnownKey(str) {
  const cleaned = cleanKey(str);
  if (!cleaned) return false;
  const known = [
    "symbol", "instrument", "asset", "market",
    "type", "direction", "side", "action",
    "volume", "lot", "lots", "size",
    "openprice", "open", "entry", "entryprice", "price",
    "closeprice", "close", "exit", "exitprice",
    "opentime", "entrytime", "entrydate", "opendate", "time", "date",
    "closetime", "exittime", "exitdate", "closedate",
    "profit", "pnl", "pl", "netprofit", "result",
    "assettype"
  ];
  return known.includes(cleaned);
}

function hasVerticalBlocks(rawRows) {
  let maxConsecutiveKeys = 0;
  let currentConsecutive = 0;

  for (let r = 0; r < rawRows.length; r++) {
    const firstCell = rawRows[r]?.[0] || "";
    if (isKnownKey(firstCell)) {
      currentConsecutive++;
      if (currentConsecutive > maxConsecutiveKeys) {
        maxConsecutiveKeys = currentConsecutive;
      }
    } else {
      currentConsecutive = 0;
    }
  }

  return maxConsecutiveKeys >= 3;
}

function parseVerticalCsv(rawRows) {
  const resultObjects = [];
  let i = 0;

  while (i < rawRows.length) {
    const firstCell = rawRows[i]?.[0] || "";

    if (!isKnownKey(firstCell)) {
      i++;
      continue;
    }

    const blockRows = [];
    while (i < rawRows.length) {
      const cell = rawRows[i]?.[0] || "";
      const cleaned = cleanKey(cell);
      if (!cleaned || cell === "-" || cell === "---") break;
      blockRows.push(rawRows[i]);
      i++;
    }

    if (blockRows.length > 0) {
      let maxCols = 0;
      for (const r of blockRows) {
        if (r.length > maxCols) maxCols = r.length;
      }

      const keys = blockRows.map((r) => cleanKey(r[0]));

      for (let col = 1; col < maxCols; col++) {
        const obj = {};
        let hasData = false;
        for (let rowIdx = 0; rowIdx < blockRows.length; rowIdx++) {
          const key = keys[rowIdx];
          const val = blockRows[rowIdx][col] || "";
          if (val.trim()) hasData = true;
          obj[key] = val;
        }
        if (hasData) {
          resultObjects.push(obj);
        }
      }
    }
  }

  return resultObjects;
}

function detectDelimiter(text) {
  const firstLine = text.split(/\r?\n/).find(Boolean) || "";
  const candidates = [",", ";", "\t"];
  return candidates.sort((a, b) => firstLine.split(b).length - firstLine.split(a).length)[0];
}

function normalizeTrade(row) {
  const openTime = parseDate(pick(row, ["open time", "opentime", "entrytime", "entry date", "open date", "time", "date"]));
  const closeTime = parseDate(pick(row, ["close time", "closetime", "exittime", "exit date", "close date", "closetime"]));
  const openPrice = toNumber(pick(row, ["open price", "openprice", "entry", "entry price", "price", "open"]));
  const closePrice = toNumber(pick(row, ["close price", "closeprice", "exit", "exit price", "close"]));
  if (!openTime || !closeTime || !Number.isFinite(openPrice) || !Number.isFinite(closePrice)) return null;
  return {
    symbol: normalizeSymbol(pick(row, ["symbol", "instrument", "asset", "market"]) || "UNKNOWN"),
    type: pick(row, ["type", "direction", "side", "action"]).toUpperCase().includes("SELL") ? "SELL" : "BUY",
    volume: toNumber(pick(row, ["volume", "lot", "lots", "size"])) || 0,
    openPrice,
    closePrice,
    openTime,
    closeTime,
    profit: toNumber(pick(row, ["profit", "pnl", "p/l", "pl", "net profit", "result"])) || 0
  };
}

function pick(row, keys) {
  for (const key of keys) {
    const cleaned = cleanKey(key);
    if (row[cleaned] !== undefined && row[cleaned] !== "") return row[cleaned];
  }
  return "";
}

function cleanKey(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9/]+/g, "");
}

function toNumber(value) {
  const cleaned = String(value || "")
    .replace(/\$/g, "")
    .replace(/\s/g, "")
    .replace(/[()]/g, "")
    .replace(/,/g, "");
  const number = Number(cleaned);
  if (String(value || "").includes("(") && Number.isFinite(number)) return -Math.abs(number);
  return number;
}

function parseDate(value) {
  if (!value) return null;
  const text = String(value).trim();
  const direct = new Date(text);
  if (!Number.isNaN(direct.getTime())) return direct;
  const match = text.match(/^(\d{1,2})[/-](\d{1,2})(?:[/-](\d{2,4}))?\s+(\d{1,2}):(\d{2})(?::(\d{2}))?/);
  if (!match) return null;
  const year = match[3] ? Number(match[3].length === 2 ? `20${match[3]}` : match[3]) : new Date().getFullYear();
  return new Date(year, Number(match[2]) - 1, Number(match[1]), Number(match[4]), Number(match[5]), Number(match[6] || 0));
}

function normalizeSymbol(symbol) {
  const value = String(symbol || "").toUpperCase().trim();
  if (!value) return "GOLD";
  const clean = value.replace(/\.(PRO|M|ECN|RAW|STD|VIP|MICRO)$/i, "").replace(/[^A-Z0-9]/g, "");

  if (clean === "GOLD" || clean === "JJJ" || clean === "XAUUSD") return "GOLD";
  if (clean === "SILVER" || clean === "XAGUSD") return "SILVER";
  if (clean === "US100CASH" || clean === "US100SEP26" || clean === "US100DEC26" || clean === "NDX" || clean === "NASDAQ" || clean === "NAS100") return "US100CASH";
  if (clean === "US30CASH" || clean === "US30SEP26" || clean === "US30DEC26" || clean === "DJI" || clean === "DOW" || clean === "WS30") return "US30CASH";
  if (clean === "US500CASH" || clean === "US500SEP26" || clean === "US500DEC26" || clean === "SPX" || clean === "SP500") return "US500CASH";
  if (clean === "BTCUSD" || clean === "BTCUSDT") return "BTCUSDT";
  if (clean === "ETHUSD" || clean === "ETHUSDT") return "ETHUSDT";

  return clean;
}

function isCryptoSymbol(symbol) {
  return normalizeSymbol(symbol).startsWith("BTC") || normalizeSymbol(symbol).startsWith("ETH");
}

function duration(trade) {
  return Math.max(0, Math.round((trade.closeTime.getTime() - trade.openTime.getTime()) / 60000));
}

function money(value) {
  return `${value < 0 ? "-" : ""}$${Math.abs(value).toFixed(2)}`;
}

function price(value) {
  return Math.abs(value) >= 100 ? value.toFixed(2) : value.toFixed(5).replace(/0+$/, "").replace(/\.$/, "");
}

function formatCsvDate(date) {
  if (!date) return "";
  const d = new Date(date);
  if (isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = pad(d.getMonth() + 1);
  const dd = pad(d.getDate());
  const hh = pad(d.getHours());
  const min = pad(d.getMinutes());
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

function formatDate(date) {
  return date.toLocaleString(undefined, { month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" });
}

function formatTime(date) {
  return date.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit" });
}

function intervalMs(value) {
  if (value === "5m") return 5 * 60 * 1000;
  if (value === "15m") return 15 * 60 * 1000;
  if (value === "1h") return 60 * 60 * 1000;
  return 60 * 1000;
}

function clamp(value, min, max) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function TradeEditModal({ trade, trades, onSave, onClose, t }) {
  const isNew = !trade;
  const [type, setType] = useState(trade?.type || "BUY");
  const [symbol, setSymbol] = useState(trade?.symbol || "GOLD");
  const [volume, setVolume] = useState(trade?.volume || 0.1);
  const [openPrice, setOpenPrice] = useState(trade?.openPrice || 2000.00);
  const [closePrice, setClosePrice] = useState(trade?.closePrice || 2005.00);
  const [profit, setProfit] = useState(trade?.profit || 50.00);

  const defaultOpenStr = trade?.openTime
    ? (trade.openTime instanceof Date ? trade.openTime : new Date(trade.openTime)).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);
  const defaultCloseStr = trade?.closeTime
    ? (trade.closeTime instanceof Date ? trade.closeTime : new Date(trade.closeTime)).toISOString().slice(0, 16)
    : new Date().toISOString().slice(0, 16);

  const [openTimeStr, setOpenTimeStr] = useState(defaultOpenStr);
  const [closeTimeStr, setCloseTimeStr] = useState(defaultCloseStr);

  // Dropdown & Search Query States
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState(trade?.symbol || "GOLD");
  const [validationError, setValidationError] = useState("");

  const baseSymbols = useMemo(() => ["BTCUSDT", "BTCUSD", "GOLD", "XAUUSD", "EURUSD", "US100CASH", "US30CASH", "US500CASH", "US100", "US30", "US500"], []);

  // Sort symbols by popularity (frequency in trades)
  const sortedSymbols = useMemo(() => {
    const symbolCounts = {};
    if (trades && Array.isArray(trades)) {
      trades.forEach(t => {
        const sym = t.symbol?.toUpperCase();
        if (sym) {
          symbolCounts[sym] = (symbolCounts[sym] || 0) + 1;
        }
      });
    }
    
    // Add any symbols that are in trades but not in baseSymbols
    const allSymbolsSet = new Set([...baseSymbols, ...Object.keys(symbolCounts)]);
    const allSymbols = Array.from(allSymbolsSet);

    return allSymbols.sort((a, b) => {
      const countA = symbolCounts[a] || 0;
      const countB = symbolCounts[b] || 0;
      if (countB !== countA) {
        return countB - countA; // popular first
      }
      return a.localeCompare(b); // alphabetical fallback
    });
  }, [trades, baseSymbols]);

  const filteredSymbols = useMemo(() => {
    if (!searchQuery) return sortedSymbols;
    return sortedSymbols.filter(s => s.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [searchQuery, sortedSymbols]);

  const validateSymbol = (sym) => {
    if (!sym) {
      setValidationError(t.symbol + " is required");
      return false;
    }
    const isValid = baseSymbols.some(s => s.toLowerCase() === sym.toLowerCase());
    if (!isValid) {
      setValidationError(t.invalidSymbol);
      return false;
    }
    setValidationError("");
    return true;
  };

  const handleSelectSymbol = (sym) => {
    setSymbol(sym);
    setSearchQuery(sym);
    setIsDropdownOpen(false);
    validateSymbol(sym);
  };

  const handleBlur = () => {
    // Small timeout to allow option click to register
    setTimeout(() => {
      setIsDropdownOpen(false);
      validateSymbol(searchQuery);
    }, 200);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateSymbol(symbol)) {
      return;
    }
    const newTrade = {
      type: type.toUpperCase(),
      symbol: symbol.toUpperCase(),
      volume: Number(volume) || 0.1,
      openPrice: Number(openPrice) || 0,
      closePrice: Number(closePrice) || 0,
      profit: Number(profit) || 0,
      openTime: new Date(openTimeStr),
      closeTime: new Date(closeTimeStr)
    };
    onSave(newTrade, trade);
    onClose();
  };

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(9,13,18,0.85)", backdropFilter: "blur(8px)", zIndex: 10000, display: "grid", placeItems: "center", padding: "20px" }} onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "#0d1117", border: "1px solid #21262d", borderRadius: "14px", width: "100%", maxWidth: "520px", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #21262d", paddingBottom: "12px" }}>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#e6edf3" }}>{isNew ? t.addTradeTitle : t.editTradeTitle}</h3>
          <button onClick={onClose} style={{ background: "transparent", border: "none", color: "#8b949e", fontSize: "18px", cursor: "pointer" }}>✕</button>
        </div>

        <form onSubmit={handleSubmit} style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>{t.type}</label>
            <select value={type} onChange={(e) => setType(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px 10px", borderRadius: "6px", fontSize: "13px" }}>
              <option value="BUY">{t.buy || "BUY"}</option>
              <option value="SELL">{t.sell || "SELL"}</option>
            </select>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", position: "relative" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>{t.symbol}</label>
            <input
              value={searchQuery}
              onFocus={() => setIsDropdownOpen(true)}
              onBlur={handleBlur}
              onChange={(e) => {
                const val = e.target.value.toUpperCase();
                setSearchQuery(val);
                setSymbol(val);
                validateSymbol(val);
                setIsDropdownOpen(true);
              }}
              required
              placeholder={t.searchPlaceholder}
              style={{
                background: "#161b22",
                border: validationError ? "1px solid #f43f5e" : "1px solid #30363d",
                color: "#e6edf3",
                padding: "8px 10px",
                borderRadius: "6px",
                fontSize: "13px",
                width: "100%",
                boxSizing: "border-box"
              }}
            />
            {validationError && (
              <span style={{ color: "#f43f5e", fontSize: "10px", marginTop: "2px" }}>{validationError}</span>
            )}
            
            {isDropdownOpen && (
              <div style={{
                position: "absolute",
                top: "100%",
                left: 0,
                right: 0,
                background: "#161b22",
                border: "1px solid #30363d",
                borderRadius: "6px",
                marginTop: "4px",
                maxHeight: "150px",
                overflowY: "auto",
                zIndex: 10005,
                boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
              }}>
                {filteredSymbols.length === 0 ? (
                  <div style={{ padding: "8px 10px", color: "#8b949e", fontSize: "12px" }}>No symbols found</div>
                ) : (
                  filteredSymbols.map((sym, index) => {
                    const count = trades ? trades.filter(t => t.symbol?.toUpperCase() === sym).length : 0;
                    return (
                      <div
                        key={sym}
                        onMouseDown={() => handleSelectSymbol(sym)}
                        style={{
                          padding: "8px 10px",
                          cursor: "pointer",
                          color: "#e6edf3",
                          fontSize: "13px",
                          display: "flex",
                          justifyContent: "space-between",
                          background: index === 0 && searchQuery === "" ? "rgba(56, 189, 248, 0.08)" : "transparent"
                        }}
                      >
                        <span>{sym}</span>
                        {count > 0 && <span style={{ color: "#8b949e", fontSize: "11px" }}>🔥 {count} trades</span>}
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>{t.volume}</label>
            <input type="number" step="0.01" value={volume} onChange={(e) => setVolume(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px 10px", borderRadius: "6px", fontSize: "13px" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>{t.profitLoss}</label>
            <input type="number" step="0.01" value={profit} onChange={(e) => setProfit(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: Number(profit) >= 0 ? "#22c55e" : "#f43f5e", padding: "8px 10px", borderRadius: "6px", fontSize: "13px", fontWeight: "700" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>{t.entryPrice}</label>
            <input type="number" step="0.0001" value={openPrice} onChange={(e) => setOpenPrice(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px 10px", borderRadius: "6px", fontSize: "13px" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>{t.exitPrice}</label>
            <input type="number" step="0.0001" value={closePrice} onChange={(e) => setClosePrice(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px 10px", borderRadius: "6px", fontSize: "13px" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", gridColumn: "span 2" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>{t.openTime}</label>
            <input type="datetime-local" value={openTimeStr} onChange={(e) => setOpenTimeStr(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px 10px", borderRadius: "6px", fontSize: "13px" }} />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "4px", gridColumn: "span 2" }}>
            <label style={{ color: "#8b949e", fontSize: "11px", fontWeight: "600" }}>{t.closeTime}</label>
            <input type="datetime-local" value={closeTimeStr} onChange={(e) => setCloseTimeStr(e.target.value)} style={{ background: "#161b22", border: "1px solid #30363d", color: "#e6edf3", padding: "8px 10px", borderRadius: "6px", fontSize: "13px" }} />
          </div>

          <div style={{ gridColumn: "span 2", display: "flex", justifyContent: "flex-end", gap: "8px", marginTop: "12px" }}>
            <button type="button" onClick={onClose} style={{ background: "#161b22", border: "1px solid #30363d", color: "#8b949e", padding: "8px 16px", borderRadius: "6px", cursor: "pointer", fontSize: "13px" }}>{t.cancel}</button>
            <button type="submit" disabled={!!validationError} style={{ background: !!validationError ? "#21262d" : "linear-gradient(135deg, #22c55e, #16a34a)", border: "none", color: !!validationError ? "#8b949e" : "#fff", padding: "8px 20px", borderRadius: "6px", fontWeight: "700", cursor: !!validationError ? "not-allowed" : "pointer", fontSize: "13px" }}>{isNew ? t.addTrade : t.saveChanges}</button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CandleIcon({ type, name = "" }) {
  const isBull = type === "bullish";
  const isBear = type === "bearish";

  const color = isBull ? "#22c55e" : isBear ? "#f43f5e" : "#f59e0b";
  const bgFill = isBull ? "#22c55e" : isBear ? "#f43f5e" : "transparent";

  let topWick = 4;
  let bottomWick = 4;
  let bodyHeight = 12;
  let bodyY = 6;

  if (name.includes("Hammer") && !name.includes("Inverted")) {
    topWick = 1;
    bottomWick = 13;
    bodyHeight = 6;
    bodyY = 4;
  } else if (name.includes("Inverted Hammer")) {
    topWick = 13;
    bottomWick = 1;
    bodyHeight = 6;
    bodyY = 13;
  } else if (name.includes("Pin Bar")) {
    if (isBull) { topWick = 1; bottomWick = 14; bodyHeight = 5; bodyY = 3; }
    else { topWick = 14; bottomWick = 1; bodyHeight = 5; bodyY = 14; }
  } else if (name.includes("Marubozu")) {
    topWick = 0;
    bottomWick = 0;
    bodyHeight = 20;
    bodyY = 2;
  } else if (name.includes("Doji") || name.includes("Spinning")) {
    topWick = 7;
    bottomWick = 7;
    bodyHeight = 2;
    bodyY = 11;
  }

  return (
    <svg width="20" height="24" viewBox="0 0 20 24" style={{ display: "block", flexShrink: 0 }}>
      <line x1="10" y1={2} x2="10" y2={22} stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <rect
        x="5"
        y={bodyY}
        width="10"
        height={bodyHeight}
        fill={bgFill}
        stroke={color}
        strokeWidth="1.5"
        rx="1"
      />
    </svg>
  );
}
