import { NextResponse } from "next/server";

// ─── MOST IMPORTANT ECONOMIC NEWS & EVENTS FOR TRADERS ───
// This database is organized by economic indicator category.
// Each entry represents a high-impact macro event that moves markets.

const WEEKLY_HIGH_IMPACT_NEWS = [
  {
    title: "🇺🇸 U.S. Non-Farm Payrolls (NFP)",
    summary: "The NFP report measures the change in number of employed people in the U.S. excluding farm workers. A stronger-than-expected reading signals economic strength, boosting USD and pressuring Gold. A weaker reading signals potential rate cuts, weakening USD and boosting Gold & equities.",
    importance: "🔴 Extreme High Impact",
    impact: "Massive volatility spike on USD pairs (EUR/USD, GBP/USD, XAU/USD). Gold typically drops on strong NFP and rallies on weak NFP. Expect 50-200 pip moves within minutes.",
    market: "Forex (USD pairs), Gold (XAU/USD), US Indices (S&P 500, Nasdaq)",
    indicator: "Non-Farm Employment Change",
    economy: "United States 🇺🇸",
    frequency: "Monthly (First Friday of every month)",
    source: "https://www.bls.gov/news.release/empsit.nr0.htm",
    sourceLabel: "U.S. Bureau of Labor Statistics"
  },
  {
    title: "🇺🇸 Consumer Price Index (CPI) — Inflation Report",
    summary: "CPI measures the change in prices of goods and services purchased by consumers. Higher CPI = higher inflation = Fed likely to raise or hold rates high. Lower CPI = disinflation = market expects rate cuts sooner, boosting risk assets.",
    importance: "🔴 Extreme High Impact",
    impact: "EUR/USD, GBP/USD, XAU/USD experience 80-150 pip moves. US equity indices react sharply. Gold surges on lower-than-expected CPI and drops on higher CPI.",
    market: "Forex (all USD pairs), Gold (XAU/USD), US Bonds (10Y Yield), Crypto (BTC)",
    indicator: "CPI m/m, CPI y/y, Core CPI (excl. Food & Energy)",
    economy: "United States 🇺🇸",
    frequency: "Monthly (around 10th-14th of each month)",
    source: "https://www.bls.gov/cpi/",
    sourceLabel: "U.S. Bureau of Labor Statistics"
  },
  {
    title: "🇺🇸 Federal Reserve Interest Rate Decision (FOMC)",
    summary: "The Federal Open Market Committee (FOMC) sets the federal funds rate. Rate hikes strengthen USD and pressure Gold/equities. Rate cuts or dovish forward guidance weaken USD and boost Gold, stocks, and crypto.",
    importance: "🔴 Extreme High Impact",
    impact: "All USD pairs, Gold, US indices, and crypto experience extreme volatility. The press conference 30 minutes after the decision often causes a second wave of movement even larger than the initial reaction.",
    market: "All Forex pairs, Gold, Silver, US Indices, Bonds, Crypto",
    indicator: "Federal Funds Rate, FOMC Statement, Dot Plot Projections",
    economy: "United States 🇺🇸 (Global Impact)",
    frequency: "8 times per year (every ~6 weeks)",
    source: "https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm",
    sourceLabel: "Federal Reserve Board"
  },
  {
    title: "🇺🇸 Gross Domestic Product (GDP)",
    summary: "GDP measures the total value of goods and services produced in the U.S. economy. Strong GDP signals economic expansion, supporting USD. Weak GDP raises recession fears, boosting safe-haven assets like Gold and JPY.",
    importance: "🟠 High Impact",
    impact: "USD pairs move 30-80 pips. US indices react based on growth outlook. Gold inversely correlated — drops on strong GDP, rises on weak GDP.",
    market: "Forex (USD pairs), US Indices (Dow Jones, S&P 500), Gold",
    indicator: "GDP q/q (Advance, Preliminary, Final)",
    economy: "United States 🇺🇸",
    frequency: "Quarterly (3 releases per quarter: Advance, 2nd, Final)",
    source: "https://www.bea.gov/data/gdp/gross-domestic-product",
    sourceLabel: "U.S. Bureau of Economic Analysis"
  },
  {
    title: "🇺🇸 Initial Jobless Claims",
    summary: "Measures the number of people filing for unemployment benefits for the first time. Rising claims = weakening labor market = USD bearish, Gold bullish. Falling claims = strong economy = USD bullish.",
    importance: "🟡 Medium-High Impact",
    impact: "Short-term USD volatility of 20-50 pips. Acts as a weekly leading indicator for the labor market health ahead of NFP.",
    market: "Forex (USD pairs), Gold (XAU/USD)",
    indicator: "Initial Jobless Claims, Continuing Claims",
    economy: "United States 🇺🇸",
    frequency: "Weekly (every Thursday, 8:30 AM ET)",
    source: "https://www.dol.gov/ui/data.pdf",
    sourceLabel: "U.S. Department of Labor"
  },
  {
    title: "🇺🇸 Producer Price Index (PPI)",
    summary: "PPI measures wholesale-level price changes before they reach consumers. It's a leading indicator for CPI. Rising PPI signals future consumer inflation, keeping the Fed hawkish. Falling PPI signals disinflation.",
    importance: "🟠 High Impact",
    impact: "USD pairs move 20-60 pips. Often released one day before or after CPI, creating a 2-day inflation sentiment window.",
    market: "Forex (USD pairs), Gold, US Bonds",
    indicator: "PPI m/m, Core PPI (excl. Food & Energy)",
    economy: "United States 🇺🇸",
    frequency: "Monthly",
    source: "https://www.bls.gov/ppi/",
    sourceLabel: "U.S. Bureau of Labor Statistics"
  },
  {
    title: "🇪🇺 European Central Bank (ECB) Interest Rate Decision",
    summary: "The ECB sets the main refinancing rate for the Eurozone. Rate hikes strengthen EUR and pressure EUR/USD downside on USD strength differential. Rate cuts weaken EUR. Lagarde's press conference adds secondary volatility.",
    importance: "🔴 Extreme High Impact",
    impact: "EUR/USD moves 60-120 pips. EUR crosses (EUR/GBP, EUR/JPY) also impacted. European indices (DAX, CAC) react sharply.",
    market: "Forex (EUR pairs), European Indices (DAX, STOXX), Bonds",
    indicator: "Main Refinancing Rate, Deposit Facility Rate, ECB Press Conference",
    economy: "Eurozone 🇪🇺",
    frequency: "6-8 times per year",
    source: "https://www.ecb.europa.eu/mopo/decisions/html/index.en.html",
    sourceLabel: "European Central Bank"
  },
  {
    title: "🇬🇧 Bank of England (BoE) Interest Rate Decision",
    summary: "The BoE's Monetary Policy Committee sets the UK base rate. Rate decisions and the MPC vote split directly impact GBP. A hawkish hold or hike strengthens GBP; dovish cuts weaken it.",
    importance: "🔴 High Impact",
    impact: "GBP/USD moves 50-100 pips. GBP crosses heavily affected. FTSE 100 reacts inversely to GBP strength.",
    market: "Forex (GBP pairs), UK Indices (FTSE 100), UK Gilts",
    indicator: "Bank Rate, MPC Vote Split, BoE Minutes",
    economy: "United Kingdom 🇬🇧",
    frequency: "8 times per year",
    source: "https://www.bankofengland.co.uk/monetary-policy/the-interest-rate-bank-rate",
    sourceLabel: "Bank of England"
  },
  {
    title: "🇺🇸 ISM Manufacturing & Services PMI",
    summary: "ISM PMI above 50 = economic expansion; below 50 = contraction. Manufacturing PMI is a leading indicator for industrial output. Services PMI covers 80% of the US economy and often has more market impact.",
    importance: "🟠 High Impact",
    impact: "USD pairs move 30-60 pips. Equity indices react based on economic expansion/contraction signals. Prices Paid sub-index acts as an inflation gauge.",
    market: "Forex (USD pairs), US Indices, Commodities",
    indicator: "ISM Manufacturing PMI, ISM Services PMI, Prices Paid, New Orders",
    economy: "United States 🇺🇸",
    frequency: "Monthly (1st and 3rd business day of each month)",
    source: "https://www.ismworld.org/supply-management-news-and-reports/reports/ism-report-on-business/",
    sourceLabel: "Institute for Supply Management"
  },
  {
    title: "🇺🇸 Retail Sales",
    summary: "Measures the total receipts of retail stores. It reflects consumer spending which drives ~70% of US GDP. Strong retail sales = economic strength = USD bullish. Weak sales raise recession concerns.",
    importance: "🟠 High Impact",
    impact: "USD pairs move 30-70 pips. Equity markets react positively to strong consumer spending data.",
    market: "Forex (USD pairs), US Indices, Consumer Discretionary Stocks",
    indicator: "Retail Sales m/m, Core Retail Sales (excl. Automobiles)",
    economy: "United States 🇺🇸",
    frequency: "Monthly (around 15th of each month)",
    source: "https://www.census.gov/retail/index.html",
    sourceLabel: "U.S. Census Bureau"
  },
  {
    title: "🇯🇵 Bank of Japan (BoJ) Interest Rate Decision",
    summary: "The BoJ has maintained ultra-loose monetary policy for decades but recently began normalizing. Any rate hike or yield curve control adjustment causes massive JPY volatility and impacts global carry trades.",
    importance: "🔴 High Impact",
    impact: "USD/JPY can move 100-300 pips on surprise decisions. JPY carry trade unwinding impacts global equity markets. Gold affected through USD/JPY correlation.",
    market: "Forex (JPY pairs), Nikkei 225, Global Equities (carry trade impact)",
    indicator: "Short-Term Policy Rate, Yield Curve Control, BoJ Outlook Report",
    economy: "Japan 🇯🇵 (Global Carry Trade Impact)",
    frequency: "8 times per year",
    source: "https://www.boj.or.jp/en/mopo/mpmdeci/index.htm",
    sourceLabel: "Bank of Japan"
  },
  {
    title: "🇨🇳 China Manufacturing PMI & Trade Balance",
    summary: "China's PMI and trade data are leading indicators for global demand and commodity prices. Strong Chinese data boosts AUD, NZD, and commodity currencies. Weak data signals global slowdown.",
    importance: "🟠 High Impact",
    impact: "AUD/USD and NZD/USD move 30-60 pips. Copper, Iron Ore, and Oil react to China demand signals. Asian equity markets lead the reaction.",
    market: "Forex (AUD, NZD, commodity currencies), Commodities (Copper, Oil), Asian Indices",
    indicator: "Caixin Manufacturing PMI, NBS PMI, Trade Balance, Industrial Production",
    economy: "China 🇨🇳 (Global Supply Chain Impact)",
    frequency: "Monthly",
    source: "https://www.stats.gov.cn/english/",
    sourceLabel: "National Bureau of Statistics of China"
  },
  {
    title: "🛢️ OPEC+ Production Decision & Crude Oil Inventories",
    summary: "OPEC+ production cuts reduce supply, pushing oil prices higher. Production increases or weak compliance lower prices. US EIA Crude Oil Inventories (weekly) provide real-time supply data. Oil price moves impact inflation expectations globally.",
    importance: "🟠 High Impact",
    impact: "WTI & Brent Crude move $2-5 per barrel. USD/CAD reacts inversely (Canada is major oil exporter). Energy stocks and inflation expectations shift.",
    market: "Commodities (WTI, Brent), Forex (USD/CAD, USD/NOK), Energy Stocks",
    indicator: "OPEC+ Output Decision, EIA Crude Oil Inventories, API Weekly Report",
    economy: "Global Energy Markets 🌍",
    frequency: "OPEC: ~6x/year, EIA Inventories: Weekly (Wednesday 10:30 ET)",
    source: "https://www.eia.gov/petroleum/supply/weekly/",
    sourceLabel: "U.S. Energy Information Administration"
  },
  {
    title: "🇺🇸 JOLTS Job Openings",
    summary: "Measures the number of unfilled job positions in the US economy. High openings = tight labor market = Fed stays hawkish. Declining openings signal labor market cooling, supporting rate cut expectations.",
    importance: "🟡 Medium-High Impact",
    impact: "USD pairs move 20-40 pips. This is a Fed-watched indicator; Jerome Powell has specifically cited JOLTS data in press conferences as a key metric.",
    market: "Forex (USD pairs), Gold, US Bonds",
    indicator: "JOLTS Job Openings, Quits Rate, Hires Rate",
    economy: "United States 🇺🇸",
    frequency: "Monthly (released with 2-month lag)",
    source: "https://www.bls.gov/jlt/",
    sourceLabel: "U.S. Bureau of Labor Statistics"
  },
  {
    title: "🇺🇸 PCE Price Index (Fed's Preferred Inflation Gauge)",
    summary: "The Personal Consumption Expenditures Price Index is the Fed's preferred measure of inflation (not CPI). Core PCE excluding food & energy is the key metric. Deviation from the 2% target drives rate expectations.",
    importance: "🔴 Extreme High Impact",
    impact: "USD pairs move 40-80 pips. Gold reacts inversely. This is the single most important inflation indicator for the Federal Reserve's rate decisions.",
    market: "Forex (USD pairs), Gold, US Bonds (2Y, 10Y Yields), Crypto",
    indicator: "PCE Price Index m/m, Core PCE y/y (excl. Food & Energy)",
    economy: "United States 🇺🇸",
    frequency: "Monthly (last Friday of each month)",
    source: "https://www.bea.gov/data/personal-consumption-expenditures-price-index",
    sourceLabel: "U.S. Bureau of Economic Analysis"
  },
  {
    title: "🇺🇸 University of Michigan Consumer Sentiment",
    summary: "Measures consumer confidence and inflation expectations. Rising sentiment supports USD and equities. The 5-year inflation expectations sub-index is closely monitored by the Fed.",
    importance: "🟡 Medium Impact",
    impact: "USD pairs move 15-30 pips. The preliminary reading (mid-month) often has more impact than the final reading.",
    market: "Forex (USD pairs), US Indices, Consumer Stocks",
    indicator: "Consumer Sentiment Index, Current Conditions, 5Y Inflation Expectations",
    economy: "United States 🇺🇸",
    frequency: "Monthly (Preliminary mid-month, Final end of month)",
    source: "http://www.sca.isr.umich.edu/",
    sourceLabel: "University of Michigan"
  }
];

export async function GET() {
  try {
    const now = new Date();
    const dayOfWeek = now.getUTCDay();
    
    // Use the week number as seed for consistent weekly selection
    const startOfYear = new Date(now.getUTCFullYear(), 0, 1);
    const weekNumber = Math.ceil(((now - startOfYear) / 86400000 + startOfYear.getUTCDay() + 1) / 7);
    
    // Deterministic but varied selection based on week number
    // Each week shows a different set of 5-6 high-impact news
    const seed = weekNumber * 7 + now.getUTCFullYear();
    const shuffled = [...WEEKLY_HIGH_IMPACT_NEWS].sort((a, b) => {
      const hashA = (seed * a.title.length * 31) % 1000;
      const hashB = (seed * b.title.length * 31) % 1000;
      return hashA - hashB;
    });
    
    const selectedNews = shuffled.slice(0, 6).map((item, index) => ({
      id: `week-${weekNumber}-${index}`,
      ...item,
      weekLabel: `Week ${weekNumber} of ${now.getUTCFullYear()}`
    }));

    return NextResponse.json({
      success: true,
      weekNumber,
      year: now.getUTCFullYear(),
      news: selectedNews,
      totalAvailable: WEEKLY_HIGH_IMPACT_NEWS.length
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
