// app/components/HeaderClient.jsx
"use client";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import {
  Moon,
  Sun,
  Globe,
  ChevronDown,
  Menu,
  X,
  Check,
  MapPin,
  Clock,
  Truck,
  MessageCircle,
} from "lucide-react";

// WhatsApp number (no + or spaces, country code included)
const WHATSAPP_NUMBER = "93731574174";

// Vehicle types — labelKey maps to your LanguageContext translations
const VEHICLE_OPTIONS = [
  { id: "dump-truck", labelKey: "vehicleDumpTruck" },
  { id: "body-truck", labelKey: "vehicleBodyTruck" },
  { id: "excavator", labelKey: "vehicleExcavator" },
  { id: "tanker", labelKey: "vehicleTanker" },
  { id: "taxi", labelKey: "vehicleTaxi" },
  { id: "rental", labelKey: "vehicleRental" },
];

function BookingModal({ open, onClose, t }) {
  const [vehicle, setVehicle] = useState(VEHICLE_OPTIONS[0].id);
  const [message, setMessage] = useState("");

  if (!open) return null;

  const handleSend = () => {
    const vehicleLabel =
      t(VEHICLE_OPTIONS.find((v) => v.id === vehicle)?.labelKey) || vehicle;
    const text = `${t("whatsappGreeting")} *${vehicleLabel}*.${
      message.trim()
        ? `\n\n${t("whatsappDetailsLabel")}: ${message.trim()}`
        : ""
    }`;
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(
      text,
    )}`;
    window.open(url, "_blank", "noopener,noreferrer");
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-slate-200 dark:ring-slate-700 p-6 animate-in zoom-in-95 fade-in duration-200 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full bg-green-500/10 flex items-center justify-center">
              <MessageCircle size={18} className="text-green-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-800 dark:text-white">
              {t("registerVehicleTitle")}
            </h3>
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Vehicle radio options — grid so 6 items fit nicely */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          {VEHICLE_OPTIONS.map((opt) => {
            const active = vehicle === opt.id;
            return (
              <label
                key={opt.id}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border cursor-pointer transition-colors ${
                  active
                    ? "border-teal-500 bg-teal-50 dark:bg-teal-500/10"
                    : "border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/60"
                }`}
              >
                <input
                  type="radio"
                  name="vehicle"
                  value={opt.id}
                  checked={active}
                  onChange={() => setVehicle(opt.id)}
                  className="w-4 h-4 accent-teal-500 flex-shrink-0"
                />
                <Truck
                  size={15}
                  className={`flex-shrink-0 ${active ? "text-teal-500" : "text-slate-400"}`}
                />
                <span
                  className={`text-xs sm:text-sm font-medium truncate ${
                    active
                      ? "text-teal-700 dark:text-teal-300"
                      : "text-slate-700 dark:text-slate-200"
                  }`}
                >
                  {t(opt.labelKey)}
                </span>
              </label>
            );
          })}
        </div>

        {/* Message box */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={t("registerVehiclePlaceholder")}
          rows={3}
          className="w-full resize-none rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/60 px-4 py-3 text-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-400 mb-4"
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          className="w-full flex items-center justify-center gap-2 rounded-xl bg-green-500 hover:bg-green-600 text-white font-semibold py-3 transition-colors"
        >
          <MessageCircle size={18} />
          {t("sendViaWhatsapp")}
        </button>
      </div>
    </div>
  );
}

export default function HeaderClient() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const desktopLangRef = useRef(null);
  const mobileLangRef = useRef(null);

  useEffect(() => setMounted(true), []);

  // Close language dropdown on outside click
  useEffect(() => {
    function handleClick(e) {
      const insideDesktop = desktopLangRef.current?.contains(e.target);
      const insideMobile = mobileLangRef.current?.contains(e.target);
      if (!insideDesktop && !insideMobile) {
        setIsLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Subtle shadow/shrink once the page scrolls
  useEffect(() => {
    function handleScroll() {
      setScrolled(window.scrollY > 8);
    }
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Lock body scroll while the mobile drawer or booking modal is open
  useEffect(() => {
    document.body.style.overflow =
      isMobileMenuOpen || isBookingOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [isMobileMenuOpen, isBookingOpen]);

  if (!mounted) return null;

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ps", label: "پښتو", flag: "🇦🇫" },
    { code: "prs", label: "دری", flag: "🇦🇫" },
  ];

  const currentLang = languages.find((l) => l.code === language);
  const isDark = theme === "dark";

  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  const navLinks = [
    { href: "/", label: t("home") },
    { href: "/about", label: t("about") },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-50 border-b transition-all duration-300 ${
          scrolled
            ? "bg-white/90 dark:bg-slate-950/90 border-slate-200 dark:border-slate-800 shadow-sm"
            : "bg-white/70 dark:bg-slate-950/70 border-transparent"
        } backdrop-blur-md`}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div
            className={`flex justify-between items-center transition-all duration-300 ${
              scrolled ? "h-14 sm:h-16 md:h-[4.5rem]" : "h-14 sm:h-16 md:h-20"
            }`}
          >
            {/* Logo & Brand */}
            <Link
              href="/"
              className="flex items-center gap-2.5 group flex-shrink-0"
            >
              <div className="relative w-9 h-9 md:w-11 md:h-11 rounded-full bg-gradient-to-br from-teal-400 via-blue-500 to-indigo-600 p-[2px]">
                <div className="w-full h-full rounded-full overflow-hidden bg-white dark:bg-slate-950">
                  <Image
                    src="/rawan.png"
                    alt="Rawan Logistic Logo"
                    width={44}
                    height={44}
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span className="text-base sm:text-lg md:text-xl font-extrabold tracking-tight bg-gradient-to-r from-teal-600 to-teal-700 dark:from-white dark:via-blue-200 dark:to-teal-200 bg-clip-text text-transparent whitespace-nowrap">
                  {t("brand")}
                </span>
                {/* 24/7 badge */}
                <span className="hidden sm:flex items-center gap-1 text-[10px] md:text-[11px] font-semibold text-teal-600 dark:text-teal-300">
                  <Clock size={11} className="animate-pulse" />
                  {t("available247")}
                </span>
              </div>
            </Link>

            {/* Desktop Navigation & Controls */}
            <div className="hidden md:flex items-center gap-3 lg:gap-5">
              <nav className="flex gap-1 lg:gap-2">
                {navLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="relative px-3 py-2 text-sm lg:text-[15px] font-medium text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-teal-300 transition-colors group/link"
                  >
                    {link.label}
                    <span className="absolute left-3 right-3 -bottom-0.5 h-0.5 rounded-full bg-gradient-to-r from-blue-500 to-teal-400 scale-x-0 group-hover/link:scale-x-100 origin-left transition-transform duration-300" />
                  </Link>
                ))}
              </nav>

              {/* Register Vehicle Button */}
              <button
                onClick={() => setIsBookingOpen(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500 hover:bg-green-600 text-white text-sm font-semibold shadow-sm shadow-green-500/30 transition-colors"
              >
                <Truck size={16} />
                {t("registerVehicle")}
              </button>

              {/* Language Dropdown (desktop) */}
              <div className="relative" ref={desktopLangRef}>
                <button
                  onClick={() => setIsLangOpen((v) => !v)}
                  aria-haspopup="listbox"
                  aria-expanded={isLangOpen}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-slate-100 dark:bg-slate-800/80 text-slate-700 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700 ring-1 ring-inset ring-transparent hover:ring-blue-200 dark:hover:ring-slate-600 transition-all"
                >
                  <Globe
                    size={17}
                    className="text-blue-500 dark:text-teal-300"
                  />
                  <span className="text-sm font-medium">
                    {currentLang?.flag} {currentLang?.label}
                  </span>
                  <ChevronDown
                    size={15}
                    className={`text-slate-400 dark:text-slate-500 transition-transform duration-200 ${
                      isLangOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>
                {isLangOpen && (
                  <div
                    role="listbox"
                    className="absolute right-0 mt-2 w-44 origin-top-right rounded-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-xl shadow-slate-900/10 dark:shadow-black/40 ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden z-50 animate-in fade-in zoom-in-95 duration-150"
                  >
                    {languages.map((lang) => {
                      const active = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          role="option"
                          aria-selected={active}
                          onClick={() => {
                            setLanguage(lang.code);
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left px-4 py-2.5 flex items-center gap-2.5 text-sm transition-colors ${
                            active
                              ? "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-teal-300 font-semibold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span className="flex-1">{lang.label}</span>
                          {active && (
                            <Check
                              size={15}
                              className="text-blue-500 dark:text-teal-300"
                            />
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle — animated sliding pill */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label="Toggle dark mode"
                className="relative w-14 h-8 rounded-full bg-slate-200 dark:bg-slate-800 ring-1 ring-inset ring-slate-300/60 dark:ring-slate-700 transition-colors duration-300"
              >
                <span
                  className={`absolute top-1 left-1 w-6 h-6 rounded-full bg-white dark:bg-slate-950 shadow-md flex items-center justify-center transition-transform duration-300 ease-out ${
                    isDark ? "translate-x-6" : "translate-x-0"
                  }`}
                >
                  {isDark ? (
                    <Moon size={14} className="text-teal-300" />
                  ) : (
                    <Sun size={14} className="text-amber-500" />
                  )}
                </span>
              </button>
            </div>

            {/* Mobile: Register Vehicle + Language + Dark Mode + Hamburger */}
            <div className="flex md:hidden items-center gap-1.5">
              {/* Register Vehicle Button (mobile, icon only) */}
              <button
                onClick={() => setIsBookingOpen(true)}
                aria-label={t("registerVehicle")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-full bg-green-500 hover:bg-green-600 text-white transition-colors"
              >
                <Truck size={15} />
              </button>

              {/* Language selector (simplified on mobile) */}
              <div className="relative" ref={mobileLangRef}>
                <button
                  onClick={() => setIsLangOpen((v) => !v)}
                  aria-label="Change language"
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                >
                  <Globe
                    size={15}
                    className="text-blue-500 dark:text-teal-300"
                  />
                  <span className="text-xs">{currentLang?.flag}</span>
                  <ChevronDown
                    size={12}
                    className={`transition-transform duration-200 ${isLangOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-36 rounded-xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-lg ring-1 ring-slate-200 dark:ring-slate-700 overflow-hidden z-50">
                    {languages.map((lang) => {
                      const active = language === lang.code;
                      return (
                        <button
                          key={lang.code}
                          onClick={() => {
                            setLanguage(lang.code);
                            setIsLangOpen(false);
                          }}
                          className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                            active
                              ? "bg-blue-50 dark:bg-slate-800 text-blue-600 dark:text-teal-300 font-semibold"
                              : "text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800/70"
                          }`}
                        >
                          <span>{lang.flag}</span>
                          <span>{lang.label}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle (mobile) */}
              <button
                onClick={() => setTheme(isDark ? "light" : "dark")}
                aria-label="Toggle dark mode"
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
              >
                {isDark ? (
                  <Sun size={16} className="text-amber-400" />
                ) : (
                  <Moon size={16} className="text-slate-600" />
                )}
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>

          {/* 24/7 badge (mobile, shown below logo row) */}
          <div className="flex sm:hidden items-center gap-1 pb-2 -mt-1">
            <Clock size={11} className="text-teal-500 animate-pulse" />
            <span className="text-[10px] font-semibold text-teal-600 dark:text-teal-300">
              {t("available247")}
            </span>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay (Slide-in from right) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-[60] md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-72 max-w-[80vw] bg-white dark:bg-slate-950 shadow-2xl p-5 flex flex-col animate-in slide-in-from-right duration-250 ease-out">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-400 via-blue-500 to-indigo-600 p-[2px]">
                  <div className="w-full h-full rounded-[10px] overflow-hidden bg-white dark:bg-slate-950">
                    <Image
                      src="/rawan.png"
                      alt=""
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
                <span className="font-bold text-slate-800 dark:text-white text-sm">
                  {t("brand")}
                </span>
              </div>
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                aria-label="Close menu"
                className="p-1.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <nav className="flex flex-col gap-1">
              {navLinks.map((link, i) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={closeMobileMenu}
                  className="flex items-center gap-2.5 text-slate-800 dark:text-slate-100 hover:text-blue-600 dark:hover:text-teal-300 hover:bg-slate-50 dark:hover:bg-slate-900 font-medium py-3 px-3 rounded-xl transition-colors"
                  style={{ animationDelay: `${i * 40}ms` }}
                >
                  <MapPin
                    size={16}
                    className="text-blue-400 dark:text-teal-400"
                  />
                  {link.label}
                </Link>
              ))}
              {/* Register Vehicle link in mobile drawer too */}
              <button
                onClick={() => {
                  closeMobileMenu();
                  setIsBookingOpen(true);
                }}
                className="flex items-center gap-2.5 text-white bg-green-500 hover:bg-green-600 font-semibold py-3 px-3 rounded-xl transition-colors mt-2"
              >
                <Truck size={16} />
                {t("registerVehicle")}
              </button>
            </nav>
            <div className="mt-auto pt-4 border-t border-slate-100 dark:border-slate-800 text-xs text-slate-400 dark:text-slate-500">
              {currentLang?.flag} {currentLang?.label}
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        open={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        t={t}
      />
    </>
  );
}
