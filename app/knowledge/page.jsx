"use client";

import { useState, useEffect } from "react";
import KnowledgeModal from "../components/KnowledgeModal";

export default function KnowledgePage() {
  const [lang, setLang] = useState("en");

  useEffect(() => {
    const savedLang = localStorage.getItem("preferred_language");
    if (savedLang) {
      setLang(savedLang);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== "undefined" && document.documentElement) {
      document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
      document.documentElement.lang = lang;
    }
  }, [lang]);

  return (
    <KnowledgeModal isOpen={true} onClose={() => { window.location.href = "/"; }} mode="page" lang={lang} />
  );
}
