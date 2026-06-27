// app/components/HeaderClient.jsx
"use client";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { Moon, Sun, Globe, ChevronDown, Menu, X } from "lucide-react";

export default function HeaderClient() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const [mounted, setMounted] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null;

  const languages = [
    { code: "en", label: "English", flag: "🇬🇧" },
    { code: "ps", label: "پښتو", flag: "🇦🇫" },
    { code: "prs", label: "دری", flag: "🇦🇫" },
  ];

  const currentLang = languages.find((l) => l.code === language);

  // Close mobile menu when clicking a link
  const closeMobileMenu = () => setIsMobileMenuOpen(false);

  return (
    <>
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16 md:h-20">
            {/* Logo & Brand */}
            <Link
              href="/"
              className="flex items-center gap-2 group flex-shrink-0"
            >
              <div className="relative w-8 h-8 md:w-10 md:h-10 overflow-hidden rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 p-0.5">
                <Image
                  src="/kohistan.png"
                  alt="Kohistan Logistic Logo"
                  width={40}
                  height={40}
                  className="rounded-full object-cover"
                />
              </div>
              <span className="text-base sm:text-lg md:text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent whitespace-nowrap">
                {t("brand")}
              </span>
            </Link>

            {/* Desktop Navigation & Controls */}
            <div className="hidden md:flex items-center gap-4 lg:gap-6">
              <nav className="flex gap-4 lg:gap-6">
                <Link
                  href="/"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition font-medium"
                >
                  {t("home")}
                </Link>
                <Link
                  href="/about"
                  className="text-gray-600 dark:text-gray-300 hover:text-blue-500 dark:hover:text-blue-400 transition font-medium"
                >
                  {t("about")}
                </Link>
              </nav>

              {/* Language Dropdown (desktop) */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                >
                  <Globe
                    size={18}
                    className="text-gray-600 dark:text-gray-300"
                  />
                  <span className="text-sm font-medium">
                    {currentLang?.flag} {currentLang?.label}
                  </span>
                  <ChevronDown
                    size={16}
                    className={`transition-transform ${isLangOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className={`w-full text-left px-4 py-2 flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition ${
                          language === lang.code
                            ? "bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400"
                            : ""
                        }`}
                      >
                        <span>{lang.flag}</span>
                        <span className="text-sm">{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition"
                aria-label="Toggle dark mode"
              >
                {theme === "dark" ? (
                  <Sun size={20} className="text-yellow-400" />
                ) : (
                  <Moon size={20} className="text-gray-700" />
                )}
              </button>
            </div>

            {/* Mobile: Language + Dark Mode + Hamburger */}
            <div className="flex md:hidden items-center gap-2">
              {/* Language selector (simplified on mobile) */}
              <div className="relative">
                <button
                  onClick={() => setIsLangOpen(!isLangOpen)}
                  className="flex items-center gap-1 px-2 py-1.5 rounded-full bg-gray-100 dark:bg-gray-800"
                >
                  <Globe size={16} />
                  <span className="text-xs">{currentLang?.flag}</span>
                  <ChevronDown size={12} />
                </button>
                {isLangOpen && (
                  <div className="absolute right-0 mt-2 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLangOpen(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <span>{lang.flag}</span>
                        <span>{lang.label}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Dark Mode Toggle (mobile) */}
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="p-1.5 rounded-full bg-gray-100 dark:bg-gray-800"
              >
                {theme === "dark" ? <Sun size={16} /> : <Moon size={16} />}
              </button>

              {/* Hamburger Menu Button */}
              <button
                onClick={() => setIsMobileMenuOpen(true)}
                className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-800"
                aria-label="Open menu"
              >
                <Menu size={20} />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay (Slide-in from right) */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <div className="absolute right-0 top-0 h-full w-64 bg-white dark:bg-gray-900 shadow-xl p-4 flex flex-col animate-in slide-in-from-right">
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1"
              >
                <X size={24} />
              </button>
            </div>
            <nav className="flex flex-col gap-4">
              <Link
                href="/"
                onClick={closeMobileMenu}
                className="text-gray-800 dark:text-gray-200 hover:text-blue-500 font-medium py-2"
              >
                {t("home")}
              </Link>
              <Link
                href="/about"
                onClick={closeMobileMenu}
                className="text-gray-800 dark:text-gray-200 hover:text-blue-500 font-medium py-2"
              >
                {t("about")}
              </Link>
            </nav>
          </div>
        </div>
      )}
    </>
  );
}
