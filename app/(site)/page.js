// app/page.js
"use client";

import Image from "next/image";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { vehiclesData } from "@/data/icons";
import { sliderData } from "@/data/sliderData";
import {
  X,
  Users,
  HardHat,
  Droplet,
  PackageCheck,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Pause,
  Play,
  MousePointerClick,
  ChevronDown,
  ArrowLeft,
} from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";

// Localized static text
const pageText = {
  en: {
    welcome: "Welcome to Rawan Logistic Services",
    footer: "Tap a card for details – local vehicle images",
    tapHint: "Tap to explore",
    categoryLabel: "Category",
    viewDetails: "select ",
    selectCue: "Select a category below to get started",
    loading: "Getting things moving",
  },
  ps: {
    welcome: "روان لوژستیک خدماتو ته ښه راغلاست",
    footer: "د تفصیلاتو لپاره په کارت کلیک وکړئ – د موټر محلي انځورونه",
    tapHint: "د معلوماتو لپاره کلیک وکړئ",
    categoryLabel: "کټګورۍ",
    viewDetails: "وټاکي",
    selectCue: "د پیل کولو لپاره لاندې یوه کټګورۍ وټاکئ",
    loading: "چمتووالی روان دی",
  },
  prs: {
    welcome: "به خدمات لوژستیک روان خوش آمدید",
    footer: "برای جزئیات روی کارت کلیک کنید – تصاویر محلی وسایط",
    tapHint: "برای مشاهده کلیک کنید",
    categoryLabel: "دسته‌بندی",
    viewDetails: "  انتخاب کړي",
    selectCue: "برای شروع، یک دسته‌بندی را از پایین انتخاب کنید",
    loading: "در حال آماده شدن",
  },
};

// Simple category classification — this is the piece your data doesn't carry yet.
// Truck and Dump Truck intentionally share the same category (both heavy freight).
const vehicleCategory = {
  taxi: {
    icon: Users,
    label: { en: "Passenger", ps: "مسافر وړونکی", prs: "مسافربری" },
  },
  loader: {
    icon: HardHat,
    label: { en: "Construction", ps: "ساختماني", prs: "ساختمانی" },
  },
  tanker: {
    icon: Droplet,
    label: { en: "Liquid Cargo", ps: "مایع بار", prs: "بار مایع" },
  },
  truck: {
    icon: PackageCheck,
    label: { en: "Freight Cargo", ps: "د بار لیږد", prs: "باربری" },
  },
  "dump-truck": {
    icon: PackageCheck,
    label: { en: "Freight Cargo", ps: "د بار لیږد", prs: "باربری" },
  },
};

// ---------- Hero image slider ----------
// Uses its own independent slide content (sliderData) — separate from the vehicle grid below.
// Auto-advances every SLIDE_DURATION ms. Progress is shown as "story"-style segmented
// bars above the slide (each segment fills in real time), which double as click targets.
const SLIDE_DURATION = 6000; // 6s — was 25s, felt static before

function HeroSlider({ slides, welcomeText, pinnedBadge }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progressKey, setProgressKey] = useState(0); // remounts the progress bar to restart its fill animation
  const timeoutRef = useRef(null);
  const count = slides.length;

  const goTo = (i) => {
    setIndex(((i % count) + count) % count);
    setProgressKey((k) => k + 1);
  };
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Autoplay — advances automatically, restarts cleanly on manual navigation or pause toggle
  useEffect(() => {
    if (paused || count <= 1) return;
    timeoutRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % count);
      setProgressKey((k) => k + 1);
    }, SLIDE_DURATION);
    return () => clearTimeout(timeoutRef.current);
  }, [paused, count, index]);

  if (!count) return null;

  return (
    <div className="mb-16">
      {/* Welcome banner */}
      <div className="text-center mb-6">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
          {welcomeText}
        </h1>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-400 via-purple-500 to-amber-400 mx-auto mt-4 rounded-full" />
      </div>

      {/* Story-style progress bars — encode both position and pacing */}
      <div className="flex gap-1.5 mb-3 px-1">
        {slides.map((s, i) => (
          <button
            key={s.id}
            onClick={() => goTo(i)}
            aria-label={`Go to slide ${i + 1}`}
            className="relative h-1 flex-1 rounded-full bg-gray-300/60 dark:bg-white/15 overflow-hidden"
          >
            {i < index && (
              <span className="absolute inset-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full" />
            )}
            {i === index && (
              <span
                key={progressKey}
                className="absolute inset-y-0 left-0 bg-gradient-to-r from-blue-400 to-purple-500 rounded-full"
                style={{
                  animation: `hero-progress ${SLIDE_DURATION}ms linear forwards`,
                  animationPlayState: paused ? "paused" : "running",
                }}
              />
            )}
          </button>
        ))}
      </div>

      {/* Main slide area */}
      <div
        className="relative w-full h-[320px] sm:h-[420px] md:h-[520px] rounded-3xl overflow-hidden shadow-xl group"
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        {slides.map((slide, i) => (
          <div
            key={slide.id}
            className={`absolute inset-0 transition-opacity duration-700 ease-in-out ${
              i === index ? "opacity-100 z-10" : "opacity-0 z-0"
            }`}
          >
            {/* Ken Burns: slow drift/zoom on the active slide only, restarts each time it becomes active */}
            <div
              className="absolute inset-0"
              style={
                i === index
                  ? {
                      animation: `hero-kenburns ${SLIDE_DURATION + 700}ms ease-out forwards`,
                      animationPlayState: paused ? "paused" : "running",
                    }
                  : undefined
              }
            >
              <Image
                src={slide.imageUrl}
                alt={slide.title}
                fill
                priority={i === 0}
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
            </div>

            {/* Gradient overlay for text legibility only — no color tint over the photo */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

            {/* Title + description overlay, with a small staggered rise-in on entry */}
            <div className="absolute inset-x-0 bottom-0 p-6 sm:p-10 text-white">
              <h2
                className="text-3xl sm:text-4xl md:text-5xl font-extrabold drop-shadow-sm"
                style={
                  i === index
                    ? { animation: "hero-rise-in 600ms ease-out 150ms both" }
                    : undefined
                }
              >
                {slide.title}
              </h2>
              {slide.description && (
                <p
                  className="mt-2 max-w-lg text-sm sm:text-base text-white/85"
                  style={
                    i === index
                      ? { animation: "hero-rise-in 600ms ease-out 280ms both" }
                      : undefined
                  }
                >
                  {slide.description}
                </p>
              )}
            </div>
          </div>
        ))}

        {/* Pinned-selection badge — floats in front of the slider (z-30, above the
            slides at z-10 and the arrows at z-20) so the chosen category is always
            reachable without scrolling down manually, no matter which slide is showing. */}
        {pinnedBadge && (
          <div className="absolute top-3 start-3 z-30 animate-in fade-in slide-in-from-top-2 duration-300">
            {pinnedBadge}
          </div>
        )}

        {/* Prev / Next arrows */}
        <button
          onClick={prev}
          aria-label="Previous slide"
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
        >
          <ChevronLeft size={22} />
        </button>
        <button
          onClick={next}
          aria-label="Next slide"
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 p-2 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
        >
          <ChevronRight size={22} />
        </button>

        {/* Play/pause toggle + slide counter */}
        <div className="absolute bottom-3 right-3 z-20 flex items-center gap-2">
          <span className="px-2 py-0.5 rounded-full bg-black/30 backdrop-blur-sm text-white text-[11px] font-medium tabular-nums">
            {String(index + 1).padStart(2, "0")} /{" "}
            {String(count).padStart(2, "0")}
          </span>
          <button
            onClick={() => setPaused((p) => !p)}
            aria-label={paused ? "Play slideshow" : "Pause slideshow"}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 backdrop-blur-sm text-white transition"
          >
            {paused ? <Play size={13} /> : <Pause size={13} />}
          </button>
        </div>
      </div>

      {/* Local keyframes for the slider's motion */}
      <style jsx>{`
        @keyframes hero-progress {
          from {
            width: 0%;
          }
          to {
            width: 100%;
          }
        }
        @keyframes hero-kenburns {
          from {
            transform: scale(1);
          }
          to {
            transform: scale(1.08);
          }
        }
        @keyframes hero-rise-in {
          from {
            opacity: 0;
            transform: translateY(14px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @media (prefers-reduced-motion: reduce) {
          div {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
// ---------- End hero slider ----------

// ---------- Pointer cue for the category cards ----------
// Sits between the hero and the grid, telling the user the cards below are the
// actual next step. Bounces gently to draw the eye, and unmounts itself for good
// once the user has clicked any card, so it never nags returning visitors.
function SelectCue({ text, dismissed }) {
  if (dismissed) return null;

  return (
    <div className="flex flex-col items-center gap-1.5 mb-6 select-none">
      <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/30 text-blue-600 dark:text-blue-300 text-sm font-medium shadow-sm">
        <MousePointerClick size={15} className="shrink-0" />
        <span>{text}</span>
      </div>
      <ChevronDown
        size={20}
        className="text-blue-400 dark:text-blue-400/70 animate-bounce"
      />
    </div>
  );
}
// ---------- End pointer cue ----------

export default function Home() {
  const { language } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [hasSelectedOnce, setHasSelectedOnce] = useState(false);

  // The "pinned" vehicle is what the badge in front of the slider jumps to.
  const [pinnedVehicle, setPinnedVehicle] = useState(null);
  const cardRefs = useRef({});

  useEffect(() => setMounted(true), []);

  // ---------- Loading state ----------
  // Shown until the client has mounted (avoids any flash of footer/empty
  // content before the real page + hero slider render). Reusable, responsive
  // component — see components/LoadingScreen.jsx.
  if (!mounted) {
    return (
      <LoadingScreen
        text={pageText.en.loading}
        brandName="KOHISTAN"
        subtitle="Logistic Services"
        size="md"
      />
    );
  }

  const vehicles = vehiclesData[language] || vehiclesData.en;
  const slides = sliderData[language] || sliderData.en;
  const text = pageText[language] || pageText.en;
  const lang = pageText[language] ? language : "en";
  const isRTL = lang === "ps" || lang === "prs";

  // Click a card -> pin it (for the badge) and go straight to the detail page.
  const selectVehicle = (vehicle) => {
    setPinnedVehicle(vehicle);
    setHasSelectedOnce(true);
    router.push(`/${vehicle.id}`);
  };

  const jumpToPinned = () => {
    if (!pinnedVehicle) return;
    cardRefs.current[pinnedVehicle.id]?.scrollIntoView({
      behavior: "smooth",
      block: "center",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-gray-100 dark:from-black dark:to-zinc-900 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Hero image slider — its own independent images + welcome banner, plus
            the pinned-selection badge floating in front of it */}
        <HeroSlider
          slides={slides}
          welcomeText={text.welcome}
          pinnedBadge={
            pinnedVehicle && (
              <div className="flex items-center gap-1 rounded-full bg-black/40 backdrop-blur-sm shadow-lg pl-1 pr-1 py-1">
                <button
                  type="button"
                  onClick={jumpToPinned}
                  className="flex items-center gap-2 pl-1.5 pr-2 py-1 rounded-full hover:bg-white/10 text-white text-xs font-medium transition"
                >
                  <span className="relative w-6 h-6 rounded-full overflow-hidden ring-1 ring-white/40 shrink-0">
                    <Image
                      src={pinnedVehicle.imageUrl}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="24px"
                    />
                  </span>
                  <span className="max-w-[30vw] sm:max-w-[160px] truncate">
                    {pinnedVehicle.name}
                  </span>
                  <ChevronDown size={13} className="opacity-80 shrink-0" />
                </button>
                <button
                  type="button"
                  onClick={() => setPinnedVehicle(null)}
                  aria-label="Clear selection"
                  className="p-1 rounded-full hover:bg-white/15 text-white/80 shrink-0"
                >
                  <X size={12} />
                </button>
              </div>
            )
          }
        />

        {/* Pointer cue — draws the eye down to the category cards, which are easy to miss
            underneath a large hero image. Bounces gently and fades away permanently once
            the user has clicked any card. */}
        <SelectCue text={text.selectCue} dismissed={hasSelectedOnce} />

        {/* Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">
          {vehicles.map((vehicle, idx) => {
            const cat = vehicleCategory[vehicle.id];
            const CatIcon = cat?.icon;
            const isPinned = pinnedVehicle?.id === vehicle.id;

            return (
              <div
                key={vehicle.id}
                ref={(el) => {
                  cardRefs.current[vehicle.id] = el;
                }}
                role="button"
                tabIndex={0}
                onClick={() => selectVehicle(vehicle)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    selectVehicle(vehicle);
                  }
                }}
                style={{ animationDelay: `${idx * 70}ms` }}
                className={`group flex flex-col items-center p-5 rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border scroll-mt-6 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-400 animate-in fade-in slide-in-from-bottom-4 duration-500 ${
                  isPinned
                    ? "border-blue-400 dark:border-blue-400 ring-2 ring-blue-300/70 dark:ring-blue-500/40"
                    : idx === 0 && !hasSelectedOnce
                      ? "border-blue-300 dark:border-blue-500/50 ring-2 ring-blue-300/60 dark:ring-blue-500/30"
                      : "border-gray-100 dark:border-gray-700"
                }`}
              >
                <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden shadow-md ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-400 transition-all duration-300 group-hover:scale-105 bg-white dark:bg-gray-800">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${vehicle.color} opacity-20 group-hover:opacity-30 transition z-0`}
                  />
                  <Image
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 144px, 160px"
                  />

                  {/* Category icon badge, top-right of the image */}
                  {CatIcon && (
                    <div
                      className={`absolute -top-1 -right-1 z-10 p-1.5 rounded-full bg-gradient-to-br ${vehicle.color} shadow-md ring-2 ring-white dark:ring-gray-800`}
                    >
                      <CatIcon size={14} className="text-white" />
                    </div>
                  )}
                </div>

                <div className="mt-4 text-center">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {vehicle.name}
                  </h2>
                  {vehicle.description && (
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 leading-snug">
                      {vehicle.description}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    selectVehicle(vehicle);
                  }}
                  className={`mt-3 inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r ${vehicle.color} text-white text-xs font-semibold px-4 py-2 shadow-sm hover:opacity-90 hover:shadow-md transition-all`}
                >
                  {text.viewDetails}
                  {isRTL && <ArrowLeft size={13} />}
                  {!isRTL && <ArrowRight size={13} />}
                </button>
              </div>
            );
          })}
        </div>

        <div className="mt-20 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>{text.footer}</p>
        </div>
      </div>
    </div>
  );
}
