/** Drawing tool types and state management */

export const DRAW_TOOLS = {
  NONE: "none",
  TREND_LINE: "trendline",
  HORIZONTAL_LINE: "hline",
  CROSSHAIR: "crosshair",
  LONG_POSITION: "long",
  SHORT_POSITION: "short",
  ARROW: "arrow",
  FIBONACCI: "fibonacci",
  VERTICAL_LINE: "vline",
  RECTANGLE: "rectangle",
  CHANNEL: "channel",
  PATH: "path",
  CIRCLE: "circle",
  ELLIPSE: "ellipse",
  PRICE_RANGE: "pricerange",
  ERASER: "eraser"
};

export const TOOL_LABELS = {
  [DRAW_TOOLS.NONE]: { label: "Cursor (Select/Edit)", icon: "↖" },
  [DRAW_TOOLS.TREND_LINE]: { label: "Trend Line", icon: "╱" },
  [DRAW_TOOLS.HORIZONTAL_LINE]: { label: "H-Line", icon: "─" },
  [DRAW_TOOLS.CROSSHAIR]: { label: "Crosshair", icon: "┼" },
  [DRAW_TOOLS.LONG_POSITION]: { label: "Long Position", icon: "買" },
  [DRAW_TOOLS.SHORT_POSITION]: { label: "Short Position", icon: "賣" },
  [DRAW_TOOLS.ARROW]: { label: "Arrow", icon: "➔" },
  [DRAW_TOOLS.FIBONACCI]: { label: "Fibonacci", icon: "◈" },
  [DRAW_TOOLS.VERTICAL_LINE]: { label: "V-Line", icon: "│" },
  [DRAW_TOOLS.RECTANGLE]: { label: "Rectangle", icon: "▭" },
  [DRAW_TOOLS.CHANNEL]: { label: "Parallel Channel", icon: "▰" },
  [DRAW_TOOLS.PATH]: { label: "Path (Double click to end)", icon: "✏" },
  [DRAW_TOOLS.CIRCLE]: { label: "Circle", icon: "◯" },
  [DRAW_TOOLS.ELLIPSE]: { label: "Ellipse", icon: "⬭" },
  [DRAW_TOOLS.PRICE_RANGE]: { label: "Price Range / Ruler", icon: "⇳" },
  [DRAW_TOOLS.ERASER]: { label: "Eraser", icon: "✕" }
};

const FIB_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];

export function createDrawingState() {
  return {
    drawings: loadDrawings(),
    activeTool: DRAW_TOOLS.NONE,
    pendingPoints: [],
    hoverPoint: null
  };
}

export function saveDrawings(drawings) {
  try {
    localStorage.setItem("chart_drawings", JSON.stringify(drawings));
  } catch (_) {}
}

export function loadDrawings() {
  try {
    const raw = localStorage.getItem("chart_drawings");
    return raw ? JSON.parse(raw) : [];
  } catch (_) {
    return [];
  }
}

export function clearDrawings() {
  try {
    localStorage.removeItem("chart_drawings");
  } catch (_) {}
}

export function pointsNeeded(tool) {
  switch (tool) {
    case DRAW_TOOLS.HORIZONTAL_LINE:
    case DRAW_TOOLS.CROSSHAIR:
    case DRAW_TOOLS.VERTICAL_LINE:
      return 1;
    case DRAW_TOOLS.TREND_LINE:
    case DRAW_TOOLS.ARROW:
    case DRAW_TOOLS.FIBONACCI:
    case DRAW_TOOLS.RECTANGLE:
    case DRAW_TOOLS.CIRCLE:
    case DRAW_TOOLS.ELLIPSE:
    case DRAW_TOOLS.PRICE_RANGE:
    case DRAW_TOOLS.LONG_POSITION:
    case DRAW_TOOLS.SHORT_POSITION:
      return 2;
    case DRAW_TOOLS.CHANNEL:
      return 3;
    case DRAW_TOOLS.PATH:
      return Infinity; // continuous
    default:
      return 0;
  }
}

export function createDrawing(tool, points) {
  if (tool === DRAW_TOOLS.LONG_POSITION || tool === DRAW_TOOLS.SHORT_POSITION) {
    const p1 = points[0];
    const p2 = points[1];
    const targetDiff = p2.price - p1.price;
    // default symmetric risk reward
    const stopPrice = tool === DRAW_TOOLS.LONG_POSITION ? p1.price - targetDiff * 0.5 : p1.price + targetDiff * 0.5;
    return {
      id: Date.now() + Math.random(),
      type: tool,
      points: [
        { time: p1.time, price: p1.price },
        { time: p2.time, price: p2.price },
        { time: p2.time, price: stopPrice }
      ],
      color: tool === DRAW_TOOLS.LONG_POSITION ? "#22c55e" : "#f43f5e",
      created: Date.now()
    };
  }

  return {
    id: Date.now() + Math.random(),
    type: tool,
    points: points.map((p) => ({ time: p.time, price: p.price })),
    color: tool === DRAW_TOOLS.FIBONACCI ? "#f59e0b" : "#60a5fa",
    created: Date.now()
  };
}

export function duplicateDrawing(drawing) {
  return {
    ...drawing,
    id: Date.now() + Math.random(),
    points: drawing.points.map((p) => ({
      time: p.time,
      price: p.price * 0.995
    })),
    created: Date.now()
  };
}

export function renderDrawings(ctx, drawings, timeToX, priceToY, bounds, pendingDrawing, selectedId = null, candles = [], activeIndicators = new Set()) {
  ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

  // 1. Draw sessions if active
  if (activeIndicators.has("sessions") && candles.length > 0) {
    ctx.save();
    for (let i = 0; i < candles.length; i++) {
      const candle = candles[i];
      const nextCandle = candles[i + 1];

      const x = timeToX(Math.floor(candle.time / 1000));
      const nextX = nextCandle ? timeToX(Math.floor(nextCandle.time / 1000)) : x + 10;
      const width = nextX - x;
      if (width <= 0) continue;

      const date = new Date(candle.time);
      const hour = date.getUTCHours();

      // Tokyo/Asian (0:00 - 8:00 UTC) -> Purple overlay
      if (hour >= 0 && hour < 8) {
        ctx.fillStyle = "rgba(168, 85, 247, 0.04)";
        ctx.fillRect(x, bounds.top, width, bounds.bottom - bounds.top);
      }
      // London (8:00 - 16:00 UTC) -> Blue overlay
      if (hour >= 8 && hour < 16) {
        ctx.fillStyle = "rgba(56, 189, 248, 0.04)";
        ctx.fillRect(x, bounds.top, width, bounds.bottom - bounds.top);
      }
      // New York (13:00 - 21:00 UTC) -> Orange overlay
      if (hour >= 13 && hour < 21) {
        ctx.fillStyle = "rgba(249, 115, 22, 0.04)";
        ctx.fillRect(x, bounds.top, width, bounds.bottom - bounds.top);
      }

      // Draw Session Header Badges (T, L, N) at the start of each session
      let label = "";
      let badgeColor = "";
      const prevHour = i > 0 ? new Date(candles[i - 1].time).getUTCHours() : -1;

      if (hour === 0 && prevHour !== 0) {
        label = "T";
        badgeColor = "#a855f7";
      } else if (hour === 8 && prevHour !== 8) {
        label = "L";
        badgeColor = "#38bdf8";
      } else if (hour === 13 && prevHour !== 13) {
        label = "N";
        badgeColor = "#f97316";
      }

      if (label) {
        ctx.save();
        ctx.fillStyle = badgeColor;
        ctx.beginPath();
        ctx.arc(x + width / 2, bounds.top + 16, 7, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px Inter, system-ui, sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(label, x + width / 2, bounds.top + 16);
        ctx.restore();
      }
    }
    ctx.restore();
  }

  // 2. Draw normal shapes
  for (const drawing of drawings) {
    const isSelected = drawing.id === selectedId;
    drawShape(ctx, drawing, timeToX, priceToY, bounds, false, isSelected);
  }

  if (pendingDrawing) {
    drawShape(ctx, pendingDrawing, timeToX, priceToY, bounds, true);
  }
}

function drawShape(ctx, drawing, timeToX, priceToY, bounds, isPending = false, isSelected = false) {
  ctx.save();
  ctx.globalAlpha = isPending ? 0.6 : (isSelected ? 1.0 : 0.85);
  ctx.lineWidth = isSelected ? 3 : 2;
  ctx.strokeStyle = isSelected ? "#38bdf8" : (drawing.color || "#60a5fa");
  ctx.fillStyle = isSelected ? "#38bdf8" : (drawing.color || "#60a5fa");
  ctx.setLineDash(isPending ? [6, 4] : (isSelected ? [4, 2] : []));

  switch (drawing.type) {
    case DRAW_TOOLS.TREND_LINE:
      drawTrendLine(ctx, drawing, timeToX, priceToY, isSelected);
      break;
    case DRAW_TOOLS.HORIZONTAL_LINE:
      drawHorizontalLine(ctx, drawing, priceToY, bounds, isSelected);
      break;
    case DRAW_TOOLS.CROSSHAIR:
      drawCrosshair(ctx, drawing, timeToX, priceToY, bounds, isSelected);
      break;
    case DRAW_TOOLS.LONG_POSITION:
      drawPositionBlock(ctx, drawing, timeToX, priceToY, bounds, isSelected, true);
      break;
    case DRAW_TOOLS.SHORT_POSITION:
      drawPositionBlock(ctx, drawing, timeToX, priceToY, bounds, isSelected, false);
      break;
    case DRAW_TOOLS.ARROW:
      drawArrow(ctx, drawing, timeToX, priceToY, isSelected);
      break;
    case DRAW_TOOLS.FIBONACCI:
      drawFibonacci(ctx, drawing, timeToX, priceToY, bounds, isSelected);
      break;
    case DRAW_TOOLS.VERTICAL_LINE:
      drawVerticalLine(ctx, drawing, timeToX, bounds, isSelected);
      break;
    case DRAW_TOOLS.RECTANGLE:
      drawRectangle(ctx, drawing, timeToX, priceToY, isSelected);
      break;
    case DRAW_TOOLS.CHANNEL:
      drawChannel(ctx, drawing, timeToX, priceToY, isSelected);
      break;
    case DRAW_TOOLS.PATH:
      drawPath(ctx, drawing, timeToX, priceToY, isSelected);
      break;
    case DRAW_TOOLS.CIRCLE:
      drawCircle(ctx, drawing, timeToX, priceToY, isSelected);
      break;
    case DRAW_TOOLS.ELLIPSE:
      drawEllipse(ctx, drawing, timeToX, priceToY, isSelected);
      break;
    case DRAW_TOOLS.PRICE_RANGE:
      drawPriceRange(ctx, drawing, timeToX, priceToY, isSelected);
      break;
  }

  ctx.restore();
}

function drawTrendLine(ctx, drawing, timeToX, priceToY, isSelected) {
  if (drawing.points.length < 2) return;
  const [p1, p2] = drawing.points;
  const x1 = timeToX(p1.time);
  const y1 = priceToY(p1.price);
  const x2 = timeToX(p2.time);
  const y2 = priceToY(p2.price);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  drawAnchorDots(ctx, [[x1, y1], [x2, y2]], isSelected);
}

function drawHorizontalLine(ctx, drawing, priceToY, bounds, isSelected) {
  if (drawing.points.length < 1) return;
  const y = priceToY(drawing.points[0].price);
  const left = bounds.left || 0;
  const right = bounds.right || ctx.canvas.width;

  ctx.beginPath();
  ctx.moveTo(left, y);
  ctx.lineTo(right, y);
  ctx.stroke();

  drawAnchorDots(ctx, [[(left + right) / 2, y]], isSelected);
}

function drawCrosshair(ctx, drawing, timeToX, priceToY, bounds, isSelected) {
  if (drawing.points.length < 1) return;
  const x = timeToX(drawing.points[0].time);
  const y = priceToY(drawing.points[0].price);

  ctx.beginPath();
  ctx.moveTo(bounds.left, y);
  ctx.lineTo(bounds.right, y);
  ctx.moveTo(x, bounds.top);
  ctx.lineTo(x, bounds.bottom);
  ctx.stroke();

  drawAnchorDots(ctx, [[x, y]], isSelected);
}

function drawVerticalLine(ctx, drawing, timeToX, bounds, isSelected) {
  if (drawing.points.length < 1) return;
  const x = timeToX(drawing.points[0].time);

  ctx.beginPath();
  ctx.moveTo(x, bounds.top);
  ctx.lineTo(x, bounds.bottom);
  ctx.stroke();

  drawAnchorDots(ctx, [[x, (bounds.top + bounds.bottom) / 2]], isSelected);
}

function drawArrow(ctx, drawing, timeToX, priceToY, isSelected) {
  if (drawing.points.length < 2) return;
  const [p1, p2] = drawing.points;
  const x1 = timeToX(p1.time);
  const y1 = priceToY(p1.price);
  const x2 = timeToX(p2.time);
  const y2 = priceToY(p2.price);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // Arrowhead
  const angle = Math.atan2(y2 - y1, x2 - x1);
  ctx.beginPath();
  ctx.moveTo(x2, y2);
  ctx.lineTo(x2 - 12 * Math.cos(angle - Math.PI / 6), y2 - 12 * Math.sin(angle - Math.PI / 6));
  ctx.lineTo(x2 - 12 * Math.cos(angle + Math.PI / 6), y2 - 12 * Math.sin(angle + Math.PI / 6));
  ctx.closePath();
  ctx.fill();

  drawAnchorDots(ctx, [[x1, y1], [x2, y2]], isSelected);
}

function drawCircle(ctx, drawing, timeToX, priceToY, isSelected) {
  if (drawing.points.length < 2) return;
  const [p1, p2] = drawing.points;
  const x1 = timeToX(p1.time);
  const y1 = priceToY(p1.price);
  const x2 = timeToX(p2.time);
  const y2 = priceToY(p2.price);
  const radius = Math.hypot(x2 - x1, y2 - y1);

  ctx.beginPath();
  ctx.arc(x1, y1, radius, 0, Math.PI * 2);
  ctx.stroke();

  drawAnchorDots(ctx, [[x1, y1], [x2, y2]], isSelected);
}

function drawEllipse(ctx, drawing, timeToX, priceToY, isSelected) {
  if (drawing.points.length < 2) return;
  const [p1, p2] = drawing.points;
  const x1 = timeToX(p1.time);
  const y1 = priceToY(p1.price);
  const x2 = timeToX(p2.time);
  const y2 = priceToY(p2.price);

  const cx = (x1 + x2) / 2;
  const cy = (y1 + y2) / 2;
  const rx = Math.abs(x2 - x1) / 2;
  const ry = Math.abs(y2 - y1) / 2;

  ctx.beginPath();
  ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
  ctx.stroke();

  drawAnchorDots(ctx, [[x1, y1], [x2, y2]], isSelected);
}

function drawPath(ctx, drawing, timeToX, priceToY, isSelected) {
  if (drawing.points.length < 1) return;
  ctx.beginPath();
  ctx.moveTo(timeToX(drawing.points[0].time), priceToY(drawing.points[0].price));
  for (let i = 1; i < drawing.points.length; i++) {
    ctx.lineTo(timeToX(drawing.points[i].time), priceToY(drawing.points[i].price));
  }
  ctx.stroke();

  const dots = drawing.points.map(pt => [timeToX(pt.time), priceToY(pt.price)]);
  drawAnchorDots(ctx, dots, isSelected);
}

function drawRectangle(ctx, drawing, timeToX, priceToY, isSelected) {
  if (drawing.points.length < 2) return;
  const [p1, p2] = drawing.points;
  const x1 = timeToX(p1.time);
  const y1 = priceToY(p1.price);
  const x2 = timeToX(p2.time);
  const y2 = priceToY(p2.price);

  ctx.globalAlpha = isSelected ? 0.15 : 0.08;
  ctx.fillRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));

  ctx.globalAlpha = isSelected ? 1.0 : 0.85;
  ctx.strokeRect(Math.min(x1, x2), Math.min(y1, y2), Math.abs(x2 - x1), Math.abs(y2 - y1));

  drawAnchorDots(ctx, [[x1, y1], [x2, y2]], isSelected);
}

function drawChannel(ctx, drawing, timeToX, priceToY, isSelected) {
  if (drawing.points.length < 3) return;
  const [p1, p2, p3] = drawing.points;
  const x1 = timeToX(p1.time);
  const y1 = priceToY(p1.price);
  const x2 = timeToX(p2.time);
  const y2 = priceToY(p2.price);
  const x3 = timeToX(p3.time);
  const y3 = priceToY(p3.price);

  // Line 1
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();

  // perpendicular vector offset of point 3
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy);
  if (length === 0) return;

  const nx = -dy / length;
  const ny = dx / length;

  const projOffset = (x3 - x1) * nx + (y3 - y1) * ny;
  const ox = nx * projOffset;
  const oy = ny * projOffset;

  // Line 2 (parallel)
  const x1_offset = x1 + ox;
  const y1_offset = y1 + oy;
  const x2_offset = x2 + ox;
  const y2_offset = y2 + oy;

  ctx.beginPath();
  ctx.moveTo(x1_offset, y1_offset);
  ctx.lineTo(x2_offset, y2_offset);
  ctx.stroke();

  // Midline
  ctx.save();
  ctx.setLineDash([4, 4]);
  ctx.beginPath();
  ctx.moveTo(x1 + ox / 2, y1 + oy / 2);
  ctx.lineTo(x2 + ox / 2, y2 + oy / 2);
  ctx.stroke();
  ctx.restore();

  drawAnchorDots(ctx, [[x1, y1], [x2, y2], [x3, y3]], isSelected);
}

function drawPositionBlock(ctx, drawing, timeToX, priceToY, bounds, isSelected, isLong) {
  if (drawing.points.length < 3) return;
  const [entryPt, targetPt, stopPt] = drawing.points;
  const x1 = timeToX(entryPt.time);
  const yEntry = priceToY(entryPt.price);
  const yTarget = priceToY(targetPt.price);
  const yStop = priceToY(stopPt.price);

  const left = bounds.left;
  const right = bounds.right;
  const width = right - left;

  const targetDiff = Math.abs(targetPt.price - entryPt.price);
  const stopDiff = Math.abs(entryPt.price - stopPt.price);
  const rr = stopDiff === 0 ? 0 : targetDiff / stopDiff;

  // Target Box (Green / Blue)
  ctx.save();
  ctx.fillStyle = isLong ? "rgba(34,197,94,0.15)" : "rgba(244,63,94,0.15)";
  ctx.fillRect(left, Math.min(yEntry, yTarget), width, Math.abs(yTarget - yEntry));

  // Stop Box (Red)
  ctx.fillStyle = isLong ? "rgba(244,63,94,0.15)" : "rgba(34,197,94,0.15)";
  ctx.fillRect(left, Math.min(yEntry, yStop), width, Math.abs(yStop - yEntry));
  ctx.restore();

  // Lines
  ctx.beginPath();
  ctx.moveTo(left, yEntry);
  ctx.lineTo(right, yEntry);
  ctx.stroke();

  ctx.save();
  ctx.strokeStyle = isLong ? "#22c55e" : "#f43f5e";
  ctx.beginPath();
  ctx.moveTo(left, yTarget);
  ctx.lineTo(right, yTarget);
  ctx.stroke();

  ctx.strokeStyle = isLong ? "#f43f5e" : "#22c55e";
  ctx.beginPath();
  ctx.moveTo(left, yStop);
  ctx.lineTo(right, yStop);
  ctx.stroke();
  ctx.restore();

  // Labels
  ctx.font = "11px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  const midX = (left + right) / 2;

  ctx.fillText(`Target: ${targetPt.price.toFixed(2)} (RR: ${rr.toFixed(2)})`, midX, Math.min(yEntry, yTarget) + 15);
  ctx.fillText(`Stop: ${stopPt.price.toFixed(2)}`, midX, Math.max(yEntry, yStop) - 8);

  drawAnchorDots(ctx, [[x1, yEntry], [x1, yTarget], [x1, yStop]], isSelected);
}

function drawPriceRange(ctx, drawing, timeToX, priceToY, isSelected) {
  if (drawing.points.length < 2) return;
  const [p1, p2] = drawing.points;
  const x1 = timeToX(p1.time);
  const y1 = priceToY(p1.price);
  const x2 = timeToX(p2.time);
  const y2 = priceToY(p2.price);

  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x1, y2);
  ctx.moveTo(x1 - 8, y1);
  ctx.lineTo(x1 + 8, y1);
  ctx.moveTo(x1 - 8, y2);
  ctx.lineTo(x1 + 8, y2);
  ctx.stroke();

  const diff = p2.price - p1.price;
  const pct = (diff / p1.price) * 100;
  const text = `${diff >= 0 ? "+" : ""}${diff.toFixed(2)} (${pct.toFixed(2)}%)`;

  ctx.font = "11px Inter, system-ui, sans-serif";
  ctx.fillStyle = "#38bdf8";
  ctx.textAlign = "left";
  ctx.fillText(text, x1 + 12, (y1 + y2) / 2);

  drawAnchorDots(ctx, [[x1, y1], [x1, y2]], isSelected);
}

function drawFibonacci(ctx, drawing, timeToX, priceToY, bounds, isSelected) {
  if (drawing.points.length < 2) return;
  const [p1, p2] = drawing.points;
  const high = Math.max(p1.price, p2.price);
  const low = Math.min(p1.price, p2.price);
  const range = high - low;
  const left = bounds.left || 0;
  const right = bounds.right || ctx.canvas.width;

  const x1 = timeToX(p1.time);
  const y1 = priceToY(p1.price);
  const x2 = timeToX(p2.time);
  const y2 = priceToY(p2.price);

  ctx.font = "10px Inter, system-ui, sans-serif";
  ctx.textAlign = "left";

  for (const level of FIB_LEVELS) {
    const price = high - range * level;
    const y = priceToY(price);

    ctx.globalAlpha = level === 0 || level === 1 ? 0.7 : 0.45;
    ctx.setLineDash([4, 3]);
    ctx.beginPath();
    ctx.moveTo(left, y);
    ctx.lineTo(right, y);
    ctx.stroke();

    ctx.globalAlpha = 0.8;
    ctx.fillStyle = isSelected ? "#38bdf8" : "#f59e0b";
    ctx.fillText(`${(level * 100).toFixed(1)}% — ${price.toFixed(2)}`, left + 6, y - 3);
  }

  const y382 = priceToY(high - range * 0.382);
  const y618 = priceToY(high - range * 0.618);
  ctx.globalAlpha = 0.06;
  ctx.fillStyle = isSelected ? "#38bdf8" : "#f59e0b";
  ctx.fillRect(left, Math.min(y382, y618), right - left, Math.abs(y618 - y382));

  drawAnchorDots(ctx, [[x1, y1], [x2, y2]], isSelected);
}

function drawAnchorDots(ctx, coordinates, isSelected) {
  ctx.save();
  ctx.globalAlpha = 1.0;
  for (const [x, y] of coordinates) {
    ctx.beginPath();
    ctx.arc(x, y, isSelected ? 6 : 4, 0, Math.PI * 2);
    ctx.fill();
    if (isSelected) {
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  }
  ctx.restore();
}

export function findControlPointNear(drawings, clickTime, clickPrice, timeToX, priceToY, threshold = 12) {
  const px = timeToX(clickTime);
  const py = priceToY(clickPrice);

  for (let i = drawings.length - 1; i >= 0; i--) {
    const d = drawings[i];
    if (d.type === DRAW_TOOLS.HORIZONTAL_LINE) {
      const y = priceToY(d.points[0].price);
      if (Math.abs(y - py) < threshold) {
        return { drawingId: d.id, pointIndex: 0 };
      }
    } else {
      for (let ptIdx = 0; ptIdx < d.points.length; ptIdx++) {
        const ptX = timeToX(d.points[ptIdx].time);
        const ptY = priceToY(d.points[ptIdx].price);
        const dist = Math.hypot(px - ptX, py - ptY);
        if (dist < threshold) {
          return { drawingId: d.id, pointIndex: ptIdx };
        }
      }
    }
  }
  return null;
}

export function findDrawingNear(drawings, time, price, timeToX, priceToY, threshold = 14) {
  for (let i = drawings.length - 1; i >= 0; i--) {
    const d = drawings[i];
    if (d.type === DRAW_TOOLS.HORIZONTAL_LINE) {
      const y = priceToY(d.points[0].price);
      const clickY = priceToY(price);
      if (Math.abs(y - clickY) < threshold) return i;
    } else if (d.points.length >= 2) {
      const x1 = timeToX(d.points[0].time);
      const y1 = priceToY(d.points[0].price);
      const x2 = timeToX(d.points[1].time);
      const y2 = priceToY(d.points[1].price);
      const clickX = timeToX(time);
      const clickY = priceToY(price);

      if (d.type === DRAW_TOOLS.RECTANGLE || d.type === DRAW_TOOLS.LONG_POSITION || d.type === DRAW_TOOLS.SHORT_POSITION) {
        const xMin = Math.min(x1, x2);
        const xMax = Math.max(x1, x2);
        const yMin = Math.min(y1, y2);
        const yMax = Math.max(y1, y2);
        if (clickX >= xMin - threshold && clickX <= xMax + threshold &&
            clickY >= yMin - threshold && clickY <= yMax + threshold) {
          return i;
        }
      } else {
        const dist = pointToLineDistance(clickX, clickY, x1, y1, x2, y2);
        if (dist < threshold) return i;
      }
    }
  }
  return -1;
}

function pointToLineDistance(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const lenSq = dx * dx + dy * dy;
  if (lenSq === 0) return Math.hypot(px - x1, py - y1);
  let t = ((px - x1) * dx + (py - y1) * dy) / lenSq;
  t = Math.max(0, Math.min(1, t));
  const projX = x1 + t * dx;
  const projY = y1 + t * dy;
  return Math.hypot(px - projX, py - projY);
}
