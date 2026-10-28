"use client";
/* eslint-disable @next/next/no-img-element */

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
  CreditCard,
  Check,
  Lock,
  ChefHat,
  Bike,
  Home,
  Smartphone,
  Star,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

/* ------------------------------------------------------------------ */
/*  Languages: English (en), Pashto (ps), Dari (prs)                  */
/*  Your own translation keys (t.xxx) win; these are the fallbacks.   */
/* ------------------------------------------------------------------ */
type Lang = "en" | "ps" | "prs"; // prs = Dari (same code as your pageText)

const DICT: Record<Lang, Record<string, string>> = {
  en: {
    currency: "Af",
    onlineAppTime: "12:14",
    onlineAppEyebrow: "Order online",
    onlineAppTitle: "Melmah",
    onlineTitle: "Order online, pay with Hesab Pay, get it at your door",
    onlineSubtitle:
      "Customers browse the menu in the Melmah app, pay securely online, and a courier brings the food straight to their home.",
    onlineCheckout: "Checkout",
    onlineBrowse: "Choose your food",
    onlineCart: "Your order",
    onlinePayTitle: "Choose how you pay",
    onlineSecure: "Secure",
    onlineSubtotal: "Subtotal",
    onlineDeliveryFee: "Delivery",
    onlineTotal: "Total",
    onlinePay: "Pay",
    onlineCard: "Card",
    onlineHesab: "Hesab Pay",
    onlineProcessing: "Processing…",
    onlinePaymentSuccess: "Payment successful",
    onlinePaidHesab: "Paid with Hesab Pay",
    onlinePreparing: "Preparing your order",
    onlinePreparingSub: "The restaurant got your order",
    onlineOnTheWay: "Courier is on the way",
    onlineDelivered: "Delivered!",
    onlineDeliveredSub: "Enjoy your meal",
    onlineMin: "min",
    onlineNewOrder: "New order!",
    onlineLive: "Live",
    onlineCourierLabel: "Your courier",
    onlineCourierName: "Ahmad",
    onlineStepOrder: "Pick food in the app",
    onlineStepPay: "Pay online with Hesab Pay",
    onlineStepKitchen: "The restaurant prepares it",
    onlineStepRide: "Courier rides to the customer",
    onlineStepDelivered: "Delivered to the door",
    showcaseMenuPizza: "Pizza",
    showcaseMenuChicken: "Chicken",
    showcaseMenuDrinks: "Drinks",
    showcaseMenuSoups: "Soups",
    showcaseMenuDesserts: "Desserts",
    showcaseMenuSides: "Sides",
  },
  ps: {
    currency: "؋",
    onlineAppTime: "12:14",
    onlineAppEyebrow: "آنلاین آرډر",
    onlineAppTitle: "Melmah",
    onlineTitle:
      "آنلاین آرډر ورکړئ، په حساب پی تادیه وکړئ، خواړه ستاسو دروازې ته راځي",
    onlineSubtitle:
      "پیرودونکي د ملمه په اپ کې مینو ګوري، په خوندي ډول آنلاین تادیه کوي، او کوریر خواړه مستقیم کور ته رسوي.",
    onlineCheckout: "آرډر بشپړ کړئ",
    onlineBrowse: "خواړه وټاکئ",
    onlineCart: "ستاسو آرډر",
    onlinePayTitle: "د تادیې طریقه وټاکئ",
    onlineSecure: "خوندي",
    onlineSubtotal: "فرعي مجموعه",
    onlineDeliveryFee: "ډلیوري",
    onlineTotal: "ټولټال",
    onlinePay: "تادیه",
    onlineCard: "کارت",
    onlineHesab: "حساب پی",
    onlineProcessing: "پروسس کیږي…",
    onlinePaymentSuccess: "تادیه بریالۍ شوه",
    onlinePaidHesab: "د حساب پی په واسطه تادیه شوه",
    onlinePreparing: "ستاسو آرډر چمتو کیږي",
    onlinePreparingSub: "رستورانت ستاسو آرډر ترلاسه کړ",
    onlineOnTheWay: "کوریر په لاره کې دی",
    onlineDelivered: "رسول شو!",
    onlineDeliveredSub: "نوش جان!",
    onlineMin: "دقیقې",
    onlineNewOrder: "نوی آرډر!",
    onlineLive: "ژوندی",
    onlineCourierLabel: "ستاسو کوریر",
    onlineCourierName: "احمد",
    onlineStepOrder: "په اپ کې خواړه وټاکئ",
    onlineStepPay: "په حساب پی آنلاین تادیه وکړئ",
    onlineStepKitchen: "رستورانت یې چمتو کوي",
    onlineStepRide: "کوریر پیرودونکي ته ځي",
    onlineStepDelivered: "دروازې ته رسول کیږي",
    showcaseMenuPizza: "پیتزا",
    showcaseMenuChicken: "چرګ",
    showcaseMenuDrinks: "څښاک",
    showcaseMenuSoups: "سوپونه",
    showcaseMenuDesserts: "خواږه",
    showcaseMenuSides: "ملګري خواړه",
  },
  prs: {
    currency: "؋",
    onlineAppTime: "12:14",
    onlineAppEyebrow: "سفارش آنلاین",
    onlineAppTitle: "Melmah",
    onlineTitle:
      "آنلاین سفارش دهید، با حساب پی پرداخت کنید، غذا دم دروازه می‌رسد",
    onlineSubtitle:
      "مشتریان مینو را در اپ ملمه می‌بینند، به‌صورت امن آنلاین پرداخت می‌کنند و پیک غذا را مستقیم به خانه می‌رساند.",
    onlineCheckout: "تکمیل سفارش",
    onlineBrowse: "غذا را انتخاب کنید",
    onlineCart: "سفارش شما",
    onlinePayTitle: "روش پرداخت را انتخاب کنید",
    onlineSecure: "امن",
    onlineSubtotal: "جمع جزء",
    onlineDeliveryFee: "تحویل",
    onlineTotal: "مجموع",
    onlinePay: "پرداخت",
    onlineCard: "کارت",
    onlineHesab: "حساب پی",
    onlineProcessing: "در حال پردازش…",
    onlinePaymentSuccess: "پرداخت موفق بود",
    onlinePaidHesab: "با حساب پی پرداخت شد",
    onlinePreparing: "سفارش شما آماده می‌شود",
    onlinePreparingSub: "رستورانت سفارش شما را دریافت کرد",
    onlineOnTheWay: "پیک در راه است",
    onlineDelivered: "تحویل داده شد!",
    onlineDeliveredSub: "نوش جان!",
    onlineMin: "دقیقه",
    onlineNewOrder: "سفارش جدید!",
    onlineLive: "زنده",
    onlineCourierLabel: "پیک شما",
    onlineCourierName: "احمد",
    onlineStepOrder: "غذا را در اپ انتخاب کنید",
    onlineStepPay: "با حساب پی آنلاین پرداخت کنید",
    onlineStepKitchen: "رستورانت آن را آماده می‌کند",
    onlineStepRide: "پیک به سوی مشتری حرکت می‌کند",
    onlineStepDelivered: "دم دروازه تحویل می‌شود",
    showcaseMenuPizza: "پیتزا",
    showcaseMenuChicken: "مرغ",
    showcaseMenuDrinks: "نوشیدنی",
    showcaseMenuSoups: "سوپ",
    showcaseMenuDesserts: "دسر",
    showcaseMenuSides: "جانبی",
  },
};

const ITEM_NAMES: Record<"ps" | "prs", Record<string, string>> = {
  ps: {
    Margherita: "مارګریتا",
    Pepperoni: "پپرونی",
    Veggie: "سبزیجاتو پیتزا",
    "Grilled Chicken": "کبابي چرګ",
    "Fried Chicken": "سرخ شوی چرګ",
    "Chicken Tikka": "چرګ تکه",
    Coffee: "قهوه",
    Tea: "چای",
    Soda: "سوډا",
    "Tomato Soup": "د روميانو سوپ",
    "Chicken Soup": "د چرګ سوپ",
    Cheesecake: "چیزکیک",
    Brownie: "براوني",
    Fries: "فرایز",
    "Garlic Bread": "د سیر ډوډۍ",
    Salad: "سلاد",
  },
  prs: {
    Margherita: "مارگریتا",
    Pepperoni: "پپرونی",
    Veggie: "پیتزا سبزیجات",
    "Grilled Chicken": "مرغ کبابی",
    "Fried Chicken": "مرغ سرخ‌شده",
    "Chicken Tikka": "چکن تکه",
    Coffee: "قهوه",
    Tea: "چای",
    Soda: "نوشابه",
    "Tomato Soup": "سوپ رومی",
    "Chicken Soup": "سوپ مرغ",
    Cheesecake: "چیزکیک",
    Brownie: "براونی",
    Fries: "فرنچ فرایز",
    "Garlic Bread": "نان سیر",
    Salad: "سلاد",
  },
};

/* ------------------------------------------------------------------ */
/*  Menu data                                                          */
/* ------------------------------------------------------------------ */
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

const MENU_LABEL_KEYS: Record<string, string> = {
  pizza: "showcaseMenuPizza",
  chicken: "showcaseMenuChicken",
  drinks: "showcaseMenuDrinks",
  soups: "showcaseMenuSoups",
  desserts: "showcaseMenuDesserts",
  sides: "showcaseMenuSides",
};

const FLOATING_ICONS = [
  { Icon: Pizza, size: 20, delay: 0 },
  { Icon: Coffee, size: 16, delay: 2 },
  { Icon: Soup, size: 14, delay: 4 },
  { Icon: Cake, size: 18, delay: 1 },
  { Icon: Drumstick, size: 15, delay: 3 },
  { Icon: UtensilsCrossed, size: 12, delay: 5 },
];

/* ------------------------------------------------------------------ */
/*  Types + constants                                                  */
/* ------------------------------------------------------------------ */
type Phase =
  | "idle"
  | "browsing"
  | "paying"
  | "preparing"
  | "delivering"
  | "delivered";
type PayStage = "choose" | "form" | "processing" | "approved";
type Item = { name: string; price: number };

const TEAL = "#0A7C70";
const TEAL_DARK = "#006961";
const TEAL_LIGHT = "#13A093";
const GOLD = "#C9A227";
const NAVY = "#0B1220";
const DELIVERY_FEE = 80;
const LANE = 3.6; // courier rides in the right-hand lane
const ROUTE_LEN = 562; // length of ROUTE in map units
const ROUTE_CORNERS = [50, 136, 216, 296, 376, 516]; // distance of each turn along ROUTE

// courier route (map units): restaurant -> customer's home
const ROUTE = "M294 380V330H380V250H300V170H440V124";
const ROUTE_START = { x: 294, y: 380 };
const SIDE_ROADS = ["M480 24V444", "M236 210H508", "M340 330V444"];

// scene units (viewBox 520 wide) -> container-query width units
const q = (v: number) => `${(v / 5.2).toFixed(3)}cqw`;

function beep(
  freq: number,
  dur: number,
  type: OscillatorType = "sine",
  vol = 0.12,
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

/* ------------------------------------------------------------------ */
/*  Small SVG helpers for the realistic map                            */
/* ------------------------------------------------------------------ */
function Block(props: {
  x: number;
  y: number;
  w: number;
  h: number;
  d?: number;
  front?: string;
  top?: string;
  side?: string;
  children?: React.ReactNode;
}) {
  const {
    x,
    y,
    w,
    h,
    d = 7,
    front = "#EFE3CF",
    top = "#FAF3E4",
    side = "#CDBFA3",
    children,
  } = props;
  return (
    <g>
      <polygon
        points={`${x + w},${y + h} ${x + w + d},${y + h - d} ${x + w + d + 9},${y + h - d + 4} ${x + w + 9},${y + h + 4}`}
        fill="#000"
        opacity="0.12"
      />
      <polygon
        points={`${x},${y} ${x + d},${y - d} ${x + w + d},${y - d} ${x + w},${y}`}
        fill={top}
      />
      <polygon
        points={`${x + w},${y} ${x + w + d},${y - d} ${x + w + d},${y + h - d} ${x + w},${y + h}`}
        fill={side}
      />
      <rect x={x} y={y} width={w} height={h} fill={front} />
      <rect
        x={x}
        y={y + h - 1.5}
        width={w}
        height={1.5}
        fill="#000"
        opacity="0.08"
      />
      {children}
    </g>
  );
}

function Windows(props: {
  x: number;
  y: number;
  cols: number;
  rows: number;
  w?: number;
  h?: number;
  gx?: number;
  gy?: number;
  seed?: number;
}) {
  const { x, y, cols, rows, w = 5, h = 6, gx = 4, gy = 4, seed = 0 } = props;
  const out: React.ReactNode[] = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const lit = (r * 3 + c * 5 + seed) % 4 === 0;
      out.push(
        <rect
          key={`${r}-${c}`}
          x={x + c * (w + gx)}
          y={y + r * (h + gy)}
          width={w}
          height={h}
          rx={1}
          fill={lit ? "#FFE9A8" : "#A9C3D2"}
          stroke="#7E98A8"
          strokeWidth={0.4}
        />,
      );
    }
  }
  return <g>{out}</g>;
}

function Tree({ x, y, r = 7 }: { x: number; y: number; r?: number }) {
  return (
    <g>
      <ellipse
        cx={x + r * 0.55}
        cy={y + r * 0.95}
        rx={r * 1.05}
        ry={r * 0.5}
        fill="#000"
        opacity="0.15"
      />
      <rect x={x - 1} y={y} width={2} height={r * 0.95} fill="#7A5A3A" />
      <circle cx={x} cy={y - 1} r={r} fill="#6FA25B" />
      <circle cx={x - r * 0.3} cy={y - r * 0.4} r={r * 0.62} fill="#8DBE74" />
    </g>
  );
}

function Lamp({ x, y }: { x: number; y: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={5} fill="#FFE9A8" opacity="0.25" />
      <circle cx={x} cy={y} r={1.4} fill="#5A5F6E" />
    </g>
  );
}

function Car({
  x,
  y,
  color,
  vertical,
}: {
  x: number;
  y: number;
  color: string;
  vertical?: boolean;
}) {
  return vertical ? (
    <g>
      <rect x={x} y={y} width={6.5} height={14} rx={2.2} fill={color} />
      <rect
        x={x + 1}
        y={y + 3.5}
        width={4.5}
        height={6}
        rx={1}
        fill="#DDEBF3"
      />
      <rect
        x={x + 6.5}
        y={y}
        width={1.2}
        height={14}
        fill="#000"
        opacity="0.15"
      />
    </g>
  ) : (
    <g>
      <rect x={x} y={y} width={14} height={6.5} rx={2.2} fill={color} />
      <rect
        x={x + 3.5}
        y={y + 1}
        width={6}
        height={4.5}
        rx={1}
        fill="#DDEBF3"
      />
      <rect
        x={x}
        y={y + 6.5}
        width={14}
        height={1.2}
        fill="#000"
        opacity="0.15"
      />
    </g>
  );
}

function Zebra({
  x,
  y,
  vertical,
}: {
  x: number;
  y: number;
  vertical?: boolean;
}) {
  return (
    <g fill="#fff" opacity="0.9">
      {[0, 1, 2, 3, 4].map((i) =>
        vertical ? (
          <rect key={i} x={x + i * 3.1} y={y} width={1.8} height={7} />
        ) : (
          <rect key={i} x={x} y={y + i * 3.1} width={7} height={1.8} />
        ),
      )}
    </g>
  );
}

/* ------------------------------------------------------------------ */
/*  Component                                                          */
/* ------------------------------------------------------------------ */
export default function OnlineOrderShowcase({
  isRTL,
  lang: langProp,
  text,
  logoSrc = "/Melmah.png",
  hesabSrc = "/hesab.jpg",
  afpaySrc = "/afpay.png",
}: {
  isRTL?: boolean;
  lang?: string; // "en" | "ps" | "prs" (optional: read from LanguageContext)
  text?: Record<string, any>; // pageText[lang] (optional)
  logoSrc?: string;
  hesabSrc?: string;
  afpaySrc?: string;
}) {
  const ctx: any = useLanguage();
  const t: any = text || {};
  const rawLang: string = langProp ?? ctx?.language ?? (isRTL ? "prs" : "en");
  const lang: Lang =
    rawLang === "ps"
      ? "ps"
      : rawLang === "prs" || rawLang === "fa"
        ? "prs"
        : "en";
  const rtl = isRTL ?? lang !== "en";

  const sectionRef = useRef<HTMLElement | null>(null);
  const routeRef = useRef<SVGPathElement | null>(null);
  const angleRef = useRef(-Math.PI / 2);
  const inViewRef = useRef(false);
  const [inView, setInView] = useState(false);

  const [order, setOrder] = useState<Item[]>([]);
  const [orderTotal, setOrderTotal] = useState(0);
  const [clickedKey, setClickedKey] = useState<string | null>(null);
  const [phase, setPhase] = useState<Phase>("idle");
  const [payStage, setPayStage] = useState<PayStage>("choose");
  const [btnPress, setBtnPress] = useState(false);
  const [ping, setPing] = useState(-1);
  const [orderSent, setOrderSent] = useState(false);
  const [routeP, setRouteP] = useState(0);
  const [bag, setBag] = useState(-1); // order bag flying from the kitchen to the courier
  const [boxKey, setBoxKey] = useState(0);
  const [scooter, setScooter] = useState({
    x: ROUTE_START.x + LANE,
    y: ROUTE_START.y,
    a: -90,
  });

  const grand = orderTotal + (order.length ? DELIVERY_FEE : 0);

  // ----- strings, digits, money -----
  const s = (k: string) => t?.[k] || DICT[lang][k] || DICT.en[k] || "";
  const num = (v: number | string) =>
    lang === "en"
      ? String(v)
      : String(v).replace(/\d/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[+d]);
  const money = (v: number) => `${num(v)} ${DICT[lang].currency}`;
  const itemName = (n: string) =>
    lang === "en" ? n : ITEM_NAMES[lang][n] || n;
  const getMenuLabel = (key: string) => s(MENU_LABEL_KEYS[key]) || key;

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

  // ----- the story, looping while visible -----
  useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));
    const frame = () =>
      new Promise<void>((r) => requestAnimationFrame(() => r()));
    const sound = (f: () => void) => {
      if (inViewRef.current) f();
    };
    const tween = async (ms: number, fn: (p: number) => void) => {
      const t0 = performance.now();
      while (!cancelled) {
        const p = Math.min((performance.now() - t0) / ms, 1);
        fn(p);
        if (p >= 1) break;
        await frame();
      }
    };
    // place the bike on the road: follow the path, turn smoothly, stay in the right lane
    const moveScooter = (dist: number) => {
      const path = routeRef.current;
      if (!path) return;
      const len = path.getTotalLength();
      const at = (d: number) =>
        path.getPointAtLength(Math.min(Math.max(d, 0), len));
      const c = at(dist);
      const p0 = at(dist - 7);
      const p1 = at(dist + 7);
      const target = Math.atan2(p1.y - p0.y, p1.x - p0.x);
      let diff = target - angleRef.current;
      while (diff > Math.PI) diff -= Math.PI * 2;
      while (diff < -Math.PI) diff += Math.PI * 2;
      angleRef.current += diff * 0.22; // smooth turning at corners
      const th = angleRef.current;
      setScooter({
        x: c.x - Math.sin(th) * LANE,
        y: c.y + Math.cos(th) * LANE,
        a: (th * 180) / Math.PI,
      });
    };

    const run = async () => {
      while (!cancelled) {
        setOrder([]);
        setOrderTotal(0);
        setClickedKey(null);
        setPayStage("choose");
        setBtnPress(false);
        setPing(-1);
        setOrderSent(false);
        setRouteP(0);
        setBag(-1);
        angleRef.current = -Math.PI / 2;
        setScooter({ x: ROUTE_START.x + LANE, y: ROUTE_START.y, a: -90 });
        setPhase("browsing");
        await sleep(1000);
        if (cancelled) return;

        // 1) customer picks food in the Melmah app
        const items: Item[] = [];
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
          await sleep(350);
          if (cancelled) return;
        }
        await sleep(700);

        // 2) choose Hesab Pay and pay online
        setPhase("paying");
        setPayStage("choose");
        await sleep(1500);
        if (cancelled) return;
        setPayStage("form");
        sound(() => beep(900, 0.08));
        await sleep(1400);
        if (cancelled) return;
        setBtnPress(true);
        sound(() => beep(1000, 0.06));
        await sleep(350);
        setBtnPress(false);
        setPayStage("processing");
        await sleep(1300);
        if (cancelled) return;
        setPayStage("approved");
        sound(() => {
          beep(880, 0.12);
          setTimeout(() => beep(1320, 0.2), 130);
        });
        await sleep(1400);
        if (cancelled) return;

        // 3) order reaches the restaurant
        setPhase("preparing");
        await tween(800, (p) => setPing(p));
        setPing(-1);
        setOrderSent(true);
        sound(() => beep(660, 0.15, "triangle"));
        await sleep(1500);
        if (cancelled) return;

        // bag is handed to the courier
        sound(() => beep(1046, 0.1, "triangle"));
        await tween(900, (p) => setBag(p));
        setBag(-1);
        setBoxKey((k) => k + 1);
        sound(() => beep(784, 0.08));
        await sleep(500);
        if (cancelled) return;

        // 4) courier rides to the customer
        setPhase("delivering");
        {
          const len = routeRef.current
            ? routeRef.current.getTotalLength()
            : ROUTE_LEN;
          const k = len / ROUTE_LEN;
          const base = len / 5.2; // units per second at full speed
          let d = 0;
          let last = performance.now();
          while (!cancelled && d < len) {
            await frame();
            const now = performance.now();
            const dt = Math.min((now - last) / 1000, 0.05);
            last = now;
            // slow down for corners, ease in at the start and out at the end
            const near = Math.min(
              ...ROUTE_CORNERS.map((c) => Math.abs(d - c * k)),
            );
            const corner = near < 16 ? 0.45 + (0.55 * near) / 16 : 1;
            const ease = Math.min(1, 0.2 + d / 40, 0.2 + (len - d) / 40);
            d = Math.min(len, d + base * corner * ease * dt);
            setRouteP(d / len);
            moveScooter(d);
          }
        }
        if (cancelled) return;

        // 5) delivered
        setPhase("delivered");
        sound(() => {
          beep(740, 0.12);
          setTimeout(() => beep(988, 0.12), 120);
          setTimeout(() => beep(1480, 0.22), 250);
        });
        await sleep(3200);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [inView]);

  const steps = [
    { Icon: Smartphone, label: s("onlineStepOrder") },
    { Icon: CreditCard, label: s("onlineStepPay") },
    { Icon: ChefHat, label: s("onlineStepKitchen") },
    { Icon: Bike, label: s("onlineStepRide") },
    { Icon: Home, label: s("onlineStepDelivered") },
  ];
  const activeStep =
    phase === "browsing"
      ? 0
      : phase === "paying"
        ? 1
        : phase === "preparing"
          ? 2
          : phase === "delivering"
            ? 3
            : phase === "delivered"
              ? 5
              : -1;

  const sans = "system-ui, -apple-system, 'Segoe UI', Tahoma, sans-serif";
  const tracking =
    phase === "preparing" || phase === "delivering" || phase === "delivered";
  const eta = Math.max(0, Math.ceil((1 - routeP) * 12));
  const selectedHesab = payStage !== "choose";

  const pingPos = (() => {
    const p = Math.max(ping, 0);
    const [x0, y0, x1, y1, x2, y2] = [214, 300, 244, 350, 274, 396];
    const u = 1 - p;
    return {
      x: u * u * x0 + 2 * u * p * x1 + p * p * x2,
      y: u * u * y0 + 2 * u * p * y1 + p * p * y2,
    };
  })();

  const rowStyle = {
    fontSize: q(7.5),
    color: "#475569",
    padding: `${q(1.5)} 0`,
  } as const;

  return (
    <section
      ref={sectionRef}
      dir={rtl ? "rtl" : "ltr"}
      className="relative overflow-y-visible bg-[#F8F7F4] py-10 md:py-14"
    >
      {/* ===== BACKGROUND ===== */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 20% 50%, rgba(10,124,112,0.07) 0%, transparent 60%), radial-gradient(ellipse at 80% 30%, rgba(201,162,39,0.06) 0%, transparent 50%)",
          }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundImage:
              "linear-gradient(rgba(10,124,112,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(10,124,112,0.04) 1px, transparent 1px)",
            backgroundSize: "60px 60px",
          }}
        />
        {FLOATING_ICONS.map(({ Icon, size, delay }, index) => (
          <div
            key={index}
            className="ol-float absolute"
            style={{
              top: `${12 + index * 14}%`,
              left: `${4 + index * 16}%`,
              animationDelay: `${delay}s`,
              opacity: 0.08,
            }}
          >
            <Icon size={size + index * 2} color={TEAL} strokeWidth={1.5} />
          </div>
        ))}
        {FLOATING_ICONS.map(({ Icon, size, delay }, index) => (
          <div
            key={`r-${index}`}
            className="ol-float absolute"
            style={{
              top: `${8 + index * 15}%`,
              right: `${6 + index * 12}%`,
              animationDelay: `${delay + 1.5}s`,
              opacity: 0.06,
            }}
          >
            <Icon size={size + index * 2 + 4} color={GOLD} strokeWidth={1.5} />
          </div>
        ))}
      </div>

      {/* ===== MAIN CONTENT ===== */}
      <div className="relative z-10 mx-auto grid max-w-5xl grid-cols-1 items-center gap-8 px-4 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
        {/* ===== SCENE ===== */}
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
              viewBox="0 0 520 470"
              className="block h-auto w-full"
              fill="none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <linearGradient id="ol-phone" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#4A4F5E" />
                  <stop offset="0.5" stopColor="#262A35" />
                  <stop offset="1" stopColor="#14161D" />
                </linearGradient>
                <radialGradient id="ol-glow" cx="50%" cy="50%" r="50%">
                  <stop offset="0" stopColor={TEAL_LIGHT} stopOpacity="0.2" />
                  <stop offset="1" stopColor={TEAL_LIGHT} stopOpacity="0" />
                </radialGradient>
                <linearGradient id="ol-ground" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#EFEBDE" />
                  <stop offset="1" stopColor="#E3DECE" />
                </linearGradient>
                <linearGradient id="ol-roof" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#C4623A" />
                  <stop offset="1" stopColor="#9E4A28" />
                </linearGradient>
                <filter
                  id="ol-blur"
                  x="-30%"
                  y="-100%"
                  width="160%"
                  height="300%"
                >
                  <feGaussianBlur stdDeviation="6" />
                </filter>
                <clipPath id="ol-mapclip">
                  <rect x="236" y="24" width="272" height="420" rx="20" />
                </clipPath>
              </defs>

              <ellipse
                cx="260"
                cy="240"
                rx="270"
                ry="240"
                fill="url(#ol-glow)"
              />

              {/* ---------- phone body ---------- */}
              <ellipse
                cx="114"
                cy="452"
                rx="90"
                ry="8"
                fill="#000"
                opacity="0.3"
                filter="url(#ol-blur)"
              />
              <rect
                x="14"
                y="18"
                width="200"
                height="424"
                rx="30"
                fill="url(#ol-phone)"
              />
              <rect
                x="14.5"
                y="18.5"
                width="199"
                height="423"
                rx="29.5"
                stroke="#fff"
                strokeOpacity="0.22"
              />
              <rect
                x="20"
                y="24"
                width="188"
                height="412"
                rx="25"
                fill="#07080C"
              />
              <rect
                x="212"
                y="110"
                width="3.5"
                height="40"
                rx="1.7"
                fill="#8A90A0"
              />
              <rect
                x="212"
                y="160"
                width="3.5"
                height="40"
                rx="1.7"
                fill="#8A90A0"
              />

              {/* ---------- realistic map ---------- */}
              <g clipPath="url(#ol-mapclip)">
                <rect
                  x="236"
                  y="24"
                  width="272"
                  height="420"
                  fill="url(#ol-ground)"
                />

                {/* park with pond */}
                <rect
                  x="248"
                  y="52"
                  width="72"
                  height="92"
                  rx="9"
                  fill="#CFE3B4"
                />
                <rect
                  x="248"
                  y="52"
                  width="72"
                  height="92"
                  rx="9"
                  stroke="#B9D29C"
                />
                <path
                  d="M254 140Q284 112 316 96"
                  stroke="#EDE5CF"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <ellipse cx="290" cy="76" rx="15" ry="9" fill="#A9D6E8" />
                <ellipse cx="287" cy="74" rx="8" ry="4" fill="#C9E7F3" />
                <Tree x={262} y={70} r={7} />
                <Tree x={304} y={118} r={7} />
                <Tree x={270} y={124} r={6} />
                <Tree x={308} y={62} r={5.5} />
                <circle
                  className="ol-pulse"
                  cx="290"
                  cy="76"
                  r="5"
                  stroke="#fff"
                  strokeWidth="0.8"
                />
                <g className="ol-duck">
                  <ellipse cx="284" cy="76" rx="2.6" ry="1.9" fill="#F4D03F" />
                  <circle cx="286" cy="74.8" r="1.3" fill="#F4D03F" />
                  <path d="M287.2 74.8l1.6.4-1.6.5Z" fill="#E8833A" />
                </g>
                <g className="ol-duck" style={{ animationDelay: "-1.4s" }}>
                  <ellipse cx="297" cy="79" rx="2.4" ry="1.7" fill="#F4D03F" />
                  <circle cx="295.2" cy="78" r="1.2" fill="#F4D03F" />
                  <path d="M294.1 78l-1.5.4 1.5.5Z" fill="#E8833A" />
                </g>

                {/* road layers: sidewalk, curb, asphalt, lane marks */}
                {[...SIDE_ROADS, ROUTE].map((d) => (
                  <path
                    key={`sw-${d}`}
                    d={d}
                    stroke="#F6F3EA"
                    strokeWidth="25"
                    strokeLinejoin="round"
                  />
                ))}
                {[...SIDE_ROADS, ROUTE].map((d) => (
                  <path
                    key={`cb-${d}`}
                    d={d}
                    stroke="#D6D0BE"
                    strokeWidth="18"
                    strokeLinejoin="round"
                  />
                ))}
                {[...SIDE_ROADS, ROUTE].map((d) => (
                  <path
                    key={`as-${d}`}
                    d={d}
                    stroke="#C4C2BC"
                    strokeWidth="16"
                    strokeLinejoin="round"
                  />
                ))}
                {SIDE_ROADS.map((d) => (
                  <path
                    key={`ln-${d}`}
                    d={d}
                    stroke="#fff"
                    strokeWidth="0.9"
                    strokeDasharray="5 5"
                    opacity="0.85"
                  />
                ))}
                <path
                  ref={routeRef}
                  d={ROUTE}
                  stroke="#fff"
                  strokeWidth="0.9"
                  strokeDasharray="5 5"
                  strokeLinejoin="round"
                  opacity="0.85"
                />
                {/* travelled route */}
                <path
                  d={ROUTE}
                  pathLength={1}
                  stroke={GOLD}
                  strokeWidth="4.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeDasharray="1"
                  strokeDashoffset={1 - routeP}
                  opacity={routeP > 0 ? 0.95 : 0}
                />

                <Zebra x={472.5} y={188} vertical />
                <Zebra x={418} y={202.5} />
                <Zebra x={372.5} y={288} vertical />

                {/* ambient traffic */}
                <g className="ol-car-a">
                  <Car x={236} y={203.5} color="#D6402B" />
                </g>
                <g className="ol-car-b">
                  <Car x={500} y={211} color="#2F6FB5" />
                </g>
                <g className="ol-car-c">
                  <Car x={473} y={30} color="#E4B93A" vertical />
                </g>
                <g className="ol-walk-a">
                  <g transform="translate(236 220)">
                    <ellipse
                      cx="0.8"
                      cy="1"
                      rx="2.8"
                      ry="1.6"
                      fill="#000"
                      opacity="0.12"
                    />
                    <ellipse cx="0" cy="0" rx="1.6" ry="2.6" fill="#C95D27" />
                    <circle cx="0.5" cy="0" r="1.7" fill="#2B2B33" />
                  </g>
                </g>
                <g className="ol-walk-b">
                  <g transform="translate(470 24)">
                    <ellipse
                      cx="0.8"
                      cy="1"
                      rx="2.8"
                      ry="1.6"
                      fill="#000"
                      opacity="0.12"
                    />
                    <ellipse cx="0" cy="0" rx="2.6" ry="1.6" fill="#2F6FB5" />
                    <circle cx="0" cy="0.5" r="1.7" fill="#6B4A2E" />
                  </g>
                </g>

                {/* city blocks (2.5D) */}
                <Block
                  x={332}
                  y={84}
                  w={50}
                  h={44}
                  d={8}
                  front="#EEDFC6"
                  top="#F9F1E1"
                  side="#CDBC9D"
                >
                  <Windows x={338} y={92} cols={3} rows={3} seed={1} />
                </Block>
                <Block
                  x={322}
                  y={268}
                  w={40}
                  h={44}
                  d={7}
                  front="#E9E1D3"
                  top="#F6F1E6"
                  side="#C8BEA9"
                >
                  <Windows
                    x={327}
                    y={274}
                    cols={3}
                    rows={3}
                    w={4}
                    h={5}
                    gx={3}
                    gy={4}
                    seed={2}
                  />
                </Block>
                <Block
                  x={248}
                  y={276}
                  w={36}
                  h={34}
                  d={6}
                  front="#E3D8C4"
                  top="#F2EBDC"
                  side="#C2B59B"
                >
                  <Windows
                    x={253}
                    y={282}
                    cols={3}
                    rows={2}
                    w={4}
                    h={5}
                    gx={3}
                    gy={4}
                    seed={3}
                  />
                </Block>
                <Block
                  x={398}
                  y={282}
                  w={54}
                  h={40}
                  d={8}
                  front="#F0E6D3"
                  top="#FBF5E8"
                  side="#D0C2A6"
                >
                  <Windows x={405} y={288} cols={4} rows={2} seed={4} />
                </Block>
                <Block
                  x={248}
                  y={344}
                  w={26}
                  h={30}
                  d={5}
                  front="#E9DCC6"
                  top="#F7F0E1"
                  side="#C9BA9C"
                >
                  <Windows
                    x={252}
                    y={350}
                    cols={2}
                    rows={2}
                    w={4}
                    h={5}
                    gx={4}
                    gy={4}
                    seed={5}
                  />
                </Block>
                <Block
                  x={354}
                  y={382}
                  w={30}
                  h={34}
                  d={6}
                  front="#E6DCCB"
                  top="#F4EDDF"
                  side="#C6BAA3"
                >
                  <Windows
                    x={359}
                    y={388}
                    cols={3}
                    rows={2}
                    w={4}
                    h={5}
                    gx={3}
                    gy={5}
                    seed={6}
                  />
                </Block>
                <Block
                  x={398}
                  y={368}
                  w={54}
                  h={46}
                  d={8}
                  front="#EADFCB"
                  top="#F8F1E2"
                  side="#CABC9F"
                >
                  <Windows x={405} y={375} cols={4} rows={3} seed={7} />
                </Block>

                {/* trees + street lamps */}
                <Tree x={372} y={228} r={6} />
                <Tree x={460} y={346} r={6.5} />
                <Tree x={346} y={160} r={6} />
                <Tree x={270} y={236} r={6} />
                <Tree x={462} y={336} r={5} />
                <Lamp x={308} y={246} />
                <Lamp x={388} y={176} />
                <Lamp x={388} y={322} />
                <Lamp x={472} y={226} />
                <Lamp x={332} y={344} />

                {/* destination ring */}
                {(phase === "delivering" || phase === "preparing") && (
                  <circle
                    className="ol-pulse"
                    cx="440"
                    cy="130"
                    r="9"
                    stroke={GOLD}
                    strokeWidth="1.6"
                  />
                )}

                {/* ---------- customer's home ---------- */}
                <ellipse
                  cx="444"
                  cy="123"
                  rx="40"
                  ry="5"
                  fill="#000"
                  opacity="0.14"
                />
                <rect x="412" y="84" width="56" height="36" fill="#FFF6E6" />
                <rect
                  x="412"
                  y="84"
                  width="56"
                  height="36"
                  fill="none"
                  stroke="#DCCFB4"
                />
                <rect x="468" y="86" width="6" height="34" fill="#D9C9A8" />
                <path d="M406 86L420 62H460L474 86Z" fill="url(#ol-roof)" />
                <path d="M420 62H460L474 86H440Z" fill="#fff" opacity="0.08" />
                <rect x="452" y="52" width="7" height="13" fill="#8F4A2A" />
                <rect x="451" y="50" width="9" height="3" fill="#6E381E" />
                {phase === "delivered" ? (
                  <g>
                    <rect
                      x="434"
                      y="100"
                      width="12"
                      height="20"
                      rx="1.5"
                      fill="#F2D39B"
                    />
                    <polygon
                      points="434,100 428.5,102 428.5,121 434,120"
                      fill="#7A4A22"
                    />
                    <g className="ol-pop">
                      <rect
                        x="436.4"
                        y="110"
                        width="7.2"
                        height="10"
                        rx="3.2"
                        fill="#E4B93A"
                      />
                      <circle cx="440" cy="106" r="3.6" fill="#F2C9A0" />
                      <path
                        d="M436.4 105.6a3.6 3.6 0 0 1 7.2 0Z"
                        fill="#3A2A1E"
                      />
                      <circle cx="438.8" cy="106.4" r="0.55" fill="#3A2A1E" />
                      <circle cx="441.2" cy="106.4" r="0.55" fill="#3A2A1E" />
                      <path
                        d="M438.9 108q1.1 1.1 2.2 0"
                        stroke="#A8553A"
                        strokeWidth="0.6"
                        strokeLinecap="round"
                      />
                      <circle
                        cx="437.6"
                        cy="107.9"
                        r="0.8"
                        fill="#F28B9B"
                        opacity="0.6"
                      />
                      <circle
                        cx="442.4"
                        cy="107.9"
                        r="0.8"
                        fill="#F28B9B"
                        opacity="0.6"
                      />
                    </g>
                    <g className="ol-wave">
                      <path
                        d="M443.2 112L449 107"
                        stroke="#E4B93A"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                      />
                      <circle cx="449.4" cy="106.6" r="1.5" fill="#F2C9A0" />
                    </g>
                  </g>
                ) : (
                  <g>
                    <rect
                      x="434"
                      y="100"
                      width="12"
                      height="20"
                      rx="1.5"
                      fill="#7A4A22"
                    />
                    <rect
                      x="436"
                      y="102"
                      width="8"
                      height="6"
                      rx="1"
                      fill="#BFE3F5"
                      opacity="0.9"
                    />
                    <circle cx="443.3" cy="111" r="1" fill="#F4D77A" />
                  </g>
                )}
                <rect
                  x="431"
                  y="119"
                  width="18"
                  height="4"
                  rx="1"
                  fill="#CFC6B0"
                />
                <circle cx="431" cy="96" r="1.6" fill="#FFE9A8" />
                {[418, 451].map((wx) => (
                  <g key={wx}>
                    <rect
                      x={wx - 1.5}
                      y="90.5"
                      width="14"
                      height="15"
                      rx="1.5"
                      fill="#fff"
                      stroke="#D8CFB8"
                    />
                    <rect x={wx} y="92" width="11" height="12" fill="#BFE3F5" />
                    <path
                      d={`M${wx} 92H${wx + 11}L${wx} 100Z`}
                      fill="#fff"
                      opacity="0.35"
                    />
                    <rect
                      x={wx}
                      y="92"
                      width="3.5"
                      height="12"
                      fill="#F4D77A"
                      opacity="0.5"
                    />
                  </g>
                ))}
                {phase === "delivering" && routeP > 0.7 && (
                  <g className="ol-pop">
                    <circle cx="423.5" cy="101.5" r="3.6" fill="#F2C9A0" />
                    <path d="M419.9 101a3.6 3.6 0 0 1 7.2 0Z" fill="#6B4A2E" />
                    <circle cx="422.2" cy="102" r="0.55" fill="#3A2A1E" />
                    <circle cx="424.8" cy="102" r="0.55" fill="#3A2A1E" />
                    <path
                      d="M422.3 103.6q1.2 1.1 2.4 0"
                      stroke="#A8553A"
                      strokeWidth="0.6"
                      strokeLinecap="round"
                    />
                  </g>
                )}
                <circle cx="417" cy="121" r="5" fill="#6FA25B" />
                <circle cx="415" cy="119" r="2.8" fill="#8DBE74" />
                <circle cx="465" cy="121" r="5" fill="#6FA25B" />
                <circle cx="463" cy="119" r="2.8" fill="#8DBE74" />
                <circle cx="419" cy="117" r="1" fill="#F2A0B5" />
                <circle cx="466" cy="118" r="1" fill="#F4D77A" />

                {phase !== "delivered" ? (
                  <g className="ol-pinbounce">
                    <path
                      d="M440 56C433 49 431 43 431 40a9 9 0 0 1 18 0c0 3-2 9-9 16Z"
                      fill={TEAL}
                      stroke="#fff"
                      strokeWidth="1.2"
                    />
                    <circle cx="440" cy="40" r="3.4" fill="#fff" />
                  </g>
                ) : (
                  <>
                    <g className="ol-pop">
                      <rect
                        x="449"
                        y="111"
                        width="13"
                        height="10"
                        rx="2"
                        fill={TEAL}
                        stroke={TEAL_DARK}
                      />
                      <path
                        d="M449 114H462"
                        stroke="#fff"
                        strokeWidth="0.8"
                        opacity="0.7"
                      />
                      <rect
                        x="453"
                        y="115"
                        width="5"
                        height="5"
                        rx="1"
                        fill="#fff"
                      />
                    </g>
                    <g className="ol-pop">
                      <circle
                        cx="440"
                        cy="38"
                        r="11"
                        fill="#22C55E"
                        stroke="#fff"
                        strokeWidth="1.5"
                      />
                      <path
                        d="M434.5 38l4 4 7-8"
                        stroke="#fff"
                        strokeWidth="2.4"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                  </>
                )}

                {/* ---------- Melmah restaurant ---------- */}
                <rect
                  x="276"
                  y="374"
                  width="36"
                  height="14"
                  rx="3"
                  fill="#F3F0E6"
                  stroke="#DDD6C3"
                />
                <Block
                  x={260}
                  y={394}
                  w={60}
                  h={40}
                  d={7}
                  front="#F7EEDD"
                  top={TEAL_LIGHT}
                  side="#0B6E64"
                >
                  {/* roof detail */}
                  <rect
                    x={266}
                    y={389}
                    width={18}
                    height={4}
                    rx={1}
                    fill="#fff"
                    opacity="0.18"
                  />
                  <rect x={307} y={380} width={7} height={9} fill="#8A8F9E" />
                  <rect
                    x={306}
                    y={378.5}
                    width={9}
                    height={2.5}
                    fill="#6B7080"
                  />
                  {/* sign with logo */}
                  <rect
                    x={264}
                    y={396}
                    width={52}
                    height={11}
                    rx={2.5}
                    fill="#fff"
                    stroke="#DCCFB4"
                    strokeWidth={0.6}
                  />
                  <image
                    href={logoSrc}
                    x={266}
                    y={396.5}
                    width={10}
                    height={10}
                    preserveAspectRatio="xMidYMid meet"
                  />
                  <text
                    x={280}
                    y={404.2}
                    fontSize="6.6"
                    fontWeight="700"
                    fill={TEAL_DARK}
                    fontFamily="Georgia, serif"
                  >
                    Melmah
                  </text>
                  {/* striped awning */}
                  {Array.from({ length: 8 }).map((_, i) => (
                    <g key={i}>
                      <rect
                        x={260 + i * 7.5}
                        y={408}
                        width={7.5}
                        height={7}
                        fill={i % 2 ? "#fff" : TEAL}
                      />
                      <circle
                        cx={263.75 + i * 7.5}
                        cy={415}
                        r={3.75}
                        fill={i % 2 ? "#fff" : TEAL}
                      />
                    </g>
                  ))}
                  <rect
                    x={260}
                    y={407.4}
                    width={60}
                    height={1.2}
                    fill="#000"
                    opacity="0.12"
                  />
                  {/* windows (warm light) */}
                  <rect
                    x={264}
                    y={420}
                    width={16}
                    height={11}
                    rx={1.5}
                    fill="#FFE9A8"
                    stroke="#E6C96F"
                  />
                  <rect
                    x={300}
                    y={420}
                    width={16}
                    height={11}
                    rx={1.5}
                    fill="#FFE9A8"
                    stroke="#E6C96F"
                  />
                  <path
                    d="M264 420L274 420L266 431H264Z"
                    fill="#fff"
                    opacity="0.35"
                  />
                  <path
                    d="M300 420L310 420L302 431H300Z"
                    fill="#fff"
                    opacity="0.35"
                  />
                  <g
                    className={
                      phase === "preparing" && orderSent ? "ol-chef" : undefined
                    }
                  >
                    <circle cx="272" cy="427.6" r="3.1" fill="#F2C9A0" />
                    <circle
                      cx="270.2"
                      cy="423.4"
                      r="2.1"
                      fill="#fff"
                      stroke="#D8DCE6"
                      strokeWidth="0.3"
                    />
                    <circle
                      cx="272"
                      cy="422.4"
                      r="2.4"
                      fill="#fff"
                      stroke="#D8DCE6"
                      strokeWidth="0.3"
                    />
                    <circle
                      cx="273.8"
                      cy="423.4"
                      r="2.1"
                      fill="#fff"
                      stroke="#D8DCE6"
                      strokeWidth="0.3"
                    />
                    <rect
                      x="269.1"
                      y="424"
                      width="5.8"
                      height="1.8"
                      rx="0.6"
                      fill="#fff"
                      stroke="#D8DCE6"
                      strokeWidth="0.3"
                    />
                    <circle cx="271" cy="427.6" r="0.5" fill="#3A2A1E" />
                    <circle cx="273" cy="427.6" r="0.5" fill="#3A2A1E" />
                    <path
                      d="M271.2 429q0.8 0.8 1.6 0"
                      stroke="#A8553A"
                      strokeWidth="0.5"
                      strokeLinecap="round"
                    />
                    <circle
                      cx="270.1"
                      cy="428.8"
                      r="0.7"
                      fill="#F28B9B"
                      opacity="0.55"
                    />
                    <circle
                      cx="273.9"
                      cy="428.8"
                      r="0.7"
                      fill="#F28B9B"
                      opacity="0.55"
                    />
                  </g>
                  {/* door */}
                  <rect
                    x={286}
                    y={419}
                    width={16}
                    height={15}
                    rx={1.5}
                    fill="#1F2A36"
                  />
                  <rect
                    x={288}
                    y={421}
                    width={5.6}
                    height={13}
                    fill="#BFE3F5"
                    opacity="0.9"
                  />
                  <rect
                    x={294.4}
                    y={421}
                    width={5.6}
                    height={13}
                    fill="#BFE3F5"
                    opacity="0.9"
                  />
                  <circle cx={293.4} cy={428} r={0.8} fill="#C9A227" />
                  <circle cx={295.2} cy={428} r={0.8} fill="#C9A227" />
                  {/* plant pots */}
                  <rect x={281} y={428} width={4} height={5} fill="#B4532A" />
                  <circle cx={283} cy={426.5} r={3} fill="#6FA25B" />
                  <rect x={303} y={428} width={4} height={5} fill="#B4532A" />
                  <circle cx={305} cy={426.5} r={3} fill="#6FA25B" />
                </Block>

                {orderSent && phase !== "delivered" && (
                  <g>
                    {[0, 1, 2].map((i) => (
                      <circle
                        key={i}
                        className="ol-steam"
                        cx={311 + (i - 1) * 3}
                        cy="376"
                        r="3"
                        fill="#fff"
                        stroke="#E1DCCD"
                        style={{ animationDelay: `${i * 0.5}s` }}
                      />
                    ))}
                  </g>
                )}
                {orderSent && phase === "preparing" && (
                  <g className="ol-pop">
                    <rect
                      x="312"
                      y="352"
                      width="54"
                      height="17"
                      rx="8.5"
                      fill={NAVY}
                    />
                    <path d="M320 369L324 374L328 369Z" fill={NAVY} />
                    <text
                      x="339"
                      y="363.5"
                      textAnchor="middle"
                      fontSize="7"
                      fontWeight="700"
                      fill="#F4D77A"
                      fontFamily={sans}
                    >
                      {s("onlineNewOrder")}
                    </text>
                  </g>
                )}

                {/* ---------- courier motorbike (top view, rotates with the road) ---------- */}
                <g transform={`translate(${scooter.x} ${scooter.y})`}>
                  <g transform={`rotate(${scooter.a}) scale(1.15)`}>
                    <ellipse
                      cx="1"
                      cy="2.2"
                      rx="17"
                      ry="6"
                      fill="#000"
                      opacity="0.22"
                    />
                    {phase === "delivering" && (
                      <path d="M12 0L40 -9V9Z" fill="#FFE9A8" opacity="0.2" />
                    )}
                    {phase === "delivering" && (
                      <g
                        className="ol-speed"
                        stroke="#fff"
                        strokeWidth="1"
                        strokeLinecap="round"
                        opacity="0.7"
                      >
                        <path d="M-22 -4H-31" />
                        <path d="M-22 4H-29" />
                      </g>
                    )}
                    {phase === "delivering" &&
                      [0, 1, 2].map((i) => (
                        <circle
                          key={i}
                          className="ol-puff"
                          cx={-20}
                          cy={0}
                          r={2.2}
                          fill="#fff"
                          stroke="#E1DCCD"
                          strokeWidth="0.4"
                          style={{ animationDelay: `${i * 0.28}s` }}
                        />
                      ))}
                    <g
                      className={phase === "delivering" ? "ol-bob" : undefined}
                    >
                      {/* wheels */}
                      <rect
                        x="-12"
                        y="-1.5"
                        width="6.5"
                        height="3"
                        rx="1.5"
                        fill="#15171E"
                      />
                      <rect
                        x="6.5"
                        y="-1.5"
                        width="6.5"
                        height="3"
                        rx="1.5"
                        fill="#15171E"
                      />
                      {/* body */}
                      <rect
                        x="-9"
                        y="-2.6"
                        width="19"
                        height="5.2"
                        rx="2.6"
                        fill="#ECEEF2"
                        stroke="#B9BECB"
                        strokeWidth="0.4"
                      />
                      <rect
                        x="-8"
                        y="-0.7"
                        width="17"
                        height="1.4"
                        rx="0.7"
                        fill={TEAL}
                      />
                      <rect
                        x="-9"
                        y="-1.6"
                        width="2"
                        height="3.2"
                        rx="1"
                        fill="#D6402B"
                      />
                      {/* handlebar + headlight */}
                      <rect
                        x="7"
                        y="-5.2"
                        width="1.8"
                        height="10.4"
                        rx="0.9"
                        fill="#262A35"
                      />
                      <circle cx="11.2" cy="0" r="1.7" fill="#FFE9A8" />
                      {/* delivery box with upright logo */}
                      <g key={boxKey} className="ol-pop">
                        <rect
                          x="-18"
                          y="-5.6"
                          width="10.5"
                          height="11.2"
                          rx="2"
                          fill={TEAL}
                          stroke={TEAL_DARK}
                          strokeWidth="0.6"
                        />
                        <rect
                          x="-18"
                          y="-5.6"
                          width="10.5"
                          height="3"
                          rx="1.5"
                          fill={TEAL_LIGHT}
                        />
                        <g
                          transform={`translate(-12.75 0.4) rotate(${-scooter.a - 0})`}
                        >
                          <rect
                            x="-3.6"
                            y="-3.6"
                            width="7.2"
                            height="7.2"
                            rx="1.6"
                            fill="#fff"
                          />
                          <image
                            href={logoSrc}
                            x="-3.2"
                            y="-3.2"
                            width="6.4"
                            height="6.4"
                            preserveAspectRatio="xMidYMid meet"
                          />
                        </g>
                      </g>
                      {/* rider from above: arms, jacket, helmet */}
                      <path
                        d="M-0.5 -3.4L7.8 -4.4M-0.5 3.4L7.8 4.4"
                        stroke={TEAL}
                        strokeWidth="2.2"
                        strokeLinecap="round"
                      />
                      <ellipse
                        cx="-1.2"
                        cy="0"
                        rx="3.4"
                        ry="5"
                        fill={TEAL}
                        stroke={TEAL_DARK}
                        strokeWidth="0.5"
                      />
                      <circle
                        cx="1.6"
                        cy="-3.4"
                        r="1.3"
                        fill="#fff"
                        stroke="#C9CEDA"
                        strokeWidth="0.4"
                      />
                      <circle cx="1.6" cy="-3.4" r="0.6" fill="#F28B9B" />
                      <circle
                        cx="1.6"
                        cy="3.4"
                        r="1.3"
                        fill="#fff"
                        stroke="#C9CEDA"
                        strokeWidth="0.4"
                      />
                      <circle cx="1.6" cy="3.4" r="0.6" fill="#F28B9B" />
                      <circle
                        cx="2.2"
                        cy="0"
                        r="3.2"
                        fill="#fff"
                        stroke="#C9CEDA"
                        strokeWidth="0.5"
                      />
                      <path d="M-0.6 0H5" stroke={TEAL} strokeWidth="1" />
                      <rect
                        x="4"
                        y="-2"
                        width="1.8"
                        height="4"
                        rx="0.9"
                        fill="#14161D"
                        opacity="0.65"
                      />
                    </g>
                  </g>
                </g>

                {/* drifting cloud shadows */}
                <ellipse
                  className="ol-cloud"
                  cx="236"
                  cy="150"
                  rx="46"
                  ry="22"
                  fill="#2B3A4A"
                  opacity="0.06"
                />
                <ellipse
                  className="ol-cloud ol-cloud2"
                  cx="236"
                  cy="320"
                  rx="38"
                  ry="18"
                  fill="#2B3A4A"
                  opacity="0.05"
                />

                {/* live badge */}
                {tracking && (
                  <g className="ol-pop">
                    <rect
                      x="244"
                      y="32"
                      width="40"
                      height="13"
                      rx="6.5"
                      fill="#fff"
                      stroke="#E4DDCB"
                    />
                    <circle
                      className="ol-pulse"
                      cx="252"
                      cy="38.5"
                      r="2.4"
                      fill="#EF4444"
                    />
                    <circle cx="252" cy="38.5" r="2.4" fill="#EF4444" />
                    <text
                      x="258"
                      y="41"
                      fontSize="6.4"
                      fontWeight="700"
                      fill={NAVY}
                      fontFamily={sans}
                    >
                      {s("onlineLive")}
                    </text>
                  </g>
                )}

                {/* ETA chip that follows the courier */}
                {phase === "delivering" && routeP < 0.9 && (
                  <g transform={`translate(${scooter.x} ${scooter.y - 30})`}>
                    <rect
                      x="-19"
                      y="-6"
                      width="38"
                      height="12"
                      rx="6"
                      fill={NAVY}
                    />
                    <path d="M-3 6L0 10L3 6Z" fill={NAVY} />
                    <text
                      x="0"
                      y="2.4"
                      textAnchor="middle"
                      fontSize="6.4"
                      fontWeight="700"
                      fill="#F4D77A"
                      fontFamily={sans}
                    >
                      {num(eta)} {s("onlineMin")}
                    </text>
                  </g>
                )}

                {/* order bag flying from the restaurant to the courier */}
                {bag >= 0 &&
                  (() => {
                    const u = 1 - bag;
                    const lift = Math.sin(bag * Math.PI);
                    const bx =
                      u * u * 294 + 2 * u * bag * 334 + bag * bag * 297;
                    const by =
                      u * u * 430 +
                      2 * u * bag * 392 +
                      bag * bag * 376 -
                      lift * 6;
                    return (
                      <g
                        transform={`translate(${bx} ${by}) scale(${1 + lift * 0.3})`}
                      >
                        <path
                          d="M-2.6 -3.6a2.6 2.6 0 0 1 5.2 0"
                          stroke={TEAL_DARK}
                          strokeWidth="0.9"
                        />
                        <rect
                          x="-4.5"
                          y="-3.6"
                          width="9"
                          height="9"
                          rx="2"
                          fill={TEAL}
                          stroke={TEAL_DARK}
                          strokeWidth="0.6"
                        />
                        <rect
                          x="-2.6"
                          y="-1.6"
                          width="5.2"
                          height="5.2"
                          rx="1.2"
                          fill="#fff"
                        />
                        <image
                          href={logoSrc}
                          x="-2.3"
                          y="-1.3"
                          width="4.6"
                          height="4.6"
                          preserveAspectRatio="xMidYMid meet"
                        />
                      </g>
                    );
                  })()}

                {/* celebration: hearts + confetti */}
                {phase === "delivered" && (
                  <g>
                    {[0, 1, 2].map((i) => (
                      <g
                        key={`h${i}`}
                        transform={`translate(${450 + i * 7} 96)`}
                      >
                        <path
                          className="ol-heart"
                          d="M0 -2C-3 -5 -6 -1 0 3C6 -1 3 -5 0 -2Z"
                          fill="#F25C7A"
                          style={{ animationDelay: `${i * 0.5}s` }}
                        />
                      </g>
                    ))}
                    {[
                      [-34, -44, 220, "#F4D77A"],
                      [-20, -56, -160, "#13A093"],
                      [-6, -62, 200, "#F25C7A"],
                      [10, -58, -240, "#C9A227"],
                      [24, -50, 180, "#13A093"],
                      [38, -40, -200, "#F25C7A"],
                      [-42, -24, 150, "#C9A227"],
                      [46, -22, -170, "#F4D77A"],
                    ].map(([dx, dy, r, c], i) => (
                      <g
                        key={`c${i}`}
                        className="ol-confetti"
                        style={
                          {
                            "--dx": `${dx}px`,
                            "--dy": `${dy}px`,
                            "--r": `${r}deg`,
                            animationDelay: `${i * 0.04}s`,
                          } as React.CSSProperties
                        }
                      >
                        <rect
                          x="440"
                          y="98"
                          width="3"
                          height="5"
                          rx="0.6"
                          fill={c as string}
                        />
                      </g>
                    ))}
                  </g>
                )}

                {/* order packet flying from the phone */}
                {ping >= 0 && (
                  <g transform={`translate(${pingPos.x} ${pingPos.y})`}>
                    <circle r="10" fill={GOLD} opacity="0.25" />
                    <rect
                      x="-5"
                      y="-4"
                      width="10"
                      height="8"
                      rx="1.5"
                      fill={GOLD}
                    />
                    <path d="M-5 -4L0 1L5 -4" stroke="#fff" strokeWidth="1" />
                  </g>
                )}
              </g>
              <rect
                x="236.5"
                y="24.5"
                width="271"
                height="419"
                rx="19.5"
                stroke="#D8CFB8"
              />
            </svg>

            {/* ---------- phone screen (HTML) ---------- */}
            <div
              dir={rtl ? "rtl" : "ltr"}
              className="absolute flex flex-col overflow-hidden bg-white"
              style={{
                left: q(24),
                top: q(28),
                width: q(180),
                height: q(404),
                borderRadius: q(21),
                fontFamily: sans,
              }}
            >
              <div
                className="flex items-center justify-between text-white"
                style={{ background: NAVY, padding: `${q(5)} ${q(12)}` }}
              >
                <span style={{ fontSize: q(8), fontWeight: 500 }}>
                  {s("onlineAppTime")}
                </span>
                <span className="flex items-center" style={{ gap: q(3) }}>
                  <Wifi style={{ width: q(9), height: q(9) }} />
                  <BatteryFull style={{ width: q(11), height: q(11) }} />
                </span>
              </div>

              {/* app header with Melmah logo */}
              <div
                className="flex items-center"
                style={{
                  gap: q(7),
                  padding: `${q(7)} ${q(10)} ${q(5)}`,
                  borderBottom: "1px solid #EEF0F4",
                }}
              >
                <img
                  src={logoSrc}
                  alt=""
                  style={{ width: q(24), height: q(24), objectFit: "contain" }}
                />
                <div>
                  <div style={{ fontSize: q(7), color: "#94A3B8" }}>
                    {s("onlineAppEyebrow")}
                  </div>
                  <div
                    style={{
                      fontSize: q(12),
                      fontWeight: 700,
                      color: TEAL_DARK,
                      fontFamily: "Georgia, serif",
                      lineHeight: 1.1,
                    }}
                  >
                    {s("onlineAppTitle")}
                  </div>
                </div>
              </div>

              {/* ----- menu + cart ----- */}
              {!tracking && (
                <>
                  <div
                    className="grid grid-cols-3 content-start"
                    style={{ padding: `${q(8)} ${q(8)} ${q(4)}`, gap: q(5) }}
                  >
                    {MENU_ITEMS.map(({ icon: Icon, key }) => {
                      const on = clickedKey === key;
                      return (
                        <div
                          key={key}
                          className="flex flex-col items-center justify-center"
                          style={{
                            gap: q(3),
                            padding: `${q(6)} 0`,
                            borderRadius: q(8),
                            border: `1px solid ${on ? GOLD : "#EEF0F4"}`,
                            background: on
                              ? "rgba(201,162,39,0.12)"
                              : "#FAFBFC",
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
                              width: q(22),
                              height: q(22),
                              borderRadius: q(7),
                              background: on
                                ? "rgba(10,124,112,0.28)"
                                : "rgba(10,124,112,0.12)",
                              transition: "background .2s",
                            }}
                          >
                            <Icon
                              style={{
                                width: q(12),
                                height: q(12),
                                color: TEAL,
                              }}
                            />
                          </span>
                          <span
                            style={{
                              fontSize: q(7),
                              fontWeight: 600,
                              color: NAVY,
                            }}
                          >
                            {getMenuLabel(key)}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div
                    className="flex-1"
                    style={{ padding: `${q(4)} ${q(10)}` }}
                  >
                    <div
                      style={{
                        fontSize: q(7.5),
                        fontWeight: 700,
                        color: "#475569",
                        marginBottom: q(3),
                      }}
                    >
                      {order.length ? s("onlineCart") : s("onlineBrowse")}
                    </div>
                    {order.map((it, i) => (
                      <div
                        key={`${it.name}-${i}`}
                        className="ol-pop-html flex items-center justify-between"
                        style={{
                          padding: `${q(4)} 0`,
                          borderBottom: "1px dashed #E2E8F0",
                          fontSize: q(8),
                          color: NAVY,
                        }}
                      >
                        <span>{itemName(it.name)}</span>
                        <span style={{ fontWeight: 600 }}>
                          {money(it.price)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div
                    style={{
                      padding: q(8),
                      borderTop: "1px solid #EEF0F4",
                      background: "#F8FAFC",
                    }}
                  >
                    <div
                      className="flex items-center justify-between"
                      style={{
                        padding: `${q(6)} ${q(9)}`,
                        borderRadius: q(9),
                        background: order.length ? NAVY : "#E2E8F0",
                        color: order.length ? "#F4D77A" : "#94A3B8",
                        fontSize: q(8.5),
                        fontWeight: 700,
                        transition: "background .3s",
                      }}
                    >
                      <span className="flex items-center" style={{ gap: q(4) }}>
                        <ShoppingBag style={{ width: q(10), height: q(10) }} />
                        {num(order.length)}
                      </span>
                      <span>
                        {s("onlineCheckout")}
                        {order.length ? ` · ${money(orderTotal)}` : ""}
                      </span>
                    </div>
                  </div>
                </>
              )}

              {/* ----- live tracking ----- */}
              {tracking && (
                <div
                  className="ol-pop-html flex flex-1 flex-col items-center"
                  style={{ padding: `${q(12)} ${q(12)}`, gap: q(6) }}
                >
                  <span
                    className="flex items-center justify-center"
                    style={{
                      width: q(42),
                      height: q(42),
                      borderRadius: "9999px",
                      background:
                        phase === "delivered"
                          ? "#16A34A"
                          : "rgba(10,124,112,0.14)",
                      color: phase === "delivered" ? "#fff" : TEAL,
                      transition: "all .3s",
                    }}
                  >
                    {phase === "preparing" && (
                      <ChefHat style={{ width: q(21), height: q(21) }} />
                    )}
                    {phase === "delivering" && (
                      <Bike style={{ width: q(21), height: q(21) }} />
                    )}
                    {phase === "delivered" && (
                      <Check
                        style={{ width: q(21), height: q(21) }}
                        strokeWidth={3}
                      />
                    )}
                  </span>
                  <div className="text-center">
                    <div
                      style={{
                        fontSize: q(10.5),
                        fontWeight: 700,
                        color: NAVY,
                      }}
                    >
                      {phase === "preparing"
                        ? s("onlinePreparing")
                        : phase === "delivering"
                          ? s("onlineOnTheWay")
                          : s("onlineDelivered")}
                    </div>
                    <div
                      style={{
                        fontSize: q(7.5),
                        color: "#64748B",
                        marginTop: q(2),
                      }}
                    >
                      {phase === "preparing"
                        ? s("onlinePreparingSub")
                        : phase === "delivering"
                          ? `${num(eta)} ${s("onlineMin")}`
                          : s("onlineDeliveredSub")}
                    </div>
                  </div>

                  <div
                    className="flex w-full items-center"
                    style={{ gap: q(4), marginTop: q(1) }}
                  >
                    {[0, 1, 2].map((i) => {
                      const filled =
                        phase === "delivered" ||
                        (phase === "delivering" && i < 2) ||
                        (phase === "preparing" && i < 1);
                      return (
                        <span
                          key={i}
                          style={{
                            flex: 1,
                            height: q(4),
                            borderRadius: q(2),
                            background: filled ? TEAL : "#E2E8F0",
                            transition: "background .4s",
                          }}
                        />
                      );
                    })}
                  </div>

                  {(phase === "delivering" || phase === "delivered") && (
                    <div
                      className="ol-pop-html flex w-full items-center"
                      style={{
                        gap: q(6),
                        padding: q(6),
                        borderRadius: q(9),
                        border: "1px solid #EEF0F4",
                        background: "#fff",
                      }}
                    >
                      <span
                        className="flex items-center justify-center"
                        style={{
                          width: q(20),
                          height: q(20),
                          borderRadius: "9999px",
                          background: TEAL,
                          color: "#fff",
                        }}
                      >
                        <Bike style={{ width: q(11), height: q(11) }} />
                      </span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: q(6.5), color: "#94A3B8" }}>
                          {s("onlineCourierLabel")}
                        </div>
                        <div
                          style={{
                            fontSize: q(8.5),
                            fontWeight: 700,
                            color: NAVY,
                          }}
                        >
                          {s("onlineCourierName")}
                        </div>
                      </div>
                      <div
                        className="flex items-center"
                        style={{ gap: q(1.5) }}
                      >
                        {phase === "delivered" ? (
                          [0, 1, 2, 3, 4].map((i) => (
                            <Star
                              key={i}
                              className="ol-pop-html"
                              style={{
                                width: q(8),
                                height: q(8),
                                color: GOLD,
                                fill: GOLD,
                                animationDelay: `${i * 0.12}s`,
                              }}
                            />
                          ))
                        ) : (
                          <>
                            <Star
                              style={{
                                width: q(8),
                                height: q(8),
                                color: GOLD,
                                fill: GOLD,
                              }}
                            />
                            <span
                              style={{
                                fontSize: q(7.5),
                                fontWeight: 700,
                                color: NAVY,
                              }}
                            >
                              {num("4.9").replace(
                                ".",
                                lang === "en" ? "." : "٫",
                              )}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  )}

                  <div
                    className="w-full"
                    style={{
                      marginTop: q(3),
                      padding: q(8),
                      borderRadius: q(9),
                      background: "#F8FAFC",
                      border: "1px solid #EEF0F4",
                    }}
                  >
                    {order.map((it, i) => (
                      <div
                        key={i}
                        className="flex justify-between"
                        style={rowStyle}
                      >
                        <span>{itemName(it.name)}</span>
                        <span>{money(it.price)}</span>
                      </div>
                    ))}
                    <div className="flex justify-between" style={rowStyle}>
                      <span>{s("onlineDeliveryFee")}</span>
                      <span>{money(DELIVERY_FEE)}</span>
                    </div>
                    <div
                      className="flex items-center justify-between"
                      style={{
                        marginTop: q(3),
                        paddingTop: q(4),
                        borderTop: "1px solid #E2E8F0",
                        fontSize: q(8.5),
                        fontWeight: 700,
                        color: NAVY,
                      }}
                    >
                      <span>{s("onlineTotal")}</span>
                      <span>{money(grand)}</span>
                    </div>
                    <div
                      className="flex items-center"
                      style={{
                        gap: q(5),
                        marginTop: q(5),
                        fontSize: q(7),
                        color: "#16A34A",
                        fontWeight: 600,
                      }}
                    >
                      <img
                        src={hesabSrc}
                        alt=""
                        style={{
                          width: q(16),
                          height: q(12),
                          objectFit: "contain",
                        }}
                      />
                      <Check
                        style={{ width: q(8), height: q(8) }}
                        strokeWidth={3}
                      />
                      {s("onlinePaidHesab")}
                    </div>
                  </div>
                </div>
              )}

              <div
                className="flex justify-center"
                style={{
                  padding: q(5),
                  background: "#fff",
                  borderTop: "1px solid #EEF0F4",
                }}
              >
                <span
                  style={{
                    width: q(48),
                    height: q(3),
                    borderRadius: "9999px",
                    background: "#CBD5E1",
                  }}
                />
              </div>

              {/* ----- payment sheet: choose Hesab Pay ----- */}
              {phase === "paying" && (
                <>
                  <div
                    className="absolute inset-0"
                    style={{ background: "rgba(11,18,32,0.45)" }}
                  />
                  <div
                    className="ol-sheet absolute bottom-0 left-0 right-0 bg-white"
                    style={{
                      padding: `${q(10)} ${q(10)} ${q(12)}`,
                      borderTopLeftRadius: q(14),
                      borderTopRightRadius: q(14),
                    }}
                  >
                    <div
                      className="flex items-center justify-between"
                      style={{ marginBottom: q(7) }}
                    >
                      <span
                        style={{
                          fontSize: q(9.5),
                          fontWeight: 700,
                          color: NAVY,
                        }}
                      >
                        {s("onlinePayTitle")}
                      </span>
                      <span
                        className="flex items-center"
                        style={{
                          gap: q(3),
                          fontSize: q(6.5),
                          color: "#16A34A",
                          fontWeight: 600,
                        }}
                      >
                        <Lock style={{ width: q(8), height: q(8) }} />
                        {s("onlineSecure")}
                      </span>
                    </div>

                    {/* payment methods: Card · AfPay · Hesab Pay */}
                    <div className="flex" style={{ gap: q(5) }}>
                      {(["card", "afpay", "hesab"] as const).map((id) => {
                        const sel = id === "hesab" && selectedHesab;
                        return (
                          <div
                            key={id}
                            className="relative flex flex-1 items-center justify-center"
                            style={{
                              height: q(32),
                              padding: q(3),
                              borderRadius: q(8),
                              border: `${sel ? 2 : 1}px solid ${sel ? GOLD : "#E2E8F0"}`,
                              background: "#fff",
                              boxShadow: sel
                                ? "0 0 0 3px rgba(201,162,39,0.22)"
                                : "none",
                              transform: sel ? "scale(1.04)" : "scale(1)",
                              opacity: selectedHesab && !sel ? 0.45 : 1,
                              transition: "all .25s ease",
                            }}
                          >
                            {id === "card" ? (
                              <div
                                className="flex flex-col items-center"
                                style={{ gap: q(2) }}
                              >
                                <CreditCard
                                  style={{
                                    width: q(13),
                                    height: q(13),
                                    color: "#334155",
                                  }}
                                />
                                <span
                                  style={{
                                    fontSize: q(6.5),
                                    fontWeight: 600,
                                    color: "#334155",
                                  }}
                                >
                                  {s("onlineCard")}
                                </span>
                              </div>
                            ) : (
                              <img
                                src={id === "hesab" ? hesabSrc : afpaySrc}
                                alt={id === "hesab" ? "Hesab Pay" : "AfPay"}
                                style={{
                                  width: "100%",
                                  height: "100%",
                                  objectFit: "contain",
                                }}
                              />
                            )}
                            {sel && (
                              <span
                                className="ol-pop-html absolute flex items-center justify-center"
                                style={{
                                  top: q(-4),
                                  insetInlineEnd: q(-4),
                                  width: q(11),
                                  height: q(11),
                                  borderRadius: "9999px",
                                  background: "#16A34A",
                                  color: "#fff",
                                }}
                              >
                                <Check
                                  style={{ width: q(7), height: q(7) }}
                                  strokeWidth={3.5}
                                />
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <div
                      style={{
                        margin: `${q(8)} 0`,
                        fontSize: q(7.5),
                        color: "#475569",
                      }}
                    >
                      <div
                        className="flex justify-between"
                        style={{ padding: `${q(1.5)} 0` }}
                      >
                        <span>{s("onlineSubtotal")}</span>
                        <span>{money(orderTotal)}</span>
                      </div>
                      <div
                        className="flex justify-between"
                        style={{ padding: `${q(1.5)} 0` }}
                      >
                        <span>{s("onlineDeliveryFee")}</span>
                        <span>{money(DELIVERY_FEE)}</span>
                      </div>
                      <div
                        className="flex justify-between"
                        style={{
                          marginTop: q(3),
                          paddingTop: q(4),
                          borderTop: "1px solid #E2E8F0",
                          fontWeight: 700,
                          color: NAVY,
                          fontSize: q(9),
                        }}
                      >
                        <span>{s("onlineTotal")}</span>
                        <span>{money(grand)}</span>
                      </div>
                    </div>

                    <div
                      className="flex items-center justify-center"
                      style={{
                        gap: q(5),
                        padding: `${q(7)} 0`,
                        borderRadius: q(9),
                        background:
                          payStage === "approved"
                            ? "#16A34A"
                            : payStage === "choose"
                              ? "#E2E8F0"
                              : NAVY,
                        color:
                          payStage === "approved"
                            ? "#fff"
                            : payStage === "choose"
                              ? "#94A3B8"
                              : "#F4D77A",
                        fontSize: q(9),
                        fontWeight: 700,
                        transform: btnPress ? "scale(0.96)" : "scale(1)",
                        boxShadow: btnPress
                          ? "0 0 0 4px rgba(201,162,39,0.3)"
                          : "none",
                        transition: "all .2s ease, background .3s",
                      }}
                    >
                      {(payStage === "choose" || payStage === "form") &&
                        `${s("onlinePay")} · ${money(grand)}`}
                      {payStage === "processing" && (
                        <>
                          <span
                            className="ol-spin"
                            style={{
                              width: q(9),
                              height: q(9),
                              borderRadius: "9999px",
                              border: `${q(1.6)} solid rgba(244,215,122,0.3)`,
                              borderTopColor: "#F4D77A",
                            }}
                          />
                          {s("onlineProcessing")}
                        </>
                      )}
                      {payStage === "approved" && (
                        <span
                          className="ol-pop-html flex items-center"
                          style={{ gap: q(5) }}
                        >
                          <Check
                            style={{ width: q(11), height: q(11) }}
                            strokeWidth={3}
                          />
                          {s("onlinePaymentSuccess")}
                        </span>
                      )}
                    </div>
                  </div>
                </>
              )}

              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(120deg, rgba(255,255,255,0.22), rgba(255,255,255,0) 34%)",
                }}
              />
            </div>
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
          <h2
            className="font-serif text-2xl leading-tight sm:text-3xl"
            style={{ color: NAVY }}
          >
            {s("onlineTitle")}
          </h2>
          <p className="mt-3 max-w-[48ch] text-sm leading-relaxed text-slate-600 sm:text-base">
            {s("onlineSubtitle")}
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
                      background: done ? TEAL : active ? GOLD : "#fff",
                      borderColor: done ? TEAL : active ? GOLD : "#E2E8F0",
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
                      color: active ? NAVY : done ? "#475569" : "#94A3B8",
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
        @keyframes olFloat {
          0% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-16px) rotate(3deg);
          }
          100% {
            transform: translateY(0) rotate(0deg);
          }
        }
        @keyframes olPop {
          0% {
            transform: scale(0.8);
            opacity: 0;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        @keyframes olSheet {
          0% {
            transform: translateY(100%);
          }
          100% {
            transform: translateY(0);
          }
        }
        @keyframes olSpin {
          to {
            transform: rotate(360deg);
          }
        }
        @keyframes olPulse {
          0% {
            opacity: 0.9;
            transform: scale(0.6);
          }
          100% {
            opacity: 0;
            transform: scale(2.6);
          }
        }
        @keyframes olSteam {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          30% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-16px) scale(1.4);
            opacity: 0;
          }
        }
        @keyframes olBob {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1.2px);
          }
        }
        @keyframes olSpeed {
          0%,
          100% {
            opacity: 0.2;
          }
          50% {
            opacity: 0.9;
          }
        }
        @keyframes olPinBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-4px);
          }
        }
        @keyframes olCarA {
          0% {
            transform: translateX(-20px);
          }
          100% {
            transform: translateX(290px);
          }
        }
        @keyframes olCarB {
          0% {
            transform: translateX(20px);
          }
          100% {
            transform: translateX(-290px);
          }
        }
        @keyframes olCarC {
          0% {
            transform: translateY(-20px);
          }
          100% {
            transform: translateY(440px);
          }
        }
        .ol-float {
          animation: olFloat 9s ease-in-out infinite;
        }
        .ol-pop {
          transform-box: fill-box;
          transform-origin: center;
          animation: olPop 0.35s cubic-bezier(0.2, 1.2, 0.4, 1) both;
        }
        .ol-pop-html {
          animation: olPop 0.35s cubic-bezier(0.2, 1.2, 0.4, 1) both;
        }
        .ol-sheet {
          animation: olSheet 0.45s cubic-bezier(0.2, 0.9, 0.3, 1) both;
        }
        .ol-spin {
          animation: olSpin 0.8s linear infinite;
        }
        .ol-pulse {
          transform-box: fill-box;
          transform-origin: center;
          animation: olPulse 1.4s ease-out infinite;
        }
        .ol-steam {
          transform-box: fill-box;
          transform-origin: center;
          animation: olSteam 1.8s ease-out infinite;
        }
        .ol-bob {
          animation: olBob 0.3s ease-in-out infinite;
        }
        .ol-speed {
          animation: olSpeed 0.5s ease-in-out infinite;
        }
        .ol-pinbounce {
          animation: olPinBounce 1.2s ease-in-out infinite;
        }
        .ol-car-a {
          animation: olCarA 9s linear infinite;
        }
        .ol-car-b {
          animation: olCarB 11s linear infinite;
          animation-delay: -4s;
        }
        .ol-car-c {
          animation: olCarC 12s linear infinite;
          animation-delay: -2s;
        }
        @keyframes olWalkA {
          0% {
            transform: translateX(-10px);
          }
          100% {
            transform: translateX(280px);
          }
        }
        @keyframes olWalkB {
          0% {
            transform: translateY(-10px);
          }
          100% {
            transform: translateY(450px);
          }
        }
        @keyframes olCloud {
          0% {
            transform: translateX(-90px);
          }
          100% {
            transform: translateX(380px);
          }
        }
        @keyframes olDuck {
          0%,
          100% {
            transform: translateX(-2.5px);
          }
          50% {
            transform: translateX(2.5px);
          }
        }
        @keyframes olHeart {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          20% {
            opacity: 1;
          }
          100% {
            transform: translateY(-34px) scale(1.15);
            opacity: 0;
          }
        }
        @keyframes olWave {
          from {
            transform: rotate(-12deg);
          }
          to {
            transform: rotate(22deg);
          }
        }
        @keyframes olConfetti {
          0% {
            transform: translate(0, 0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx), var(--dy)) rotate(var(--r));
            opacity: 0;
          }
        }
        @keyframes olChef {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-1.2px);
          }
        }
        @keyframes olPuff {
          0% {
            transform: translateX(0) scale(0.5);
            opacity: 0.8;
          }
          100% {
            transform: translateX(-12px) scale(1.5);
            opacity: 0;
          }
        }
        .ol-walk-a {
          animation: olWalkA 26s linear infinite;
        }
        .ol-walk-b {
          animation: olWalkB 30s linear infinite;
          animation-delay: -9s;
        }
        .ol-cloud {
          animation: olCloud 40s linear infinite;
        }
        .ol-cloud2 {
          animation-duration: 55s;
          animation-delay: -20s;
        }
        .ol-duck {
          animation: olDuck 3.2s ease-in-out infinite;
        }
        .ol-heart {
          transform-box: fill-box;
          transform-origin: center;
          animation: olHeart 1.6s ease-out infinite;
        }
        .ol-wave {
          transform-box: view-box;
          transform-origin: 443.2px 112px;
          animation: olWave 0.6s ease-in-out infinite alternate;
        }
        .ol-confetti {
          transform-box: fill-box;
          transform-origin: center;
          animation: olConfetti 1.3s ease-out both;
        }
        .ol-chef {
          animation: olChef 0.5s ease-in-out infinite;
        }
        .ol-puff {
          transform-box: fill-box;
          transform-origin: center;
          animation: olPuff 0.9s ease-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .ol-float,
          .ol-pop,
          .ol-pop-html,
          .ol-sheet,
          .ol-spin,
          .ol-pulse,
          .ol-steam,
          .ol-bob,
          .ol-speed,
          .ol-pinbounce,
          .ol-car-a,
          .ol-car-b,
          .ol-car-c,
          .ol-walk-a,
          .ol-walk-b,
          .ol-cloud,
          .ol-duck,
          .ol-heart,
          .ol-wave,
          .ol-confetti,
          .ol-chef,
          .ol-puff {
            animation: none !important;
          }
          .ol-confetti {
            display: none;
          }
        }
      `}</style>
    </section>
  );
}
