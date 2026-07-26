/** Indicator calculation utilities for OHLC data */

/**
 * Simple Moving Average
 * @param {Array<{time: number, close: number}>} data
 * @param {number} period
 * @returns {Array<{time: number, value: number}>}
 */
export function calcSMA(data, period) {
  const result = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

/**
 * Exponential Moving Average
 * @param {Array<{time: number, close: number}>} data
 * @param {number} period
 * @returns {Array<{time: number, value: number}>}
 */
export function calcEMA(data, period) {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const result = [];

  // seed with SMA
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].close;
  let ema = sum / period;
  result.push({ time: data[period - 1].time, value: ema });

  for (let i = period; i < data.length; i++) {
    ema = data[i].close * k + ema * (1 - k);
    result.push({ time: data[i].time, value: ema });
  }
  return result;
}

/**
 * Bollinger Bands (SMA ± stdDev * multiplier)
 * @param {Array<{time: number, close: number}>} data
 * @param {number} period
 * @param {number} mult - standard deviation multiplier (default 2)
 * @returns {{upper: Array, middle: Array, lower: Array}}
 */
export function calcBollingerBands(data, period, mult = 2) {
  const upper = [];
  const middle = [];
  const lower = [];
  for (let i = period - 1; i < data.length; i++) {
    let sum = 0;
    for (let j = 0; j < period; j++) sum += data[i - j].close;
    const mean = sum / period;
    let variance = 0;
    for (let j = 0; j < period; j++) variance += (data[i - j].close - mean) ** 2;
    const std = Math.sqrt(variance / period);
    const time = data[i].time;
    upper.push({ time, value: mean + mult * std });
    middle.push({ time, value: mean });
    lower.push({ time, value: mean - mult * std });
  }
  return { upper, middle, lower };
}

/**
 * Relative Strength Index
 * @param {Array<{time: number, close: number}>} data
 * @param {number} period
 * @returns {Array<{time: number, value: number}>}
 */
export function calcRSI(data, period = 14) {
  if (data.length < period + 1) return [];
  const result = [];
  let avgGain = 0;
  let avgLoss = 0;

  // initial average
  for (let i = 1; i <= period; i++) {
    const change = data[i].close - data[i - 1].close;
    if (change > 0) avgGain += change;
    else avgLoss -= change;
  }
  avgGain /= period;
  avgLoss /= period;

  const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
  result.push({ time: data[period].time, value: 100 - 100 / (1 + rs) });

  for (let i = period + 1; i < data.length; i++) {
    const change = data[i].close - data[i - 1].close;
    const gain = change > 0 ? change : 0;
    const loss = change < 0 ? -change : 0;
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
    const rsi = avgLoss === 0 ? 100 : 100 - 100 / (1 + avgGain / avgLoss);
    result.push({ time: data[i].time, value: rsi });
  }
  return result;
}

/**
 * MACD (Moving Average Convergence Divergence)
 * @param {Array<{time: number, close: number}>} data
 * @param {number} fast - fast EMA period (default 12)
 * @param {number} slow - slow EMA period (default 26)
 * @param {number} signal - signal EMA period (default 9)
 * @returns {{macd: Array, signal: Array, histogram: Array}}
 */
export function calcMACD(data, fast = 12, slow = 26, signal = 9) {
  const fastEMA = calcEMA(data, fast);
  const slowEMA = calcEMA(data, slow);

  // align fast and slow EMA by time
  const slowTimes = new Set(slowEMA.map((d) => d.time));
  const alignedFast = fastEMA.filter((d) => slowTimes.has(d.time));
  const slowMap = Object.fromEntries(slowEMA.map((d) => [d.time, d.value]));

  const macdLine = alignedFast.map((d) => ({
    time: d.time,
    close: d.value - slowMap[d.time],
    value: d.value - slowMap[d.time]
  }));

  const signalLine = calcEMAFromValues(macdLine, signal);
  const signalMap = Object.fromEntries(signalLine.map((d) => [d.time, d.value]));

  const histogram = macdLine
    .filter((d) => signalMap[d.time] !== undefined)
    .map((d) => ({
      time: d.time,
      value: d.value - signalMap[d.time],
      color: d.value - signalMap[d.time] >= 0 ? "rgba(34,197,94,0.6)" : "rgba(244,63,94,0.6)"
    }));

  return {
    macd: macdLine.map((d) => ({ time: d.time, value: d.value })),
    signal: signalLine,
    histogram
  };
}

/** Helper: EMA from pre-computed values (for MACD signal line) */
function calcEMAFromValues(data, period) {
  if (data.length < period) return [];
  const k = 2 / (period + 1);
  const result = [];
  let sum = 0;
  for (let i = 0; i < period; i++) sum += data[i].value || data[i].close;
  let ema = sum / period;
  result.push({ time: data[period - 1].time, value: ema });
  for (let i = period; i < data.length; i++) {
    ema = (data[i].value || data[i].close) * k + ema * (1 - k);
    result.push({ time: data[i].time, value: ema });
  }
  return result;
}

/**
 * Prepare volume data for histogram series
 * @param {Array<{time: number, open: number, close: number, volume: number}>} data
 * @returns {Array<{time: number, value: number, color: string}>}
 */
export function calcVolume(data) {
  return data.map((d) => ({
    time: d.time,
    value: d.volume || 0,
    color: d.close >= d.open ? "rgba(34,197,94,0.35)" : "rgba(244,63,94,0.35)"
  }));
}

/**
 * Calculate Heikin Ashi Candlestick data
 * @param {Array<{time: number, open: number, high: number, low: number, close: number}>} data
 * @returns {Array}
 */
export function calcHeikinAshi(data) {
  if (data.length === 0) return [];
  const result = [];

  // First candle seed
  let prevOpen = (data[0].open + data[0].close) / 2;
  let prevClose = (data[0].open + data[0].high + data[0].low + data[0].close) / 4;
  result.push({
    time: data[0].time,
    open: prevOpen,
    high: Math.max(data[0].high, prevOpen, prevClose),
    low: Math.min(data[0].low, prevOpen, prevClose),
    close: prevClose
  });

  for (let i = 1; i < data.length; i++) {
    const c = data[i];
    const haClose = (c.open + c.high + c.low + c.close) / 4;
    const haOpen = (prevOpen + prevClose) / 2;
    const haHigh = Math.max(c.high, haOpen, haClose);
    const haLow = Math.min(c.low, haOpen, haClose);

    result.push({
      time: c.time,
      open: haOpen,
      high: haHigh,
      low: haLow,
      close: haClose
    });

    prevOpen = haOpen;
    prevClose = haClose;
  }
  return result;
}
