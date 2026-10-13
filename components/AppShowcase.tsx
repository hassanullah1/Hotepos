"use client";

import { useEffect, useRef, useState } from "react";
import {
  Pizza,
  Drumstick,
  Coffee,
  Soup,
  Cake,
  UtensilsCrossed,
  Wifi,
  BatteryFull,
  ShoppingBag,
  Printer,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// ----- Food menu (only static structure – labels come from translations) -----
const MENU_ITEMS = [
  { icon: Pizza, key: "pizza" },
  { icon: Drumstick, key: "chicken" },
  { icon: Coffee, key: "drinks" },
  { icon: Soup, key: "soups" },
  { icon: Cake, key: "desserts" },
  { icon: UtensilsCrossed, key: "sides" },
];

const FOOD_ITEMS = {
  pizza: [
    { name: "Margherita", price: 300 },
    { name: "Pepperoni", price: 350 },
    { name: "Veggie", price: 320 },
  ],
  chicken: [
    { name: "Grilled Chicken", price: 400 },
    { name: "Fried Chicken", price: 380 },
    { name: "Chicken Tikka", price: 420 },
  ],
  drinks: [
    { name: "Coffee", price: 150 },
    { name: "Tea", price: 100 },
    { name: "Soda", price: 120 },
  ],
  soups: [
    { name: "Tomato Soup", price: 180 },
    { name: "Chicken Soup", price: 220 },
  ],
  desserts: [
    { name: "Cheesecake", price: 250 },
    { name: "Brownie", price: 200 },
  ],
  sides: [
    { name: "Fries", price: 140 },
    { name: "Garlic Bread", price: 160 },
    { name: "Salad", price: 180 },
  ],
};

const LINE_HEIGHT = 10;

// ----- Background SVG Drawings (Kitchen Theme) – unchanged -----
const KITCHEN_DRAWINGS = [
  {
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <circle cx="12" cy="12" r="8" />
        <line x1="20" y1="12" x2="24" y2="12" />
      </svg>
    ),
  },
  {
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M12 4C9 4 7 6 7 9C5 9 4 11 4 13C4 15 5 17 7 17H17C19 17 20 15 20 13C20 11 19 9 17 9C17 6 15 4 12 4Z" />
      </svg>
    ),
  },
  {
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <rect x="4" y="10" width="16" height="4" rx="2" />
        <circle cx="4" cy="12" r="3" />
        <circle cx="20" cy="12" r="3" />
      </svg>
    ),
  },
  {
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M6 4L8 8L6 12L8 16L6 20" />
        <path d="M10 4L12 8L10 12L12 16L10 20" />
        <path d="M14 4L16 8L14 12L16 16L14 20" />
        <line x1="4" y1="20" x2="18" y2="20" />
      </svg>
    ),
  },
  {
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M5 2L5 14" />
        <path d="M5 6L9 6" />
        <path d="M5 10L9 10" />
        <path d="M5 14L9 14" />
        <path d="M5 18L5 22" />
      </svg>
    ),
  },
  {
    svg: (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
      >
        <path d="M18 2L12 10L10 12L8 14L6 16L8 18L10 16L12 14L14 12L18 2Z" />
        <path d="M16 4L20 8" />
      </svg>
    ),
  },
];

const FLOATING_ICONS = [
  { Icon: Pizza, color: "#C9A227", size: 20, delay: 0 },
  { Icon: Coffee, color: "#C9A227", size: 16, delay: 2 },
  { Icon: Soup, color: "#C9A227", size: 14, delay: 4 },
  { Icon: Cake, color: "#C9A227", size: 18, delay: 1 },
  { Icon: Drumstick, color: "#C9A227", size: 15, delay: 3 },
  { Icon: UtensilsCrossed, color: "#C9A227", size: 12, delay: 5 },
];

export default function AppShowcase({ isRTL }) {
  const t = useTranslation();
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  // Order state
  const [order, setOrder] = useState([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const orderRef = useRef([]);
  const totalRef = useRef(0);

  // Receipt state
  const [receiptLines, setReceiptLines] = useState([]);
  const [printProgress, setPrintProgress] = useState(0);
  const [isTorn, setIsTorn] = useState(false);
  const [isPrinting, setIsPrinting] = useState(false);

  const [clickedKey, setClickedKey] = useState(null);

  // Loop state machine
  const [loopPhase, setLoopPhase] = useState("idle");

  // ----- Scroll trigger -----
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.5 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ----- Sound helpers (unchanged) -----
  const playClickSound = () => {
    if (!inView) return;
    try {
      const ctx = new (window.AudioContext || (window as any).AudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.value = 800;
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch (_) {
      /* ignore */
    }
  };

  const playPrintSound = () => {
    if (!inView) return;
    try {
      const ctx = new (window.AudioContext || (window as any).AudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sawtooth";
      osc.frequency.value = 300;
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.25);
    } catch (_) {
      /* ignore */
    }
  };

  // ----- Loop phases (unchanged) -----
  useEffect(() => {
    if (!inView) return;
    if (
      loopPhase === "idle" &&
      orderRef.current.length === 0 &&
      !isPrinting &&
      !isTorn
    ) {
      setLoopPhase("ordering");
    }
  }, [inView, loopPhase, isPrinting, isTorn]);

  useEffect(() => {
    if (loopPhase !== "ordering") return;
    const timers = [
      setTimeout(() => addItem("pizza"), 300),
      setTimeout(() => addItem("chicken"), 900),
      setTimeout(() => addItem("drinks"), 1500),
      setTimeout(() => setLoopPhase("printing"), 2200),
    ];
    return () => timers.forEach(clearTimeout);
  }, [loopPhase]);

  useEffect(() => {
    if (loopPhase !== "printing") return;
    if (orderRef.current.length === 0) {
      setLoopPhase("clearing");
      return;
    }
    handlePrint();
  }, [loopPhase]);

  useEffect(() => {
    if (loopPhase !== "clearing") return;
    const timer = setTimeout(() => {
      clearOrder();
      setLoopPhase("idle");
      setTimeout(() => {
        if (orderRef.current.length === 0 && !isPrinting && !isTorn) {
          setLoopPhase("ordering");
        }
      }, 500);
    }, 1000);
    return () => clearTimeout(timer);
  }, [loopPhase]);

  useEffect(() => {
    if (isTorn && loopPhase === "printing") {
      setLoopPhase("clearing");
    }
  }, [isTorn, loopPhase]);

  // ----- Print animation driver -----
  useEffect(() => {
    if (!isPrinting || receiptLines.length === 0) return;
    const totalLines = receiptLines.length;
    const startDelay = 400;
    const lineDuration = 80;
    const totalDuration = totalLines * lineDuration;
    let startTime = performance.now() + startDelay;
    let rafId;

    const step = () => {
      const elapsed = performance.now() - startTime;
      const rawProgress = Math.min(elapsed / totalDuration, 1);
      setPrintProgress(rawProgress);
      if (rawProgress < 1) {
        rafId = requestAnimationFrame(step);
      } else {
        setIsTorn(true);
        setIsPrinting(false);
      }
    };
    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isPrinting, receiptLines]);

  // ----- Helpers -----
  const buildReceipt = (items, total) => {
    const lines = [];
    lines.push({
      text: "FLAVOR KITCHEN",
      align: "center",
      weight: "bold",
      size: "large",
    });
    lines.push({
      text: `Order #${Math.floor(1000 + Math.random() * 9000)}`,
      align: "center",
      weight: "normal",
    });
    lines.push({ text: "────────────────", align: "center" });

    items.forEach((item) => {
      lines.push({ left: item.name, right: `${item.price} Af` });
    });

    lines.push({ text: "────────────────", align: "center" });
    const subtotal = total;
    const tax = Math.round(subtotal * 0.05);
    const service = Math.round(subtotal * 0.1);
    const grandTotal = subtotal + tax + service;

    lines.push({ left: "SUBTOTAL", right: `${subtotal} Af` });
    lines.push({ left: "TAX (5%)", right: `${tax} Af` });
    lines.push({ left: "SERVICE CHARGE", right: `${service} Af` });
    lines.push({ left: "────────────────", align: "center" });
    lines.push({
      left: "TOTAL",
      right: `${grandTotal} Af`,
      weight: "bold",
      size: "large",
    });
    lines.push({ text: "Thank you for dining", align: "center" });
    lines.push({ text: "Visit again!", align: "center", weight: "bold" });

    return lines;
  };

  const addItem = (categoryKey) => {
    if (isPrinting || isTorn) return;
    playClickSound();
    setClickedKey(categoryKey);
    setTimeout(() => setClickedKey(null), 400);

    const items = FOOD_ITEMS[categoryKey];
    if (!items || items.length === 0) return;
    const randomItem = items[Math.floor(Math.random() * items.length)];

    setOrder((prev) => {
      const newOrder = [...prev, randomItem];
      orderRef.current = newOrder;
      return newOrder;
    });
    setOrderTotal((prev) => {
      const newTotal = prev + randomItem.price;
      totalRef.current = newTotal;
      return newTotal;
    });
  };

  const handlePrint = () => {
    if (orderRef.current.length === 0 || isPrinting || isTorn) return;
    playPrintSound();
    const newReceipt = buildReceipt(orderRef.current, totalRef.current);
    setReceiptLines(newReceipt);
    setPrintProgress(0);
    setIsTorn(false);
    setIsPrinting(true);
  };

  const clearOrder = () => {
    if (isPrinting) return;
    setOrder([]);
    setOrderTotal(0);
    orderRef.current = [];
    totalRef.current = 0;
    setReceiptLines([]);
    setPrintProgress(0);
    setIsTorn(false);
    setIsPrinting(false);
  };

  // ----- Localized strings from flat translations -----
  const appTime = t.showcaseAppTime || "12:14";
  const appEyebrow = t.showcaseAppEyebrow || "Food POS";
  const appTitle = t.showcaseAppTitle || "Flavor Kitchen";
  const showcaseTitle = t.showcaseTitle || "Auto‑Loop POS Demo";
  const showcaseSubtitle =
    t.showcaseSubtitle ||
    "The POS automatically takes orders, prints receipts, clears, and repeats – all with full animations: button glow, line‑by‑line printing, and tear‑off.";

  // Map menu keys to translation keys
  const menuKeys = {
    pizza: "showcaseMenuPizza",
    chicken: "showcaseMenuChicken",
    drinks: "showcaseMenuDrinks",
    soups: "showcaseMenuSoups",
    desserts: "showcaseMenuDesserts",
    sides: "showcaseMenuSides",
  };

  const getMenuLabel = (key) => {
    const translationKey = menuKeys[key];
    return t[translationKey] || key.charAt(0).toUpperCase() + key.slice(1);
  };

  const printedCount = Math.floor(printProgress * (receiptLines.length || 0));
  const paperHeight = Math.max(20 + printedCount * LINE_HEIGHT, 30);

  return (
    <section
      ref={sectionRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative bg-[#F8F7F4] py-4 md:py-6 pt-16 overflow-y-visible"
    >
      {/* ===== ENHANCED KITCHEN BACKGROUND (unchanged) ===== */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Warm gradient overlays */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(201,162,39,0.04) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(201,162,39,0.03) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              linear-gradient(rgba(201,162,39,0.04) 1px, transparent 1px),
              linear-gradient(90deg, rgba(201,162,39,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "60px 60px",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 50%, rgba(201,162,39,0.06) 1px, transparent 1px),
              radial-gradient(circle at 80% 30%, rgba(201,162,39,0.04) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px, 60px 60px",
            backgroundPosition: "0 0, 20px 20px",
          }}
        />

        {/* Kitchen SVG Drawings (large, faint) */}
        {KITCHEN_DRAWINGS.map((drawing, index) => (
          <div
            key={`drawing-${index}`}
            className="absolute floating-drawing"
            style={{
              top: `${5 + index * 18}%`,
              left: `${2 + index * 14}%`,
              width: `${60 + index * 20}px`,
              height: `${60 + index * 20}px`,
              color: "#da3d1d",
              opacity: 0.04,
              animationDelay: `${index * 0.8}s`,
            }}
          >
            {drawing.svg}
          </div>
        ))}
        {KITCHEN_DRAWINGS.map((drawing, index) => (
          <div
            key={`drawing-right-${index}`}
            className="absolute floating-drawing-right"
            style={{
              top: `${8 + index * 16}%`,
              right: `${3 + index * 12}%`,
              width: `${50 + index * 18}px`,
              height: `${50 + index * 18}px`,
              color: "#c95d27",
              opacity: 0.03,
              animationDelay: `${index * 0.6 + 1.5}s`,
            }}
          >
            {drawing.svg}
          </div>
        ))}

        {/* Floating food icons (left & right) */}
        {FLOATING_ICONS.map(({ Icon, color, size, delay }, index) => (
          <div
            key={index}
            className="absolute floating-icon"
            style={{
              top: `${15 + index * 12}%`,
              left: `${5 + index * 15}%`,
              animationDelay: `${delay}s`,
              opacity: 0.08,
              transform: `scale(${0.6 + index * 0.05})`,
            }}
          >
            <Icon size={size + index * 2} color={color} strokeWidth={1.5} />
          </div>
        ))}
        {FLOATING_ICONS.map(({ Icon, color, size, delay }, index) => (
          <div
            key={`right-${index}`}
            className="absolute floating-icon-right"
            style={{
              top: `${10 + index * 15}%`,
              right: `${8 + index * 12}%`,
              animationDelay: `${delay + 1.5}s`,
              opacity: 0.06,
              transform: `scale(${0.5 + index * 0.05})`,
            }}
          >
            <Icon size={size + index * 2 + 4} color={color} strokeWidth={1.5} />
          </div>
        ))}

        {/* Floating order numbers */}
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`order-${i}`}
            className="absolute floating-shape"
            style={{
              top: `${20 + i * 18}%`,
              left: `${50 + i * 8}%`,
              animationDelay: `${i * 1.2}s`,
              opacity: 0.04,
              fontSize: `${24 + i * 6}px`,
              fontWeight: "bold",
              color: "#c92727",
              fontFamily: "monospace",
            }}
          >
            #{1000 + i * 111}
          </div>
        ))}

        {/* Floating dots */}
        {[...Array(8)].map((_, i) => (
          <div
            key={`dot-${i}`}
            className="absolute floating-dot"
            style={{
              top: `${5 + i * 12}%`,
              left: `${30 + i * 7}%`,
              animationDelay: `${i * 0.8}s`,
              width: `${3 + (i % 3) * 2}px`,
              height: `${3 + (i % 3) * 2}px`,
              borderRadius: "50%",
              backgroundColor: "#C9A227",
              opacity: 0.04,
            }}
          />
        ))}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-10 mx-auto grid max-w-4xl grid-cols-1 items-center gap-4 px-4 lg:grid-cols-[0.9fr_1.1fr] lg:gap-6">
        {/* ===== POS DEVICE (LEFT) ===== */}
        <div
          className="flex items-center justify-center transition-all duration-700 ease-out"
          style={{
            transformOrigin: "top center",
            transform: inView ? "scaleY(1)" : "scaleY(0.2)",
            opacity: inView ? 1 : 0,
          }}
        >
          <div
            className="relative w-full max-w-[240px] aspect-[340/500]"
            style={{
              transition:
                "transform 600ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 400ms ease-out",
            }}
          >
            {/* Receipt */}
            {receiptLines.length > 0 && (
              <div
                className="absolute left-1/2 z-30 w-[82%] overflow-hidden bg-[#FFFDF7] px-2 pb-1.5 pt-2 shadow-[0_8px_24px_-8px_rgba(0,0,0,0.5)]"
                style={{
                  bottom: "86%",
                  height: `${paperHeight}px`,
                  maxHeight: `${paperHeight}px`,
                  opacity: printedCount > 0 ? 1 : 0,
                  transformOrigin: "bottom center",
                  transform: isTorn
                    ? "translateX(-50%) rotate(-2deg) scale(0.98)"
                    : "translateX(-50%) rotate(0deg)",
                  transition:
                    "height 180ms ease-out, max-height 180ms ease-out, opacity 250ms ease-out, transform 300ms cubic-bezier(0.34, 1.56, 0.64, 1)",
                  clipPath:
                    "polygon(0 0,100% 0,100% calc(100% - 4px),92% 100%,84% calc(100% - 4px),76% 100%,68% calc(100% - 4px),60% 100%,52% calc(100% - 4px),44% 100%,36% calc(100% - 4px),28% 100%,20% calc(100% - 4px),12% 100%,4% calc(100% - 4px),0 100%)",
                  display: "flex",
                  flexDirection: "column-reverse",
                  justifyContent: "flex-start",
                  alignItems: "stretch",
                }}
              >
                <div className="font-mono text-[6px] leading-[10px] text-[#2b2b2b] tracking-[-0.2px] w-full">
                  {receiptLines.slice(-printedCount).map((line, idx) => {
                    const indexFromBottom = printedCount - idx - 1;
                    const delay = indexFromBottom * 50;
                    return (
                      <div
                        key={idx}
                        style={{
                          animationDelay: `${delay}ms`,
                          animationFillMode: "forwards",
                        }}
                        className="opacity-0 animate-fadeInUp"
                      >
                        {line.left ? (
                          <div
                            className={`flex justify-between gap-2 ${
                              line.weight === "bold" ? "font-bold" : ""
                            } ${line.size === "large" ? "text-[8px]" : ""}`}
                          >
                            <span>{line.left}</span>
                            <span>{line.right}</span>
                          </div>
                        ) : (
                          <div
                            className={`text-center ${
                              line.weight === "bold" ? "font-bold" : ""
                            } ${line.size === "large" ? "text-[8px]" : ""}`}
                          >
                            {line.text}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Printer slot */}
            <div
              className="absolute left-1/2 z-20 w-[80%] flex items-center justify-center rounded-b-lg bg-[#0B1220] shadow-[inset_0_-2px_4px_rgba(0,0,0,0.5)]"
              style={{
                bottom: "82%",
                height: "8%",
                minHeight: "16px",
                transform: "translateX(-50%)",
              }}
            >
              <span className="h-1 w-3/4 rounded-full bg-black/60" />
            </div>

            {/* Device casing */}
            <div className="absolute bottom-0 left-0 right-0 h-[82%] rounded-[1.5rem] bg-gradient-to-b from-[#1a2540] to-[#0B1220] p-[3%] shadow-2xl shadow-black/40">
              <span className="absolute right-[5%] top-[5%] z-20 h-1.5 w-1.5 rounded-full bg-slate-700 shadow-inner" />

              {/* Screen */}
              <div className="relative z-10 h-full overflow-hidden rounded-lg bg-white flex flex-col">
                {/* Status bar */}
                <div className="flex items-center justify-between bg-[#0B1220] px-2 py-0.5 text-white">
                  <span className="text-[7px] font-medium">{appTime}</span>
                  <span className="flex items-center gap-0.5">
                    <Wifi size={8} />
                    <BatteryFull size={10} />
                  </span>
                </div>

                {/* App header */}
                <div className="border-b border-slate-100 px-2 pb-0.5 pt-1">
                  <p className="text-[6px] text-slate-400">{appEyebrow}</p>
                  <p className="mt-0.5 font-serif text-[9px] font-semibold text-[#0B1220]">
                    {appTitle}
                  </p>
                </div>

                {/* Menu Grid */}
                <div className="grid grid-cols-2 gap-1 px-2 py-1 flex-1">
                  {MENU_ITEMS.map(({ icon: Icon, key }, i) => {
                    const isClicked = clickedKey === key;
                    return (
                      <button
                        key={key}
                        onClick={() => addItem(key)}
                        disabled={isPrinting || isTorn}
                        className={`
                          flex flex-col items-center gap-0 transition-all duration-200
                          focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed
                          ${isClicked ? "scale-90" : "hover:scale-105 active:scale-95"}
                        `}
                        style={{
                          transitionDelay: inView ? `${200 + i * 40}ms` : "0ms",
                          opacity: inView ? 1 : 0,
                          transform: inView ? "scale(1)" : "scale(0.85)",
                        }}
                      >
                        <span
                          className={`
                            flex h-7 w-7 shrink-0 items-center justify-center rounded-lg
                            bg-[#C9A227]/15 transition-all duration-300
                            ${isClicked ? "bg-[#C9A227]/40 shadow-[0_0_16px_rgba(201,162,39,0.5)]" : ""}
                            ${isClicked ? "scale-110" : "scale-100"}
                          `}
                        >
                          <Icon
                            size={14}
                            className={`text-[#8a6f16] transition-all duration-300 ${
                              isClicked ? "scale-125" : ""
                            }`}
                          />
                        </span>
                        <p className="text-center text-[6px] font-medium leading-tight text-[#0B1220]">
                          {getMenuLabel(key)}
                        </p>
                      </button>
                    );
                  })}
                </div>

                {/* Order Summary */}
                <div className="border-t border-slate-100 bg-slate-50/80 px-2 py-1">
                  {orderRef.current.length === 0 ? (
                    <div className="text-center text-[6px] text-slate-400 py-0.5">
                      {loopPhase === "idle" ? "🔄 Auto‑loop" : "⏳ Loading…"}
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        <ShoppingBag size={10} className="text-slate-600" />
                        <span className="text-[7px] font-medium">
                          {orderRef.current.length}
                        </span>
                        <span className="text-[7px] font-semibold text-[#0B1220]">
                          {totalRef.current} Af
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => {
                            clearOrder();
                            setLoopPhase("idle");
                          }}
                          disabled={isPrinting}
                          className="text-[6px] text-slate-400 hover:text-slate-600 transition disabled:opacity-50"
                        >
                          Clear
                        </button>
                        <button
                          onClick={() => handlePrint()}
                          disabled={
                            isPrinting ||
                            isTorn ||
                            orderRef.current.length === 0
                          }
                          className="flex items-center gap-0.5 rounded-full bg-[#0B1220] px-2 py-0.5 text-[6px] font-medium text-white transition hover:bg-[#1a2540] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Printer size={8} />
                          {isPrinting ? "…" : isTorn ? "✓" : ""}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Home button */}
                <div className="flex justify-center py-1 border-t border-slate-200/50 bg-white/50">
                  <span className="block h-3 w-3 rounded-full border-2 border-slate-500" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TEXT COLUMN (RIGHT) ===== */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            transformOrigin: "bottom center",
            transform: inView ? "scaleY(1)" : "scaleY(0.2)",
            opacity: inView ? 1 : 0,
          }}
        >
          <h2 className="font-serif text-xl leading-tight text-[#0B1220] sm:text-2xl">
            {showcaseTitle}
          </h2>
          <p className="mt-2 max-w-[50ch] text-sm leading-relaxed text-slate-600">
            {showcaseSubtitle}
          </p>
        </div>
      </div>

      {/* Custom animations – unchanged */}
      <style jsx>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(3px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes floatIcon {
          0% {
            transform: translateY(0px) rotate(0deg) scale(0.8);
            opacity: 0.04;
          }
          25% {
            transform: translateY(-18px) rotate(3deg) scale(1);
            opacity: 0.12;
          }
          50% {
            transform: translateY(-8px) rotate(-2deg) scale(0.9);
            opacity: 0.08;
          }
          75% {
            transform: translateY(-25px) rotate(2deg) scale(1.1);
            opacity: 0.1;
          }
          100% {
            transform: translateY(0px) rotate(0deg) scale(0.8);
            opacity: 0.04;
          }
        }
        @keyframes floatIconRight {
          0% {
            transform: translateY(0px) rotate(0deg) scale(0.7);
            opacity: 0.03;
          }
          30% {
            transform: translateY(-22px) rotate(-4deg) scale(0.9);
            opacity: 0.1;
          }
          60% {
            transform: translateY(-12px) rotate(3deg) scale(1);
            opacity: 0.08;
          }
          100% {
            transform: translateY(0px) rotate(0deg) scale(0.7);
            opacity: 0.03;
          }
        }
        @keyframes floatDrawing {
          0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.04;
          }
          50% {
            transform: translateY(-12px) rotate(2deg);
            opacity: 0.08;
          }
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.04;
          }
        }
        @keyframes floatDrawingRight {
          0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.03;
          }
          50% {
            transform: translateY(-15px) rotate(-2deg);
            opacity: 0.07;
          }
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.03;
          }
        }
        @keyframes floatShape {
          0% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.02;
          }
          50% {
            transform: translateY(-15px) rotate(5deg);
            opacity: 0.06;
          }
          100% {
            transform: translateY(0px) rotate(0deg);
            opacity: 0.02;
          }
        }
        @keyframes floatDot {
          0% {
            transform: translateY(0px);
            opacity: 0.02;
          }
          50% {
            transform: translateY(-20px);
            opacity: 0.06;
          }
          100% {
            transform: translateY(0px);
            opacity: 0.02;
          }
        }
        .floating-icon {
          animation: floatIcon 8s ease-in-out infinite;
        }
        .floating-icon-right {
          animation: floatIconRight 9s ease-in-out infinite;
        }
        .floating-drawing {
          animation: floatDrawing 10s ease-in-out infinite;
        }
        .floating-drawing-right {
          animation: floatDrawingRight 11s ease-in-out infinite;
        }
        .floating-shape {
          animation: floatShape 7s ease-in-out infinite;
        }
        .floating-dot {
          animation: floatDot 6s ease-in-out infinite;
        }
        .animate-fadeInUp {
          animation-name: fadeInUp;
          animation-duration: 0.12s;
          animation-timing-function: ease-out;
          animation-fill-mode: forwards;
          opacity: 0;
        }
        button:disabled {
          pointer-events: none;
        }
      `}</style>
    </section>
  );
}
