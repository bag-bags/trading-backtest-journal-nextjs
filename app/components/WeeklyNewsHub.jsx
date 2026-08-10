"use client";

import { useEffect, useState } from "react";

const UI_TR = {
  en: {
    title: "Investing.com Economic Calendar",
    subtitle: "Daily macroeconomic events & Gold sentiment bias",
    time: "Time",
    currency: "Cur.",
    importance: "Imp.",
    event: "Event",
    actual: "Actual",
    forecast: "Forecast",
    previous: "Previous",
    status: "Status",
    completed: "Released",
    upcoming: "Scheduled",
    noNewsTitle: "No Economic Events",
    noNewsMessage: "No high-impact economic news scheduled for today. Gold market bias is carried over from",
    refresh: "Refresh Calendar",
    goldBiasTitle: "Gold Market Sentiment Bias",
    goldBiasSubtitle: "Calculated based on selected day's macroeconomic events",
    sentimentMeter: "Sentiment Meter",
    keyDrivers: "Key Macro Drivers",
    explanationLabel: "Explanation",
    biasBullish: "Bullish",
    biasBearish: "Bearish",
    biasNeutral: "Neutral",
    biasStrong: "Strong",
    biasModerate: "Moderate",
    biasBalanced: "Balanced",
    biasMild: "Mild"
  },
  fr: {
    title: "Calendrier Économique Investing.com",
    subtitle: "Événements macroéconomiques quotidiens & biais de l'Or",
    time: "Heure",
    currency: "Dev.",
    importance: "Imp.",
    event: "Événement",
    actual: "Actuel",
    forecast: "Prévision",
    previous: "Précédent",
    status: "Statut",
    completed: "Publié",
    upcoming: "Planifié",
    noNewsTitle: "Aucun Événement Économique",
    noNewsMessage: "Aucun indicateur économique majeur prévu aujourd'hui. Le biais de l'Or est reporté de",
    refresh: "Actualiser le Calendrier",
    goldBiasTitle: "Biais de Sentiment de l'Or",
    goldBiasSubtitle: "Calculé à partir des événements macroéconomiques du jour sélectionné",
    sentimentMeter: "Jauge de Sentiment",
    keyDrivers: "Moteurs Macro Clés",
    explanationLabel: "Explication",
    biasBullish: "Haussier",
    biasBearish: "Baissier",
    biasNeutral: "Neutre",
    biasStrong: "Fort",
    biasModerate: "Modéré",
    biasBalanced: "Équilibré",
    biasMild: "Léger"
  },
  ar: {
    title: "المفكرة الاقتصادية Investing.com",
    subtitle: "الأحداث الاقتصادية اليومية وانحياز معنويات الذهب",
    time: "الوقت",
    currency: "العملة",
    importance: "الأهمية",
    event: "الحدث",
    actual: "الحالي",
    forecast: "التقديري",
    previous: "السابق",
    status: "الحالة",
    completed: "تم النشر",
    upcoming: "مجدول",
    noNewsTitle: "لا توجد أحداث اقتصادية",
    noNewsMessage: "لا توجد أخبار اقتصادية هامة مقررة اليوم. تم ترحيل انحياز سوق الذهب من يوم",
    refresh: "تحديث المفكرة",
    goldBiasTitle: "انحياز معنويات سوق الذهب",
    goldBiasSubtitle: "محسوب بناءً على الأحداث الاقتصادية لليوم المحدد",
    sentimentMeter: "مقياس المعنويات",
    keyDrivers: "المحركات الماكرو الرئيسية",
    explanationLabel: "التفسير",
    biasBullish: "صعودي",
    biasBearish: "هبوطي",
    biasNeutral: "حيادي",
    biasStrong: "قوي",
    biasModerate: "معتدل",
    biasBalanced: "متوازن",
    biasMild: "خفيف"
  }
};

const DAYS_TR = {
  en: { Monday: "Monday", Tuesday: "Tuesday", Wednesday: "Wednesday", Thursday: "Thursday", Friday: "Friday", Saturday: "Saturday", Sunday: "Sunday" },
  fr: { Monday: "Lundi", Tuesday: "Mardi", Wednesday: "Mercredi", Thursday: "Jeudi", Friday: "Vendredi", Saturday: "Samedi", Sunday: "Dimanche" },
  ar: { Monday: "الاثنين", Tuesday: "الثلاثاء", Wednesday: "الأربعاء", Thursday: "الخميس", Friday: "الجمعة", Saturday: "السبت", Sunday: "الأحد" }
};

const EVENT_TRANSLATIONS = {
  fr: {
    "German CPI (YoY) (Prelim)": "IPC Allemand (AoA) (Préliminaire)",
    "Manufacturing PMI": "PMI Manufacturier",
    "Empire State Manufacturing Index": "Indice manufacturier d'Empire State",
    "German ZEW Economic Sentiment": "Sentiment économique allemand ZEW",
    "Core Retail Sales (MoM)": "Ventes au détail de base (MoM)",
    "Retail Sales (MoM)": "Ventes au détail (MoM)",
    "Existing Home Sales": "Ventes de logements existants",
    "CPI (YoY)": "IPC (AoA)",
    "Core PPI (MoM)": "IPP de base (MoM)",
    "Crude Oil Inventories": "Stocks de pétrole brut",
    "FOMC Meeting Minutes": "Minutes de la réunion de la FOMC",
    "German Manufacturing PMI": "PMI manufacturier allemand",
    "Initial Jobless Claims": "Inscriptions hebdomadaires au chômage",
    "Philadelphia Fed Manufacturing Index": "Indice manufacturier de la Fed de Philadelphie",
    "Core PCE Price Index (MoM)": "Indice des prix PCE de base (MoM)",
    "Revised UoM Consumer Sentiment": "Sentiment révisé des consommateurs UoM"
  },
  ar: {
    "German CPI (YoY) (Prelim)": "مؤشر أسعار المستهلكين الألماني (سنوي) (تقديري)",
    "Manufacturing PMI": "مؤشر مديري المشتريات الصناعي",
    "Empire State Manufacturing Index": "مؤشر إمباير ستيت للصناعة",
    "German ZEW Economic Sentiment": "مؤشر ZEW لمعنويات الاقتصاد الألماني",
    "Core Retail Sales (MoM)": "مبيعات التجزئة الأساسية (شهري)",
    "Retail Sales (MoM)": "مبيعات التجزئة (شهري)",
    "Existing Home Sales": "مبيعات المنازل القائمة",
    "CPI (YoY)": "مؤشر أسعار المستهلكين (سنوي)",
    "Core PPI (MoM)": "مؤشر أسعار المنتجين الأساسي (شهري)",
    "Crude Oil Inventories": "مخزونات النفط الخام",
    "FOMC Meeting Minutes": "محضر اجتماع اللجنة الفيدرالية للسوق المفتوحة",
    "German Manufacturing PMI": "مؤشر مديري المشتريات الصناعي الألماني",
    "Initial Jobless Claims": "معدلات شكاوى البطالة الأولية",
    "Philadelphia Fed Manufacturing Index": "مؤشر فيلادلفيا للصناعات التحويلية",
    "Core PCE Price Index (MoM)": "مؤشر أسعار نفقات الاستهلاك الشخصي الأساسي (شهري)",
    "Revised UoM Consumer Sentiment": "مؤشر ثقة المستهلك لجامعة ميشيغان المعدل"
  }
};

const getGoldBiasData = (newsItems, lang) => {
  let bullishFactor = 0;
  let bearishFactor = 0;
  let totalImpactScore = 0;

  newsItems.forEach(item => {
    const title = (item.event || "").toLowerCase();
    let weight = 1;
    if ((item.importance || "").includes("High") || (item.importance || "").includes("🔴")) {
      weight = 3;
    } else if ((item.importance || "").includes("Medium") || (item.importance || "").includes("🟡")) {
      weight = 2;
    }
    totalImpactScore += weight;

    if (title.includes("cpi") || title.includes("pce") || title.includes("inflation")) {
      bullishFactor += weight * 1.3;
    } else if (title.includes("fomc") || title.includes("interest rate") || title.includes("minutes")) {
      bullishFactor += weight * 1.5;
    } else if (title.includes("payroll") || title.includes("nfp") || title.includes("employment")) {
      bullishFactor += weight * 0.8;
      bearishFactor += weight * 0.8;
    } else if (title.includes("jobless") || title.includes("claims")) {
      bullishFactor += weight * 0.7;
      bearishFactor += weight * 0.3;
    } else if (title.includes("gdp") || title.includes("pmi")) {
      bullishFactor += weight * 0.9;
      bearishFactor += weight * 0.5;
    }
  });

  const savedLanguage = lang || "en";
  const texts = UI_TR[savedLanguage] || UI_TR.en;

  // Compute sentiment percentage score
  let score = 65; // default if no news
  if (totalImpactScore > 0) {
    const total = bullishFactor + bearishFactor;
    if (total > 0) {
      score = Math.round((bullishFactor / total) * 100);
    }
  }
  if (score > 88) score = 88;
  if (score < 32) score = 32;

  // Explanation strings
  const explanations = {
    en: {
      strongBullish: "Strong bullish macro bias for Gold. Dovish indicators and lower inflation expectations indicate a weaker USD path, which historically boosts XAU/USD.",
      moderateBullish: "Moderately bullish bias. Gold benefits from supportive interest rate cut expectations, but short-term volatility remains high.",
      strongBearish: "Strong bearish macro bias. High economic resilience and inflation parameters suggest interest rates may stay higher, putting pressure on Gold.",
      moderateBearish: "Moderately bearish bias. Economic growth and resilient retail sales support USD strength, limiting Gold's upside potential.",
      neutral: "Balanced outlook. Safe-haven factors are currently offset by U.S. economic resilience. Expect range-bound price action."
    },
    fr: {
      strongBullish: "Fort biais haussier sur l'Or. Les indicateurs accommodants et la baisse des attentes d'inflation pèsent sur le dollar, favorisant l'Or.",
      moderateBullish: "Biais modérément haussier. L'Or profite des espoirs de baisse des taux d'intérêt, mais les fluctuations à court terme demeurent intenses.",
      strongBearish: "Fort biais baissier. Une inflation persistante et un emploi vigoureux pourraient contraindre les banques centrales à maintenir des taux élevés, pesant sur l'Or.",
      moderateBearish: "Biais modérément baissier. La force de l'économie américaine et la résilience des ventes soutiennent le dollar, limitant la hausse de l'Or.",
      neutral: "Biais neutre. Les facteurs de soutien sont équilibrés par la robustesse économique générale. Consolidation attendue sur l'XAU/USD."
    },
    ar: {
      strongBullish: "انحياز صعودي قوي للذهب. المؤشرات التيسيرية وتراجع توقعات التضخم تضعف الدولار الأمريكي، مما يدعم الذهب تاريخياً.",
      moderateBullish: "انحياز صعودي معتدل. يستفيد الذهب من توقعات خفض أسعار الفائدة، ولكن التقلبات قصيرة المدى تظل مرتفعة.",
      strongBearish: "انحياز هبوطي قوي. تؤدي مرونة الاقتصاد ومعدلات التضخم إلى بقاء الفائدة مرتفعة، مما يقوي الدولار ويضغط على الذهب.",
      moderateBearish: "انحياز هبوطي معتدل. يدعم النمو الاقتصادي ومبيعات التجزئة قوة الدولار، مما يحد من فرص صعود الذهب.",
      neutral: "توقعات متوازنة. تقابل عوامل الملاذ الآمن الصعودية مرونة الاقتصاد الأمريكي. توقع تحركاً عرضياً للذهب."
    }
  };

  const currentExplanations = explanations[savedLanguage] || explanations.en;
  let biasText = texts.biasNeutral;
  let strengthText = texts.biasMild;
  let explanationText = currentExplanations.neutral;

  if (score >= 70) {
    biasText = texts.biasBullish;
    strengthText = texts.biasStrong;
    explanationText = currentExplanations.strongBullish;
  } else if (score >= 58) {
    biasText = texts.biasBullish;
    strengthText = texts.biasModerate;
    explanationText = currentExplanations.moderateBullish;
  } else if (score <= 40) {
    biasText = texts.biasBearish;
    strengthText = texts.biasStrong;
    explanationText = currentExplanations.strongBearish;
  } else if (score <= 48) {
    biasText = texts.biasBearish;
    strengthText = texts.biasModerate;
    explanationText = currentExplanations.moderateBearish;
  } else {
    biasText = texts.biasNeutral;
    strengthText = texts.biasBalanced;
    explanationText = currentExplanations.neutral;
  }

  // Build drivers list
  const drivers = [];
  let hasCpi = false;
  let hasFomc = false;
  let hasJobs = false;

  newsItems.forEach(item => {
    const eventName = (item.event || "").toLowerCase();
    if ((eventName.includes("cpi") || eventName.includes("pce") || eventName.includes("inflation")) && !hasCpi) {
      hasCpi = true;
      drivers.push({
        name: lang === "ar" ? "توقعات التضخم" : lang === "fr" ? "Inflation" : "Inflation Outlook",
        sentiment: "bullish",
        impact: "Soft inflation boosts Gold"
      });
    }
    if ((eventName.includes("fomc") || eventName.includes("rate") || eventName.includes("minutes")) && !hasFomc) {
      hasFomc = true;
      drivers.push({
        name: lang === "ar" ? "سياسة الفيدرالي" : lang === "fr" ? "Politique de la Fed" : "Fed Policy",
        sentiment: "bullish",
        impact: "Dovish rates reduce holding cost"
      });
    }
    if ((eventName.includes("payroll") || eventName.includes("nfp") || eventName.includes("jobless") || eventName.includes("employment")) && !hasJobs) {
      hasJobs = true;
      drivers.push({
        name: lang === "ar" ? "سوق العمل" : lang === "fr" ? "Emploi" : "Labor Market",
        sentiment: "neutral",
        impact: "Mixed jobs reports produce volatility"
      });
    }
  });

  if (drivers.length === 0) {
    drivers.push({
      name: lang === "ar" ? "طلب الملاذ الآمن" : lang === "fr" ? "Refuge Financier" : "Safe Haven Status",
      sentiment: "bullish",
      impact: "Gold is the ultimate safe-haven"
    });
  }

  return {
    score,
    bias: biasText,
    strength: strengthText,
    explanation: explanationText,
    drivers
  };
};

export default function WeeklyNewsHub({ lang = "en" }) {
  const [calendar, setCalendar] = useState({});
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState("Monday");
  const trans = UI_TR[lang] || UI_TR.en;

  useEffect(() => {
    // Set default day to today
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const todayName = daysOfWeek[new Date().getDay()];
    setSelectedDay(todayName);

    fetchCalendar();
  }, []);

  const fetchCalendar = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-news?t=${Date.now()}`);
      const data = await res.json();
      if (data.calendar) {
        setCalendar(data.calendar);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const getEventName = (eventName) => {
    const table = EVENT_TRANSLATIONS[lang];
    if (table && table[eventName]) {
      return table[eventName];
    }
    return eventName;
  };

  const isEventUpcoming = (timeStr, dayName) => {
    const daysOfWeek = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const now = new Date();
    const currentDayName = daysOfWeek[now.getDay()];

    if (dayName !== currentDayName) {
      const selectedIndex = daysOfWeek.indexOf(dayName);
      const currentIndex = daysOfWeek.indexOf(currentDayName);
      return selectedIndex > currentIndex;
    }

    const [eventHour, eventMinute] = timeStr.split(":").map(Number);
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();

    if (currentHour < eventHour) return true;
    if (currentHour === eventHour && currentMinute < eventMinute) return true;
    return false;
  };

  // Determine current day news and calculate bias
  const newsForSelectedDay = calendar[selectedDay] || [];
  let biasData = null;
  let carryOverFromDay = null;

  if (newsForSelectedDay.length > 0) {
    biasData = getGoldBiasData(newsForSelectedDay, lang);
  } else {
    // Scan backwards to find the last day with news
    const daysOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const currentIdx = daysOrder.indexOf(selectedDay);
    for (let i = currentIdx - 1; i >= 0; i--) {
      const prevDay = daysOrder[i];
      if (calendar[prevDay] && calendar[prevDay].length > 0) {
        biasData = getGoldBiasData(calendar[prevDay], lang);
        carryOverFromDay = prevDay;
        break;
      }
    }
    if (!biasData) {
      // Fallback
      biasData = getGoldBiasData([], lang);
    }
  }

  const daysList = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

  return (
    <div
      style={{
        background: "linear-gradient(135deg, #111113, #050506)",
        border: "1px solid #222225",
        borderRadius: "12px",
        padding: "18px 22px",
        marginBottom: "24px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.4)",
        position: "relative",
        overflow: "hidden"
      }}
    >
      {/* Animated gradient accent line */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "2px",
          background: "linear-gradient(90deg, #f43f5e, #a3e635, #22c55e, #a3e635, #8b5cf6, #f43f5e)",
          backgroundSize: "200% 100%",
          animation: "newsGradientSlide 4s linear infinite"
        }}
      />

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📅</span> {trans.title}
          </h3>
          <p style={{ margin: "4px 0 0", color: "#888893", fontSize: "12px" }}>
            {trans.subtitle}
          </p>
        </div>
        <button
          onClick={fetchCalendar}
          disabled={loading}
          style={{
            background: "#050506",
            border: "1px solid #222225",
            color: "#a3e635",
            padding: "6px 12px",
            borderRadius: "6px",
            fontSize: "12px",
            fontWeight: "700",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            transition: "all 0.2s"
          }}
        >
          <span>🔄</span> {loading ? "..." : trans.refresh}
        </button>
      </div>

      {/* Day Tabs */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          marginBottom: "18px",
          overflowX: "auto",
          paddingBottom: "4px",
          scrollbarWidth: "none"
        }}
      >
        {daysList.map((day) => {
          const isSelected = selectedDay === day;
          const hasEvents = calendar[day] && calendar[day].length > 0;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              style={{
                background: isSelected ? "rgba(163, 230, 53, 0.1)" : "#050506",
                border: isSelected ? "1px solid #a3e635" : "1px solid #222225",
                color: isSelected ? "#a3e635" : "#888893",
                padding: "8px 14px",
                borderRadius: "6px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <span>{DAYS_TR[lang]?.[day] || day}</span>
              {hasEvents && <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#a3e635" }} />}
            </button>
          );
        })}
      </div>

      {/* Gold Bias Section */}
      {!loading && biasData && (
        <div
          style={{
            background: "rgba(250, 204, 21, 0.02)",
            border: "1px solid rgba(250, 204, 21, 0.15)",
            borderRadius: "10px",
            padding: "16px",
            marginBottom: "20px",
            display: "flex",
            flexDirection: "column",
            gap: "14px"
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ fontSize: "20px" }}>✨</span>
            <div>
              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: "800", color: "#facc15" }}>
                {trans.goldBiasTitle} ({DAYS_TR[lang]?.[selectedDay] || selectedDay})
              </h4>
              <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#888893" }}>
                {trans.goldBiasSubtitle}
              </p>
            </div>
          </div>

          {/* Carry-over Banner Notice */}
          {carryOverFromDay && (
            <div
              style={{
                background: "rgba(234, 179, 8, 0.05)",
                border: "1px solid rgba(234, 179, 8, 0.2)",
                borderRadius: "6px",
                padding: "8px 12px",
                fontSize: "11px",
                color: "#facc15",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}
            >
              <span>⚠️</span>
              <span>
                {trans.noNewsMessage} <strong>{DAYS_TR[lang]?.[carryOverFromDay] || carryOverFromDay}</strong>
              </span>
            </div>
          )}

          {/* Grid Layout for Gauge & Explanation */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px", alignItems: "start" }}>
            
            {/* Sentiment Meter (Gauge) */}
            <div style={{ background: "#050506", borderRadius: "8px", padding: "12px", border: "1px solid #222225" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
                <span style={{ fontSize: "11px", fontWeight: "700", color: "#888893" }}>{trans.sentimentMeter}</span>
                <span style={{ fontSize: "12px", fontWeight: "800", color: biasData.score >= 58 ? "#a3e635" : biasData.score <= 48 ? "#f43f5e" : "#888893" }}>
                  {biasData.score}% {biasData.score >= 58 ? trans.biasBullish : biasData.score <= 48 ? trans.biasBearish : trans.biasNeutral}
                </span>
              </div>
              
              {/* Custom Horizontal Sentiment Bar */}
              <div style={{ position: "relative", height: "8px", background: "linear-gradient(90deg, #f43f5e, #eab308, #a3e635)", borderRadius: "4px", margin: "14px 0 8px" }}>
                {/* Pointer / Dial */}
                <div
                  style={{
                    position: "absolute",
                    top: "-4px",
                    left: `${biasData.score}%`,
                    transform: "translateX(-50%)",
                    width: "16px",
                    height: "16px",
                    borderRadius: "50%",
                    background: "#ffffff",
                    border: "3px solid #facc15",
                    boxShadow: "0 0 8px rgba(250, 204, 21, 0.8)",
                    transition: "left 0.5s ease-in-out"
                  }}
                />
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#484f58", fontWeight: "700" }}>
                <span>{trans.biasBearish.toUpperCase()}</span>
                <span>{trans.biasNeutral.toUpperCase()}</span>
                <span>{trans.biasBullish.toUpperCase()}</span>
              </div>
            </div>

            {/* Explanation & Drivers */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "10px", fontWeight: "700", color: "#888893", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                  {trans.explanationLabel} · <strong style={{ color: biasData.score >= 58 ? "#a3e635" : biasData.score <= 48 ? "#f43f5e" : "#facc15" }}>{biasData.strength} {biasData.bias}</strong>
                </span>
                <p style={{ margin: 0, fontSize: "11.5px", color: "#ffffff", lineHeight: "1.5" }}>
                  {biasData.explanation}
                </p>
              </div>

              {/* Mini Drivers List */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <span style={{ fontSize: "9px", fontWeight: "700", color: "#888893", textTransform: "uppercase" }}>{trans.keyDrivers}</span>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                  {biasData.drivers.map((d, index) => (
                    <div
                      key={index}
                      style={{
                        background: "#111113",
                        border: "1px solid #222225",
                        borderRadius: "4px",
                        padding: "4px 8px",
                        fontSize: "10.5px",
                        color: "#ffffff",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px"
                      }}
                      title={d.impact}
                    >
                      <span style={{ color: d.sentiment === "bullish" ? "#a3e635" : d.sentiment === "bearish" ? "#f43f5e" : "#eab308" }}>●</span>
                      <strong>{d.name}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Calendar Table (Investing.com Style) */}
      {!loading && (
        <div style={{ overflowX: "auto" }}>
          {newsForSelectedDay.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 0", color: "#888893" }}>
              <span style={{ fontSize: "24px", display: "block", marginBottom: "8px" }}>💤</span>
              <p style={{ margin: 0, fontSize: "13px", fontWeight: "600" }}>{trans.noNewsTitle}</p>
              <p style={{ margin: "4px 0 0", fontSize: "11.5px" }}>{trans.noNewsMessage} {carryOverFromDay ? DAYS_TR[lang]?.[carryOverFromDay] : ""}.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px", textAlign: lang === "ar" ? "right" : "left" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #222225", color: "#888893", fontWeight: "700" }}>
                  <th style={{ padding: "8px 10px" }}>{trans.time}</th>
                  <th style={{ padding: "8px 10px" }}>{trans.currency}</th>
                  <th style={{ padding: "8px 10px", textAlign: "center" }}>{trans.importance}</th>
                  <th style={{ padding: "8px 10px" }}>{trans.event}</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>{trans.actual}</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>{trans.forecast}</th>
                  <th style={{ padding: "8px 10px", textAlign: "right" }}>{trans.previous}</th>
                  <th style={{ padding: "8px 10px", textAlign: "center" }}>{trans.status}</th>
                </tr>
              </thead>
              <tbody>
                {newsForSelectedDay.map((item) => {
                  const upcoming = isEventUpcoming(item.time, selectedDay);
                  const isHigh = item.importance.includes("High") || item.importance.includes("🔴");
                  const isMed = item.importance.includes("Medium") || item.importance.includes("🟡");
                  
                  return (
                    <tr
                      key={item.id}
                      style={{
                        borderBottom: "1px solid #111113",
                        transition: "background 0.2s",
                        background: upcoming ? "rgba(255, 255, 255, 0.01)" : "transparent"
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = "rgba(163, 230, 53, 0.02)"}
                      onMouseLeave={(e) => e.currentTarget.style.background = upcoming ? "rgba(255, 255, 255, 0.01)" : "transparent"}
                    >
                      {/* Time */}
                      <td style={{ padding: "10px 10px", color: upcoming ? "#eab308" : "#ffffff", fontWeight: "700" }}>
                        {item.time}
                      </td>
                      
                      {/* Currency */}
                      <td style={{ padding: "10px 10px", fontWeight: "700", color: "#ffffff" }}>
                        <span style={{
                          background: item.currency === "USD" ? "rgba(34, 197, 94, 0.1)" : "rgba(59, 130, 246, 0.1)",
                          color: item.currency === "USD" ? "#22c55e" : "#3b82f6",
                          padding: "2px 6px",
                          borderRadius: "4px",
                          fontSize: "10px"
                        }}>
                          {item.currency}
                        </span>
                      </td>
                      
                      {/* Importance (Bulls / Stars) */}
                      <td style={{ padding: "10px 10px", textAlign: "center", fontSize: "11px" }}>
                        {isHigh ? (
                          <span style={{ color: "#ef4444" }}>⭐⭐⭐</span>
                        ) : isMed ? (
                          <span style={{ color: "#f59e0b" }}>⭐⭐</span>
                        ) : (
                          <span style={{ color: "#9ca3af" }}>⭐</span>
                        )}
                      </td>
                      
                      {/* Event Name */}
                      <td style={{ padding: "10px 10px", color: upcoming ? "#d1d5db" : "#ffffff", fontWeight: "600" }}>
                        {getEventName(item.event)}
                      </td>
                      
                      {/* Actual */}
                      <td style={{ padding: "10px 10px", textAlign: "right", color: upcoming ? "#4b5563" : "#ffffff", fontWeight: "700" }}>
                        {upcoming ? "—" : item.actual}
                      </td>
                      
                      {/* Forecast */}
                      <td style={{ padding: "10px 10px", textAlign: "right", color: "#9ca3af" }}>
                        {item.forecast || "—"}
                      </td>
                      
                      {/* Previous */}
                      <td style={{ padding: "10px 10px", textAlign: "right", color: "#9ca3af" }}>
                        {item.previous || "—"}
                      </td>
                      
                      {/* Status */}
                      <td style={{ padding: "10px 10px", textAlign: "center" }}>
                        {upcoming ? (
                          <span style={{
                            background: "rgba(234, 179, 8, 0.1)",
                            color: "#eab308",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "9.5px",
                            fontWeight: "700",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px"
                          }}>
                            🕒 {trans.upcoming}
                          </span>
                        ) : (
                          <span style={{
                            background: "rgba(34, 197, 94, 0.1)",
                            color: "#22c55e",
                            padding: "2px 8px",
                            borderRadius: "12px",
                            fontSize: "9.5px",
                            fontWeight: "700"
                          }}>
                            ✓ {trans.completed}
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes newsGradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
      `}</style>
    </div>
  );
}
