"use client";

import { useEffect, useRef, useState, useCallback, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { createChart, ColorType, CrosshairMode, CandlestickSeries, LineSeries, HistogramSeries, createSeriesMarkers } from "lightweight-charts";
import { calcSMA, calcEMA, calcBollingerBands, calcRSI, calcMACD, calcVolume, calcHeikinAshi } from "./indicators";
import {
  DRAW_TOOLS, TOOL_LABELS, createDrawingState, saveDrawings, clearDrawings,
  pointsNeeded, createDrawing, renderDrawings, findDrawingNear, findControlPointNear, duplicateDrawing
} from "./drawings";
import IndicatorSettingsModal from "./IndicatorSettingsModal";
import "./chart.css";

const INTERVALS = ["1m", "5m", "15m", "1h", "1d", "1w"];

const INDICATOR_DEFS = [
  { key: "sma20", label: "SMA 20", group: "overlay" },
  { key: "sma50", label: "SMA 50", group: "overlay" },
  { key: "ema9", label: "EMA 9", group: "overlay" },
  { key: "ema21", label: "EMA 21", group: "overlay" },
  { key: "bb", label: "Bollinger", group: "overlay" },
  { key: "sessions", label: "Sessions", group: "overlay" },
  { key: "vol", label: "Volume", group: "pane" },
  { key: "rsi", label: "RSI 14", group: "pane" },
  { key: "macd", label: "MACD", group: "pane" },
];

const INDICATOR_COLORS = {
  sma20: "#f59e0b",
  sma50: "#a855f7",
  ema9: "#22d3ee",
  ema21: "#fb923c",
  bb_upper: "rgba(96,165,250,0.5)",
  bb_middle: "rgba(96,165,250,0.7)",
  bb_lower: "rgba(96,165,250,0.5)",
  rsi: "#c084fc",
  macd_line: "#22d3ee",
  macd_signal: "#f43f5e",
};

function ChartContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const overlayRef = useRef(null);
  const seriesMapRef = useRef({});

  const [interval, setIntervalState] = useState(searchParams.get("interval") || "1m");
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeIndicators, setActiveIndicators] = useState(new Set(["vol"]));
  const [activeTool, setActiveTool] = useState(DRAW_TOOLS.NONE);
  const [candleType, setCandleType] = useState("standard");
  const [drawings, setDrawings] = useState([]);
  const [pendingPoints, setPendingPoints] = useState([]);
  const [hoverPoint, setHoverPoint] = useState(null);
  const [trade, setTrade] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [draggedInfo, setDraggedInfo] = useState(null);
  const [history, setHistory] = useState([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [indicatorSettings, setIndicatorSettings] = useState({
    sma20: { period: 20, color: "#f59e0b" },
    sma50: { period: 50, color: "#a855f7" },
    ema9: { period: 9, color: "#22d3ee" },
    ema21: { period: 21, color: "#fb923c" },
    bb: { period: 20, mult: 2 },
    rsi: { period: 14, color: "#c084fc", overbought: 70, oversold: 30 },
    macd: { fast: 12, slow: 26, signal: 9 },
  });

  // Load custom indicator settings from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chart_indicator_settings");
      if (stored) {
        setIndicatorSettings(JSON.parse(stored));
      }
    } catch (_) {}
  }, []);

  const saveIndicatorSettings = (newSettings) => {
    setIndicatorSettings(newSettings);
    try {
      localStorage.setItem("chart_indicator_settings", JSON.stringify(newSettings));
    } catch (_) {}
  };

  const symbol = searchParams.get("symbol") || "XAUUSD";
  const provider = searchParams.get("provider") || "twelvedata";
  const selectedIndex = searchParams.get("selectedIndex");

  // Load trade data from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem("chart_trades");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (selectedIndex !== null && parsed[Number(selectedIndex)]) {
          const t = parsed[Number(selectedIndex)];
          t.openTime = new Date(t.openTime);
          t.closeTime = new Date(t.closeTime);
          setTrade(t);
        }
      }
    } catch (_) {}
    const state = createDrawingState();
    setDrawings(state.drawings);
  }, [selectedIndex]);

  const handleAutoFit = () => {
    if (chartRef.current) {
      chartRef.current.priceScale("right").applyOptions({ autoScale: true });
      chartRef.current.timeScale().fitContent();
    }
  };

  const handleFocusTrade = () => {
    if (chartRef.current && trade) {
      const entryTime = Math.floor(trade.openTime.getTime() / 1000);
      const exitTime = Math.floor(trade.closeTime.getTime() / 1000);
      const candleSecs = intervalMs(interval) / 1000;
      const beforeBuffer = candleSecs * 120;
      const afterBuffer = candleSecs * 10;
      chartRef.current.priceScale("right").applyOptions({ autoScale: true });
      chartRef.current.timeScale().setVisibleRange({
        from: entryTime - beforeBuffer,
        to: exitTime + afterBuffer,
      });
    }
  };

  // Fetch candles
  useEffect(() => {
    fetchCandles();
  }, [symbol, provider, interval]);

  async function fetchCandles() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ provider, symbol, interval, limit: "2000" });
      if (trade) {
        const windowMsBefore = intervalMs(interval) * 600;
        const windowMsAfter = intervalMs(interval) * 100;
        params.set("from", String(trade.openTime.getTime() - windowMsBefore));
        params.set("to", String(trade.closeTime.getTime() + windowMsAfter));
      }
      const response = await fetch(`/api/ohlc?${params.toString()}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Request failed.");
      setCandles(payload.candles || []);
    } catch (err) {
      setCandles([]);
      setError(err instanceof Error ? err.message : "Could not load data.");
    } finally {
      setLoading(false);
    }
  }

  // Create / update chart
  useEffect(() => {
    if (!chartContainerRef.current || !candles.length) return;

    // Cleanup previous chart
    if (chartRef.current) {
      chartRef.current.remove();
      chartRef.current = null;
      seriesMapRef.current = {};
    }

    const container = chartContainerRef.current;
    const chart = createChart(container, {
      width: container.clientWidth,
      height: container.clientHeight,
      layout: {
        background: { type: ColorType.Solid, color: "#0d1117" },
        textColor: "#8b949e",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#1a2230" },
        horzLines: { color: "#1a2230" },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
        vertLine: { color: "#3a4556", width: 1, style: 2, labelBackgroundColor: "#26313d" },
        horzLine: { color: "#3a4556", width: 1, style: 2, labelBackgroundColor: "#26313d" },
      },
      rightPriceScale: {
        borderColor: "#26313d",
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: "#26313d",
        timeVisible: true,
        secondsVisible: false,
      },
      handleScroll: { mouseWheel: true, pressedMouseMove: true, horzTouchDrag: true },
      handleScale: { mouseWheel: true, pinch: true, axisPressedMouseMove: true },
    });

    chartRef.current = chart;

    // Candlestick series
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: "#22c55e",
      downColor: "#f43f5e",
      wickUpColor: "#22c55e",
      wickDownColor: "#f43f5e",
      borderVisible: false,
    });

    let chartData = candles.map((c) => ({
      time: Math.floor(c.time / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    if (candleType === "heikin_ashi") {
      chartData = calcHeikinAshi(chartData);
    }

    candleSeries.setData(chartData);
    seriesMapRef.current.candles = candleSeries;

    // Trade markers
    if (trade) {
      const entryTime = Math.floor(trade.openTime.getTime() / 1000);
      const exitTime = Math.floor(trade.closeTime.getTime() / 1000);
      const isBuy = trade.type === "BUY";
      const isWin = trade.profit >= 0;

      // Entry line
      const entryLine = chart.addSeries(LineSeries, {
        color: isBuy ? "#22c55e" : "#f43f5e",
        lineWidth: 2,
        lineStyle: 0,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      entryLine.setData([
        { time: entryTime, value: trade.openPrice },
        { time: exitTime, value: trade.openPrice },
      ]);

      // Exit line
      const exitLine = chart.addSeries(LineSeries, {
        color: isWin ? "#22c55e" : "#f43f5e",
        lineWidth: 2,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      exitLine.setData([
        { time: entryTime, value: trade.closePrice },
        { time: exitTime, value: trade.closePrice },
      ]);

      // Connection line
      const connLine = chart.addSeries(LineSeries, {
        color: isWin ? "rgba(34,197,94,0.5)" : "rgba(244,63,94,0.5)",
        lineWidth: 1,
        lineStyle: 2,
        priceLineVisible: false,
        lastValueVisible: false,
        crosshairMarkerVisible: false,
      });
      connLine.setData([
        { time: entryTime, value: trade.openPrice },
        { time: exitTime, value: trade.closePrice },
      ]);

      // Markers
      const markersApi = createSeriesMarkers(candleSeries);
      markersApi.setMarkers([
        {
          time: entryTime,
          position: isBuy ? "belowBar" : "aboveBar",
          color: isBuy ? "#22c55e" : "#f43f5e",
          shape: isBuy ? "arrowUp" : "arrowDown",
          text: `Entry ${trade.openPrice.toFixed(2)}`,
        },
        {
          time: exitTime,
          position: isWin ? "aboveBar" : "belowBar",
          color: isWin ? "#22c55e" : "#f43f5e",
          shape: isWin ? "arrowUp" : "arrowDown",
          text: `Exit ${trade.closePrice.toFixed(2)} (${trade.profit >= 0 ? "+" : ""}$${trade.profit.toFixed(2)})`,
        },
      ]);
    }

    // Apply indicators
    applyIndicators(chart, chartData, activeIndicators);

    // Focus trade if selected, else fit all content
    if (trade) {
      const entryTime = Math.floor(trade.openTime.getTime() / 1000);
      const exitTime = Math.floor(trade.closeTime.getTime() / 1000);
      const candleSecs = intervalMs(interval) / 1000;
      const beforeBuffer = candleSecs * 120;
      const afterBuffer = candleSecs * 10;
      chart.priceScale("right").applyOptions({ autoScale: true });
      chart.timeScale().setVisibleRange({
        from: entryTime - beforeBuffer,
        to: exitTime + afterBuffer,
      });
    } else {
      chart.timeScale().fitContent();
    }

    // Resize handler
    const handleResize = () => {
      if (chartRef.current && container) {
        chartRef.current.resize(container.clientWidth, container.clientHeight);
      }
    };
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      if (chartRef.current) {
        chartRef.current.remove();
        chartRef.current = null;
        seriesMapRef.current = {};
      }
    };
  }, [candles, trade, candleType]);

  // Re-apply indicators when they change
  useEffect(() => {
    if (!chartRef.current || !candles.length) return;
    const chartData = candles.map((c) => ({
      time: Math.floor(c.time / 1000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
      volume: c.volume || 0,
    }));
    applyIndicators(chartRef.current, chartData, activeIndicators);
  }, [activeIndicators, candles, indicatorSettings]);

  function applyIndicators(chart, data, active) {
    // Remove old indicator series
    const keep = new Set(["candles"]);
    for (const [key, series] of Object.entries(seriesMapRef.current)) {
      if (!keep.has(key)) {
        try { chart.removeSeries(series); } catch (_) {}
        delete seriesMapRef.current[key];
      }
    }

    if (active.has("sma20")) {
      const s = chart.addSeries(LineSeries, { color: indicatorSettings.sma20.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(calcSMA(data, indicatorSettings.sma20.period));
      seriesMapRef.current.sma20 = s;
    }
    if (active.has("sma50")) {
      const s = chart.addSeries(LineSeries, { color: indicatorSettings.sma50.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(calcSMA(data, indicatorSettings.sma50.period));
      seriesMapRef.current.sma50 = s;
    }
    if (active.has("ema9")) {
      const s = chart.addSeries(LineSeries, { color: indicatorSettings.ema9.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(calcEMA(data, indicatorSettings.ema9.period));
      seriesMapRef.current.ema9 = s;
    }
    if (active.has("ema21")) {
      const s = chart.addSeries(LineSeries, { color: indicatorSettings.ema21.color, lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      s.setData(calcEMA(data, indicatorSettings.ema21.period));
      seriesMapRef.current.ema21 = s;
    }
    if (active.has("bb")) {
      const bb = calcBollingerBands(data, indicatorSettings.bb.period, indicatorSettings.bb.mult);
      const sU = chart.addSeries(LineSeries, { color: "rgba(96,165,250,0.5)", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      sU.setData(bb.upper);
      seriesMapRef.current.bb_upper = sU;
      const sM = chart.addSeries(LineSeries, { color: "rgba(96,165,250,0.7)", lineWidth: 1, priceLineVisible: false, lastValueVisible: false });
      sM.setData(bb.middle);
      seriesMapRef.current.bb_middle = sM;
      const sL = chart.addSeries(LineSeries, { color: "rgba(96,165,250,0.5)", lineWidth: 1, lineStyle: 2, priceLineVisible: false, lastValueVisible: false });
      sL.setData(bb.lower);
      seriesMapRef.current.bb_lower = sL;
    }
    if (active.has("vol")) {
      const volData = calcVolume(data);
      const s = chart.addSeries(HistogramSeries, {
        priceFormat: { type: "volume" },
        priceScaleId: "vol",
        lastValueVisible: false,
        priceLineVisible: false,
      });
      s.setData(volData);
      chart.priceScale("vol").applyOptions({ scaleMargins: { top: 0.85, bottom: 0 } });
      seriesMapRef.current.vol = s;
    }
    if (active.has("rsi")) {
      const rsiData = calcRSI(data, indicatorSettings.rsi.period);
      const s = chart.addSeries(LineSeries, {
        color: indicatorSettings.rsi.color,
        lineWidth: 1.5,
        priceScaleId: "rsi",
        priceLineVisible: false,
        lastValueVisible: false,
      });
      s.setData(rsiData);
      chart.priceScale("rsi").applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } });
      seriesMapRef.current.rsi = s;

      // RSI levels
      if (rsiData.length >= 2) {
        const rsiLow = chart.addSeries(LineSeries, { color: "rgba(244,63,94,0.3)", lineWidth: 1, lineStyle: 2, priceScaleId: "rsi", priceLineVisible: false, lastValueVisible: false });
        rsiLow.setData([{ time: rsiData[0].time, value: indicatorSettings.rsi.oversold }, { time: rsiData[rsiData.length - 1].time, value: indicatorSettings.rsi.oversold }]);
        seriesMapRef.current.rsi30 = rsiLow;
        const rsiHigh = chart.addSeries(LineSeries, { color: "rgba(34,197,94,0.3)", lineWidth: 1, lineStyle: 2, priceScaleId: "rsi", priceLineVisible: false, lastValueVisible: false });
        rsiHigh.setData([{ time: rsiData[0].time, value: indicatorSettings.rsi.overbought }, { time: rsiData[rsiData.length - 1].time, value: indicatorSettings.rsi.overbought }]);
        seriesMapRef.current.rsi70 = rsiHigh;
      }
    }
    if (active.has("macd")) {
      const macdData = calcMACD(data, indicatorSettings.macd.fast, indicatorSettings.macd.slow, indicatorSettings.macd.signal);
      const sLine = chart.addSeries(LineSeries, { color: "#22d3ee", lineWidth: 1.5, priceScaleId: "macd", priceLineVisible: false, lastValueVisible: false });
      sLine.setData(macdData.macd);
      seriesMapRef.current.macd_line = sLine;
      const sSig = chart.addSeries(LineSeries, { color: "#f43f5e", lineWidth: 1.5, priceScaleId: "macd", priceLineVisible: false, lastValueVisible: false });
      sSig.setData(macdData.signal);
      seriesMapRef.current.macd_signal = sSig;
      const sHist = chart.addSeries(HistogramSeries, { priceScaleId: "macd", priceLineVisible: false, lastValueVisible: false });
      sHist.setData(macdData.histogram);
      seriesMapRef.current.macd_hist = sHist;
      chart.priceScale("macd").applyOptions({ scaleMargins: { top: 0.88, bottom: 0 } });
    }
  }

  // Toggle indicator
  function toggleIndicator(key) {
    setActiveIndicators((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  const pushToHistory = (newDrawings) => {
    setHistory((prev) => [...prev, drawings]);
    setDrawings(newDrawings);
    saveDrawings(newDrawings);
  };

  const handleUndo = () => {
    if (history.length > 0) {
      const prev = history[history.length - 1];
      setHistory((prevHist) => prevHist.slice(0, -1));
      setDrawings(prev);
      saveDrawings(prev);
      setSelectedId(null);
    }
  };

  const handleDuplicate = () => {
    if (selectedId !== null) {
      const target = drawings.find((d) => d.id === selectedId);
      if (target) {
        const dup = duplicateDrawing(target);
        const updated = [...drawings, dup];
        pushToHistory(updated);
        setSelectedId(dup.id);
      }
    }
  };

  const handleDeleteSelected = () => {
    if (selectedId !== null) {
      const updated = drawings.filter((d) => d.id !== selectedId);
      pushToHistory(updated);
      setSelectedId(null);
    }
  };

  const handleClearAll = () => {
    pushToHistory([]);
    clearDrawings();
    setSelectedId(null);
  };

  // Keyboard shortcut listener
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.target.tagName === "INPUT" || e.target.tagName === "SELECT") return;

      if (e.key === "Backspace" || e.key === "Delete") {
        e.preventDefault();
        handleDeleteSelected();
      } else if (e.key === "z" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleUndo();
      } else if (e.key === "d" && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        handleDuplicate();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, drawings, history]);

  // Drawing tool overlay actions
  const handleMouseDown = (e) => {
    if (!chartRef.current) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const chart = chartRef.current;
    const timeCoord = chart.timeScale().coordinateToTime(x);
    const mainSeries = seriesMapRef.current.candles;
    if (!mainSeries) return;
    const priceCoord = mainSeries.coordinateToPrice(y);
    if (timeCoord === null || priceCoord === null) return;

    const timeToX = (t) => chart.timeScale().timeToCoordinate(t) || 0;
    const priceToY = (p) => mainSeries.priceToCoordinate(p) || 0;

    // 1. Drawing creation mode
    if (activeTool !== DRAW_TOOLS.NONE && activeTool !== DRAW_TOOLS.ERASER) {
      const newPoints = [...pendingPoints, { time: timeCoord, price: priceCoord }];
      const needed = pointsNeeded(activeTool);

      if (newPoints.length >= needed) {
        const drawing = createDrawing(activeTool, newPoints);
        pushToHistory([...drawings, drawing]);
        setPendingPoints([]);
        setHoverPoint(null);
      } else {
        setPendingPoints(newPoints);
      }
      return;
    }

    // 2. Eraser mode
    if (activeTool === DRAW_TOOLS.ERASER) {
      const idx = findDrawingNear(drawings, timeCoord, priceCoord, timeToX, priceToY);
      if (idx >= 0) {
        const updated = drawings.filter((_, i) => i !== idx);
        pushToHistory(updated);
      }
      return;
    }

    // 3. Selection / Edit mode
    const cp = findControlPointNear(drawings, timeCoord, priceCoord, timeToX, priceToY);
    if (cp) {
      const target = drawings.find((d) => d.id === cp.drawingId);
      setDraggedInfo({
        drawingId: cp.drawingId,
        pointIndex: cp.pointIndex,
        startPoint: { time: timeCoord, price: priceCoord },
        originalPoints: target.points.map((p) => ({ ...p }))
      });
      setSelectedId(cp.drawingId);
      return;
    }

    const idx = findDrawingNear(drawings, timeCoord, priceCoord, timeToX, priceToY);
    if (idx >= 0) {
      const target = drawings[idx];
      setDraggedInfo({
        drawingId: target.id,
        pointIndex: -1,
        startPoint: { time: timeCoord, price: priceCoord },
        originalPoints: target.points.map((p) => ({ ...p }))
      });
      setSelectedId(target.id);
      return;
    }

    // Deselect if clicking empty space
    setSelectedId(null);
  };

  const handleMouseMove = (e) => {
    if (!chartRef.current) return;
    const overlay = overlayRef.current;
    if (!overlay) return;
    const rect = overlay.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const chart = chartRef.current;
    const mainSeries = seriesMapRef.current.candles;
    if (!mainSeries) return;
    const timeCoord = chart.timeScale().coordinateToTime(x);
    const priceCoord = mainSeries.coordinateToPrice(y);
    if (timeCoord === null || priceCoord === null) return;

    if (activeTool !== DRAW_TOOLS.NONE && pendingPoints.length > 0) {
      setHoverPoint({ time: timeCoord, price: priceCoord });
      return;
    }

    if (draggedInfo) {
      const { drawingId, pointIndex, startPoint, originalPoints } = draggedInfo;
      const priceDelta = priceCoord - startPoint.price;
      let timeDelta = 0;
      if (typeof timeCoord === "number" && typeof startPoint.time === "number") {
        timeDelta = timeCoord - startPoint.time;
      }

      const updated = drawings.map((d) => {
        if (d.id !== drawingId) return d;

        const pts = d.points.map((pt, idx) => {
          const orig = originalPoints[idx];
          if (pointIndex === -1) {
            return {
              time: typeof orig.time === "number" ? orig.time + timeDelta : orig.time,
              price: orig.price + priceDelta
            };
          } else if (idx === pointIndex) {
            return {
              time: timeCoord,
              price: priceCoord
            };
          }
          return pt;
        });

        return { ...d, points: pts };
      });

      setDrawings(updated);
    }
  };

  const handleMouseUp = () => {
    if (draggedInfo) {
      saveDrawings(drawings);
      setDraggedInfo(null);
    }
  };

  // Render drawing overlay
  useEffect(() => {
    const overlay = overlayRef.current;
    if (!overlay || !chartRef.current) return;
    const ctx = overlay.getContext("2d");
    if (!ctx) return;

    const container = chartContainerRef.current;
    if (!container) return;
    const dpr = window.devicePixelRatio || 1;
    overlay.width = container.clientWidth * dpr;
    overlay.height = container.clientHeight * dpr;
    overlay.style.width = container.clientWidth + "px";
    overlay.style.height = container.clientHeight + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    const chart = chartRef.current;
    const mainSeries = seriesMapRef.current.candles;
    if (!mainSeries) return;

    const timeToX = (t) => chart.timeScale().timeToCoordinate(t) || 0;
    const priceToY = (p) => mainSeries.priceToCoordinate(p) || 0;
    const bounds = {
      left: 0,
      right: container.clientWidth,
      top: 0,
      bottom: container.clientHeight,
    };

    let pending = null;
    if (pendingPoints.length > 0 && hoverPoint) {
      pending = createDrawing(activeTool, [...pendingPoints, hoverPoint]);
    }

    renderDrawings(ctx, drawings, timeToX, priceToY, bounds, pending, selectedId);
  }, [drawings, pendingPoints, hoverPoint, candles, activeIndicators, selectedId]);

  // Redraw overlay when chart scrolls/zooms
  useEffect(() => {
    if (!chartRef.current) return;
    const chart = chartRef.current;

    const redraw = () => {
      const overlay = overlayRef.current;
      const container = chartContainerRef.current;
      if (!overlay || !container) return;
      const ctx = overlay.getContext("2d");
      if (!ctx) return;
      const mainSeries = seriesMapRef.current.candles;
      if (!mainSeries) return;

      const dpr = window.devicePixelRatio || 1;
      overlay.width = container.clientWidth * dpr;
      overlay.height = container.clientHeight * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const timeToX = (t) => chart.timeScale().timeToCoordinate(t) || 0;
      const priceToY = (p) => mainSeries.priceToCoordinate(p) || 0;
      const bounds = { left: 0, right: container.clientWidth, top: 0, bottom: container.clientHeight };
      renderDrawings(ctx, drawings, timeToX, priceToY, bounds, null, selectedId, candles, activeIndicators);
    };

    chart.timeScale().subscribeVisibleTimeRangeChange(redraw);
    return () => {
      try { chart.timeScale().unsubscribeVisibleTimeRangeChange(redraw); } catch (_) {}
    };
  }, [drawings, candles, activeIndicators, selectedId]);



  function changeInterval(newInterval) {
    setIntervalState(newInterval);
  }

  return (
    <div className="chartPage">
      {/* Top Bar */}
      <div className="chartTopBar">
        <button className="backBtn" onClick={() => router.back()} title="Back to journal">←</button>
        <div className="symbolInfo">
          <h1>{symbol}</h1>
          <span>{interval}</span>
        </div>

        <div className="chartToolstrip">
          <div className="divider" />
          <div className="intervalBtns">
            {INTERVALS.map((iv) => (
              <button key={iv} className={iv === interval ? "active" : ""} onClick={() => changeInterval(iv)}>
                {iv}
              </button>
            ))}
          </div>
          <div className="divider" />
          <div className="intervalBtns">
            <button
              className={candleType === "standard" ? "active" : ""}
              onClick={() => setCandleType("standard")}
              title="Standard Candlesticks"
            >
              🕯️ Standard
            </button>
            <button
              className={candleType === "heikin_ashi" ? "active" : ""}
              onClick={() => setCandleType("heikin_ashi")}
              title="Heikin Ashi Candlesticks"
            >
              📊 Heikin Ashi
            </button>
          </div>
          <div className="divider" />
          <div className="indicatorToggles">
            {INDICATOR_DEFS.map((ind) => (
              <button
                key={ind.key}
                className={activeIndicators.has(ind.key) ? "active" : ""}
                onClick={() => toggleIndicator(ind.key)}
              >
                {ind.label}
              </button>
            ))}
            <button className="gearBtn" onClick={() => setIsSettingsOpen(true)} title="Indicator Settings">
              ⚙️ Settings
            </button>
          </div>
          <div className="divider" />
          <div className="intervalBtns">
            <button onClick={handleAutoFit} title="Fit all candles on chart">Auto Fit</button>
            {trade && (
              <button onClick={handleFocusTrade} title="Focus on buy/sell entry/exit range">Focus Trade</button>
            )}
          </div>
        </div>

        {trade && (
          <div className="tradeInfo">
            <span className={`tradeType ${trade.type.toLowerCase()}`}>{trade.type}</span>
            <span>{trade.openPrice.toFixed(2)} → {trade.closePrice.toFixed(2)}</span>
            <span className={`tradeProfit ${trade.profit >= 0 ? "goodText" : "badText"}`}>
              {trade.profit >= 0 ? "+" : ""}${trade.profit.toFixed(2)}
            </span>
          </div>
        )}
      </div>

      {/* Drawing Tools Sidebar */}
      <div className="drawSidebar">
        {Object.entries(TOOL_LABELS).map(([key, { label, icon }]) => (
          <button
            key={key}
            className={activeTool === key ? "active" : ""}
            onClick={() => {
              setActiveTool(key);
              setPendingPoints([]);
              setHoverPoint(null);
            }}
          >
            {icon}
            <span className="tooltip">{label}</span>
          </button>
        ))}
        <div className="divider" style={{ margin: "8px 0", height: "1px", background: "#26313d", width: "100%" }} />
        <button onClick={handleUndo} disabled={history.length === 0} title="Undo last action (Ctrl+Z)">
          ↶
          <span className="tooltip">Undo</span>
        </button>
        <button onClick={handleDuplicate} disabled={selectedId === null} title="Duplicate selected (Ctrl+D)">
          📋
          <span className="tooltip">Duplicate</span>
        </button>
        <button onClick={handleDeleteSelected} disabled={selectedId === null} title="Delete selected (Delete/Backspace)">
          🗑️
          <span className="tooltip">Delete</span>
        </button>
        <button className="clearBtn" onClick={handleClearAll} title="Clear all drawings">
          Clear
        </button>
      </div>

      {/* Chart Area */}
      <div className="chartArea">
        {loading && !candles.length && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#8b949e", zIndex: 2 }}>
            Loading candles...
          </div>
        )}
        {error && (
          <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#fecdd3", zIndex: 2 }}>
            {error}
          </div>
        )}
        <div className="chartContainer" ref={chartContainerRef} />
        <canvas
          ref={overlayRef}
          className={`drawingOverlay ${activeTool !== DRAW_TOOLS.NONE || selectedId !== null ? "drawing" : ""}`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
        />
      </div>
      <IndicatorSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={indicatorSettings}
        onSave={saveIndicatorSettings}
      />
    </div>
  );
}

function intervalMs(value) {
  if (value === "5m") return 5 * 60 * 1000;
  if (value === "15m") return 15 * 60 * 1000;
  if (value === "1h") return 60 * 60 * 1000;
  if (value === "1d") return 24 * 60 * 60 * 1000;
  if (value === "1w") return 7 * 24 * 60 * 60 * 1000;
  return 60 * 1000;
}

export default function ChartPage() {
  return (
    <Suspense fallback={<div style={{ background: "#0d1117", color: "#8b949e", height: "100vh", display: "grid", placeItems: "center" }}>Loading chart...</div>}>
      <ChartContent />
    </Suspense>
  );
}
