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

function HeroSlider({ slides, pinnedBadge }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const timeoutRef = useRef(null);
  const count = slides.length;

  const goTo = (i) => setIndex(((i % count) + count) % count);
  const next = () => goTo(index + 1);
  const prev = () => goTo(index - 1);

  // Autoplay — advances automatically, restarts cleanly on manual navigation or pause toggle
  useEffect(() => {
    if (paused || count <= 1) return;
    timeoutRef.current = setTimeout(() => {
      setIndex((i) => (i + 1) % count);
    }, SLIDE_DURATION);
    return () => clearTimeout(timeoutRef.current);
  }, [paused, count, index]);

  if (!count) return null;

  return (
    <div className="mb-16">
      {/* Main image area — full browser width, no crossfade, no video-style
          play/pause control. Just the current photo, swapped instantly. */}
      <div
        className="relative w-screen max-w-none overflow-x-hidden"
        style={{
          marginInlineStart: "calc(50% - 50vw)",
          marginInlineEnd: "calc(50% - 50vw)",
        }}
        onMouseEnter={() => setPaused(true)}
        onMouseLeave={() => setPaused(false)}
      >
        <div
          dir="ltr"
          className="relative w-full h-[300px] sm:h-[420px] md:h-[500px] overflow-hidden"
        >
          {/* Coverflow layout — the active slide sits centered at full focus;
              its immediate neighbors peek in from the edges, scaled down,
              dimmed and blurred, so three images are visible at once. */}
          {slides.map((slide, i) => {
            // Shortest-path offset from the active slide, wrapping around
            // (e.g. for the last slide, "next" wraps back to slide 0).
            let offset = i - index;
            if (offset > count / 2) offset -= count;
            if (offset < -count / 2) offset += count;

            const isActive = offset === 0;
            const isNeighbor = Math.abs(offset) === 1;
            if (!isActive && !isNeighbor) return null; // keep DOM light

            return (
              <div
                key={slide.id}
                onClick={() => !isActive && goTo(i)}
                className={`absolute inset-y-0 left-1/2 w-[80%] sm:w-[62%] md:w-[52%] transition-all duration-500 ease-in-out ${
                  isActive ? "z-20 cursor-default" : "z-10 cursor-pointer"
                }`}
                style={{
                  transform: `translateX(calc(-50% + ${offset * 100}%)) scale(${
                    isActive ? 1 : 0.86
                  })`,
                }}
              >
                <div
                  className={`relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden shadow-xl transition-all duration-500 ${
                    isActive ? "" : "blur-[2px] brightness-[0.55]"
                  }`}
                >
                  <Image
                    src={slide.imageUrl}
                    alt={slide.title}
                    fill
                    priority={i === 0}
                    className="object-cover"
                    sizes="(max-width: 768px) 80vw, 52vw"
                  />

                  {isActive && (
                    <>
                      {/* Duotone-style gradient wash for a more designed, less "raw photo" look */}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/5" />
                      <div className="absolute inset-0 bg-gradient-to-r from-black/40 via-transparent to-transparent" />

                      {/* Floating content card */}
                      <div className="absolute inset-x-0 bottom-0 px-4 sm:px-6 md:px-10 pb-6 sm:pb-8">
                        <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold text-white leading-tight drop-shadow-md">
                          {slide.title}
                        </h2>

                        {slide.description && (
                          <p className="max-w-md text-sm sm:text-base text-white/85">
                            {slide.description}
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pinned-selection badge — floats in front of the slider so the
              chosen category is always reachable without scrolling down. */}
          {pinnedBadge && (
            <div className="absolute top-3 start-4 sm:start-8 md:start-14 z-30">
              {pinnedBadge}
            </div>
          )}

          {/* Prev / Next arrows — always visible, glassy circular buttons */}
          <button
            onClick={prev}
            aria-label="Previous slide"
            className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white shadow-lg transition-all hover:scale-105"
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={next}
            aria-label="Next slide"
            className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-30 flex items-center justify-center w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/15 hover:bg-white/25 backdrop-blur-md border border-white/25 text-white shadow-lg transition-all hover:scale-105"
          >
            <ChevronRight size={20} />
          </button>

          {/* Gradient progress-style dots */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 z-30 flex items-center gap-1.5">
            {slides.map((s, i) => (
              <button
                key={s.id}
                onClick={() => goTo(i)}
                aria-label={`Go to slide ${i + 1}`}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === index
                    ? "w-7 bg-gradient-to-r from-blue-400 via-purple-500 to-amber-400"
                    : "w-1.5 bg-gray-400/60 dark:bg-white/40 hover:bg-gray-500/70 dark:hover:bg-white/60"
                }`}
              />
            ))}
          </div>
        </div>
      </div>
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

// ---------- Category quick-access bar ----------
// Shown first, above the hero slider. Spans the full browser width (breaks
// out of the page's centered max-w-6xl container) and wraps into a centered
// row on larger screens, or scrolls horizontally on narrow ones. Tapping a
// pill jumps straight to that vehicle's detail page, same as tapping its
// card in the grid below.
function CategoryQuickBar({ vehicles, activeId, onSelect, categoryLabel }) {
  if (!vehicles?.length) return null;

  return (
    <div
      className="mb-10 w-screen max-w-none overflow-x-hidden"
      style={{
        marginInlineStart: "calc(50% - 50vw)",
        marginInlineEnd: "calc(50% - 50vw)",
      }}
    >
      <div className="border-y sm:border-y-0 sm:border-b border-gray-200/70 dark:border-gray-700/70 bg-white/70 dark:bg-zinc-900/70 backdrop-blur-md shadow-sm">
        <div
          className="flex sm:flex-wrap sm:justify-center items-stretch gap-2.5 sm:gap-3 px-4 sm:px-8 md:px-14 py-3.5 sm:py-4 overflow-x-auto scrollbar-none"
          role="tablist"
          aria-label={categoryLabel}
        >
          {vehicles.map((vehicle) => {
            const cat = vehicleCategory[vehicle.id];
            const CatIcon = cat?.icon;
            const isActive = activeId === vehicle.id;

            return (
              <button
                key={vehicle.id}
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => onSelect(vehicle)}
                className={`group flex flex-col sm:flex-row items-center gap-1.5 sm:gap-2 shrink-0 rounded-2xl sm:rounded-full px-3.5 sm:px-4 py-2.5 sm:py-2 min-w-[74px] sm:min-w-0 text-[11px] sm:text-sm font-semibold whitespace-nowrap border transition-all duration-200 ${
                  isActive
                    ? `bg-gradient-to-r ${vehicle.color} text-white border-transparent shadow-md sm:scale-105`
                    : "bg-white dark:bg-gray-800/70 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-md hover:-translate-y-0.5"
                }`}
              >
                <span
                  className={`flex items-center justify-center w-8 h-8 sm:w-6 sm:h-6 rounded-full shrink-0 ${
                    isActive
                      ? "bg-white/20"
                      : `bg-gradient-to-br ${vehicle.color}`
                  }`}
                >
                  {CatIcon && <CatIcon size={15} className="text-white" />}
                </span>
                {vehicle.name}
              </button>
            );
          })}
        </div>
      </div>

      <style jsx>{`
        .scrollbar-none::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-none {
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
// ---------- End category quick-access bar ----------

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
        {/* Category quick-access bar — shown first, before the hero image
            slider, full-width and responsive */}
        <CategoryQuickBar
          vehicles={vehicles}
          activeId={pinnedVehicle?.id}
          onSelect={selectVehicle}
          categoryLabel={text.categoryLabel}
        />

        {/* Hero image slider — its own independent images, plus the
            pinned-selection badge floating in front of it */}
        <HeroSlider
          slides={slides}
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
