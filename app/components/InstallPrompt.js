"use client";

import { useEffect, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { useLanguage } from "@/context/LanguageContext";

const DISMISS_DAYS = 7;
const SHOW_DELAY_MS = 8000; // 8 seconds

const installText = {
  en: {
    title: "Install Melmah App",
    subtitle: "Faster ordering. Works offline. No app store needed.",
    install: "Install",



    
    later: "Not now",
    iosTitle: "Add Melmah to Home Screen",
    iosSubtitle: 'Tap the Share button below, then "Add to Home Screen".',
    iosHint: 'Tap Share → "Add to Home Screen"',
  },
  ps: {
    title: "د Melmah اپلیکیشن نصب کړئ",
    subtitle: "چټک فرمایش. پرته له انټرنېټ کار کوي. اپ سټور ته اړتیا نشته.",
    install: "نصب کړئ",
    later: "اوس نه",
    iosTitle: "Melmah کور سکرین ته اضافه کړئ",
    iosSubtitle: 'لاندې د شریکولو تڼۍ کېکاږئ، بیا "کور سکرین ته اضافه کړئ".',
    iosHint: 'شریکول → "کور سکرین ته اضافه کړئ"',
  },
  prs: {
    title: "اپلیکیشن Melmah را نصب کنید",
    subtitle: "سفارش سریع. بدون اینترنت کار می‌کند. بدون فروشگاه اپ.",
    install: "نصب",
    later: "الان نه",
    iosTitle: "Melmah را به صفحه اصلی اضافه کنید",
    iosSubtitle: 'دکمه اشتراک را لمس کنید، سپس "افزودن به صفحه اصلی".',
    iosHint: 'اشتراک → "افزودن به صفحه اصلی"',
  },
};

// ── helpers ──
function isStandalone() {
  if (typeof window === "undefined") return false;
  try {
    if (window.matchMedia("(display-mode: standalone)").matches) return true;
    if (window.matchMedia("(display-mode: fullscreen)").matches) return true;
    if (window.matchMedia("(display-mode: minimal-ui)").matches) return true;
  } catch {}
  // iOS Safari
  if (window.navigator.standalone === true) return true;
  return false;
}

function isIOS() {
  if (typeof window === "undefined") return false;
  const ua = window.navigator.userAgent;
  const isIPad =
    navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
  return /iPad|iPhone|iPod/.test(ua) || isIPad;
}

function isDismissedRecently() {
  if (typeof window === "undefined") return false;
  try {
    const until = localStorage.getItem("pwa_dismissed_until");
    if (!until) return false;
    return Date.now() < parseInt(until, 10);
  } catch {
    return false;
  }
}

function wasInstalledBefore() {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem("pwa_installed") === "1";
  } catch {
    return false;
  }
}

// ── component ──
export default function InstallPrompt() {
  const { resolvedTheme } = useTheme();
  const { language } = useLanguage();

  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [deferred, setDeferred] = useState(null);

  const timerRef = useRef(null);
  const dismissedRef = useRef(false);

  useEffect(() => setMounted(true), []);

  const lang = installText[language] ? language : "en";
  const t = installText[lang];
  const isDark = mounted ? resolvedTheme !== "light" : true;

  useEffect(() => {
    if (!mounted) return;
    if (isStandalone()) return;
    if (wasInstalledBefore()) return;
    if (isDismissedRecently()) return;

    const iosDevice = isIOS();
    setIos(iosDevice);

    function startTimer() {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        if (!dismissedRef.current) setVisible(true);
      }, SHOW_DELAY_MS);
    }

    // iOS — no beforeinstallprompt, show instructions after delay
    if (iosDevice) {
      startTimer();
      return () => {
        if (timerRef.current) clearTimeout(timerRef.current);
      };
    }

    // Android / Chrome / Edge — wait for beforeinstallprompt
    function handleBeforeInstall(e) {
      e.preventDefault();
      setDeferred(e);
      startTimer();
    }

    function handleAppInstalled() {
      setVisible(false);
      try {
        localStorage.setItem("pwa_installed", "1");
      } catch {}
    }

    window.addEventListener("beforeinstallprompt", handleBeforeInstall);
    window.addEventListener("appinstalled", handleAppInstalled);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstall);
      window.removeEventListener("appinstalled", handleAppInstalled);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [mounted]);

  async function install() {
    if (!deferred) return;
    setInstalling(true);
    try {
      deferred.prompt();
      const { outcome } = await deferred.userChoice;
      if (outcome === "accepted") {
        setVisible(false);
        try {
          localStorage.setItem("pwa_installed", "1");
        } catch {}
      }
    } catch (err) {
      console.error("Install failed:", err);
    } finally {
      setInstalling(false);
      setDeferred(null);
    }
  }

  function dismiss() {
    setVisible(false);
    dismissedRef.current = true;
    try {
      const until = Date.now() + DISMISS_DAYS * 24 * 60 * 60 * 1000;
      localStorage.setItem("pwa_dismissed_until", String(until));
    } catch {}
  }

  if (!mounted || !visible) return null;

  /* ──────────────── iOS: instructions banner ──────────────── */
  if (ios) {
    return (
      <div
        className={`fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md rounded-2xl border p-4 shadow-2xl backdrop-blur-xl transition-colors ${
          isDark
            ? "border-[#C9A227]/40 bg-[#1E1B26]/95 text-[#F0EAE2]"
            : "border-[#A9821E]/30 bg-white/95 text-[#1D1A22]"
        }`}
      >
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className={`absolute end-3 top-3 rounded-full p-1 transition ${
            isDark
              ? "text-[#6E687A] hover:bg-[#2A2534] hover:text-[#F0EAE2]"
              : "text-[#A39D8F] hover:bg-[#F7F4EE] hover:text-[#1D1A22]"
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex items-start gap-3 pe-6">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-md">
            <svg
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <rect x="3" y="4" width="18" height="18" rx="2" />
              <path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">{t.iosTitle}</p>
            <p
              className={`mt-1 text-[11px] leading-snug ${
                isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
              }`}
            >
              {t.iosSubtitle}
            </p>
            <div
              className={`mt-2 inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-[10px] font-semibold ${
                isDark
                  ? "bg-[#C9A227]/15 text-[#E0B93A]"
                  : "bg-[#C9A227]/15 text-[#8A6E1A]"
              }`}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                <polyline points="16 6 12 2 8 6" />
                <line x1="12" y1="2" x2="12" y2="15" />
              </svg>
              {t.iosHint}
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ──────────────── Android / Chrome: install banner ──────────────── */
  return (
    <div
      className={`fixed inset-x-3 bottom-3 z-[60] mx-auto max-w-md overflow-hidden rounded-2xl border shadow-2xl backdrop-blur-xl transition-colors ${
        isDark
          ? "border-[#C9A227]/40 bg-[#1E1B26]/95 text-[#F0EAE2]"
          : "border-[#A9821E]/30 bg-white/95 text-[#1D1A22]"
      }`}
    >
      {/* Gold accent stripe */}
      <div className="h-1 w-full bg-gradient-to-r from-[#E0B93A] via-[#F0C94A] to-[#A9821E]" />

      <div className="relative p-4">
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className={`absolute end-3 top-3 rounded-full p-1 transition ${
            isDark
              ? "text-[#6E687A] hover:bg-[#2A2534] hover:text-[#F0EAE2]"
              : "text-[#A39D8F] hover:bg-[#F7F4EE] hover:text-[#1D1A22]"
          }`}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        <div className="flex items-start gap-3 pe-6">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-lg shadow-[#C9A227]/30">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold leading-tight">{t.title}</p>
            <p
              className={`mt-1 text-[11px] leading-snug ${
                isDark ? "text-[#B7B2C4]" : "text-[#6E687A]"
              }`}
            >
              {t.subtitle}
            </p>

            <div className="mt-3 flex gap-2">
              <button
                onClick={install}
                disabled={installing}
                className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-4 py-2 text-xs font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/25 transition hover:-translate-y-0.5 disabled:opacity-60 disabled:hover:translate-y-0"
              >
                {installing && (
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    className="animate-spin"
                  >
                    <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                  </svg>
                )}
                {t.install}
              </button>
              <button
                onClick={dismiss}
                className={`rounded-full border px-4 py-2 text-xs font-semibold transition ${
                  isDark
                    ? "border-[#3A3347] text-[#B7B2C4] hover:border-[#C9A227]/40 hover:text-[#E0B93A]"
                    : "border-[#E4DFD4] text-[#6E687A] hover:border-[#A9821E]/40 hover:text-[#8A6E1A]"
                }`}
              >
                {t.later}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
