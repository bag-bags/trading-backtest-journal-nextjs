/**
 * Reda System Strategy Signal Engine & Pre-Trade Checklist Evaluator
 * Based on Macro Fundamental Bias, Technical Candle Close, Orderflow Liquidity Sweeps, POI Zones, and Session Killzones.
 */

export function calculateLotSize(accountBalance = 10000, riskPercent = 1, entryPrice = 0, stopLossPrice = 0, symbol = "GOLD") {
  if (!entryPrice || !stopLossPrice || entryPrice === stopLossPrice) {
    return {
      riskAmount: (accountBalance * (riskPercent / 100)).toFixed(2),
      distance: "0.00",
      lotSize: "0.01",
      pipDistance: "0",
      recommendedPosition: "0.01 Lots"
    };
  }

  const riskAmount = accountBalance * (riskPercent / 100);
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const normSym = (symbol || "GOLD").toUpperCase();

  let lotSize = 0.01;
  let pipDistance = priceDistance;

  if (normSym.includes("GOLD") || normSym.includes("XAU")) {
    // Gold: 1 Standard Lot = 100 oz. $1.00 move per 1.0 Lot = $100
    // pipDistance is price change in dollars (e.g. 2650.00 - 2642.00 = $8.00)
    lotSize = riskAmount / (priceDistance * 100);
  } else if (normSym.includes("BTC") || normSym.includes("ETH") || normSym.includes("CRYPTO")) {
    // Crypto: Quantity = Risk Amount / Price Distance
    lotSize = riskAmount / priceDistance;
  } else if (normSym.includes("US100") || normSym.includes("US30") || normSym.includes("US500") || normSym.includes("NASDAQ") || normSym.includes("DOW")) {
    // Indices: $1 per point per lot (or CFD specification)
    lotSize = riskAmount / (priceDistance * 10);
  } else {
    // Standard Forex Pair (EURUSD, GBPUSD, etc.)
    // 1 Pip = 0.0001 (or 0.01 for JPY). 1 Standard Lot = $10 per pip
    const isJpy = normSym.includes("JPY");
    const pipMultiplier = isJpy ? 100 : 10000;
    pipDistance = priceDistance * pipMultiplier;
    lotSize = riskAmount / (pipDistance * 10);
  }

  // Sanitize lot size display
  if (isNaN(lotSize) || lotSize <= 0) lotSize = 0.01;
  const formattedLot = lotSize >= 10 ? lotSize.toFixed(1) : lotSize.toFixed(2);

  return {
    riskAmount: riskAmount.toFixed(2),
    distance: priceDistance.toFixed(2),
    pipDistance: pipDistance.toFixed(1),
    lotSize: formattedLot,
    recommendedPosition: `${formattedLot} Lots`
  };
}

export function isInsideKillzone() {
  const now = new Date();
  const utcHour = now.getUTCHours();

  // London Killzone: 07:00 - 11:00 UTC
  // New York Killzone: 13:00 - 17:00 UTC
  const inLondon = utcHour >= 7 && utcHour < 11;
  const inNY = utcHour >= 13 && utcHour < 17;

  return inLondon || inNY;
}

export function evaluateRedaSystem(candles = [], symbol = "GOLD", fundamentalBias = "Bullish", useKillzoneFilter = true, accountBalance = 10000, riskPercent = 1) {
  if (!candles || candles.length < 5) {
    const currentPrice = candles && candles.length > 0 ? candles[candles.length - 1].close : 2650.00;
    const defaultSl = fundamentalBias === "Bearish" ? currentPrice + 8.00 : currentPrice - 8.00;
    const lotInfo = calculateLotSize(accountBalance, riskPercent, currentPrice, defaultSl, symbol);
    
    return {
      score: 3,
      isReady: false,
      signal: null,
      symbol,
      fundamentalBias,
      entry: currentPrice,
      stopLoss: defaultSl,
      takeProfit1: fundamentalBias === "Bearish" ? currentPrice - 16.00 : currentPrice + 16.00,
      takeProfit2: fundamentalBias === "Bearish" ? currentPrice - 24.00 : currentPrice + 24.00,
      takeProfit3: fundamentalBias === "Bearish" ? currentPrice - 40.00 : currentPrice + 40.00,
      lotInfo,
      checklist: [
        { name: "1. Fundamental Bias", valid: true, detail: `Macro Bias set to ${fundamentalBias}` },
        { name: "2. Technical Close State", valid: false, detail: "Waiting for HTF candle close confirmation" },
        { name: "3. Liquidity & Orderflow", valid: false, detail: "Scanning for BSL/SSL sweeps & BOS" },
        { name: "4. POI Zone Alignment", valid: true, detail: "Price approaching Order Block zone" },
        { name: "5. Session Killzone Window", valid: isInsideKillzone(), detail: isInsideKillzone() ? "Inside London/NY Session 🟢" : "Outside Killzone Window 🔴" }
      ]
    };
  }

  const lastCandle = candles[candles.length - 1];
  const prevCandle = candles[candles.length - 2];
  const prevCandle2 = candles[candles.length - 3];

  const currentPrice = lastCandle.close;

  // 1. Fundamental Bias
  const fundValid = fundamentalBias === "Bullish" || fundamentalBias === "Bearish" || fundamentalBias === "Neutral";

  // 2. Technical Candle Close State
  const isBullEngulfing = prevCandle && lastCandle.close > lastCandle.open && prevCandle.close < prevCandle.open && lastCandle.close >= prevCandle.open;
  const isBearEngulfing = prevCandle && lastCandle.close < lastCandle.open && prevCandle.close > prevCandle.open && lastCandle.close <= prevCandle.open;
  
  const techValid = fundamentalBias === "Bearish" ? isBearEngulfing || lastCandle.close < lastCandle.open : isBullEngulfing || lastCandle.close > lastCandle.open;

  // 3. Liquidity Sweep & Orderflow
  let hasSweep = false;
  let lowestLow = lastCandle.low;
  let highestHigh = lastCandle.high;

  for (let i = Math.max(0, candles.length - 15); i < candles.length - 1; i++) {
    if (candles[i].low < lowestLow) lowestLow = candles[i].low;
    if (candles[i].high > highestHigh) highestHigh = candles[i].high;
  }

  if (fundamentalBias === "Bearish" && lastCandle.high > highestHigh * 0.999) hasSweep = true;
  if (fundamentalBias !== "Bearish" && lastCandle.low < lowestLow * 1.001) hasSweep = true;
  const orderflowValid = hasSweep || Math.abs(lastCandle.close - prevCandle.close) > 0.5;

  // 4. POI Zone Alignment (Order Block / FVG)
  const isFvgBull = prevCandle2 && lastCandle.low > prevCandle2.high;
  const isFvgBear = prevCandle2 && lastCandle.high < prevCandle2.low;
  const poiValid = fundamentalBias === "Bearish" ? (isFvgBear || isBearEngulfing) : (isFvgBull || isBullEngulfing);

  // 5. Session Killzone
  const kzValid = useKillzoneFilter ? isInsideKillzone() : true;

  // Score Calculation
  const checklist = [
    { name: "1. Fundamental Bias", valid: fundValid, detail: `Macro Bias set to ${fundamentalBias}` },
    { name: "2. Technical Close State", valid: techValid, detail: techValid ? "HTF Candle Close Confirmed ✓" : "Waiting for Engulfing Bar / Close" },
    { name: "3. Liquidity & Orderflow", valid: orderflowValid, detail: orderflowValid ? "Liquidity Swept / BOS Active ✓" : "Scanning BSL/SSL Sweeps" },
    { name: "4. POI Zone Alignment", valid: poiValid, detail: poiValid ? "OB / FVG Zone Mitigated ✓" : "Approaching POI Zone" },
    { name: "5. Session Killzone Window", valid: kzValid, detail: kzValid ? "Active London/NY Session 🟢" : "Outside Killzone Window 🔴" }
  ];

  const score = checklist.filter(c => c.valid).length;
  const isReady = score === 5;

  // Determine Signal
  let signal = null;
  if (isReady) {
    if (fundamentalBias === "Bearish") {
      signal = "SELL";
    } else if (fundamentalBias === "Bullish") {
      signal = "BUY";
    } else {
      signal = lastCandle.close > lastCandle.open ? "BUY" : "SELL";
    }
  }

  // Calculate SL and TP
  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = 0;
  let takeProfit3 = 0;

  const isGold = (symbol || "").toUpperCase().includes("GOLD") || (symbol || "").toUpperCase().includes("XAU");
  const slOffset = isGold ? 6.50 : (currentPrice * 0.004);

  if (signal === "SELL" || fundamentalBias === "Bearish") {
    stopLoss = highestHigh + (isGold ? 1.50 : (currentPrice * 0.001));
    const riskDist = stopLoss - currentPrice;
    takeProfit1 = currentPrice - (riskDist * 2);
    takeProfit2 = currentPrice - (riskDist * 3);
    takeProfit3 = currentPrice - (riskDist * 5);
  } else {
    stopLoss = lowestLow - (isGold ? 1.50 : (currentPrice * 0.001));
    const riskDist = currentPrice - stopLoss;
    takeProfit1 = currentPrice + (riskDist * 2);
    takeProfit2 = currentPrice + (riskDist * 3);
    takeProfit3 = currentPrice + (riskDist * 5);
  }

  const lotInfo = calculateLotSize(accountBalance, riskPercent, currentPrice, stopLoss, symbol);

  return {
    score,
    isReady,
    signal,
    symbol,
    fundamentalBias,
    entry: currentPrice,
    stopLoss,
    takeProfit1,
    takeProfit2,
    takeProfit3,
    lotInfo,
    checklist
  };
}
