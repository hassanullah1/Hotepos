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
    available247: "24/7 Available",
    registerVehicle: "Register Vehicle",
    registerVehicleTitle: "Register Your Vehicle",
    registerVehiclePlaceholder: "Add pickup location, date, or any details...",
    sendViaWhatsapp: "Send via WhatsApp",
    whatsappGreeting: "Hello, I would like to register a",
    whatsappDetailsLabel: "Details",
    vehicleDumpTruck: "Dump Truck",
    vehicleBodyTruck: "Truck",
    vehicleExcavator: "Excavator",
    vehicleTanker: "Tanker",
    vehicleTaxi: "Taxi",
    vehicleRental: "Rental Car",
  },
  ps: {
    // Pashto
    brand: "روان لوژستیک",
    home: "کور",
    about: "درباره",
    footer: "© {year} روان لوژستیک",
    available247: "۲۴/۷ شتون لري",
    registerVehicle: "موټر ثبت کړئ",
    registerVehicleTitle: "خپل موټر ثبت کړئ",
    registerVehiclePlaceholder: "د اخیستلو ځای، نیټه، یا نور توضیحات ولیکئ...",
    sendViaWhatsapp: "د واتساپ له لارې واستوئ",
    whatsappGreeting: "سلام، زه غواړم دا موټر ثبت کړم",
    whatsappDetailsLabel: "توضیحات",
    vehicleDumpTruck: "ډمپ ټرک",
    vehicleBodyTruck: " لاري",
    vehicleExcavator: "لوډر",
    vehicleTanker: "ټانکر",
    vehicleTaxi: "ټکسي",
    vehicleRental: "کرایی موټر",
  },
  prs: {
    // Dari (Persian Afghan)
    brand: "روان لوژستیک",
    home: "خانه",
    about: "درباره ما",
    footer: "© {year} روان لوژستیک",
    available247: "۲۴/۷ در دسترس",
    registerVehicle: "ثبت وسیله",
    registerVehicleTitle: "وسیله خود را ثبت کنید",
    registerVehiclePlaceholder: "محل تحویل، تاریخ یا جزئیات دیگر را بنویسید...",
    sendViaWhatsapp: "ارسال از طریق واتساپ",
    whatsappGreeting: "سلام، می‌خواهم این وسیله را ثبت کنم",
    whatsappDetailsLabel: "جزئیات",
    vehicleDumpTruck: "دمپ ترک",
    vehicleBodyTruck: "لاري",
    vehicleExcavator: "لوډر ",
    vehicleTanker: "تانکر",
    vehicleTaxi: "تکسی",
    vehicleRental: "موتر کرایی",
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
