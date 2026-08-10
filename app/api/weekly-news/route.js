import { NextResponse } from "next/server";

const WEEKLY_CALENDAR = {
  Monday: [
    { id: "mon_1", time: "08:00", currency: "EUR", importance: "🔴 High Impact", event: "German CPI (YoY) (Prelim)", actual: "2.2%", forecast: "2.3%", previous: "2.4%" },
    { id: "mon_2", time: "09:30", currency: "GBP", importance: "🟡 Medium Impact", event: "Manufacturing PMI", actual: "49.8", forecast: "50.1", previous: "49.6" },
    { id: "mon_3", time: "14:30", currency: "USD", importance: "🟡 Medium Impact", event: "Empire State Manufacturing Index", actual: "12.5", forecast: "10.0", previous: "11.1" }
  ],
  Tuesday: [
    { id: "tue_1", time: "10:00", currency: "EUR", importance: "🟡 Medium Impact", event: "German ZEW Economic Sentiment", actual: "19.2", forecast: "20.0", previous: "18.5" },
    { id: "tue_2", time: "13:30", currency: "USD", importance: "🔴 High Impact", event: "Core Retail Sales (MoM)", actual: "0.2%", forecast: "0.1%", previous: "0.3%" },
    { id: "tue_3", time: "13:30", currency: "USD", importance: "🔴 High Impact", event: "Retail Sales (MoM)", actual: "0.4%", forecast: "0.2%", previous: "0.1%" },
    { id: "tue_4", time: "15:00", currency: "USD", importance: "🟡 Medium Impact", event: "Existing Home Sales", actual: "3.85M", forecast: "3.90M", previous: "3.89M" }
  ],
  Wednesday: [
    { id: "wed_1", time: "07:00", currency: "GBP", importance: "🔴 High Impact", event: "CPI (YoY)", actual: "2.0%", forecast: "2.1%", previous: "2.2%" },
    { id: "wed_2", time: "13:30", currency: "USD", importance: "🔴 High Impact", event: "Core PPI (MoM)", actual: "0.2%", forecast: "0.2%", previous: "0.1%" },
    { id: "wed_3", time: "15:30", currency: "USD", importance: "🔴 High Impact", event: "Crude Oil Inventories", actual: "-1.5M", forecast: "-0.8M", previous: "-2.0M" },
    { id: "wed_4", time: "19:00", currency: "USD", importance: "🔴 High Impact", event: "FOMC Meeting Minutes", actual: "", forecast: "", previous: "" }
  ],
  Thursday: [
    { id: "thu_1", time: "08:30", currency: "EUR", importance: "🟡 Medium Impact", event: "German Manufacturing PMI", actual: "43.2", forecast: "43.5", previous: "43.0" },
    { id: "thu_2", time: "13:30", currency: "USD", importance: "🔴 High Impact", event: "Initial Jobless Claims", actual: "222K", forecast: "220K", previous: "218K" },
    { id: "thu_3", time: "13:30", currency: "USD", importance: "🟡 Medium Impact", event: "Philadelphia Fed Manufacturing Index", actual: "8.2", forecast: "10.0", previous: "9.5" }
  ],
  Friday: [
    { id: "fri_1", time: "13:30", currency: "USD", importance: "🔴 High Impact", event: "Core PCE Price Index (MoM)", actual: "0.1%", forecast: "0.2%", previous: "0.2%" },
    { id: "fri_2", time: "15:00", currency: "USD", importance: "🔴 High Impact", event: "Revised UoM Consumer Sentiment", actual: "68.5", forecast: "67.5", previous: "67.0" }
  ],
  Saturday: [],
  Sunday: []
};

export async function GET() {
  try {
    return NextResponse.json({
      success: true,
      calendar: WEEKLY_CALENDAR
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
