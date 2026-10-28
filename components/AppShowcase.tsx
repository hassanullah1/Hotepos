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
  CreditCard,
  Check,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// ----- Food menu (labels come from translations) -----
const MENU_ITEMS = [
  { icon: Pizza, key: "pizza" },
  { icon: Drumstick, key: "chicken" },
  { icon: Coffee, key: "drinks" },
  { icon: Soup, key: "soups" },
  { icon: Cake, key: "desserts" },
  { icon: UtensilsCrossed, key: "sides" },
];

const FOOD_ITEMS: Record<string, { name: string; price: number }[]> = {
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

// ----- Background drawings (unchanged) -----
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

type Phase = "idle" | "ordering" | "printing" | "paying" | "paid" | "taking";
type PayStage = "standby" | "wait" | "processing" | "approved";
type Line = {
  text?: string;
  left?: string;
  right?: string;
  align?: string;
  weight?: string;
  size?: string;
};

// scene units (viewBox 520 wide) -> container-query width units
const q = (v: number) => `${(v / 5.2).toFixed(3)}cqw`;
const LINE_H = 9.4;

// ----- sound (only while the section is on screen) -----
function beep(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.15,
) {
  try {
    const AC = window.AudioContext || (window as any).webkitAudioContext;
    const ctx = new AC();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + dur);
    setTimeout(() => ctx.close?.(), dur * 1000 + 100);
  } catch (_) {
    /* ignore */
  }
}

function buildReceipt(items: { name: string; price: number }[], total: number) {
  const tax = Math.round(total * 0.05);
  const service = Math.round(total * 0.1);
  const grand = total + tax + service;
  const lines: Line[] = [
    { text: "FLAVOR KITCHEN", align: "center", weight: "bold", size: "large" },
    {
      text: `Order #${Math.floor(1000 + Math.random() * 9000)}`,
      align: "center",
    },
    { text: "────────────────", align: "center" },
    ...items.map((i) => ({ left: i.name, right: `${i.price} Af` })),
    { text: "────────────────", align: "center" },
    { left: "SUBTOTAL", right: `${total} Af` },
    { left: "TAX (5%)", right: `${tax} Af` },
    { left: "SERVICE", right: `${service} Af` },
    { text: "────────────────", align: "center" },
    { left: "TOTAL", right: `${grand} Af`, weight: "bold", size: "large" },
    { text: "Thank you for dining", align: "center" },
  ];
  return { lines, grand };
}

export default function AppShowcase({ isRTL }: { isRTL?: boolean }) {
  const t: any = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const inViewRef = useRef(false);

  const [order, setOrder] = useState<{ name: string; price: number }[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [grand, setGrand] = useState(0);
  const [receiptLines, setReceiptLines] = useState<Line[]>([]);
  const [printProgress, setPrintProgress] = useState(0);
  const [isPrinting, setIsPrinting] = useState(false);
  const [isTorn, setIsTorn] = useState(false);
  const [stamped, setStamped] = useState(false);
  const [taken, setTaken] = useState(false);
  const [clickedKey, setClickedKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [payStage, setPayStage] = useState<PayStage>("standby");
  const [cardOn, setCardOn] = useState(false);
  const [cardKey, setCardKey] = useState(0);

  // ----- scroll trigger -----
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        inViewRef.current = entry.isIntersecting;
      },
      { threshold: 0.35 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ----- the whole story, repeated while the section is visible -----
  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const frame = () =>
      new Promise<void>((r) => requestAnimationFrame(() => r()));
    const sound = (f: () => void) => {
      if (inViewRef.current) f();
    };

    const run = async () => {
      while (!cancelled) {
        // reset
        setOrder([]);
        setOrderTotal(0);
        setGrand(0);
        setReceiptLines([]);
        setPrintProgress(0);
        setIsPrinting(false);
        setIsTorn(false);
        setStamped(false);
        setTaken(false);
        setCardOn(false);
        setPayStage("standby");
        setPhase("ordering");
        await sleep(800);
        if (cancelled) return;

        // 1) take the order
        const items: { name: string; price: number }[] = [];
        let total = 0;
        for (const key of ["pizza", "chicken", "drinks"]) {
          const list = FOOD_ITEMS[key];
          const item = list[Math.floor(Math.random() * list.length)];
          items.push(item);
          total += item.price;
          sound(() => beep(800, 0.1));
          setClickedKey(key);
          setOrder([...items]);
          setOrderTotal(total);
          await sleep(450);
          setClickedKey(null);
          await sleep(250);
          if (cancelled) return;
        }
        await sleep(500);

        // 2) print the bill
        setPhase("printing");
        const { lines, grand: g } = buildReceipt(items, total);
        setGrand(g);
        setReceiptLines(lines);
        setPrintProgress(0);
        setIsPrinting(true);
        sound(() => beep(300, 0.25, "sawtooth", 0.1));
        const t0 = performance.now() + 400;
        const dur = lines.length * 80;
        while (!cancelled) {
          const p = Math.min(Math.max((performance.now() - t0) / dur, 0), 1);
          setPrintProgress(p);
          if (p >= 1) break;
          await frame();
        }
        if (cancelled) return;
        setIsPrinting(false);
        setIsTorn(true);
        await sleep(900);
        if (cancelled) return;

        // 3) tap the card
        setPhase("paying");
        setPayStage("wait");
        setCardKey((k) => k + 1);
        setCardOn(true);
        await sleep(1700);
        if (cancelled) return;
        setPayStage("processing");
        sound(() => beep(1200, 0.08));
        await sleep(1100);
        if (cancelled) return;

        // 4) paid
        setPayStage("approved");
        setPhase("paid");
        setStamped(true);
        sound(() => {
          beep(880, 0.12);
          setTimeout(() => beep(1320, 0.2), 130);
        });
        await sleep(2100);
        if (cancelled) return;

        // 5) customer takes the receipt
        setPhase("taking");
        setCardOn(false);
        setTaken(true);
        await sleep(1300);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [inView]);

  // ----- strings -----
  const appTime = t.showcaseAppTime || "12:14";
  const appEyebrow = t.showcaseAppEyebrow || "Food POS";
  const appTitle = t.showcaseAppTitle || "Flavor Kitchen";
  const showcaseTitle = t.showcaseTitle || "Order, print, tap and get paid";
  const showcaseSubtitle =
    t.showcaseSubtitle ||
    "The POS takes the order, prints the bill, accepts a contactless card and confirms the payment — then it starts again.";
  const sTapCard = t.showcaseTapCard || "Tap card to pay";
  const sPaid = t.showcasePaid || "Paid";
  const sApproved = t.showcaseApproved || "Approved";
  const sProcessing = t.showcaseProcessing || "Processing…";
  const sReceived = t.showcaseReceived || "Payment received";
  const sReady = t.showcaseReady || "Ready";
  const steps = [
    { Icon: ShoppingBag, label: t.showcaseStepOrder || "Take the order" },
    { Icon: Printer, label: t.showcaseStepPrint || "Print the bill" },
    { Icon: CreditCard, label: t.showcaseStepPay || "Tap the card" },
    { Icon: Check, label: t.showcaseStepPaid || "Payment received" },
  ];
  const activeStep =
    phase === "ordering"
      ? 0
      : phase === "printing"
        ? 1
        : phase === "paying"
          ? 2
          : phase === "paid" || phase === "taking"
            ? 3
            : -1;

  const menuKeys: Record<string, string> = {
    pizza: "showcaseMenuPizza",
    chicken: "showcaseMenuChicken",
    drinks: "showcaseMenuDrinks",
    soups: "showcaseMenuSoups",
    desserts: "showcaseMenuDesserts",
    sides: "showcaseMenuSides",
  };
  const getMenuLabel = (key: string) =>
    t[menuKeys[key]] || key.charAt(0).toUpperCase() + key.slice(1);

  const printedCount = Math.floor(printProgress * (receiptLines.length || 0));
  const paperH = 12 + printedCount * LINE_H; // scene units

  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";

  return (
    <section
      ref={sectionRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-y-visible bg-[#F8F7F4] py-10 md:py-14"
    >
      {/* ===== KITCHEN BACKGROUND ===== */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(201,162,39,0.05) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(201,162,39,0.04) 0%, transparent 50%)",
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
        {KITCHEN_DRAWINGS.map((drawing, index) => (
          <div
            key={`drawing-${index}`}
            className="floating-drawing absolute"
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
            className="floating-drawing-right absolute"
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
        {FLOATING_ICONS.map(({ Icon, color, size, delay }, index) => (
          <div
            key={index}
            className="floating-icon absolute"
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
            className="floating-icon-right absolute"
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
        {[1, 2, 3, 4].map((i) => (
          <div
            key={`order-${i}`}
            className="floating-shape absolute"
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
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        {/* ===== POS SCENE ===== */}
        <div
          className="mx-auto w-full max-w-[540px] transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView
              ? "translateY(0) scale(1)"
              : "translateY(18px) scale(0.96)",
          }}
        >
          <div
            dir="ltr"
            className="relative w-full"
            style={{ containerType: "inline-size" }}
            aria-hidden="true"
          >
            <svg
              viewBox="0 90 520 470"
              className="block h-auto w-full"
              fill="none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <linearGradient id="sc-counter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#F3EEE2" />
                  <stop offset="0.12" stopColor="#E3DBC8" />
                  <stop offset="1" stopColor="#B9AF99" />
                </linearGradient>
                <linearGradient id="sc-frame" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#4A4F5E" />
                  <stop offset="0.5" stopColor="#262A35" />
                  <stop offset="1" stopColor="#14161D" />
                </linearGradient>
                <linearGradient id="sc-metal" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#5A5F6E" />
                  <stop offset="0.45" stopColor="#B9BECB" />
                  <stop offset="1" stopColor="#4A4F5E" />
                </linearGradient>
                <linearGradient id="sc-printer" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3A3E4A" />
                  <stop offset="1" stopColor="#171920" />
                </linearGradient>
                <linearGradient id="sc-lip" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#575C6B" />
                  <stop offset="1" stopColor="#2B2E38" />
                </linearGradient>
                <linearGradient id="sc-term" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#3C404D" />
                  <stop offset="0.5" stopColor="#1C1F28" />
                  <stop offset="1" stopColor="#0F1117" />
                </linearGradient>
                <linearGradient id="sc-key" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#3A3E4B" />
                  <stop offset="1" stopColor="#242731" />
                </linearGradient>
                <linearGradient id="sc-lcd" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#12243A" />
                  <stop offset="1" stopColor="#09131F" />
                </linearGradient>
                <linearGradient id="sc-card" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#2A3A66" />
                  <stop offset="1" stopColor="#0B1220" />
                </linearGradient>
                <linearGradient id="sc-chip" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#F4D77A" />
                  <stop offset="1" stopColor="#B8891A" />
                </linearGradient>
                <radialGradient id="sc-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor="#E0B93A" stopOpacity="0.22" />
                  <stop offset="1" stopColor="#E0B93A" stopOpacity="0" />
                </radialGradient>
                <filter
                  id="sc-blur"
                  x="-30%"
                  y="-100%"
                  width="160%"
                  height="300%"
                >
                  <feGaussianBlur stdDeviation="6" />
                </filter>
              </defs>

              <ellipse
                cx="260"
                cy="300"
                rx="270"
                ry="230"
                fill="url(#sc-glow)"
              />

              <rect
                x="-14"
                y="468"
                width="548"
                height="100"
                rx="16"
                fill="url(#sc-counter)"
              />
              <rect
                x="-14"
                y="468"
                width="548"
                height="3"
                fill="#fff"
                opacity="0.8"
              />
              <rect
                x="-14"
                y="530"
                width="548"
                height="38"
                fill="#8E846F"
                opacity="0.28"
              />

              <ellipse
                cx="150"
                cy="478"
                rx="104"
                ry="9"
                fill="#000"
                opacity="0.35"
                filter="url(#sc-blur)"
              />
              <ellipse
                cx="353"
                cy="478"
                rx="72"
                ry="7"
                fill="#000"
                opacity="0.35"
                filter="url(#sc-blur)"
              />
              <ellipse
                cx="460"
                cy="480"
                rx="54"
                ry="6"
                fill="#000"
                opacity="0.35"
                filter="url(#sc-blur)"
              />

              <path
                d="M150 474C158 506 288 510 318 476"
                stroke="#12141A"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M150 473C158 504 288 508 318 475"
                stroke="#4A4F5E"
                strokeWidth="1"
                strokeLinecap="round"
                opacity="0.7"
              />
              <path
                d="M386 476C402 504 440 506 452 482"
                stroke="#12141A"
                strokeWidth="3.5"
                strokeLinecap="round"
              />

              <path d="M128 440H172L178 464H122Z" fill="url(#sc-metal)" />
              <rect
                x="82"
                y="460"
                width="136"
                height="14"
                rx="7"
                fill="url(#sc-frame)"
              />
              <rect
                x="90"
                y="472"
                width="22"
                height="3"
                rx="1.5"
                fill="#0B0C10"
              />
              <rect
                x="188"
                y="472"
                width="22"
                height="3"
                rx="1.5"
                fill="#0B0C10"
              />

              <rect
                x="24"
                y="120"
                width="252"
                height="324"
                rx="22"
                fill="url(#sc-frame)"
              />
              <rect
                x="24.5"
                y="120.5"
                width="251"
                height="323"
                rx="21.5"
                stroke="#fff"
                strokeOpacity="0.22"
              />
              <rect
                x="30"
                y="126"
                width="240"
                height="312"
                rx="17"
                fill="#07080C"
              />
              <circle cx="150" cy="130.5" r="1.9" fill="#1A1D26" />
              <circle cx="149.4" cy="129.9" r="0.6" fill="#5B6B9A" />
              <circle cx="118" cy="431.5" r="0.9" fill="#3C404C" />
              <circle cx="125" cy="431.5" r="0.9" fill="#3C404C" />
              <circle cx="132" cy="431.5" r="0.9" fill="#3C404C" />
              <circle cx="139" cy="431.5" r="0.9" fill="#3C404C" />
              <circle cx="146" cy="431.5" r="0.9" fill="#3C404C" />
              <circle cx="153" cy="431.5" r="0.9" fill="#3C404C" />
              <circle cx="160" cy="431.5" r="0.9" fill="#3C404C" />
              <circle cx="167" cy="431.5" r="0.9" fill="#3C404C" />
              <rect
                x="274"
                y="196"
                width="3.5"
                height="34"
                rx="1.7"
                fill="#8A90A0"
              />
              <rect
                x="274"
                y="238"
                width="3.5"
                height="18"
                rx="1.7"
                fill="#8A90A0"
              />

              <rect
                x="296"
                y="388"
                width="114"
                height="88"
                rx="11"
                fill="url(#sc-printer)"
              />
              <rect
                x="296.5"
                y="388.5"
                width="113"
                height="87"
                rx="10.5"
                stroke="#fff"
                strokeOpacity="0.12"
              />
              <rect
                x="312"
                y="391"
                width="82"
                height="5"
                rx="2.5"
                fill="#030407"
              />
              <rect
                x="308"
                y="414"
                width="90"
                height="46"
                rx="7"
                fill="#1B1E27"
                stroke="#2D313D"
              />
              <path d="M318 448.0H388" stroke="#0E1016" strokeWidth="1.1" />
              <path d="M318 451.2H388" stroke="#0E1016" strokeWidth="1.1" />
              <path d="M318 454.4H388" stroke="#0E1016" strokeWidth="1.1" />
              <circle
                className="sc-led"
                cx="322"
                cy="426"
                r="3"
                fill="#4ADE80"
              />
              <rect
                x="358"
                y="421"
                width="30"
                height="12"
                rx="6"
                fill="#2C303C"
                stroke="#3E4352"
              />
              <text
                x="373"
                y="429.5"
                textAnchor="middle"
                fontSize="5"
                fontWeight="700"
                fill="#9AA0B2"
                fontFamily="system-ui, sans-serif"
                letterSpacing="0.6"
              >
                FEED
              </text>
              <rect
                x="304"
                y="472"
                width="16"
                height="4"
                rx="2"
                fill="#0B0C10"
              />
              <rect
                x="386"
                y="472"
                width="16"
                height="4"
                rx="2"
                fill="#0B0C10"
              />

              <path d="M424 470H496L502 482H418Z" fill="#0B0C10" />
              <rect
                x="414"
                y="250"
                width="92"
                height="224"
                rx="17"
                fill="url(#sc-term)"
              />
              <rect
                x="414.5"
                y="250.5"
                width="91"
                height="223"
                rx="16.5"
                stroke="#fff"
                strokeOpacity="0.2"
              />
              <rect
                x="422"
                y="256"
                width="76"
                height="30"
                rx="9"
                fill="#10131A"
                stroke="#2A2E3A"
              />
              <g
                className="sc-waves"
                stroke="#8A90A4"
                strokeWidth="1.5"
                strokeLinecap="round"
              >
                <path d="M453 266q5 5 0 10" />
                <path d="M458 263q8 8 0 16" />
                <path d="M463 260q11 11 0 22" />
              </g>
              {[432, 444, 476, 488].map((x, i) => (
                <circle
                  key={x}
                  cx={x}
                  cy="281"
                  r="1.8"
                  className={payStage === "wait" ? "sc-ledblink" : undefined}
                  fill={
                    payStage === "approved"
                      ? "#4ADE80"
                      : payStage === "processing"
                        ? "#E4B93A"
                        : "#3A3F4E"
                  }
                  style={{ animationDelay: `${i * 0.18}s` }}
                />
              ))}
              <rect
                x="422"
                y="290"
                width="76"
                height="66"
                rx="6"
                fill="#04060A"
              />
              <rect
                x="425"
                y="293"
                width="70"
                height="60"
                rx="3.5"
                fill="url(#sc-lcd)"
              />
              <rect
                x="424"
                y="362"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="435"
                y="370"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                1
              </text>
              <rect
                x="451"
                y="362"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="462"
                y="370"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                2
              </text>
              <rect
                x="478"
                y="362"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="489"
                y="370"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                3
              </text>
              <rect
                x="424"
                y="376"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="435"
                y="384"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                4
              </text>
              <rect
                x="451"
                y="376"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="462"
                y="384"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                5
              </text>
              <rect
                x="478"
                y="376"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="489"
                y="384"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                6
              </text>
              <rect
                x="424"
                y="390"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="435"
                y="398"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                7
              </text>
              <rect
                x="451"
                y="390"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="462"
                y="398"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                8
              </text>
              <rect
                x="478"
                y="390"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="489"
                y="398"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                9
              </text>
              <rect
                x="424"
                y="404"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="435"
                y="412"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                *
              </text>
              <rect
                x="451"
                y="404"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="462"
                y="412"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                0
              </text>
              <rect
                x="478"
                y="404"
                width="22"
                height="11"
                rx="3"
                fill="url(#sc-key)"
              />
              <text
                x="489"
                y="412"
                textAnchor="middle"
                fontSize="6.5"
                fontWeight="600"
                fill="#C9CEDA"
                fontFamily="system-ui, sans-serif"
              >
                #
              </text>
              <rect
                x="424"
                y="420"
                width="22"
                height="12"
                rx="3.5"
                fill="#D64545"
              />
              <rect
                x="426"
                y="421.5"
                width="18"
                height="3"
                rx="1.5"
                fill="#fff"
                opacity="0.28"
              />
              <rect
                x="451"
                y="420"
                width="22"
                height="12"
                rx="3.5"
                fill="#E4B93A"
              />
              <rect
                x="453"
                y="421.5"
                width="18"
                height="3"
                rx="1.5"
                fill="#fff"
                opacity="0.28"
              />
              <rect
                x="478"
                y="420"
                width="22"
                height="12"
                rx="3.5"
                fill="#3FB56B"
              />
              <rect
                x="480"
                y="421.5"
                width="18"
                height="3"
                rx="1.5"
                fill="#fff"
                opacity="0.28"
              />
              <circle cx="435" cy="446" r="1.1" fill="#07080C" />
              <circle cx="435" cy="453" r="1.1" fill="#07080C" />
              <circle cx="435" cy="460" r="1.1" fill="#07080C" />
              <circle cx="443" cy="446" r="1.1" fill="#07080C" />
              <circle cx="443" cy="453" r="1.1" fill="#07080C" />
              <circle cx="443" cy="460" r="1.1" fill="#07080C" />
              <circle cx="451" cy="446" r="1.1" fill="#07080C" />
              <circle cx="451" cy="453" r="1.1" fill="#07080C" />
              <circle cx="451" cy="460" r="1.1" fill="#07080C" />
              <circle cx="459" cy="446" r="1.1" fill="#07080C" />
              <circle cx="459" cy="453" r="1.1" fill="#07080C" />
              <circle cx="459" cy="460" r="1.1" fill="#07080C" />
              <circle cx="467" cy="446" r="1.1" fill="#07080C" />
              <circle cx="467" cy="453" r="1.1" fill="#07080C" />
              <circle cx="467" cy="460" r="1.1" fill="#07080C" />
              <circle cx="475" cy="446" r="1.1" fill="#07080C" />
              <circle cx="475" cy="453" r="1.1" fill="#07080C" />
              <circle cx="475" cy="460" r="1.1" fill="#07080C" />
              <circle cx="483" cy="446" r="1.1" fill="#07080C" />
              <circle cx="483" cy="453" r="1.1" fill="#07080C" />
              <circle cx="483" cy="460" r="1.1" fill="#07080C" />
              <circle cx="491" cy="446" r="1.1" fill="#07080C" />
              <circle cx="491" cy="453" r="1.1" fill="#07080C" />
              <circle cx="491" cy="460" r="1.1" fill="#07080C" />
            </svg>

            {/* ---------- POS screen (HTML) ---------- */}
            <div
              className="absolute flex flex-col overflow-hidden bg-white"
              style={{
                left: q(36),
                top: q(44),
                width: q(226),
                height: q(294),
                borderRadius: q(9),
                fontFamily: sans,
              }}
            >
              <div
                className="flex items-center justify-between bg-[#0B1220] text-white"
                style={{ padding: `${q(3)} ${q(8)}` }}
              >
                <span style={{ fontSize: q(8), fontWeight: 500 }}>
                  {appTime}
                </span>
                <span className="flex items-center" style={{ gap: q(3) }}>
                  <Wifi style={{ width: q(9), height: q(9) }} />
                  <BatteryFull style={{ width: q(11), height: q(11) }} />
                </span>
              </div>

              <div
                style={{
                  padding: `${q(6)} ${q(9)} ${q(4)}`,
                  borderBottom: "1px solid #EEF0F4",
                }}
              >
                <div style={{ fontSize: q(7), color: "#94A3B8" }}>
                  {appEyebrow}
                </div>
                <div
                  style={{
                    fontSize: q(11.5),
                    fontWeight: 700,
                    color: "#0B1220",
                    fontFamily: "Georgia, serif",
                  }}
                >
                  {appTitle}
                </div>
              </div>

              <div
                className="grid flex-1 grid-cols-3 content-start"
                style={{ padding: q(8), gap: q(6) }}
              >
                {MENU_ITEMS.map(({ icon: Icon, key }) => {
                  const on = clickedKey === key;
                  return (
                    <div
                      key={key}
                      className="flex flex-col items-center justify-center"
                      style={{
                        gap: q(3),
                        padding: `${q(7)} 0`,
                        borderRadius: q(8),
                        border: `1px solid ${on ? "#C9A227" : "#EEF0F4"}`,
                        background: on ? "rgba(201,162,39,0.12)" : "#FAFBFC",
                        boxShadow: on
                          ? "0 0 0 3px rgba(201,162,39,0.25)"
                          : "none",
                        transform: on ? "scale(0.94)" : "scale(1)",
                        transition: "all 0.2s ease",
                      }}
                    >
                      <span
                        className="flex items-center justify-center"
                        style={{
                          width: q(24),
                          height: q(24),
                          borderRadius: q(7),
                          background: on
                            ? "rgba(201,162,39,0.35)"
                            : "rgba(201,162,39,0.14)",
                          transition: "background .2s",
                        }}
                      >
                        <Icon
                          style={{
                            width: q(13),
                            height: q(13),
                            color: "#8A6F16",
                          }}
                        />
                      </span>
                      <span
                        style={{
                          fontSize: q(7.5),
                          fontWeight: 600,
                          color: "#0B1220",
                        }}
                      >
                        {getMenuLabel(key)}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* order / payment footer */}
              <div
                style={{
                  padding: q(7),
                  borderTop: "1px solid #EEF0F4",
                  background: "#F8FAFC",
                }}
              >
                {phase === "paid" || phase === "taking" ? (
                  <div
                    className="sc-pop flex items-center justify-center"
                    style={{
                      gap: q(5),
                      padding: `${q(6)} 0`,
                      borderRadius: q(8),
                      background: "#16A34A",
                      color: "#fff",
                      fontSize: q(10),
                      fontWeight: 700,
                    }}
                  >
                    <Check
                      style={{ width: q(12), height: q(12) }}
                      strokeWidth={3}
                    />
                    {sPaid} · {grand} Af
                  </div>
                ) : phase === "paying" ? (
                  <div
                    className="sc-glowbar flex items-center justify-center"
                    style={{
                      gap: q(5),
                      padding: `${q(6)} 0`,
                      borderRadius: q(8),
                      background: "#0B1220",
                      color: "#F4D77A",
                      fontSize: q(9),
                      fontWeight: 600,
                    }}
                  >
                    <Wifi
                      className="sc-contactless"
                      style={{ width: q(11), height: q(11) }}
                    />
                    {sTapCard} · {grand} Af
                  </div>
                ) : order.length === 0 ? (
                  <div
                    className="text-center"
                    style={{
                      fontSize: q(8),
                      color: "#94A3B8",
                      padding: `${q(5)} 0`,
                    }}
                  >
                    {sReady}
                  </div>
                ) : (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center" style={{ gap: q(4) }}>
                      <ShoppingBag
                        style={{
                          width: q(11),
                          height: q(11),
                          color: "#475569",
                        }}
                      />
                      <span style={{ fontSize: q(9), fontWeight: 600 }}>
                        {order.length}
                      </span>
                      <span
                        style={{
                          fontSize: q(9),
                          fontWeight: 700,
                          color: "#0B1220",
                        }}
                      >
                        {orderTotal} Af
                      </span>
                    </span>
                    <span
                      className="flex items-center"
                      style={{
                        gap: q(3),
                        padding: `${q(3)} ${q(7)}`,
                        borderRadius: "9999px",
                        background: "#0B1220",
                        color: "#fff",
                        fontSize: q(8),
                      }}
                    >
                      <Printer style={{ width: q(9), height: q(9) }} />
                      {isPrinting ? "…" : isTorn ? "✓" : ""}
                    </span>
                  </div>
                )}
              </div>

              <div
                className="flex justify-center"
                style={{
                  padding: q(4),
                  background: "#fff",
                  borderTop: "1px solid #EEF0F4",
                }}
              >
                <span
                  style={{
                    width: q(10),
                    height: q(10),
                    borderRadius: "9999px",
                    border: "2px solid #94A3B8",
                  }}
                />
              </div>

              {/* glass glare */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(120deg, rgba(255,255,255,0.28), rgba(255,255,255,0) 34%)",
                }}
              />
            </div>

            {/* ---------- printed bill (emerges from the printer slot) ---------- */}
            {receiptLines.length > 0 && (
              <div
                className="absolute bg-[#FFFDF7]"
                style={{
                  left: q(311),
                  width: q(84),
                  bottom: `calc(${q(560 - 402)})`,
                  height: q(paperH),
                  padding: `${q(5)} ${q(5)} ${q(4)}`,
                  overflow: "hidden",
                  opacity: printedCount > 0 && !taken ? 1 : 0,
                  transformOrigin: "bottom center",
                  transform: taken
                    ? `translateY(${q(-70)}) rotate(-5deg)`
                    : isTorn
                      ? "rotate(-1.6deg)"
                      : "rotate(0deg)",
                  transition:
                    "height 180ms ease-out, opacity 600ms ease-out, transform 900ms cubic-bezier(0.34, 1.2, 0.64, 1)",
                  boxShadow: "0 10px 24px -10px rgba(0,0,0,0.45)",
                  clipPath: `polygon(0 0,100% 0,100% calc(100% - 3px),92% 100%,84% calc(100% - 3px),76% 100%,68% calc(100% - 3px),60% 100%,52% calc(100% - 3px),44% 100%,36% calc(100% - 3px),28% 100%,20% calc(100% - 3px),12% 100%,4% calc(100% - 3px),0 100%)`,
                  display: "flex",
                  flexDirection: "column-reverse",
                  fontFamily: mono,
                  color: "#2b2b2b",
                  zIndex: 20,
                }}
              >
                <div style={{ fontSize: q(5.6), lineHeight: q(LINE_H) }}>
                  {receiptLines.slice(0, printedCount).map((line, idx) => (
                    <div key={idx}>
                      {line.left ? (
                        <div
                          className="flex justify-between"
                          style={{
                            gap: q(4),
                            fontWeight: line.weight === "bold" ? 700 : 400,
                            fontSize:
                              line.size === "large" ? q(6.4) : undefined,
                          }}
                        >
                          <span>{line.left}</span>
                          <span>{line.right}</span>
                        </div>
                      ) : (
                        <div
                          style={{
                            textAlign: "center",
                            fontWeight: line.weight === "bold" ? 700 : 400,
                            fontSize:
                              line.size === "large" ? q(6.4) : undefined,
                          }}
                        >
                          {line.text}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                {stamped && (
                  <div
                    className="sc-stamp absolute"
                    style={{
                      left: "50%",
                      top: "50%",
                      padding: `${q(1.5)} ${q(7)}`,
                      border: `${q(1.8)} solid #D6402B`,
                      borderRadius: q(3),
                      color: "#D6402B",
                      fontWeight: 800,
                      letterSpacing: "0.12em",
                      fontSize: q(16),
                      fontFamily: sans,
                      textTransform: "uppercase",
                      background: "rgba(255,253,247,0.7)",
                    }}
                  >
                    {sPaid}
                  </div>
                )}
              </div>
            )}

            {/* printer front lip (paper slides out from behind it) + card terminal screen + bank card */}
            <svg
              viewBox="0 90 520 470"
              className="pointer-events-none absolute inset-0 h-full w-full"
              fill="none"
              style={{ overflow: "visible", zIndex: 30 }}
            >
              <rect
                x="296"
                y="396"
                width="114"
                height="9"
                rx="3"
                fill="url(#sc-lip)"
              />
              <rect
                x="296"
                y="396"
                width="114"
                height="1.2"
                fill="#fff"
                opacity="0.25"
              />

              {/* terminal screen states */}
              <g
                style={{
                  opacity: payStage === "standby" ? 1 : 0,
                  transition: "opacity .25s",
                }}
              >
                <text
                  x="460"
                  y="318"
                  textAnchor="middle"
                  fontSize="9"
                  fontWeight="700"
                  fill="#9FB4CC"
                  fontFamily={sans}
                  letterSpacing="1.5"
                >
                  MELMAH
                </text>
                <text
                  x="460"
                  y="332"
                  textAnchor="middle"
                  fontSize="7"
                  fill="#6F86A3"
                  fontFamily={sans}
                >
                  {sReady}
                </text>
              </g>
              <g
                style={{
                  opacity: payStage === "wait" ? 1 : 0,
                  transition: "opacity .25s",
                }}
              >
                <text
                  x="460"
                  y="314"
                  textAnchor="middle"
                  fontSize="12"
                  fontWeight="700"
                  fill="#fff"
                  fontFamily={sans}
                >
                  {grand} Af
                </text>
                <text
                  x="460"
                  y="329"
                  textAnchor="middle"
                  fontSize="7"
                  fill="#8FD3FF"
                  fontFamily={sans}
                >
                  {sTapCard}
                </text>
                <g
                  className="sc-contactless"
                  stroke="#8FD3FF"
                  strokeWidth="1.4"
                  strokeLinecap="round"
                >
                  <path d="M455 340q4 4 0 8" />
                  <path d="M459 337q7 7 0 14" />
                  <path d="M463 334q10 10 0 20" />
                </g>
              </g>
              <g
                style={{
                  opacity: payStage === "processing" ? 1 : 0,
                  transition: "opacity .25s",
                }}
              >
                <circle
                  cx="460"
                  cy="314"
                  r="9"
                  stroke="#2A4468"
                  strokeWidth="2.2"
                />
                <path
                  className="sc-spin"
                  d="M460 305a9 9 0 0 1 9 9"
                  stroke="#8FD3FF"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                />
                <text
                  x="460"
                  y="336"
                  textAnchor="middle"
                  fontSize="7"
                  fill="#C9D8EA"
                  fontFamily={sans}
                >
                  {sProcessing}
                </text>
              </g>
              <g
                style={{
                  opacity: payStage === "approved" ? 1 : 0,
                  transition: "opacity .25s",
                }}
              >
                <circle cx="460" cy="313" r="10" fill="#22C55E" />
                <path
                  d="M455 313l4 4 7-8"
                  stroke="#fff"
                  strokeWidth="2.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <text
                  x="460"
                  y="333"
                  textAnchor="middle"
                  fontSize="8.5"
                  fontWeight="700"
                  fill="#4ADE80"
                  fontFamily={sans}
                >
                  {sApproved}
                </text>
                <text
                  x="460"
                  y="344"
                  textAnchor="middle"
                  fontSize="5.6"
                  fill="#B7C5D6"
                  fontFamily={sans}
                >
                  {sReceived}
                </text>
              </g>

              {/* contactless pulse while the card is held */}
              {(payStage === "wait" || payStage === "processing") && (
                <g>
                  <circle
                    className="sc-pulse"
                    cx="460"
                    cy="271"
                    r="10"
                    stroke="#8FD3FF"
                    strokeWidth="1.4"
                  />
                  <circle
                    className="sc-pulse"
                    style={{ animationDelay: "0.5s" }}
                    cx="460"
                    cy="271"
                    r="10"
                    stroke="#8FD3FF"
                    strokeWidth="1.4"
                  />
                </g>
              )}

              {/* bank card */}
              {cardOn && (
                <g key={cardKey} className="sc-card">
                  <rect
                    x="-36"
                    y="-21"
                    width="76"
                    height="48"
                    rx="6"
                    fill="#000"
                    opacity="0.28"
                  />
                  <rect
                    x="-38"
                    y="-24"
                    width="76"
                    height="48"
                    rx="6"
                    fill="url(#sc-card)"
                    stroke="#4A5C8F"
                    strokeWidth="0.8"
                  />
                  <rect
                    x="-30"
                    y="-12"
                    width="15"
                    height="11"
                    rx="2.2"
                    fill="url(#sc-chip)"
                  />
                  <path
                    d="M-22.5 -12V-1M-30 -6.5H-15"
                    stroke="#8A6310"
                    strokeWidth="0.7"
                  />
                  <g
                    stroke="#E0B93A"
                    strokeWidth="1.1"
                    strokeLinecap="round"
                    opacity="0.9"
                  >
                    <path d="M-8 -9q3 3.5 0 7" />
                    <path d="M-4 -12q5 6 0 12" />
                    <path d="M0 -15q7 9 0 18" />
                  </g>
                  <text
                    x="-30"
                    y="12"
                    fontSize="6.5"
                    fill="#E8ECF6"
                    fontFamily={mono}
                    letterSpacing="1"
                  >
                    •••• 4821
                  </text>
                  <text
                    x="-30"
                    y="19.5"
                    fontSize="4.6"
                    fill="#9FB0D6"
                    fontFamily={sans}
                    letterSpacing="1"
                  >
                    MELMAH PAY
                  </text>
                  <rect
                    x="-2"
                    y="-24"
                    width="30"
                    height="48"
                    rx="6"
                    fill="#fff"
                    opacity="0.07"
                    transform="skewX(-14)"
                  />
                </g>
              )}
            </svg>
          </div>
        </div>

        {/* ===== TEXT + STEPPER ===== */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: inView ? 1 : 0,
            transform: inView ? "translateY(0)" : "translateY(18px)",
          }}
        >
          <h2 className="font-serif text-2xl leading-tight text-[#0B1220] sm:text-3xl">
            {showcaseTitle}
          </h2>
          <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-slate-600 sm:text-base">
            {showcaseSubtitle}
          </p>

          <ol className="mt-6 space-y-1">
            {steps.map(({ Icon, label }, i) => {
              const done = activeStep > i;
              const active = activeStep === i;
              return (
                <li key={i} className="relative flex items-center gap-3 py-1.5">
                  {i < steps.length - 1 && (
                    <span
                      className="absolute top-[2.4rem] h-5 w-px bg-slate-200"
                      style={{ insetInlineStart: "1.05rem" }}
                    />
                  )}
                  <span
                    className="relative z-10 flex h-[2.1rem] w-[2.1rem] shrink-0 items-center justify-center rounded-full border transition-all duration-300"
                    style={{
                      background: done
                        ? "#16A34A"
                        : active
                          ? "#C9A227"
                          : "#fff",
                      borderColor: done
                        ? "#16A34A"
                        : active
                          ? "#C9A227"
                          : "#E2E8F0",
                      color: done || active ? "#fff" : "#94A3B8",
                      boxShadow: active
                        ? "0 0 0 4px rgba(201,162,39,0.22)"
                        : "none",
                    }}
                  >
                    {done ? (
                      <Check size={16} strokeWidth={3} />
                    ) : (
                      <Icon size={16} />
                    )}
                  </span>
                  <span
                    className="text-sm font-medium transition-colors duration-300"
                    style={{
                      color: active ? "#0B1220" : done ? "#475569" : "#94A3B8",
                    }}
                  >
                    {label}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      </div>

      <style jsx global>{`
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

        /* ---- POS payment scene ---- */
        @keyframes sc-card {
          0% {
            opacity: 0;
            transform: translate(505px, 120px) rotate(20deg) scale(0.9);
          }
          12% {
            opacity: 1;
          }
          46% {
            opacity: 1;
            transform: translate(460px, 276px) rotate(-3deg) scale(1);
          }
          52% {
            transform: translate(460px, 270px) rotate(-3deg) scale(1.02);
          }
          58%,
          78% {
            opacity: 1;
            transform: translate(460px, 276px) rotate(-3deg) scale(1);
          }
          100% {
            opacity: 0;
            transform: translate(505px, 130px) rotate(18deg) scale(0.92);
          }
        }
        @keyframes sc-pulse {
          0% {
            opacity: 0.8;
            transform: scale(0.6);
          }
          100% {
            opacity: 0;
            transform: scale(2.4);
          }
        }
        @keyframes sc-spin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes sc-stamp {
          0% {
            opacity: 0;
            transform: translate(-50%, -50%) rotate(-14deg) scale(2.2);
          }
          60% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(-14deg) scale(0.92);
          }
          100% {
            opacity: 1;
            transform: translate(-50%, -50%) rotate(-14deg) scale(1);
          }
        }
        @keyframes sc-pop {
          0% {
            transform: scale(0.85);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes sc-led {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
        @keyframes sc-glowbar {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.5);
          }
          50% {
            box-shadow: 0 0 0 4px rgba(201, 162, 39, 0);
          }
        }
        @keyframes sc-contactless {
          0%,
          100% {
            opacity: 0.35;
          }
          50% {
            opacity: 1;
          }
        }
        .sc-card {
          animation: sc-card 3.6s ease-in-out both;
        }
        .sc-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: sc-pulse 1.2s ease-out infinite;
        }
        .sc-spin {
          transform-box: view-box;
          transform-origin: 460px 314px;
          animation: sc-spin 0.9s linear infinite;
        }
        .sc-stamp {
          animation: sc-stamp 0.45s cubic-bezier(0.2, 1.2, 0.4, 1) both;
        }
        .sc-pop {
          animation: sc-pop 0.35s ease-out both;
        }
        .sc-led {
          animation: sc-led 1.1s ease-in-out infinite;
        }
        .sc-glowbar {
          animation: sc-glowbar 1.2s ease-in-out infinite;
        }
        .sc-contactless {
          animation: sc-contactless 1.1s ease-in-out infinite;
        }
        .sc-ledblink {
          animation: sc-led 0.8s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .floating-icon,
          .floating-icon-right,
          .floating-drawing,
          .floating-drawing-right,
          .floating-shape,
          .sc-card,
          .sc-pulse,
          .sc-spin,
          .sc-stamp,
          .sc-pop,
          .sc-led,
          .sc-glowbar,
          .sc-contactless,
          .sc-ledblink {
            animation: none !important;
          }
        }
      `}</style>
    </section>
  );
}
