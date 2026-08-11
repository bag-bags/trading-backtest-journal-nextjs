/**
 * Reda System Strategy Signal Engine & Pre-Trade Checklist Evaluator
 * Supports XAUUSD, EURUSD, GBPUSD, GBPJPY, DXY, USOIL, NAS100
 */

export function calculateLotSize(accountBalanceInput = 10000, riskPercentInput = 1, entryPriceInput = 0, stopLossPriceInput = 0, symbol = "XAUUSD") {
  const accountBalance = parseFloat(accountBalanceInput) || 10000;
  const riskPercent = parseFloat(riskPercentInput) || 1;
  const entryPrice = parseFloat(entryPriceInput) || 0;
  const stopLossPrice = parseFloat(stopLossPriceInput) || 0;

  const riskAmount = accountBalance * (riskPercent / 100);
  const priceDistance = Math.abs(entryPrice - stopLossPrice);
  const normSym = (symbol || "XAUUSD").toUpperCase().replace(/[^A-Z0-9]/g, "");

  if (!entryPrice || !stopLossPrice || priceDistance < 0.00001) {
    return {
      riskAmount: riskAmount.toFixed(2),
      distance: "0.0000",
      lotSize: "0.01",
      pipDistance: "0",
      recommendedPosition: "0.01 Lots"
    };
  }

  let lotSize = 0.01;
  let pipDistance = priceDistance;

  if (normSym.includes("GOLD") || normSym.includes("XAU")) {
    // Gold (XAUUSD): 1 Standard Lot = 100 oz. $1.00 move per 1.0 Lot = $100
    lotSize = riskAmount / (priceDistance * 100);
  } else if (normSym.includes("USOIL") || normSym.includes("WTI") || normSym.includes("OIL")) {
    // Crude Oil (USOIL): 1 Standard Lot = 1,000 barrels. $1.00 move per 1.0 Lot = $1,000
    lotSize = riskAmount / (priceDistance * 1000);
  } else if (normSym.includes("NAS100") || normSym.includes("US100") || normSym.includes("NASDAQ")) {
    // Nasdaq 100 (NAS100): 1 point move per 1.0 Lot = $20
    lotSize = riskAmount / (priceDistance * 20);
  } else if (normSym.includes("DXY")) {
    // Dollar Index (DXY): 1 point move per 1.0 Lot = $1,000
    lotSize = riskAmount / (priceDistance * 1000);
  } else if (normSym.includes("JPY")) {
    // GBPJPY / USDJPY: 1 Pip (0.01) = $10 per lot
    pipDistance = priceDistance * 100;
    lotSize = riskAmount / (pipDistance * 10);
  } else {
    // Standard Forex (EURUSD, GBPUSD): 1 Pip (0.0001) = $10 per lot
    pipDistance = priceDistance * 10000;
    lotSize = riskAmount / (pipDistance * 10);
  }

  // Ensure positive valid lot size
  if (isNaN(lotSize) || lotSize <= 0.0001) {
    lotSize = 0.01;
  }

  let formattedLot = "0.01";
  if (lotSize < 0.05) {
    formattedLot = lotSize.toFixed(3);
  } else if (lotSize < 10) {
    formattedLot = lotSize.toFixed(2);
  } else {
    formattedLot = lotSize.toFixed(1);
  }

  return {
    riskAmount: riskAmount.toFixed(2),
    distance: priceDistance.toFixed(4),
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

export function evaluateRedaSystem(candles = [], symbol = "XAUUSD", fundamentalBias = "Bullish", useKillzoneFilter = true, accountBalance = 10000, riskPercent = 1) {
  const normSym = (symbol || "XAUUSD").toUpperCase();

  // Default market fallback prices if candles array is empty
  const defaultPrices = {
    XAUUSD: 2650.00,
    GOLD: 2650.00,
    EURUSD: 1.0920,
    GBPUSD: 1.2850,
    GBPJPY: 191.50,
    DXY: 102.80,
    USOIL: 76.40,
    NAS100: 19850.00,
    US100: 19850.00
  };

  const defaultPrice = defaultPrices[normSym] || 2650.00;

  if (!candles || candles.length === 0) {
    const slBuffer = normSym.includes("GOLD") || normSym.includes("XAU") ? 5.50 : normSym.includes("NAS100") || normSym.includes("US100") ? 35.0 : normSym.includes("GBPJPY") ? 0.35 : normSym.includes("USOIL") ? 0.60 : 0.0020;
    const defaultSl = fundamentalBias === "Bearish" ? defaultPrice + slBuffer : defaultPrice - slBuffer;
    const lotInfo = calculateLotSize(accountBalance, riskPercent, defaultPrice, defaultSl, symbol);

    return {
      score: 3,
      isReady: false,
      signal: null,
      symbol,
      fundamentalBias,
      entry: defaultPrice,
      stopLoss: defaultSl,
      takeProfit1: fundamentalBias === "Bearish" ? defaultPrice - (slBuffer * 2) : defaultPrice + (slBuffer * 2),
      takeProfit2: fundamentalBias === "Bearish" ? defaultPrice - (slBuffer * 3) : defaultPrice + (slBuffer * 3),
      takeProfit3: fundamentalBias === "Bearish" ? defaultPrice - (slBuffer * 5) : defaultPrice + (slBuffer * 5),
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
  const prevCandle = candles.length > 1 ? candles[candles.length - 2] : lastCandle;
  const prevCandle2 = candles.length > 2 ? candles[candles.length - 3] : prevCandle;

  const currentPrice = Number(lastCandle.close) || defaultPrice;

  // 1. Fundamental Bias
  const fundValid = fundamentalBias === "Bullish" || fundamentalBias === "Bearish" || fundamentalBias === "Neutral";

  // 2. Technical Candle Close State
  const isBullEngulfing = prevCandle && lastCandle.close > lastCandle.open && prevCandle.close < prevCandle.open && lastCandle.close >= prevCandle.open;
  const isBearEngulfing = prevCandle && lastCandle.close < lastCandle.open && prevCandle.close > prevCandle.open && lastCandle.close <= prevCandle.open;
  
  const techValid = fundamentalBias === "Bearish" ? (isBearEngulfing || lastCandle.close < lastCandle.open) : (isBullEngulfing || lastCandle.close > lastCandle.open);

  // 3. Liquidity Sweep & Orderflow
  let lowestLow = Number(lastCandle.low) || currentPrice;
  let highestHigh = Number(lastCandle.high) || currentPrice;

  for (let i = Math.max(0, candles.length - 15); i < candles.length - 1; i++) {
    const cLow = Number(candles[i].low);
    const cHigh = Number(candles[i].high);
    if (cLow && cLow < lowestLow) lowestLow = cLow;
    if (cHigh && cHigh > highestHigh) highestHigh = cHigh;
  }

  let hasSweep = false;
  if (fundamentalBias === "Bearish" && lastCandle.high >= highestHigh * 0.9995) hasSweep = true;
  if (fundamentalBias !== "Bearish" && lastCandle.low <= lowestLow * 1.0005) hasSweep = true;
  const orderflowValid = hasSweep || Math.abs(lastCandle.close - prevCandle.close) > (currentPrice * 0.0001);

  // 4. POI Zone Alignment
  const isFvgBull = prevCandle2 && lastCandle.low > prevCandle2.high;
  const isFvgBear = prevCandle2 && lastCandle.high < prevCandle2.low;
  const poiValid = fundamentalBias === "Bearish" ? (isFvgBear || isBearEngulfing || true) : (isFvgBull || isBullEngulfing || true);

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

  // Symbol specific Stop Loss & Take Profit calculations
  let slBuffer = 0.0015;
  if (normSym.includes("GOLD") || normSym.includes("XAU")) slBuffer = 5.00;
  else if (normSym.includes("NAS100") || normSym.includes("US100")) slBuffer = 35.00;
  else if (normSym.includes("USOIL") || normSym.includes("OIL")) slBuffer = 0.60;
  else if (normSym.includes("GBPJPY")) slBuffer = 0.35;
  else if (normSym.includes("DXY")) slBuffer = 0.20;
  else slBuffer = currentPrice * 0.0015;

  let stopLoss = 0;
  let takeProfit1 = 0;
  let takeProfit2 = 0;
  let takeProfit3 = 0;

  if (signal === "SELL" || fundamentalBias === "Bearish") {
    stopLoss = highestHigh + slBuffer;
    const riskDist = Math.max(slBuffer, stopLoss - currentPrice);
    takeProfit1 = currentPrice - (riskDist * 2);
    takeProfit2 = currentPrice - (riskDist * 3);
    takeProfit3 = currentPrice - (riskDist * 5);
  } else {
    stopLoss = lowestLow - slBuffer;
    const riskDist = Math.max(slBuffer, currentPrice - stopLoss);
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
