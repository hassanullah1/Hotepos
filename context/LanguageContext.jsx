// context/LanguageContext.jsx
"use client";
import { createContext, useContext, useState, useEffect } from "react";

const LanguageContext = createContext();

const translations = {
  en: {
    brand: "Kohistan Logistic",
    home: "Home",
    about: "About",
    footer: "© {year} Kohistan Logistic",
  },
  ps: {
    // Pashto
    brand: "کوهستان لجستیک",
    home: "کور",
    about: "درباره",
    footer: "© {year} کوهستان لجستیک",
  },
  prs: {
    // Dari (Persian Afghan)
    brand: "کوهستان لجستیک",
    home: "خانه",
    about: "درباره ما",
    footer: "© {year} کوهستان لجستیک",
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
