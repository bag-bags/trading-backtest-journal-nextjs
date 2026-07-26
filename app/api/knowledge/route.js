import { NextResponse } from "next/server";

const PRO_TRADING_TRICKS_DB = [
  {
    title: "15M Order Block & 5M CHoCH Entry",
    category: "Smart Money Concepts",
    content: "When price reaches a 15-minute Bullish Order Block, wait for a 5-minute Change of Character (CHoCH) before entering. This reduces Stop-Loss distance by 50% and boosts Risk:Reward."
  },
  {
    title: "The 3-Strike Loss Rule",
    category: "Psychology & Risk",
    content: "If you take 3 consecutive losses in a single trading session, close your trading platform for the day. Emotional capital depletes faster than financial capital."
  },
  {
    title: "Asian Range Sweep at London Open",
    category: "Session Liquidity",
    content: "80% of institutional expansion in the London session begins with a fakeout sweep of the Asian High or Asian Low between 07:00 and 08:00 UTC."
  },
  {
    title: "Fair Value Gap 50% Consequence (Consequent Encroachment)",
    category: "Price Action",
    content: "Institutional algorithms treat the exact 50% midpoint of a Fair Value Gap (FVG) as equilibrium. Placing entry orders at 50% FVG maximizes fill precision."
  },
  {
    title: "The Fixed 1% Risk Sizing Formula",
    category: "Money Management",
    content: "Calculate position size strictly as (Account Equity × 0.01) ÷ (Stop Loss Pips × Pip Value). Never adjust lot size based on 'feeling confident'."
  },
  {
    title: "High Impact News Spread Expansion Trap",
    category: "Execution Safety",
    content: "Broker spreads expand 3x-10x during NFP, CPI, and FOMC releases. Avoid placing tight 5-pip Stop-Losses during news windows to avoid artificial stop-outs."
  },
  {
    title: "Breakeven Trailing Rule",
    category: "Risk Control",
    content: "Only move Stop-Loss to Breakeven AFTER price achieves a new structural Break of Structure (BOS) in your trade direction, not just arbitrary profit dollars."
  },
  {
    title: "Equal Highs & Lows Are Retail Stop Loss Traps",
    category: "Liquidity Concepts",
    content: "Double Tops and Double Bottoms are not resistance/support; they are liquidity pools holding thousands of retail stop-loss orders waiting to be swept."
  },
  {
    title: "The 2:1 Reward-to-Risk Minimum Edge",
    category: "Mathematical Advantage",
    content: "Never take trades offering less than a 1:2 R:R. At 1:2 R:R, a 40% win-rate generates net positive portfolio growth over a 50-trade sample size."
  },
  {
    title: "Multi-Timeframe Alignment Triad",
    category: "Market Structure",
    content: "Always align your trade: 4H Trend = Directional Bias, 1H = Structure & Level Selection, 5M/1M = Precision Entry & Risk Definition."
  },
  {
    title: "Post-Trade Journaling Secret",
    category: "Performance Tracking",
    content: "Screenshot your chart BEFORE entry and AFTER exit. Reviewing your chart screenshots every weekend accelerates pattern recognition 5x faster."
  },
  {
    title: "Avoid Over-Trading During Lunch Hours",
    category: "Session Timing",
    content: "The 11:30 - 13:00 UTC window (NY Lunch / London Break) suffers from low volume and erratic chop. Save your capital for the NY Overlap."
  }
];

export async function GET() {
  try {
    // Generate pseudo-random or timestamp-based 3 fresh tricks on every request
    const timestamp = Date.now();
    const shuffled = [...PRO_TRADING_TRICKS_DB].sort(() => 0.5 - Math.random());
    const selectedThree = shuffled.slice(0, 3).map((item, index) => ({
      id: `${timestamp}-${index}`,
      ...item,
      fetchedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    }));

    return NextResponse.json({
      success: true,
      timestamp,
      tricks: selectedThree
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
