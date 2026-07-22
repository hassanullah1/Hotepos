// context/LanguageContext.jsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    brand: "RAWAN Logistic",
    home: "Home",
    about: "About",
    footer: "© {year} Rawan Logistic",
  },
  ps: {
    // Pashto
    brand: "روان لوژستیک",
    home: "کور",
    about: "درباره",
    footer: "© {year} روان لوژستیک",
  },
  prs: {
    // Dari (Persian Afghan)
    brand: "روان لوژستیک",
    home: "خانه",
    about: "درباره ما",
    footer: "© {year} روان لوژستیک",
  },
};

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState("en");
  const [dir, setDir] = useState("ltr");

  useEffect(() => {
    const saved = localStorage.getItem("language");
    if (saved && translations[saved]) setLanguage(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem("language", language);
    setDir(language === "en" ? "ltr" : "rtl");
    document.documentElement.lang =
      language === "ps" ? "ps" : language === "prs" ? "prs" : "en";
    document.documentElement.dir = dir;
  }, [language, dir]);

  const t = (key, vars = {}) => {
    let text = translations[language][key] || translations.en[key];
    if (vars.year) text = text.replace("{year}", vars.year);
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, dir }}>
      {children}
    </LanguageContext.Provider>
  );
}

export const useLanguage = () => useContext(LanguageContext);
