"use client";

import { useEffect, useState } from "react";

const KNOW_TR = {
  en: {
    title: "Important Things You Should Know As A Trader",
    subtitle: "Fresh live tips fetched on every refresh · History saved:",
    tips: "tips",
    fetching: "Fetching...",
    getNew: "Get 3 New Tricks",
    viewLive: "View Live Tips",
    archived: "Archived",
    fetchingText: "⏳ Fetching 3 new updated trader tricks from the web...",
    trick: "Trick",
    updatedAt: "Updated at",
    noArchived: "No archived tips yet. Click ☆ to bookmark tips!"
  },
  fr: {
    title: "Choses Importantes à Savoir en tant que Trader",
    subtitle: "Astuces fraîches récupérées à chaque rafraîchissement · Historique enregistré :",
    tips: "astuces",
    fetching: "Chargement...",
    getNew: "Obtenir 3 Nouvelles Astuces",
    viewLive: "Voir les Astuces en Direct",
    archived: "Archivé",
    fetchingText: "⏳ Récupération de 3 nouvelles astuces de trader sur le web...",
    trick: "Astuce",
    updatedAt: "Mis à jour à",
    noArchived: "Aucune astuce archivée pour le moment. Cliquez sur ☆ pour mettre en favoris !"
  },
  ar: {
    title: "أشياء مهمة يجب أن تعرفها كمتداول",
    subtitle: "نصائح حية جديدة يتم جلبها عند كل تحديث · السجل المحفوظ:",
    tips: "نصائح",
    fetching: "جاري الجلب...",
    getNew: "احصل على 3 نصائح جديدة",
    viewLive: "عرض النصائح الحية",
    archived: "المؤرشفة",
    fetchingText: "⏳ جاري جلب 3 نصائح متداول جديدة من الويب...",
    trick: "نصيحة",
    updatedAt: "تم التحديث في",
    noArchived: "لا توجد نصائح مؤرشفة بعد. انقر على ☆ لحفظ النصائح!"
  }
};

const TRICK_TRANSLATIONS = {
  ar: {
    "15M Order Block & 5M CHoCH Entry": {
      title: "منطقة طلب 15 دقيقة ودخول بعد تغير الاتجاه 5 دقائق",
      content: "عندما يصل السعر إلى منطقة طلب شرائية على إطار 15 دقيقة، انتظر تغير الاتجاه (CHoCH) على إطار 5 دقائق قبل الدخول. هذا يقلل من مسافة وقف الخسارة بنسبة 50% ويزيد العائد مقابل المخاطرة."
    },
    "The 3-Strike Loss Rule": {
      title: "قاعدة الخسارات الثلاث المتتالية",
      content: "إذا تعرضت لـ 3 خسائر متتالية في جلسة تداول واحدة، أغلق منصة التداول الخاصة بك لليوم. ينفد رأس المال العاطفي بشكل أسرع من رأس المال المالي."
    },
    "Asian Range Sweep at London Open": {
      title: "اختراق النطاق الآسيوي عند افتتاح لندن",
      content: "80% من التوسعات المؤسساتية في جلسة لندن تبدأ باختراق وهمي للقمة أو القاع الآسيوي بين الساعة 07:00 و08:00 بتوقيت UTC."
    },
    "Fair Value Gap 50% Consequence (Consequent Encroachment)": {
      title: "منتصف فجوة القيمة العادلة 50%",
      content: "تتعامل خوارزميات المؤسسات مع نقطة المنتصف 50% لفجوة القيمة العادلة (FVG) كمنطقة توازن. وضع أوامر الدخول عند 50% يزيد من دقة التفعيل."
    },
    "The Fixed 1% Risk Sizing Formula": {
      title: "صيغة المخاطرة الثابتة بنسبة 1%",
      content: "احسب حجم الصفقة بدقة كـ (رأس مال الحساب × 0.01) ÷ (نقاط وقف الخسارة × قيمة النقطة). لا تقم أبداً بتعديل حجم الصفقة بناءً على 'الشعور بالثقة'."
    },
    "High Impact News Spread Expansion Trap": {
      title: "فخ اتساع الفارق السعري أثناء الأخبار القوية",
      content: "يتسع الفارق السعري لدى الوسطاء بمقدار 3 إلى 10 أضعاف أثناء صدور أخبار الوظائف والتضخم والفائدة. تجنب وضع وقف خسارة ضيق مثل 5 نقاط لتفادي الإغلاق العشوائي."
    },
    "Breakeven Trailing Rule": {
      title: "قاعدة نقل وقف الخسارة لنقطة الدخول",
      content: "قم بنقل وقف الخسارة إلى نقطة الدخول فقط بعد أن يحقق السعر كسراً هيكلياً جديداً (BOS) في اتجاه صفقتك، وليس لمجرد تحقيق ربح عشوائي."
    },
    "Equal Highs & Lows Are Retail Stop Loss Traps": {
      title: "القمم والقيعان المتساوية هي مصائد سيولة",
      content: "القمم المزدوجة والقيعان المزدوجة ليست دعماً أو مقاومة؛ بل هي برك سيولة تحتجز آلاف أوامر وقف الخسارة للمتجزئين بانتظار سحبها."
    },
    "The 2:1 Reward-to-Risk Minimum Edge": {
      title: "الحد الأدنى للميزة 2:1 عائد مقابل المخاطرة",
      content: "لا تدخل أبداً صفقات تقل عن 1:2 عائد مقابل المخاطرة. مع نسبة نجاح 40%، يحقق هذا المعدل نمواً إيجابياً صافياً للمحفظة على عينة من 50 صفقة."
    },
    "Multi-Timeframe Alignment Triad": {
      title: "ثلاثية التوافق متعدد الأطر الزمنية",
      content: "قم دائماً بمحاذاة صفقتك: اتجاه 4 ساعات = الانحياز العام، 1 ساعة = تحديد الهيكل والمستوى، 5 دقائق/1 دقيقة = الدقة في الدخول وتحديد المخاطر."
    },
    "Post-Trade Journaling Secret": {
      title: "سر تدوين الصفقات بعد الانتهاء",
      content: "خذ لقطة شاشة للرسم البياني قبل الدخول وبعد الخروج. مراجعة لقطات الشاشة في كل عطلة نهاية أسبوع يسرع التعرف على الأنماط بمعدل 5 مرات أسرع."
    },
    "Avoid Over-Trading During Lunch Hours": {
      title: "تجنب التداول المفرط أثناء ساعات الغداء",
      content: "تعاني الفترة بين 11:30 و13:00 بتوقيت UTC (فترة الغداء في نيويورك / استراحة لندن) من ضعف السيولة والتذبذب العشوائي. حافظ على رأس مالك لتداخل نيويورك."
    }
  },
  fr: {
    "15M Order Block & 5M CHoCH Entry": {
      title: "Order Block 15M & Entrée CHoCH 5M",
      content: "Lorsque le prix atteint un Order Block haussier de 15 minutes, attendez un changement de caractère (CHoCH) de 5 minutes avant d'entrer. Cela réduit le Stop-Loss de 50% et augmente le Risk:Reward."
    },
    "The 3-Strike Loss Rule": {
      title: "La Règle des 3 Pertes Consécutives",
      content: "Si vous subissez 3 pertes consécutives au cours d'une seule session, fermez votre plateforme pour la journée. Le capital émotionnel s'épuise plus vite que le capital financier."
    },
    "Asian Range Sweep at London Open": {
      title: "Balayage du Range Asiatique à l'Ouverture de Londres",
      content: "80% de l'expansion institutionnelle de la session de Londres commence par un faux balayage du plus haut ou du plus bas asiatique entre 07h00 et 08h00 UTC."
    },
    "Fair Value Gap 50% Consequence (Consequent Encroachment)": {
      title: "Conséquence 50% du Fair Value Gap",
      content: "Les algorithmes institutionnels traitent le milieu exact (50%) d'un Fair Value Gap (FVG) comme équilibre. Placer les ordres d'entrée à 50% FVG maximise la précision."
    },
    "The Fixed 1% Risk Sizing Formula": {
      title: "Formule de Risque Fixe à 1%",
      content: "Calculez la taille de position comme suit: (Capital × 0,01) ÷ (Stop Loss Pips × Valeur Pip). N'ajustez jamais la taille du lot en fonction de la 'confiance'."
    },
    "High Impact News Spread Expansion Trap": {
      title: "Piège de l'Élargissement du Spread lors des News",
      content: "Les spreads des courtiers augmentent de 3x à 10x pendant les annonces NFP, CPI et FOMC. Évitez les Stop-Loss serrés de 5 pips pendant ces périodes."
    },
    "Breakeven Trailing Rule": {
      title: "Règle de Passage au Breakeven",
      content: "Ne déplacez votre Stop-Loss au Breakeven qu'APRÈS un nouveau Break of Structure (BOS) dans le sens de votre transaction, et non sur un gain arbitraire."
    },
    "Equal Highs & Lows Are Retail Stop Loss Traps": {
      title: "Double Sommet / Bas: Pièges à Stop-Loss",
      content: "Les Double Tops et Double Bottoms ne sont pas des résistances/supports; ce sont des pools de liquidité contenant des milliers de stop-losses de particuliers."
    },
    "The 2:1 Reward-to-Risk Minimum Edge": {
      title: "Ratio Minimum de 2:1",
      content: "Ne prenez jamais de transactions offrant moins de 1:2 R:R. À ce ratio, un taux de réussite de 40% génère une croissance positive sur un échantillon de 50 trades."
    },
    "Multi-Timeframe Alignment Triad": {
      title: "Triade d'Alignement Multi-Unités de Temps",
      content: "Alignez toujours votre trade: Tendance 4H = Biais directionnel, 1H = Structure & Sélection de niveau, 5M/1M = Entrée de précision."
    },
    "Post-Trade Journaling Secret": {
      title: "Le Secret du Journal de Trading",
      content: "Prenez une capture d'écran avant l'entrée et après la sortie. Analyser ces captures chaque week-end accélère la reconnaissance des patterns 5x plus vite."
    },
    "Avoid Over-Trading During Lunch Hours": {
      title: "Éviter le Sur-Trading pendant la Pause Déjeuner",
      content: "La période de 11h30 à 13h00 UTC (Déjeuner NY / Pause Londres) souffre d'un faible volume. Économisez votre capital pour l'Overlap de New York."
    }
  }
};

export default function KnowledgeHub({ lang = "en" }) {
  const [currentTips, setCurrentTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [archivedTips, setArchivedTips] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [historyCount, setHistoryCount] = useState(0);

  const trans = KNOW_TR[lang] || KNOW_TR.en;

  const getTipTranslation = (tip) => {
    const table = TRICK_TRANSLATIONS[lang];
    if (table && table[tip.title]) {
      return {
        title: table[tip.title].title,
        content: table[tip.title].content,
        category: getCategory(tip.category)
      };
    }
    return {
      title: tip.title,
      content: tip.content,
      category: getCategory(tip.category)
    };
  };

  const getCategory = (cat) => {
    if (!cat) return "";
    if (lang === "ar") {
      if (cat.toUpperCase() === "RISK CONTROL") return "إدارة المخاطر";
      if (cat.toUpperCase() === "PRICE ACTION") return "حركة السعر";
      if (cat.toUpperCase() === "SESSION TIMING") return "توقيت الجلسة";
      if (cat.toUpperCase() === "SMART MONEY CONCEPTS") return "مفاهيم المال الذكي";
      if (cat.toUpperCase() === "PSYCHOLOGY & RISK") return "علم النفس والمخاطر";
      if (cat.toUpperCase() === "SESSION LIQUIDITY") return "سيولة الجلسات";
      if (cat.toUpperCase() === "MONEY MANAGEMENT") return "إدارة الأموال";
      if (cat.toUpperCase() === "EXECUTION SAFETY") return "سلامة التنفيذ";
      if (cat.toUpperCase() === "LIQUIDITY CONCEPTS") return "مفاهيم السيولة";
      if (cat.toUpperCase() === "MATHEMATICAL ADVANTAGE") return "الميزة الرياضية";
      if (cat.toUpperCase() === "MARKET STRUCTURE") return "هيكل السوق";
      if (cat.toUpperCase() === "PERFORMANCE TRACKING") return "متابعة الأداء";
    }
    if (lang === "fr") {
      if (cat.toUpperCase() === "RISK CONTROL") return "Contrôle des Risques";
      if (cat.toUpperCase() === "PRICE ACTION") return "Price Action";
      if (cat.toUpperCase() === "SESSION TIMING") return "Timing des Sessions";
      if (cat.toUpperCase() === "SMART MONEY CONCEPTS") return "Smart Money Concepts";
      if (cat.toUpperCase() === "PSYCHOLOGY & RISK") return "Psychologie & Risques";
      if (cat.toUpperCase() === "SESSION LIQUIDITY") return "Liquidité des Sessions";
      if (cat.toUpperCase() === "MONEY MANAGEMENT") return "Gestion de l'Argent";
      if (cat.toUpperCase() === "EXECUTION SAFETY") return "Sécurité d'Exécution";
      if (cat.toUpperCase() === "LIQUIDITY CONCEPTS") return "Concepts de Liquidité";
      if (cat.toUpperCase() === "MATHEMATICAL ADVANTAGE") return "Avantage Mathématique";
      if (cat.toUpperCase() === "MARKET STRUCTURE") return "Structure du Marché";
      if (cat.toUpperCase() === "PERFORMANCE TRACKING") return "Suivi de Performance";
    }
    return cat;
  };

  const fetchFreshTips = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/knowledge?t=${Date.now()}`);
      const data = await res.json();
      if (data.tricks && data.tricks.length > 0) {
        const fetchedThree = data.tricks;
        setCurrentTips(fetchedThree);

        // Update localStorage history so no past tip is lost
        const savedHistory = JSON.parse(localStorage.getItem("knowledge_history") || "[]");
        const map = new Map(savedHistory.map((item) => [item.title, item]));
        fetchedThree.forEach((item) => map.set(item.title, item));

        const updatedHistory = Array.from(map.values());
        localStorage.setItem("knowledge_history", JSON.stringify(updatedHistory));
        setHistoryCount(updatedHistory.length);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Load archived tips from localStorage
    const savedArchived = JSON.parse(localStorage.getItem("archived_knowledge") || "[]");
    setArchivedTips(savedArchived);

    // Fetch 3 fresh tips from web/API on page refresh
    fetchFreshTips();
  }, []);

  const toggleArchive = (tip) => {
    let updated;
    const isArchived = archivedTips.some((item) => item.title === tip.title);
    if (isArchived) {
      updated = archivedTips.filter((item) => item.title !== tip.title);
    } else {
      updated = [...archivedTips, tip];
    }
    setArchivedTips(updated);
    localStorage.setItem("archived_knowledge", JSON.stringify(updated));
  };

  return (
    <div style={{ background: "linear-gradient(135deg, #111113, #050506)", border: "1px solid #222225", borderRadius: "12px", padding: "18px 22px", marginBottom: "24px", boxShadow: "0 10px 30px rgba(0,0,0,0.4)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>💡</span> {trans.title}
          </h3>
          <p style={{ margin: "4px 0 0", color: "#888893", fontSize: "12px" }}>
            {trans.subtitle} <strong>{historyCount} {trans.tips}</strong>
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={fetchFreshTips}
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
              gap: "4px"
            }}
          >
            <span>🔄</span> {loading ? trans.fetching : trans.getNew}
          </button>
          <button
            onClick={() => setShowArchived(!showArchived)}
            style={{
              background: showArchived ? "#a3e635" : "#050506",
              border: "1px solid #222225",
              color: showArchived ? "#000000" : "#ffffff",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <span>⭐</span> {showArchived ? trans.viewLive : `${trans.archived} (${archivedTips.length})`}
          </button>
        </div>
      </div>

      {loading && currentTips.length === 0 && <p style={{ color: "#a3e635", fontSize: "13px", margin: 0 }}>{trans.fetchingText}</p>}

      {!showArchived ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "14px" }}>
          {currentTips.map((tip, idx) => {
            const isBookmarked = archivedTips.some((item) => item.title === tip.title);
            const localized = getTipTranslation(tip);
            return (
              <div key={tip.id || idx} style={{ background: "#111113", border: "1px solid #222225", borderRadius: "10px", padding: "14px 16px", display: "flex", flexDirection: "column", justifyContent: "space-between", gap: "10px" }}>
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                    <span style={{ fontSize: "10px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px", background: "rgba(163,230,53,0.15)", color: "#a3e635", textTransform: "uppercase" }}>
                      {trans.trick} #{idx + 1} · {localized.category}
                    </span>
                    <button onClick={() => toggleArchive(tip)} style={{ background: "transparent", border: "none", color: isBookmarked ? "#fbbf24" : "#484f58", fontSize: "16px", cursor: "pointer" }} title={isBookmarked ? "Remove Bookmark" : "Bookmark / Archive Tip"}>
                      {isBookmarked ? "★" : "☆"}
                    </button>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>{localized.title}</h4>
                  <p style={{ margin: 0, color: "#888893", fontSize: "12px", lineHeight: "1.5" }}>{localized.content}</p>
                </div>
                {tip.fetchedAt && <span style={{ color: "#888893", fontSize: "10px" }}>✨ {trans.updatedAt} {tip.fetchedAt}</span>}
              </div>
            );
          })}
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {archivedTips.length === 0 && <p style={{ color: "#888893", fontSize: "12px", margin: 0 }}>{trans.noArchived}</p>}
          {archivedTips.map((tip, idx) => {
            const localized = getTipTranslation(tip);
            return (
              <div key={idx} style={{ background: "#111113", border: "1px solid #222225", borderRadius: "8px", padding: "12px 14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <span style={{ fontSize: "10px", fontWeight: "800", color: "#a3e635", textTransform: "uppercase" }}>{localized.category}</span>
                  <h4 style={{ margin: "2px 0 4px", fontSize: "13px", fontWeight: "700", color: "#ffffff" }}>{localized.title}</h4>
                  <p style={{ margin: 0, color: "#888893", fontSize: "12px" }}>{localized.content}</p>
                </div>
                <button onClick={() => toggleArchive(tip)} style={{ background: "transparent", border: "none", color: "#fbbf24", fontSize: "18px", cursor: "pointer", marginLeft: "12px" }}>
                  ★
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
