// app/tutorials/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Sparkles,
  Play,
  Clock,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  AlertCircle,
  X,
} from "lucide-react";


const tutorialsText = {
  en: {
    badge: "Tutorials",
    titleA: "Learn how to use",
    titleHighlight: "Melmah",
    subtitle:
      "Short videos that walk you through every part of the system — start with the first one.",
    loading: "Loading…",
    watchLabel: "Play video",
    empty: "No tutorials yet. Check back soon.",
    error: "Couldn't load tutorials. Please try again.",
    ctaTitle: "Still have questions?",
    ctaSubtitle: "Our team is one message away.",
    ctaButton: "Contact us",
    ctaSecondary: "View pricing",
  },
  ps: {
    badge: "درسونه",
    titleA: "زده کړئ چې څنګه",
    titleHighlight: "ستیوو",
    subtitle:
      "لنډ ویډیوګانې چې تاسو د سیستم هره برخه درښیي — د لومړنۍ سره پیل وکړئ.",
    loading: "بارول…",
    watchLabel: "ویډیو چلول",
    empty: "تر اوسه کوم درس نشته. وروسته بیا وګورئ.",
    error: "د درسونه بارول نشول. بیا هڅه وکړئ.",
    ctaTitle: "لا هم پوښتنې لرئ؟",
    ctaSubtitle: "زموږ ټیم یو پیغام لرې دی.",
    ctaButton: "اړیکه ونیسئ",
    ctaSecondary: "بیې وګورئ",
  },
  prs: {
    badge: "آموزش‌ها",
    titleA: "بیاموزید که چگونه از",
    titleHighlight: "ستیوو",
    subtitle:
      "ویدیوهای کوتاه که شما را با هر بخش سیستم آشنا می‌کنند — از اولین شروع کنید.",
    loading: "در حال بارگذاری…",
    watchLabel: "پخش ویدیو",
    empty: "هنوز آموزشی موجود نیست. بعداً دوباره مراجعه کنید.",
    error: "بارگذاری آموزش‌ها ممکن نشد. لطفاً دوباره تلاش کنید.",
    ctaTitle: "هنوز سوال دارید؟",
    ctaSubtitle: "تیم ما فقط یک پیام فاصله دارد.",
    ctaButton: "تماس با ما",
    ctaSecondary: "مشاهده قیمت‌ها",
  },
};

/* ------------------------------------------------------------------ */
/* Modal — only mounted while a video is open, so body scroll is       */
/* locked ONLY during playback (fixes the "page won't scroll" bug).    */
/* ------------------------------------------------------------------ */
function VideoModal({ tutorial, onClose }) {
  useEffect(() => {
    function handleKey(e) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />

      <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-[#2E2938] bg-[#1E1B26] shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          aria-label="Close video"
          className="absolute end-3 top-3 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-[#15121C]/85 text-[#F0EAE2] backdrop-blur transition-colors hover:bg-[#15121C] hover:text-[#C9A227]"
        >
          <X size={18} />
        </button>

        <div className="relative aspect-video w-full bg-black">
          <iframe
            className="absolute inset-0 h-full w-full"
            src={`https://www.youtube.com/embed/${tutorial.youtube_id}?autoplay=1&rel=0&modestbranding=1`}
            title={tutorial.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        </div>

        <div className="p-5 sm:p-6">
          {tutorial.category && (
            <span
              className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A227]"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {tutorial.category}
            </span>
          )}
          <h3
            className="mt-1.5 text-lg font-medium leading-snug text-[#F0EAE2]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {tutorial.title}
          </h3>
          {tutorial.description && (
            <p className="mt-1.5 text-sm leading-relaxed text-[#B7B2C4]">
              {tutorial.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* One compact row in the list                                         */
/* ------------------------------------------------------------------ */
function TutorialRow({ tutorial, watchLabel, onPlay }) {
  return (
    <button
      type="button"
      onClick={() => onPlay(tutorial)}
      aria-label={watchLabel}
      className="group flex w-full items-center gap-4 rounded-xl border border-[#2E2938] bg-[#1E1B26]/80 p-3 text-start transition-all duration-200 hover:border-[#C9A227]/40 hover:bg-[#1E1B26] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/50 sm:gap-5 sm:p-4"
    >
      <div className="relative aspect-video w-24 flex-shrink-0 overflow-hidden rounded-lg bg-[#15121C] sm:w-36">
        <img
          src={`https://img.youtube.com/vi/${tutorial.youtube_id}/mqdefault.jpg`}
          alt=""
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          loading="lazy"
        />
        <span className="absolute inset-0 flex items-center justify-center bg-black/25 transition-colors duration-200 group-hover:bg-black/15">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] shadow-md transition-transform duration-300 group-hover:scale-110 sm:h-9 sm:w-9">
            <Play size={14} className="ms-0.5 fill-[#1D1707]" />
          </span>
        </span>
        {tutorial.duration && (
          <span
            className="absolute bottom-1 end-1 inline-flex items-center gap-0.5 rounded bg-[#15121C]/90 px-1.5 py-0.5 text-[10px] font-medium text-[#F0EAE2] backdrop-blur sm:hidden"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {tutorial.duration}
          </span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        {tutorial.category && (
          <span
            className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#C9A227]"
            style={{ fontFamily: "var(--font-geist-mono)" }}
          >
            {tutorial.category}
          </span>
        )}
        <h3
          className="mt-0.5 truncate text-sm font-medium text-[#F0EAE2] sm:text-base"
          style={{ fontFamily: "var(--font-display)" }}
        >
          {tutorial.title}
        </h3>
        {tutorial.description && (
          <p className="mt-0.5 line-clamp-1 text-xs text-[#B7B2C4] sm:text-sm">
            {tutorial.description}
          </p>
        )}
      </div>

      {tutorial.duration && (
        <span
          className="hidden flex-shrink-0 items-center gap-1 text-xs text-[#6E687A] sm:inline-flex"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          <Clock size={12} className="text-[#C9A227]" />
          {tutorial.duration}
        </span>
      )}

      <span className="hidden flex-shrink-0 text-[#6E687A] transition-transform duration-200 group-hover:translate-x-0.5 group-hover:text-[#C9A227] rtl:group-hover:-translate-x-0.5 sm:inline-flex">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path
            d="m9 18 6-6-6-6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function TutorialsPage() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState("");
  const [activeVideo, setActiveVideo] = useState(null);

  const lang = tutorialsText[language] ? language : "en";
  const t = tutorialsText[lang];
  const isRTL = lang === "ps" || lang === "prs";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [lang, mounted, isRTL]);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      setFetchError("");
      try {
        const res = await fetch(`/api/public/tutorials?lang=${lang}`, {
          cache: "no-store",
        });
        if (!res.ok) throw new Error("Request failed");
        const data = await res.json();
        if (!cancelled) setTutorials(data.tutorials || []);
      } catch {
        if (!cancelled) setFetchError(t.error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lang]);

  if (!mounted) {
    return <LoadingScreen text={tutorialsText.en.loading} fullScreen />;
  }

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-x-hidden bg-[#15121C] text-[#F0EAE2]`}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 12 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={10 + col * 36}
              y={10 + row * 36}
              width="18"
              height="18"
              rx="4"
              fill="none"
              stroke="#F0EAE2"
              strokeWidth="1"
            />
          )),
        )}
      </svg>

      <div
        className="blob-a pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="blob-b pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full bg-[#C9A227]/8 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-3xl px-6 py-20 sm:py-24">
        <div className="text-center">
          <h1
            className="mt-1 text-4xl font-medium tracking-tight text-[#F0EAE2] sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.titleA}{" "}
            <span
              className={"text-[#C9A227] " + (isRTL ? "not-italic" : "italic")}
            >
              {t.titleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#B7B2C4] sm:text-base">
            {t.subtitle}
          </p>
        </div>

        <div className="mt-12">
          {loading ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="flex animate-pulse items-center gap-4 rounded-xl border border-[#2E2938] bg-[#1E1B26]/80 p-3 sm:p-4"
                >
                  <div className="aspect-video w-24 flex-shrink-0 rounded-lg bg-[#332C3E] sm:w-36" />
                  <div className="flex-1 space-y-2">
                    <div className="h-2.5 w-16 rounded bg-[#332C3E]" />
                    <div className="h-4 w-3/4 rounded bg-[#332C3E]" />
                    <div className="h-3 w-1/2 rounded bg-[#332C3E]" />
                  </div>
                </div>
              ))}
            </div>
          ) : fetchError ? (
            <div className="rounded-2xl border border-[#E5484D]/50 bg-[#E5484D]/10 px-5 py-4 text-center text-sm text-[#FF9B9E]">
              <AlertCircle size={18} className="mx-auto mb-2" />
              {fetchError}
            </div>
          ) : tutorials.length === 0 ? (
            <div className="rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 px-5 py-16 text-center text-sm text-[#9691A6]">
              {t.empty}
            </div>
          ) : (
            <div className="space-y-2">
              {tutorials.map((tutorial) => (
                <TutorialRow
                  key={tutorial.id}
                  tutorial={tutorial}
                  watchLabel={t.watchLabel}
                  onPlay={setActiveVideo}
                />
              ))}
            </div>
          )}
        </div>

        <div className="mt-16 rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 p-8 text-center backdrop-blur-sm sm:p-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A227]">
            <Sparkles size={12} />
            {t.ctaTitle}
          </span>
          <p className="mx-auto mt-3 max-w-md text-sm text-[#B7B2C4] sm:text-base">
            {t.ctaSubtitle}
          </p>

          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] px-6 py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30 active:translate-y-0 active:scale-[0.98]"
            >
              {t.ctaButton}
              <ArrowIcon
                size={15}
                className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
              />
            </Link>
            <Link
              href="/pricing"
              className="inline-flex items-center gap-2 rounded-lg border border-[#332C3E] px-6 py-3 text-sm font-semibold text-[#F0EAE2] transition-all duration-200 hover:-translate-y-0.5 hover:border-[#C9A227] hover:text-[#C9A227]"
            >
              {t.ctaSecondary}
            </Link>
          </div>
        </div>
      </div>

      {/* Modal is only rendered when a video is open — so its scroll-lock
          effect never runs on page load, which was what froze the page. */}
      {activeVideo && (
        <VideoModal
          tutorial={activeVideo}
          onClose={() => setActiveVideo(null)}
        />
      )}

      <style jsx>{`
        @keyframes drift-a {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(30px, 40px);
          }
        }
        @keyframes drift-b {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-40px, 30px);
          }
        }
        .blob-a {
          animation: drift-a 11s ease-in-out infinite;
        }
        .blob-b {
          animation: drift-b 13s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .blob-a,
          .blob-b {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
