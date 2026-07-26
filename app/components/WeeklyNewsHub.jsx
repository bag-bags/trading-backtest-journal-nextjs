"use client";

import { useEffect, useState } from "react";

// Impact color mapping
const impactColors = {
  "🔴 Extreme High Impact": { bg: "#f43f5e18", border: "#f43f5e44", text: "#f43f5e", glow: "0 0 20px #f43f5e22" },
  "🔴 High Impact": { bg: "#f9731618", border: "#f9731644", text: "#f97316", glow: "0 0 20px #f9731622" },
  "🟠 High Impact": { bg: "#f59e0b18", border: "#f59e0b44", text: "#f59e0b", glow: "0 0 20px #f59e0b22" },
  "🟡 Medium-High Impact": { bg: "#eab30818", border: "#eab30844", text: "#eab308", glow: "0 0 15px #eab30818" },
  "🟡 Medium Impact": { bg: "#a3e63518", border: "#a3e63544", text: "#a3e635", glow: "0 0 15px #a3e63518" },
};

function getImpactStyle(importance) {
  return impactColors[importance] || impactColors["🟡 Medium Impact"];
}

const NEWS_TR = {
  en: {
    title: "Most Important News This Week For Traders",
    subtitle: "High-impact economic events & indicators ·",
    events: "key events",
    refresh: "Refresh News",
    loadingText: "Loading...",
    fetchingText: "⏳ Fetching this week's most important economic news & events...",
    marketImpact: "💥 Market Impact",
    indicator: "📊 Indicator",
    economy: "🌍 Economy",
    marketsAffected: "💹 Markets Affected",
    frequency: "⏰ Frequency",
    sourceLink: "Source ↗",
    week: "Week",
    of: "of"
  },
  fr: {
    title: "Nouvelles les Plus Importantes de la Semaine",
    subtitle: "Événements économiques et indicateurs à fort impact ·",
    events: "événements clés",
    refresh: "Actualiser les Actualités",
    loadingText: "Chargement...",
    fetchingText: "⏳ Récupération des actualités économiques les plus importantes de la semaine...",
    marketImpact: "💥 Impact sur le Marché",
    indicator: "📊 Indicateur",
    economy: "🌍 Économie",
    marketsAffected: "💹 Marchés Affectés",
    frequency: "⏰ Fréquence",
    sourceLink: "Source ↗",
    week: "Semaine",
    of: "de"
  },
  ar: {
    title: "أهم الأخبار الاقتصادية هذا الأسبوع للمتداولين",
    subtitle: "الأحداث والمؤشرات الاقتصادية ذات الأثر القوي ·",
    events: "أحداث رئيسية",
    refresh: "تحديث الأخبار",
    loadingText: "جاري التحميل...",
    fetchingText: "⏳ جاري جلب الأخبار والأحداث الاقتصادية الأكثر أهمية لهذا الأسبوع...",
    marketImpact: "💥 التأثير على السوق",
    indicator: "📊 المؤشر",
    economy: "🌍 الاقتصاد",
    marketsAffected: "💹 الأسواق المتأثرة",
    frequency: "⏰ التكرار",
    sourceLink: "المصدر ↗",
    week: "الأسبوع",
    of: "من"
  }
};

const NEWS_ITEM_TRANSLATIONS = {
  ar: {
    "🇺🇸 U.S. Non-Farm Payrolls (NFP)": {
      title: "🇺🇸 تقرير الوظائف غير الزراعية الأمريكي (NFP)",
      summary: "يقيس تقرير NFP التغير في عدد الموظفين في الولايات المتحدة باستثناء العاملين في القطاع الزراعي. تشير القراءة القوية إلى قوة الاقتصاد، مما يعزز الدولار الأمريكي ويضغط على الذهب. وتشير القراءة الضعيفة إلى إمكانية خفض الفائدة.",
      impact: "تقلبات هائلة على أزواج الدولار (EUR/USD, GBP/USD, XAU/USD). ينخفض الذهب عادة مع تقرير قوي ويرتفع مع تقرير ضعيف. توقع تحركات بين 50-200 نقطة خلال دقائق.",
      market: "العملات (أزواج الدولار)، الذهب (XAU/USD)، المؤشرات الأمريكية (S&P 500، ناسداك)",
      indicator: "التغير في التوظيف غير الزراعي",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "شهرياً (أول جمعة من كل شهر)"
    },
    "🇺🇸 Consumer Price Index (CPI) — Inflation Report": {
      title: "🇺🇸 مؤشر أسعار المستهلكين (CPI) - تقرير التضخم",
      summary: "يقيس التغير في أسعار السلع والخدمات التي يشتريها المستهلكون. ارتفاع المؤشر = ارتفاع التضخم = احتمال إبقاء الفائدة مرتفعة. انخفاض المؤشر = تراجع التضخم = خفض الفائدة قريباً.",
      impact: "تحركات بين 80-150 نقطة على أزواج اليورو والدولار والذهب. ترتفع أسواق الذهب مع انخفاض التضخم وتتراجع مع ارتفاعه.",
      market: "العملات (أزواج الدولار)، الذهب (XAU/USD)، السندات الأمريكية، البيتكوين (BTC)",
      indicator: "مؤشر أسعار المستهلكين السنوي والشهري",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "شهرياً (بين 10 و 14 من كل شهر)"
    },
    "🇺🇸 Federal Reserve Interest Rate Decision (FOMC)": {
      title: "🇺🇸 قرار سعر الفائدة من الفيدرالي الأمريكي (FOMC)",
      summary: "تحدد اللجنة الفيدرالية للسوق المفتوحة سعر الفائدة. رفع الفائدة يقوي الدولار ويضغط على الذهب والأسهم. خفض الفائدة يضعف الدولار ويعزز الذهب والأسهم والعملات الرقمية.",
      impact: "تقلبات شديدة للغاية في جميع أسواق العملات، الذهب، والعملات الرقمية. المؤتمر الصحفي بعد القرار بـ 30 دقيقة يسبب موجة تحركات ضخمة.",
      market: "جميع أزواج العملات، الذهب، الفضة، المؤشرات الأمريكية، السندات، العملات الرقمية",
      indicator: "سعر الفائدة الفيدرالية، بيان اللجنة، التوقعات الاقتصادية",
      economy: "الولايات المتحدة الأمريكية 🇺🇸 (تأثير عالمي)",
      frequency: "8 مرات في السنة (كل 6 أسابيع تقريباً)"
    },
    "🇺🇸 Gross Domestic Product (GDP)": {
      title: "🇺🇸 الناتج المحلي الإجمالي الأمريكي (GDP)",
      summary: "يقيس القيمة الإجمالية للسلع والخدمات المنتجة في الاقتصاد الأمريكي. النمو القوي يدعم الدولار، والنمو الضعيف يثير مخاوف الركود ويعزز الملاذات الآمنة كالذهب والين.",
      impact: "تحركات بين 30-80 نقطة لأزواج الدولار. يرتفع الذهب مع ضعف النمو ويتراجع مع قوته.",
      market: "العملات (أزواج الدولار)، المؤشرات الأمريكية، الذهب",
      indicator: "الناتج المحلي الإجمالي ربع السنوي",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "ربع سنوي (ثلاث قراءات لكل ربع)"
    },
    "🇺🇸 Initial Jobless Claims": {
      title: "🇺🇸 طلبات الإعانة من البطالة لأول مرة",
      summary: "يقيس عدد الأفراد الذين يتقدمون بطلب للحصول على إعانات البطالة للمرة الأولى. زيادة الطلبات = ضعف سوق العمل = سلبي للدولار وإيجابي للذهب.",
      impact: "تقلبات قصيرة الأجل بين 20-50 نقطة لأزواج الدولار. يعتبر مؤشراً أسبوعياً مهماً لصحة سوق العمل.",
      market: "العملات (أزواج الدولار)، الذهب (XAU/USD)",
      indicator: "طلبات إعانة البطالة الأولية والمستمرة",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "أسبوعياً (كل خميس، 12:30 بتوقيت UTC)"
    },
    "🇺🇸 Producer Price Index (PPI)": {
      title: "🇺🇸 مؤشر أسعار المنتجين (PPI)",
      summary: "يقيس التغيرات في الأسعار على مستوى الجملة قبل وصولها للمستهلك. يعتبر مؤشراً أولياً لمعدلات التضخم المستقبلية.",
      impact: "تحرك أزواج الدولار بمقدار 20-60 نقطة. صدوره قبل أو بعد تقرير التضخم (CPI) بيوم يعزز حركة الأسواق.",
      market: "العملات (أزواج الدولار)، الذهب، السندات الأمريكية",
      indicator: "مؤشر أسعار المنتجين الشهري والأساسي",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "شهرياً"
    },
    "🇪🇺 European Central Bank (ECB) Interest Rate Decision": {
      title: "🇪🇺 قرار سعر الفائدة من البنك المركزي الأوروبي",
      summary: "يحدد المركزي الأوروبي سعر الفائدة الرئيسي لمنطقة اليورو. رفع الفائدة يقوي اليورو وخفضها يضعفه. يضيف المؤتمر الصحفي تقلبات ثانوية قوية.",
      impact: "يتحرك زوج EUR/USD بمقدار 60-120 نقطة. تتأثر أزواج اليورو الأخرى والمؤشرات الأوروبية مثل DAX بشدة.",
      market: "العملات (أزواج اليورو)، المؤشرات الأوروبية، السندات الأوروبية",
      indicator: "سعر إعادة العمليات الرئيسي، نسبة الإيداع، المؤتمر الصحفي",
      economy: "منطقة اليورو 🇪🇺",
      frequency: "6-8 مرات في السنة"
    },
    "🇬🇧 Bank of England (BoE) Interest Rate Decision": {
      title: "🇬🇧 قرار سعر الفائدة من بنك إنجلترا",
      summary: "تحدد لجنة السياسة النقدية لبنك إنجلترا سعر الفائدة البريطاني. يؤثر القرار وتوزيع أصوات اللجنة مباشرة على الجنيه الإسترليني.",
      impact: "يتحرك زوج GBP/USD بمقدار 50-100 نقطة. تتأثر أزواج الإسترليني الأخرى ومؤشر FTSE 100.",
      market: "العملات (أزواج الجنيه الإسترليني)، مؤشر FTSE 100، السندات البريطانية",
      indicator: "سعر الفائدة الرئيسي، توزيع أصوات اللجنة",
      economy: "المملكة المتحدة 🇬🇧",
      frequency: "8 مرات في السنة"
    },
    "🇺🇸 ISM Manufacturing & Services PMI": {
      title: "🇺🇸 مؤشر مديري المشتريات الصناعي والخدمي (ISM)",
      summary: "قراءة فوق 50 تعني التوسع الاقتصادي وتحت 50 تعني الانكماش. يمثل مؤشر الخدمات 80% من الاقتصاد الأمريكي وله تأثير أكبر على الأسواق.",
      impact: "تحرك أزواج الدولار بين 30-60 نقطة. تتفاعل أسواق الأسهم مع إشارات النمو والانكماش.",
      market: "العملات (أزواج الدولار)، المؤشرات الأمريكية، السلع",
      indicator: "مؤشر مديري المشتريات الصناعي والخدمي ISM",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "شهرياً (أول وثالث يوم عمل من الشهر)"
    },
    "🇺🇸 Retail Sales": {
      title: "🇺🇸 مبيعات التجزئة الأمريكية",
      summary: "يقيس إجمالي إيرادات محلات التجزئة. يعكس إنفاق المستهلكين الذي يمثل نحو 70% من الاقتصاد الأمريكي. المبيعات القوية تدعم الدولار.",
      impact: "يتحرك الدولار بمقدار 30-70 نقطة. تتفاعل أسواق الأسهم إيجابياً مع قوة بيانات الإنفاق الاستهلاكي.",
      market: "العملات (أزواج الدولار)، المؤشرات الأمريكية، أسهم السلع الاستهلاكية",
      indicator: "مبيعات التجزئة الأساسية والشهرية",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "شهرياً (حوالي 15 من كل شهر)"
    },
    "🇯🇵 Bank of Japan (BoJ) Interest Rate Decision": {
      title: "🇯🇵 قرار سعر الفائدة من بنك اليابان",
      summary: "يحافظ بنك اليابان على سياسة تيسيرية للغاية لكنه بدأ مؤخراً في تعديلها. أي رفع للفائدة أو تغيير في التحكم بمنحنى العائد يسبب تحركات ضخمة للين.",
      impact: "يتحرك زوج USD/JPY بمقدار 100-300 نقطة. يؤثر تفكيك صفقات الكاري تريد على أسواق الأسهم العالمية والذهب.",
      market: "العملات (أزواج الين الياباني)، مؤشر نيكاي 225، الأسهم العالمية",
      indicator: "سعر الفائدة قصيرة الأجل، التحكم بمنحنى العائد",
      economy: "اليابان 🇯🇵 (تأثير كاري تريد عالمي)",
      frequency: "8 مرات في السنة"
    },
    "🇨🇳 China Manufacturing PMI & Trade Balance": {
      title: "🇨🇳 مؤشر مديري المشتريات والميزان التجاري للصين",
      summary: "تعتبر بيانات الميزان التجاري الصيني مؤشراً أولياً للطلب العالمي وأسعار السلع. البيانات القوية تدعم الدولار الأسترالي والنيوزيلندي والسلع.",
      impact: "يتحرك الدولار الأسترالي والنيوزيلندي بمقدار 30-60 نقطة. تتفاعل أسعار النفط والنحاس ومؤشرات آسيا.",
      market: "العملات (AUD, NZD)، السلع (النحاس، النفط)، مؤشرات آسيا",
      indicator: "مؤشر مديري المشتريات التصنيعي Caixin و NBS",
      economy: "الصين 🇨🇳 (تأثير سلسلة التوريد العالمية)",
      frequency: "شهرياً"
    },
    "🛢️ OPEC+ Production Decision & Crude Oil Inventories": {
      title: "🛢️ قرارات أوبك+ ومخزونات النفط الخام الأمريكي",
      summary: "تخفيضات إنتاج أوبك+ تدفع أسعار النفط للارتفاع. توفر مخزونات النفط الأسبوعية (EIA) بيانات العرض الفورية. تؤثر أسعار النفط على توقعات التضخم العالمية.",
      impact: "يتحرك النفط الخام بمقدار 2-5 دولارات للبرميل. يتفاعل الدولار الكندي عكسياً (كندا مصدر رئيسي للنفط).",
      market: "السلع (خام تكساس، خام برنت)، العملات (USD/CAD)، أسهم الطاقة",
      indicator: "قرارات إنتاج أوبك+، مخزونات النفط من إدارة معلومات الطاقة",
      economy: "أسواق الطاقة العالمية 🌍",
      frequency: "أوبك: ~6 مرات/سنة، المخزونات: أسبوعياً (الأربعاء 14:30 بتوقيت UTC)"
    },
    "🇺🇸 JOLTS Job Openings": {
      title: "🇺🇸 فرص العمل المتاحة (JOLTS)",
      summary: "يقيس عدد الوظائف الشاغرة في الاقتصاد الأمريكي. زيادة الوظائف الشاغرة تعني قوة سوق العمل وتدعم الفيدرالي في إبقاء الفائدة مرتفعة.",
      impact: "تحرك أزواج الدولار بين 20-40 نقطة. يعتبر هذا المؤشر من البيانات المفضلة لدى جيروم باول رئيس الفيدرالي.",
      market: "العملات (أزواج الدولار)، الذهب، السندات الأمريكية",
      indicator: "فرص العمل الشاغرة، معدلات التعيين والاستقالة JOLTS",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "شهرياً"
    },
    "🇺🇸 PCE Price Index (Fed's Preferred Inflation Gauge)": {
      title: "🇺🇸 مؤشر أسعار نفقات الاستهلاك الشخصي (PCE)",
      summary: "المقياس المفضل للتضخم لدى الفيدرالي الأمريكي (وليس مؤشر أسعار المستهلكين CPI). الانحراف عن هدف 2% يؤثر بقوة على توقعات الفائدة.",
      impact: "تحرك أزواج الدولار بين 40-80 نقطة. يتفاعل الذهب عكسياً مع التقرير. هو المؤشر الأكثر أهمية لقرارات الفائدة.",
      market: "العملات (أزواج الدولار)، الذهب، السندات الأمريكية، العملات الرقمية",
      indicator: "مؤشر أسعار نفقات الاستهلاك الشخصي الأساسي والسنوي",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "شهرياً (آخر جمعة من كل شهر)"
    },
    "🇺🇸 University of Michigan Consumer Sentiment": {
      title: "🇺🇸 مؤشر ثقة المستهلك لجامعة ميشيغان",
      summary: "يقيس ثقة المستهلك وتوقعات التضخم. ارتفاع المؤشر يدعم الدولار وأسواق الأسهم. يراقب الفيدرالي توقعات التضخم لـ 5 سنوات.",
      impact: "يتحرك الدولار بمقدار 15-30 نقطة. القراءة الأولية في منتصف الشهر لها تأثير أكبر من القراءة النهائية.",
      market: "العملات (أزواج الدولار)، المؤشرات الأمريكية، أسهم التجزئة",
      indicator: "مؤشر ثقة المستهلك وتوقعات التضخم لـ 5 سنوات",
      economy: "الولايات المتحدة الأمريكية 🇺🇸",
      frequency: "شهرياً (قراءة أولية ونهائية)"
    }
  },
  fr: {
    "🇺🇸 U.S. Non-Farm Payrolls (NFP)": {
      title: "🇺🇸 Créations d'Emplois Non-Agricoles (NFP)",
      summary: "Le rapport NFP mesure l'emploi aux États-Unis hors secteur agricole. Un chiffre fort soutient le USD et pèse sur l'Or. Un chiffre faible affaiblit le USD.",
      impact: "Forte volatilité sur les paires USD (EUR/USD, XAU/USD). Mouvements de 50 à 200 pips en quelques minutes.",
      market: "Forex (paires USD), Or (XAU/USD), Indices US (S&P 500, Nasdaq)",
      indicator: "Variation des Emplois Non-Agricoles",
      economy: "États-Unis 🇺🇸",
      frequency: "Mensuel (Premier vendredi du mois)"
    },
    "🇺🇸 Consumer Price Index (CPI) — Inflation Report": {
      title: "🇺🇸 Indice des Prix à la Consommation (CPI) - Inflation",
      summary: "Mesure la variation des prix des biens et services. CPI élevé = inflation = taux maintenus élevés. CPI faible = désinflation = baisse des taux attendue.",
      impact: "Mouvements de 80 à 150 pips sur EUR/USD et XAU/USD. Les indices boursiers réagissent fortement.",
      market: "Forex (paires USD), Or (XAU/USD), Obligataire US, Crypto (BTC)",
      indicator: "CPI m/m, CPI y/y, Core CPI",
      economy: "États-Unis 🇺🇸",
      frequency: "Mensuel (Autour du 10-14 du mois)"
    },
    "🇺🇸 Federal Reserve Interest Rate Decision (FOMC)": {
      title: "🇺🇸 Décision sur les Taux de la Réserve Fédérale (FOMC)",
      summary: "Le FOMC fixe les taux directeurs. Une hausse renforce le USD; une baisse ou un ton accommodant (dovish) l'affaiblit et soutient l'Or et les actions.",
      impact: "Volatilité extrême sur toutes les paires USD, l'Or et les cryptos. Le point presse 30 minutes après crée une seconde vague de mouvements.",
      market: "Tous marchés Forex, Or, Indices US, Cryptos",
      indicator: "Taux directeur, Déclaration du FOMC, Dot Plot",
      economy: "États-Unis 🇺🇸 (Impact Global)",
      frequency: "8 fois par an (toutes les 6 semaines)"
    },
    "🇺🇸 Gross Domestic Product (GDP)": {
      title: "🇺🇸 Produit Intérieur Brut (PIB) US",
      summary: "Mesure la valeur totale de la production économique des États-Unis. Un PIB fort soutient le USD. Un PIB faible signale un risque de récession.",
      impact: "Mouvements de 30 à 80 pips sur le USD. L'Or est inversement corrélé.",
      market: "Forex (USD), Indices US, Or",
      indicator: "PIB trimestriel q/q",
      economy: "États-Unis 🇺🇸",
      frequency: "Trimestriel"
    },
    "🇺🇸 Initial Jobless Claims": {
      title: "🇺🇸 Inscriptions Hebdomadaires au Chômage",
      summary: "Nombre de personnes demandant des allocations chômage pour la première fois. Hausse = affaiblissement de l'emploi = USD baissier, Or haussier.",
      impact: "Volatilité à court terme de 20 à 50 pips sur le USD. Indicateur avancé hebdomadaire de l'emploi.",
      market: "Forex (USD), Or (XAU/USD)",
      indicator: "Inscriptions initiales et continues",
      economy: "États-Unis 🇺🇸",
      frequency: "Hebdomadaire (chaque jeudi)"
    },
    "🇺🇸 Producer Price Index (PPI)": {
      title: "🇺🇸 Indice des Prix à la Production (PPI)",
      summary: "Mesure les changements de prix au niveau de la production, indicateur avancé du CPI pour les consommateurs.",
      impact: "Paires USD en mouvement de 20 à 60 pips. Crée une fenêtre de sentiment d'inflation combinée avec le CPI.",
      market: "Forex (USD), Or, Obligations US",
      indicator: "PPI m/m, Core PPI",
      economy: "États-Unis 🇺🇸",
      frequency: "Mensuel"
    },
    "🇪🇺 European Central Bank (ECB) Interest Rate Decision": {
      title: "🇪🇺 Décision sur les Taux de la Banque Centrale Européenne",
      summary: "La BCE fixe les taux pour la Zone Euro. Une hausse soutient l'EUR, une baisse l'affaiblit. La conférence de presse apporte une volatilité secondaire.",
      impact: "EUR/USD bouge de 60 à 120 pips. Les indices européens (DAX, CAC) réagissent fortement.",
      market: "Forex (EUR), Indices Européens, Obligations",
      indicator: "Taux de refinancement, Conférence de presse",
      economy: "Zone Euro 🇪🇺",
      frequency: "6-8 fois par an"
    },
    "🇬🇧 Bank of England (BoE) Interest Rate Decision": {
      title: "🇬🇧 Décision sur les Taux de la Banque d'Angleterre",
      summary: "La BoE fixe le taux directeur britannique. Les votes des membres de la commission déterminent le biais du GBP.",
      impact: "GBP/USD bouge de 50 à 100 pips. Le FTSE 100 réagit également.",
      market: "Forex (GBP), Indices UK, Obligations UK",
      indicator: "Taux directeur, Répartition des votes",
      economy: "Royaume-Uni 🇬🇧",
      frequency: "8 fois par an"
    },
    "🇺🇸 ISM Manufacturing & Services PMI": {
      title: "🇺🇸 PMI Manufacturier et Services de l'ISM",
      summary: "PMI au-dessus de 50 = expansion. L'indice des services couvre 80% de l'économie US et a un impact souvent supérieur sur les marchés.",
      impact: "Volatilité de 30 à 60 pips sur le USD. Les indices réagissent aux signaux d'activité.",
      market: "Forex (USD), Indices US, Matières premières",
      indicator: "ISM Manufacturing PMI, ISM Services PMI",
      economy: "États-Unis 🇺🇸",
      frequency: "Mensuel"
    },
    "🇺🇸 Retail Sales": {
      title: "🇺🇸 Ventes au Détail US",
      summary: "Mesure les ventes des magasins de détail. Reflète la consommation qui représente 70% du PIB US. Des ventes fortes soutiennent le USD.",
      impact: "Mouvement de 30 à 70 pips sur le USD. Les indices apprécient des chiffres de consommation élevés.",
      market: "Forex (USD), Indices US, Actions de consommation",
      indicator: "Ventes au détail m/m",
      economy: "États-Unis 🇺🇸",
      frequency: "Mensuel"
    },
    "🇯🇵 Bank of Japan (BoJ) Interest Rate Decision": {
      title: "🇯🇵 Décision sur les Taux de la Banque du Japon",
      summary: "La BoJ normalise sa politique après des décennies de taux négatifs. Tout ajustement du contrôle de courbe de rendement secoue le JPY.",
      impact: "USD/JPY bouge de 100 à 300 pips. Impact important sur le débouclage du Carry Trade mondial.",
      market: "Forex (paires JPY), Nikkei 225, Actions Mondiales",
      indicator: "Taux à court terme, Contrôle de rendement",
      economy: "Japon 🇯🇵 (Impact Global)",
      frequency: "8 fois par an"
    },
    "🇨🇳 China Manufacturing PMI & Trade Balance": {
      title: "🇨🇳 PMI Manufacturier & Balance Commerciale de la Chine",
      summary: "Indicateurs avancés de la demande mondiale et des métaux. Des chiffres forts soutiennent l'AUD, le NZD et les matières premières.",
      impact: "AUD/USD et NZD/USD bougent de 30 à 60 pips. Les matières premières réagissent.",
      market: "Forex (AUD, NZD), Matières premières (Pétrole, Cuivre), Indices Asiatiques",
      indicator: "PMI manufacturier Caixin & NBS",
      economy: "Chine 🇨🇳 (Impact Chaîne Logistique)",
      frequency: "Mensuel"
    },
    "🛢️ OPEC+ Production Decision & Crude Oil Inventories": {
      title: "🛢️ Décision de Production de l'OPEP+ & Stocks US",
      summary: "Les coupes de production de l'OPEP+ soutiennent le brut. Les stocks hebdomadaires US apportent des chiffres en temps réel.",
      impact: "Le Brent et le WTI bougent de 2 à 5 USD le baril. USD/CAD réagit fortement en corrélation inverse.",
      market: "Matières premières (Pétrole), Forex (USD/CAD), Actions Énergie",
      indicator: "Production OPEP, Stocks EIA",
      economy: "Marchés Énergie Mondiaux 🌍",
      frequency: "OPEP: ~6x/an, Stocks: Hebdomadaire"
    },
    "🇺🇸 JOLTS Job Openings": {
      title: "🇺🇸 Offres d'Emploi JOLTS",
      summary: "Mesure le nombre de postes non pourvus. Indique la tension sur le marché de l'emploi US. Suivi de très près par la Fed.",
      impact: "Paires USD bougent de 20 à 40 pips. Chiffres suivis par Jerome Powell dans ses conférences de presse.",
      market: "Forex (USD), Or, Obligations US",
      indicator: "Offres d'emploi JOLTS",
      economy: "États-Unis 🇺🇸",
      frequency: "Mensuel"
    },
    "🇺🇸 PCE Price Index (Fed's Preferred Inflation Gauge)": {
      title: "🇺🇸 Indice des Prix PCE (Indicateur d'Inflation Préféré de la Fed)",
      summary: "Indicateur d'inflation préféré de la Fed (différent du CPI). La déviation de l'objectif de 2% influence la politique de taux.",
      impact: "Mouvements de 40 à 80 pips sur le USD. L'Or réagit inversement. C'est la donnée capitale pour la Fed.",
      market: "Forex (USD), Or, Obligations US, Cryptos",
      indicator: "Indice des prix PCE, Core PCE y/y",
      economy: "États-Unis 🇺🇸",
      frequency: "Mensuel (dernier vendredi du mois)"
    },
    "🇺🇸 University of Michigan Consumer Sentiment": {
      title: "🇺🇸 Confiance des Consommateurs du Michigan",
      summary: "Mesure le moral des ménages et leurs anticipations d'inflation à 5 ans, très suivies par la Fed.",
      impact: "Paires USD bougent de 15 à 30 pips. La lecture préliminaire au milieu du mois a plus d'impact.",
      market: "Forex (USD), Indices US, Actions de détail",
      indicator: "Indice de sentiment, Inflation attendue à 5 ans",
      economy: "États-Unis 🇺🇸",
      frequency: "Mensuel (deux lectures)"
    }
  }
};

export default function WeeklyNewsHub({ lang = "en" }) {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [weekLabel, setWeekLabel] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [savedNews, setSavedNews] = useState([]);

  const trans = NEWS_TR[lang] || NEWS_TR.en;

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("saved_weekly_news") || "[]");
    setSavedNews(saved);
    fetchNews();
  }, []);

  const getNewsTranslation = (item) => {
    const table = NEWS_ITEM_TRANSLATIONS[lang];
    if (table && table[item.title]) {
      return {
        title: table[item.title].title,
        summary: table[item.title].summary,
        impact: table[item.title].impact,
        market: table[item.title].market,
        indicator: table[item.title].indicator,
        economy: table[item.title].economy,
        frequency: table[item.title].frequency,
        importance: getImportance(item.importance)
      };
    }
    return {
      title: item.title,
      summary: item.summary,
      impact: item.impact,
      market: item.market,
      indicator: item.indicator,
      economy: item.economy,
      frequency: item.frequency,
      importance: getImportance(item.importance)
    };
  };

  const getImportance = (imp) => {
    if (!imp) return "";
    if (lang === "ar") {
      return imp
        .replace("Extreme High Impact", "تأثير مرتفع للغاية")
        .replace("High Impact", "تأثير مرتفع")
        .replace("Medium-High Impact", "تأثير متوسط إلى مرتفع")
        .replace("Medium Impact", "تأثير متوسط");
    }
    if (lang === "fr") {
      return imp
        .replace("Extreme High Impact", "Impact Extrêmement Fort")
        .replace("High Impact", "Impact Fort")
        .replace("Medium-High Impact", "Impact Moyen-Fort")
        .replace("Medium Impact", "Impact Moyen");
    }
    return imp;
  };

  const fetchNews = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/weekly-news?t=${Date.now()}`);
      const data = await res.json();
      if (data.news && data.news.length > 0) {
        setNews(data.news);
        
        let label = "";
        if (lang === "ar") {
          label = `الأسبوع ${data.weekNumber} من ${data.year}`;
        } else if (lang === "fr") {
          label = `Semaine ${data.weekNumber} de ${data.year}`;
        } else {
          label = `Week ${data.weekNumber} of ${data.year}`;
        }
        setWeekLabel(label);
      }
    } catch (_) {
    } finally {
      setLoading(false);
    }
  };

  const toggleSave = (item) => {
    let updated;
    const isSaved = savedNews.some((n) => n.title === item.title);
    if (isSaved) {
      updated = savedNews.filter((n) => n.title !== item.title);
    } else {
      updated = [...savedNews, item];
    }
    setSavedNews(updated);
    localStorage.setItem("saved_weekly_news", JSON.stringify(updated));
  };

  const toggleExpand = (id) => {
    setExpandedId(expandedId === id ? null : id);
  };

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
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", color: "#ffffff", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>📰</span> {trans.title}
          </h3>
          <p style={{ margin: "4px 0 0", color: "#888893", fontSize: "12px" }}>
            {trans.subtitle} <strong style={{ color: "#a3e635" }}>{weekLabel}</strong> · {news.length} {trans.events}
          </p>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={fetchNews}
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
            <span>🔄</span> {loading ? trans.loadingText : trans.refresh}
          </button>
        </div>
      </div>

      {/* Loading state */}
      {loading && news.length === 0 && (
        <p style={{ color: "#a3e635", fontSize: "13px", margin: 0, textAlign: "center", padding: "20px 0" }}>
          {trans.fetchingText}
        </p>
      )}

      {/* News Cards Grid */}
      {!loading && news.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "14px" }}>
          {news.map((item, idx) => {
            const localized = getNewsTranslation(item);
            const impactStyle = getImpactStyle(item.importance);
            const isSaved = savedNews.some((n) => n.title === item.title);
            const isExpanded = expandedId === item.id;

            return (
              <div
                key={item.id || idx}
                style={{
                  background: "#050506",
                  border: `1px solid ${impactStyle.border}`,
                  borderRadius: "10px",
                  padding: "0",
                  display: "flex",
                  flexDirection: "column",
                  boxShadow: impactStyle.glow,
                  transition: "all 0.3s ease",
                  overflow: "hidden",
                  cursor: "pointer"
                }}
                onClick={() => toggleExpand(item.id)}
              >
                {/* Card Header with importance badge */}
                <div style={{ padding: "14px 16px 10px", borderBottom: isExpanded ? `1px solid ${impactStyle.border}` : "none" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px", gap: "8px" }}>
                    <span
                      style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "3px 10px",
                        borderRadius: "4px",
                        background: impactStyle.bg,
                        color: impactStyle.text,
                        textTransform: "uppercase",
                        whiteSpace: "nowrap",
                        border: `1px solid ${impactStyle.border}`
                      }}
                    >
                      {localized.importance}
                    </span>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(item); }}
                        style={{ background: "transparent", border: "none", color: isSaved ? "#fbbf24" : "#484f58", fontSize: "16px", cursor: "pointer", padding: "0 2px" }}
                        title={isSaved ? "Remove from saved" : "Save this news"}
                      >
                        {isSaved ? "★" : "☆"}
                      </button>
                      <span style={{ color: "#484f58", fontSize: "14px", transition: "transform 0.3s", transform: isExpanded ? "rotate(180deg)" : "rotate(0deg)" }}>▼</span>
                    </div>
                  </div>
                  <h4 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "700", color: "#ffffff", lineHeight: "1.4" }}>
                    {localized.title}
                  </h4>
                  <p style={{ margin: 0, color: "#888893", fontSize: "11.5px", lineHeight: "1.5", display: "-webkit-box", WebkitLineClamp: isExpanded ? "unset" : 2, WebkitBoxOrient: "vertical", overflow: isExpanded ? "visible" : "hidden" }}>
                    {localized.summary}
                  </p>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div style={{ padding: "12px 16px 14px", display: "flex", flexDirection: "column", gap: "10px", animation: "fadeSlideIn 0.3s ease" }}>
                    {/* Impact Section */}
                    <div style={{ background: "rgba(163, 230, 53, 0.03)", borderRadius: "8px", padding: "10px 12px", border: "1px solid #222225" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: "#f43f5e", textTransform: "uppercase", display: "block", marginBottom: "4px" }}>
                        {trans.marketImpact}
                      </span>
                      <p style={{ margin: 0, color: "#ffffff", fontSize: "12px", lineHeight: "1.5" }}>{localized.impact}</p>
                    </div>

                    {/* Indicator & Market Info */}
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ background: "#111113", borderRadius: "6px", padding: "8px 10px", border: "1px solid #222225" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#a3e635", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>{trans.indicator}</span>
                        <span style={{ color: "#ffffff", fontSize: "11px", fontWeight: "600" }}>{localized.indicator}</span>
                      </div>
                      <div style={{ background: "#111113", borderRadius: "6px", padding: "8px 10px", border: "1px solid #222225" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#a3e635", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>{trans.economy}</span>
                        <span style={{ color: "#ffffff", fontSize: "11px", fontWeight: "600" }}>{localized.economy}</span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      <div style={{ background: "#111113", borderRadius: "6px", padding: "8px 10px", border: "1px solid #222225" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#a3e635", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>{trans.marketsAffected}</span>
                        <span style={{ color: "#ffffff", fontSize: "11px", fontWeight: "600" }}>{localized.market}</span>
                      </div>
                      <div style={{ background: "#111113", borderRadius: "6px", padding: "8px 10px", border: "1px solid #222225" }}>
                        <span style={{ fontSize: "9px", fontWeight: "700", color: "#a3e635", textTransform: "uppercase", display: "block", marginBottom: "3px" }}>{trans.frequency}</span>
                        <span style={{ color: "#ffffff", fontSize: "11px", fontWeight: "600" }}>{localized.frequency}</span>
                      </div>
                    </div>

                    {/* Source Link */}
                    <a
                      href={item.source}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "7px 14px",
                        borderRadius: "6px",
                        background: "#111113",
                        border: "1px solid #222225",
                        color: "#a3e635",
                        fontSize: "11px",
                        fontWeight: "700",
                        textDecoration: "none",
                        transition: "all 0.2s",
                        alignSelf: "flex-start"
                      }}
                    >
                      🔗 {item.sourceLabel || trans.sourceLink}
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes newsGradientSlide {
          0% { background-position: 0% 50%; }
          100% { background-position: 200% 50%; }
        }
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
