"use client";

import { useEffect, useRef, useState } from "react";
import { Clock, ChefHat, CheckCircle } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";

// Menu data (static food items)
const FOOD_ITEMS: Record<string, { name: string; price: number }[]> = {
  kebab: [
    { name: "کابلي کباب", price: 400 },
    { name: "شنو کباب", price: 380 },
    { name: "ټکي کباب", price: 420 },
  ],
  burger: [
    { name: "کابلي برګر", price: 300 },
    { name: "چرګ برګر", price: 320 },
    { name: "ډبل برګر", price: 380 },
  ],
  drinks: [
    { name: "شین چای", price: 50 },
    { name: "تور چای", price: 40 },
    { name: "دوغ", price: 80 },
  ],
  rice: [
    { name: "کابلي پلاو", price: 350 },
    { name: "چالو", price: 200 },
    { name: "شپېلې پلاو", price: 300 },
  ],
  desserts: [
    { name: "فالوده", price: 150 },
    { name: "شیر یخ", price: 120 },
  ],
  sides: [
    { name: "نان", price: 20 },
    { name: "سلاد", price: 60 },
    { name: "شوروا", price: 100 },
  ],
};

const MENU_KEYS = Object.keys(FOOD_ITEMS);

type Stage = "new" | "preparing" | "ready";
type Order = {
  id: number;
  name: string;
  price: number;
  table: number;
  stage: Stage;
  created: number; // ms
  since: number; // ms when it entered the current stage
};

// how long an order waits in each stage (ms) and how many fit per stage
const STAGE_MS: Record<Stage, number> = {
  new: 3600,
  preparing: 5200,
  ready: 4400,
};
const LIMIT: Record<Stage, number> = { new: 3, preparing: 2, ready: 2 };
const SPAWN_MS = 3000;

// scene units (viewBox is 640 wide) -> container-query width units
const q = (v: number) => `${(v / 6.4).toFixed(3)}cqw`;

const COLS: {
  stage: Stage;
  Icon: any;
  color: string;
  soft: string;
}[] = [
  {
    stage: "new",
    Icon: Clock,
    color: "#60A5FA",
    soft: "rgba(96,165,250,0.14)",
  },
  {
    stage: "preparing",
    Icon: ChefHat,
    color: "#FBBF24",
    soft: "rgba(251,191,36,0.14)",
  },
  {
    stage: "ready",
    Icon: CheckCircle,
    color: "#4ADE80",
    soft: "rgba(74,222,128,0.14)",
  },
];

const mmss = (ms: number) => {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
};

export default function KitchenBoard({ isRTL }: { isRTL?: boolean }) {
  const t: any = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  const [orders, setOrders] = useState<Order[]>([]);
  const ordersRef = useRef<Order[]>([]);
  const idRef = useRef(1);
  const lastSpawn = useRef(0);
  const [now, setNow] = useState(0);
  const [bellKey, setBellKey] = useState(0);
  const [clock, setClock] = useState("");

  // ----- visibility -----
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // ----- the kitchen "engine": spawn orders and move them along -----
  useEffect(() => {
    if (!isVisible) return;

    const makeOrder = (stage: Stage, n: number, age: number): Order => {
      const key = MENU_KEYS[Math.floor(Math.random() * MENU_KEYS.length)];
      const list = FOOD_ITEMS[key];
      const item = list[Math.floor(Math.random() * list.length)];
      return {
        id: idRef.current++,
        name: item.name,
        price: item.price,
        table: 1 + Math.floor(Math.random() * 12),
        stage,
        created: n - age,
        since: n - Math.min(age, 1500),
      };
    };

    // start with a lively board
    if (ordersRef.current.length === 0) {
      const n = Date.now();
      ordersRef.current = [
        makeOrder("preparing", n, 2600),
        makeOrder("new", n, 1200),
      ];
      lastSpawn.current = n;
      setOrders(ordersRef.current);
      setNow(n);
    }

    const tick = () => {
      const n = Date.now();
      let list = ordersRef.current.map((o) => ({ ...o }));
      let readyAdded = false;

      // ready -> picked up (removed)
      list = list.filter(
        (o) => !(o.stage === "ready" && n - o.since > STAGE_MS.ready),
      );

      // preparing -> ready
      for (const o of list
        .filter((x) => x.stage === "preparing")
        .sort((a, b) => a.since - b.since)) {
        if (
          n - o.since > STAGE_MS.preparing &&
          list.filter((x) => x.stage === "ready").length < LIMIT.ready
        ) {
          o.stage = "ready";
          o.since = n;
          readyAdded = true;
        }
      }
      // new -> preparing
      for (const o of list
        .filter((x) => x.stage === "new")
        .sort((a, b) => a.since - b.since)) {
        if (
          n - o.since > STAGE_MS.new &&
          list.filter((x) => x.stage === "preparing").length < LIMIT.preparing
        ) {
          o.stage = "preparing";
          o.since = n;
        }
      }
      // new order arrives
      if (
        list.filter((x) => x.stage === "new").length < LIMIT.new &&
        n - lastSpawn.current > SPAWN_MS
      ) {
        list.push(makeOrder("new", n, 0));
        lastSpawn.current = n;
      }

      ordersRef.current = list;
      setOrders(list);
      setNow(n);
      if (readyAdded) setBellKey((k) => k + 1);
    };

    const iv = setInterval(tick, 500);
    return () => clearInterval(iv);
  }, [isVisible]);

  // ----- wall clock on the screen -----
  useEffect(() => {
    const upd = () =>
      setClock(
        new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      );
    upd();
    const iv = setInterval(upd, 15000);
    return () => clearInterval(iv);
  }, []);

  const by = (s: Stage) => orders.filter((o) => o.stage === s);
  const prepCount = by("preparing").length;
  const readyCount = by("ready").length;
  const newCount = by("new").length;
  const cooking = prepCount > 0;
  const flameA = prepCount >= 1;
  const flameB = prepCount >= 2;

  const titles: Record<Stage, string> = {
    new: t.kitchenColumnNew,
    preparing: t.kitchenColumnPreparing,
    ready: t.kitchenColumnReady,
  };
  const noOrders = t.kitchenNoOrders;
  const tableLabel = t.kitchenTable || "T";
  const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";
  const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";

  const pills = [
    {
      label: t.kitchenStatusNew,
      n: newCount,
      cls: "bg-blue-900/50 text-blue-200 border-blue-500/30",
      dot: "bg-blue-400",
    },
    {
      label: t.kitchenStatusPreparing,
      n: prepCount,
      cls: "bg-amber-900/50 text-amber-200 border-amber-500/30",
      dot: "bg-amber-400",
    },
    {
      label: t.kitchenStatusReady,
      n: readyCount,
      cls: "bg-green-900/50 text-green-200 border-green-500/30",
      dot: "bg-green-400",
    },
  ];

  return (
    <section
      ref={sectionRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden py-10 md:py-14"
      style={{ backgroundColor: "#1a1b1f" }}
    >
      {/* background texture */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(circle at 60% 50%, rgba(224,185,58,0.07) 0%, rgba(0,0,0,0.45) 100%)",
        }}
      />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 lg:grid-cols-[0.8fr_1.2fr] lg:gap-10">
        {/* ===== TEXT ===== */}
        <div
          className="transition-all duration-700 ease-out"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? "translateY(0)" : "translateY(24px)",
          }}
        >
          <h2 className="font-serif text-2xl leading-tight text-white drop-shadow-md sm:text-3xl">
            {t.kitchenTitle}
          </h2>
          <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-gray-300">
            {t.kitchenSubtitle}
          </p>
          <div className="mt-5 flex flex-wrap gap-3">
            {pills.map((p, i) => (
              <span
                key={i}
                className={`inline-flex items-center gap-2 rounded-full border px-3 py-1 text-sm backdrop-blur-sm ${p.cls}`}
              >
                <span className={`h-2 w-2 rounded-full ${p.dot}`} />
                {p.label}
                <span className="rounded-full bg-white/15 px-1.5 text-xs font-semibold tabular-nums">
                  {p.n}
                </span>
              </span>
            ))}
          </div>
        </div>

        {/* ===== KITCHEN WALL ===== */}
        <div
          className="mx-auto w-full max-w-[660px] transition-all duration-700 ease-out delay-150"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible
              ? "translateY(0) scale(1)"
              : "translateY(28px) scale(0.97)",
          }}
        >
          <div
            dir="ltr"
            className="relative w-full overflow-hidden rounded-2xl shadow-2xl shadow-black/60 ring-1 ring-white/10"
            style={{ containerType: "inline-size" }}
          >
            <svg
              viewBox="0 0 640 500"
              className="block h-auto w-full"
              fill="none"
              style={{ overflow: "visible" }}
            >
              <defs>
                <pattern
                  id="kd-tile"
                  width="48"
                  height="48"
                  patternUnits="userSpaceOnUse"
                >
                  <rect width="48" height="48" fill="#C9C2B1" />
                  <rect
                    x="1"
                    y="1"
                    width="46"
                    height="22"
                    rx="2"
                    fill="#EFEADF"
                  />
                  <rect
                    x="-23"
                    y="25"
                    width="46"
                    height="22"
                    rx="2"
                    fill="#ECE6D9"
                  />
                  <rect
                    x="25"
                    y="25"
                    width="46"
                    height="22"
                    rx="2"
                    fill="#F1ECE1"
                  />
                  <rect
                    x="1"
                    y="1"
                    width="46"
                    height="5"
                    rx="2"
                    fill="#fff"
                    opacity="0.5"
                  />
                  <rect
                    x="25"
                    y="25"
                    width="46"
                    height="5"
                    rx="2"
                    fill="#fff"
                    opacity="0.5"
                  />
                  <rect
                    x="-23"
                    y="25"
                    width="46"
                    height="5"
                    rx="2"
                    fill="#fff"
                    opacity="0.4"
                  />
                </pattern>
                <radialGradient id="kd-vig" cx="50%" cy="45%" r="75%">
                  <stop offset="0.55" stopColor="#000" stopOpacity="0" />
                  <stop offset="1" stopColor="#000" stopOpacity="0.38" />
                </radialGradient>
                <linearGradient id="kd-steel" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#8E94A3" />
                  <stop offset="0.25" stopColor="#E6E9F0" />
                  <stop offset="0.55" stopColor="#B3B8C5" />
                  <stop offset="0.8" stopColor="#E0E3EA" />
                  <stop offset="1" stopColor="#868C9B" />
                </linearGradient>
                <linearGradient id="kd-steelv" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#F1F3F8" />
                  <stop offset="0.5" stopColor="#B9BECB" />
                  <stop offset="1" stopColor="#7C8291" />
                </linearGradient>
                <linearGradient id="kd-hood" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#D9DCE4" />
                  <stop offset="0.6" stopColor="#A8AEBB" />
                  <stop offset="1" stopColor="#7C8291" />
                </linearGradient>
                <linearGradient id="kd-counter" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#F2F4F8" />
                  <stop offset="0.35" stopColor="#C9CDD8" />
                  <stop offset="1" stopColor="#8A909F" />
                </linearGradient>
                <linearGradient id="kd-cab" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#2E323C" />
                  <stop offset="1" stopColor="#1A1C23" />
                </linearGradient>
                <linearGradient id="kd-bezel" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#3C404C" />
                  <stop offset="0.5" stopColor="#15171D" />
                  <stop offset="1" stopColor="#0B0C10" />
                </linearGradient>
                <linearGradient id="kd-flame" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#4D8BFF" />
                  <stop offset="0.45" stopColor="#7FB2FF" />
                  <stop offset="0.75" stopColor="#FFB45A" />
                  <stop offset="1" stopColor="#FF7A1A" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="kd-brass" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0" stopColor="#FFF0B0" />
                  <stop offset="0.5" stopColor="#E0B93A" />
                  <stop offset="1" stopColor="#8A6310" />
                </linearGradient>
                <radialGradient id="kd-lamp">
                  <stop offset="0" stopColor="#FFD58A" stopOpacity="0.95" />
                  <stop offset="1" stopColor="#FFD58A" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="kd-cone" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0" stopColor="#FFD58A" stopOpacity="0.30" />
                  <stop offset="1" stopColor="#FFD58A" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="kd-steam" x1="0" y1="1" x2="0" y2="0">
                  <stop offset="0" stopColor="#fff" stopOpacity="0.85" />
                  <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="kd-pan" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0" stopColor="#6B7080" />
                  <stop offset="0.3" stopColor="#D8DBE3" />
                  <stop offset="1" stopColor="#5B6070" />
                </linearGradient>
                <filter
                  id="kd-blur"
                  x="-30%"
                  y="-30%"
                  width="160%"
                  height="160%"
                >
                  <feGaussianBlur stdDeviation="7" />
                </filter>
              </defs>

              {/* tiled wall */}
              <rect width="640" height="500" fill="url(#kd-tile)" />
              <rect width="640" height="500" fill="url(#kd-vig)" />

              {/* extractor hood */}
              <rect
                x="500"
                y="-12"
                width="62"
                height="30"
                fill="url(#kd-steel)"
              />
              <path d="M448 16H614L638 108H424Z" fill="url(#kd-hood)" />
              <path d="M448 16H614" stroke="#fff" strokeOpacity="0.6" />
              <path
                d="M440 40H622M436 62H626M432 84H630"
                stroke="#6B7080"
                strokeOpacity="0.35"
              />
              <rect
                x="422"
                y="104"
                width="218"
                height="9"
                rx="2"
                fill="url(#kd-steel)"
              />
              <ellipse
                cx="470"
                cy="116"
                rx="26"
                ry="9"
                fill="url(#kd-lamp)"
                opacity={cooking ? 1 : 0.35}
                style={{ transition: "opacity .6s" }}
              />
              <ellipse
                cx="592"
                cy="116"
                rx="26"
                ry="9"
                fill="url(#kd-lamp)"
                opacity={cooking ? 1 : 0.35}
                style={{ transition: "opacity .6s" }}
              />
              <path
                d="M440 113L400 330H660L620 113Z"
                fill="url(#kd-cone)"
                opacity={cooking ? 1 : 0}
                style={{ transition: "opacity .6s" }}
              />

              {/* utensil rail */}
              <rect
                x="440"
                y="146"
                width="182"
                height="5"
                rx="2.5"
                fill="url(#kd-steelv)"
              />
              <rect
                x="436"
                y="143"
                width="8"
                height="12"
                rx="2"
                fill="#7C8291"
              />
              <rect
                x="618"
                y="143"
                width="8"
                height="12"
                rx="2"
                fill="#7C8291"
              />

              <g className="kd-sway" style={{ transformOrigin: "462px 150px" }}>
                <path
                  d="M462 150V212"
                  stroke="#8D93A1"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <ellipse
                  cx="462"
                  cy="222"
                  rx="10"
                  ry="9"
                  fill="url(#kd-steelv)"
                  stroke="#6B7080"
                  strokeWidth="0.8"
                />
              </g>
              <g
                className="kd-sway"
                style={{
                  transformOrigin: "498px 150px",
                  animationDelay: "0.6s",
                }}
              >
                <path
                  d="M498 150V196"
                  stroke="#8D93A1"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M498 196C486 200 484 224 498 232C512 224 510 200 498 196Z"
                  stroke="#9AA0AF"
                  strokeWidth="1.4"
                  fill="none"
                />
                <path
                  d="M498 196C493 204 493 226 498 232M498 196C503 204 503 226 498 232"
                  stroke="#9AA0AF"
                  strokeWidth="1"
                  fill="none"
                />
              </g>
              <g
                className="kd-sway"
                style={{
                  transformOrigin: "536px 150px",
                  animationDelay: "1.1s",
                }}
              >
                <path
                  d="M536 150V204"
                  stroke="#8B5E3C"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M536 204H550Q552 208 550 244H522Q520 208 522 204Z"
                  fill="#D6A25E"
                  stroke="#8B5E3C"
                  strokeWidth="0.8"
                  transform="translate(-7 0)"
                />
              </g>
              <g
                className="kd-sway"
                style={{
                  transformOrigin: "574px 150px",
                  animationDelay: "0.3s",
                }}
              >
                <path
                  d="M574 150V196"
                  stroke="#8D93A1"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                />
                <path
                  d="M574 196L564 244M574 196L584 244"
                  stroke="#B3B8C6"
                  strokeWidth="2.6"
                  strokeLinecap="round"
                />
              </g>
              <g
                className="kd-sway"
                style={{
                  transformOrigin: "606px 150px",
                  animationDelay: "0.9s",
                }}
              >
                <path
                  d="M606 150V200"
                  stroke="#2B2E37"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <path
                  d="M606 200C598 204 596 232 606 238C616 232 614 204 606 200Z"
                  fill="#1E2028"
                  stroke="#3C404C"
                  strokeWidth="0.8"
                />
              </g>

              {/* TV: shadow, bezel */}
              <rect
                x="42"
                y="44"
                width="372"
                height="244"
                rx="12"
                fill="#000"
                opacity="0.4"
                filter="url(#kd-blur)"
              />
              <rect
                x="34"
                y="30"
                width="370"
                height="242"
                rx="9"
                fill="url(#kd-bezel)"
              />
              <rect
                x="34.5"
                y="30.5"
                width="369"
                height="241"
                rx="8.5"
                stroke="#fff"
                strokeOpacity="0.2"
              />
              <rect
                x="38"
                y="34"
                width="362"
                height="234"
                rx="6"
                fill="#05060A"
              />
              <circle
                cx="388"
                cy="268"
                r="1.6"
                fill="#4ADE80"
                className="kd-led"
              />

              {/* ticket rail under the TV */}
              <rect
                x="60"
                y="285"
                width="334"
                height="4"
                rx="2"
                fill="url(#kd-steelv)"
              />
              <rect
                x="56"
                y="281"
                width="8"
                height="12"
                rx="2"
                fill="#7C8291"
              />
              <rect
                x="390"
                y="281"
                width="8"
                height="12"
                rx="2"
                fill="#7C8291"
              />
              <g
                className="kd-sway"
                style={{
                  animationDelay: "0.0s",
                  transformOrigin: "112px 288px",
                }}
              >
                <rect
                  x="84"
                  y="288"
                  width="56"
                  height="27"
                  rx="1.5"
                  fill="#FBF8EE"
                  stroke="#D9D2BF"
                  strokeWidth="0.6"
                />
                <rect
                  x="84"
                  y="288"
                  width="56"
                  height="5"
                  fill="#6AA3F0"
                  opacity="0.9"
                />
                <rect
                  x="90"
                  y="295.0"
                  width="31"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="90"
                  y="300.5"
                  width="33"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="90"
                  y="306.0"
                  width="27"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="106"
                  y="284"
                  width="12"
                  height="7"
                  rx="1.5"
                  fill="#B7BCC8"
                />
              </g>
              <g
                className="kd-sway"
                style={{
                  animationDelay: "0.4s",
                  transformOrigin: "188px 288px",
                }}
              >
                <rect
                  x="160"
                  y="288"
                  width="56"
                  height="27"
                  rx="1.5"
                  fill="#FBF8EE"
                  stroke="#D9D2BF"
                  strokeWidth="0.6"
                />
                <rect
                  x="160"
                  y="288"
                  width="56"
                  height="5"
                  fill="#F2B94B"
                  opacity="0.9"
                />
                <rect
                  x="166"
                  y="295.0"
                  width="36"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="166"
                  y="300.5"
                  width="39"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="166"
                  y="306.0"
                  width="28"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="182"
                  y="284"
                  width="12"
                  height="7"
                  rx="1.5"
                  fill="#B7BCC8"
                />
              </g>
              <g
                className="kd-sway"
                style={{
                  animationDelay: "0.8s",
                  transformOrigin: "264px 288px",
                }}
              >
                <rect
                  x="236"
                  y="288"
                  width="56"
                  height="27"
                  rx="1.5"
                  fill="#FBF8EE"
                  stroke="#D9D2BF"
                  strokeWidth="0.6"
                />
                <rect
                  x="236"
                  y="288"
                  width="56"
                  height="5"
                  fill="#6AA3F0"
                  opacity="0.9"
                />
                <rect
                  x="242"
                  y="295.0"
                  width="26"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="242"
                  y="300.5"
                  width="26"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="242"
                  y="306.0"
                  width="24"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="258"
                  y="284"
                  width="12"
                  height="7"
                  rx="1.5"
                  fill="#B7BCC8"
                />
              </g>
              <g
                className="kd-sway"
                style={{
                  animationDelay: "1.2000000000000002s",
                  transformOrigin: "340px 288px",
                }}
              >
                <rect
                  x="312"
                  y="288"
                  width="56"
                  height="27"
                  rx="1.5"
                  fill="#FBF8EE"
                  stroke="#D9D2BF"
                  strokeWidth="0.6"
                />
                <rect
                  x="312"
                  y="288"
                  width="56"
                  height="5"
                  fill="#58C27D"
                  opacity="0.9"
                />
                <rect
                  x="318"
                  y="295.0"
                  width="36"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="318"
                  y="300.5"
                  width="41"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="318"
                  y="306.0"
                  width="33"
                  height="2.2"
                  rx="1"
                  fill="#8A8372"
                  opacity="0.7"
                />
                <rect
                  x="334"
                  y="284"
                  width="12"
                  height="7"
                  rx="1.5"
                  fill="#B7BCC8"
                />
              </g>

              {/* counter + cabinets */}
              <rect
                x="-10"
                y="352"
                width="450"
                height="152"
                fill="url(#kd-cab)"
              />
              {[0, 1, 2].map((i) => (
                <g key={i}>
                  <rect
                    x={14 + i * 142}
                    y="366"
                    width="130"
                    height="118"
                    rx="4"
                    fill="#272A33"
                    stroke="#3A3E4A"
                  />
                  <rect
                    x={14 + i * 142 + 50}
                    y="372"
                    width="30"
                    height="4"
                    rx="2"
                    fill="#9AA0AF"
                  />
                </g>
              ))}
              <rect x="-10" y="486" width="450" height="16" fill="#0E0F13" />
              <rect
                x="-10"
                y="338"
                width="450"
                height="15"
                rx="2"
                fill="url(#kd-counter)"
              />
              <rect
                x="-10"
                y="338"
                width="450"
                height="2"
                fill="#fff"
                opacity="0.85"
              />

              {/* cooker (range) */}
              <rect
                x="428"
                y="352"
                width="194"
                height="150"
                fill="url(#kd-steel)"
              />
              <rect x="428" y="352" width="194" height="30" fill="#2A2D36" />
              {[0, 1, 2, 3].map((i) => {
                const lit = (i === 0 && flameA) || (i === 1 && flameB);
                return (
                  <g key={i}>
                    <circle
                      cx={458 + i * 46}
                      cy="367"
                      r="8.5"
                      fill="#12141A"
                      stroke={lit ? "#FF9F3A" : "#4A4F5E"}
                      strokeWidth={lit ? 2 : 1.2}
                      style={{ transition: "stroke .4s" }}
                    />
                    <rect
                      x={457 + i * 46}
                      y="359"
                      width="2.2"
                      height="6"
                      rx="1"
                      fill="#E9ECF3"
                      transform={`rotate(${lit ? 55 : 0} ${458 + i * 46} 367)`}
                      style={{ transition: "transform .5s" }}
                    />
                  </g>
                );
              })}
              <rect
                x="440"
                y="392"
                width="170"
                height="98"
                rx="5"
                fill="url(#kd-steelv)"
                stroke="#6B7080"
                strokeWidth="0.8"
              />
              <rect
                x="448"
                y="388"
                width="154"
                height="7"
                rx="3.5"
                fill="url(#kd-steel)"
                stroke="#6B7080"
                strokeWidth="0.6"
              />
              <rect
                x="456"
                y="404"
                width="138"
                height="66"
                rx="4"
                fill="#07080C"
              />
              <rect
                x="456"
                y="404"
                width="138"
                height="66"
                rx="4"
                fill="#FF9F3A"
                opacity={cooking ? 0.22 : 0.04}
                style={{ transition: "opacity .8s" }}
              />
              <path d="M462 408H500L486 468H462Z" fill="#fff" opacity="0.07" />

              {/* cooktop + grates */}
              <rect
                x="428"
                y="333"
                width="194"
                height="9"
                rx="2"
                fill="url(#kd-steel)"
              />
              <rect
                x="428"
                y="333"
                width="194"
                height="1.6"
                fill="#fff"
                opacity="0.85"
              />
              {[480, 566].map((cx) => (
                <g key={cx} fill="#17181D">
                  <rect x={cx - 30} y="327" width="5" height="7" rx="1" />
                  <rect x={cx - 2} y="327" width="5" height="7" rx="1" />
                  <rect x={cx + 25} y="327" width="5" height="7" rx="1" />
                </g>
              ))}

              {/* flames */}
              {[
                [480, flameA],
                [566, flameB],
              ].map(([cx, on]) => (
                <g
                  key={cx as number}
                  style={{ opacity: on ? 1 : 0, transition: "opacity .45s" }}
                >
                  {[-24, -14, -4, 6, 16, 26].map((dx, i) => (
                    <path
                      key={i}
                      className="kd-flame"
                      style={{
                        animationDelay: `${i * 0.11}s`,
                        transformOrigin: `${(cx as number) + dx}px 334px`,
                      }}
                      d={`M${(cx as number) + dx - 2.4} 334Q${(cx as number) + dx} 321 ${(cx as number) + dx + 2.4} 334Z`}
                      fill="url(#kd-flame)"
                    />
                  ))}
                </g>
              ))}

              {/* saucepan with lid (left burner) */}
              <g>
                <rect
                  x="452"
                  y="298"
                  width="56"
                  height="30"
                  rx="4"
                  fill="url(#kd-pan)"
                />
                <rect
                  x="452"
                  y="322"
                  width="56"
                  height="6"
                  rx="3"
                  fill="#2A2D36"
                  opacity="0.55"
                />
                <rect
                  x="448"
                  y="291"
                  width="64"
                  height="9"
                  rx="4.5"
                  fill="url(#kd-steelv)"
                />
                <circle cx="480" cy="287" r="4" fill="#1B1D24" />
                <rect
                  x="408"
                  y="306"
                  width="44"
                  height="7"
                  rx="3.5"
                  fill="#1B1D24"
                />
                <circle cx="414" cy="309.5" r="1.4" fill="#8A90A0" />
              </g>
              {/* frying pan (right burner) */}
              <g>
                <path
                  d="M534 308H598L592 328Q566 332 540 328Z"
                  fill="url(#kd-pan)"
                />
                <path
                  d="M536 310Q566 300 596 310"
                  stroke="#F0C060"
                  strokeWidth="7"
                  strokeLinecap="round"
                  fill="none"
                  opacity={flameB ? 1 : 0.0}
                  style={{ transition: "opacity .5s" }}
                />
                <path
                  d="M598 313H632"
                  stroke="#1B1D24"
                  strokeWidth="7"
                  strokeLinecap="round"
                />
                <ellipse cx="566" cy="308" rx="32" ry="2.6" fill="#0C0D11" />
                {[0, 1, 2, 3].map((i) => (
                  <circle
                    key={i}
                    className="kd-bubble"
                    cx={552 + i * 9}
                    cy="306"
                    r="1.8"
                    fill="#FFE2A8"
                    style={{
                      opacity: flameB ? undefined : 0,
                      animationDelay: `${i * 0.25}s`,
                    }}
                  />
                ))}
              </g>

              {/* steam (only while cooking) */}
              <g
                stroke="url(#kd-steam)"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ opacity: flameA ? 1 : 0, transition: "opacity .6s" }}
              >
                <path
                  className="kd-steam"
                  d="M470 284Q462 266 470 250Q478 234 470 216"
                />
                <path
                  className="kd-steam"
                  style={{ animationDelay: "0.9s" }}
                  d="M486 284Q494 266 486 250Q478 234 486 216"
                />
              </g>
              <g
                stroke="url(#kd-steam)"
                strokeWidth="3"
                strokeLinecap="round"
                style={{ opacity: flameB ? 1 : 0, transition: "opacity .6s" }}
              >
                <path
                  className="kd-steam"
                  style={{ animationDelay: "0.4s" }}
                  d="M556 296Q548 278 556 262Q564 246 556 228"
                />
                <path
                  className="kd-steam"
                  style={{ animationDelay: "1.3s" }}
                  d="M574 296Q582 278 574 262Q566 246 574 228"
                />
              </g>

              {/* service bell on the pass */}
              <ellipse
                cx="318"
                cy="340"
                rx="30"
                ry="5"
                fill="#000"
                opacity="0.3"
                filter="url(#kd-blur)"
              />
              <g
                key={bellKey}
                className={bellKey > 0 ? "kd-ding" : undefined}
                style={{ transformOrigin: "318px 338px" }}
              >
                <ellipse
                  cx="318"
                  cy="337"
                  rx="23"
                  ry="4.5"
                  fill="url(#kd-brass)"
                  stroke="#6B4E0C"
                  strokeWidth="0.8"
                />
                <path
                  d="M297 335Q297 311 318 311Q339 311 339 335Z"
                  fill="url(#kd-brass)"
                  stroke="#6B4E0C"
                  strokeWidth="0.8"
                />
                <path
                  d="M303 331Q304 318 313 315"
                  stroke="#fff"
                  strokeWidth="2.4"
                  strokeLinecap="round"
                  opacity="0.55"
                />
                <circle
                  cx="318"
                  cy="308"
                  r="4"
                  fill="url(#kd-brass)"
                  stroke="#6B4E0C"
                  strokeWidth="0.8"
                />
              </g>
              {bellKey > 0 && (
                <g
                  key={`r${bellKey}`}
                  stroke="#E0B93A"
                  strokeWidth="1.6"
                  strokeLinecap="round"
                  className="kd-rings"
                >
                  <path d="M286 300Q280 312 286 324" />
                  <path d="M278 296Q268 312 278 328" />
                  <path d="M350 300Q356 312 350 324" />
                  <path d="M358 296Q368 312 358 328" />
                </g>
              )}

              {/* plated dishes appear when orders are ready */}
              {[0, 1].map(
                (i) =>
                  i < readyCount && (
                    <g
                      key={i}
                      className="kd-plate"
                      style={{ transformOrigin: `${110 + i * 84}px 338px` }}
                    >
                      <ellipse
                        cx={110 + i * 84}
                        cy="340"
                        rx="38"
                        ry="5"
                        fill="#000"
                        opacity="0.28"
                        filter="url(#kd-blur)"
                      />
                      <ellipse
                        cx={110 + i * 84}
                        cy="337"
                        rx="34"
                        ry="5"
                        fill="#FDFCF8"
                        stroke="#D5CFBF"
                        strokeWidth="0.8"
                      />
                      <path
                        d={`M${84 + i * 84} 335Q${88 + i * 84} 316 ${110 + i * 84} 314Q${132 + i * 84} 316 ${136 + i * 84} 335Z`}
                        fill="#E5B955"
                      />
                      <circle cx={104 + i * 84} cy="322" r="5" fill="#8F4A24" />
                      <circle cx={118 + i * 84} cy="326" r="4" fill="#B66A3A" />
                      <circle
                        cx={110 + i * 84}
                        cy="330"
                        r="1.6"
                        fill="#F08A24"
                      />
                      <g
                        stroke="url(#kd-steam)"
                        strokeWidth="2.6"
                        strokeLinecap="round"
                      >
                        <path
                          className="kd-steam"
                          d={`M${102 + i * 84} 310Q${96 + i * 84} 302 ${102 + i * 84} 294`}
                        />
                        <path
                          className="kd-steam"
                          style={{ animationDelay: "0.8s" }}
                          d={`M${118 + i * 84} 310Q${124 + i * 84} 302 ${118 + i * 84} 294`}
                        />
                      </g>
                    </g>
                  ),
              )}
            </svg>

            {/* ---------- wall-mounted order screen (HTML) ---------- */}
            <div
              className="absolute flex flex-col overflow-hidden"
              style={{
                left: q(42),
                top: q(38),
                width: q(354),
                height: q(226),
                borderRadius: q(3),
                background: "linear-gradient(135deg, #0a0d1a, #14182b)",
                fontFamily: sans,
                color: "#fff",
              }}
            >
              {/* header */}
              <div
                className="flex items-center justify-between"
                style={{
                  height: q(22),
                  padding: `0 ${q(8)}`,
                  borderBottom: "1px solid rgba(255,255,255,0.09)",
                  background: "rgba(255,255,255,0.03)",
                }}
              >
                <span className="flex items-center" style={{ gap: q(6) }}>
                  <span
                    className="kd-live"
                    style={{
                      width: q(5),
                      height: q(5),
                      borderRadius: "9999px",
                      background: "#EF4444",
                    }}
                  />
                  <span
                    style={{
                      fontSize: q(7),
                      fontFamily: mono,
                      color: "rgba(255,255,255,0.5)",
                      letterSpacing: "0.08em",
                    }}
                  >
                    LIVE
                  </span>
                  <span
                    style={{
                      fontSize: q(8.5),
                      fontWeight: 600,
                      color: "rgba(255,255,255,0.85)",
                    }}
                  >
                    {t.kitchenTvLabel}
                  </span>
                </span>
                <span
                  style={{
                    fontSize: q(9),
                    fontFamily: mono,
                    color: "rgba(255,255,255,0.7)",
                  }}
                >
                  {clock}
                </span>
              </div>

              {/* three columns */}
              <div
                className="grid min-h-0 flex-1 grid-cols-3"
                style={{ gap: q(5), padding: q(6) }}
              >
                {COLS.map(({ stage, Icon, color, soft }) => {
                  const list = by(stage);
                  return (
                    <div
                      key={stage}
                      className="flex min-h-0 flex-col"
                      style={{
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        borderRadius: q(5),
                        padding: q(4),
                      }}
                    >
                      <div
                        className="flex items-center"
                        style={{ gap: q(4), marginBottom: q(4) }}
                      >
                        <span
                          className="flex items-center justify-center"
                          style={{
                            width: q(13),
                            height: q(13),
                            borderRadius: q(4),
                            background: soft,
                            color,
                          }}
                        >
                          <Icon style={{ width: q(8), height: q(8) }} />
                        </span>
                        <span
                          className="truncate"
                          style={{ fontSize: q(8), fontWeight: 700 }}
                        >
                          {titles[stage]}
                        </span>
                        <span
                          className="ms-auto"
                          style={{
                            fontSize: q(7),
                            padding: `${q(0.8)} ${q(4)}`,
                            borderRadius: "9999px",
                            background: "rgba(255,255,255,0.14)",
                            color: "rgba(255,255,255,0.85)",
                            fontFamily: mono,
                          }}
                        >
                          {list.length}
                        </span>
                      </div>

                      <div
                        className="flex min-h-0 flex-1 flex-col"
                        style={{ gap: q(3.5) }}
                      >
                        {list.map((o) => {
                          const age = now - o.created;
                          const late = stage !== "ready" && age > 14000;
                          return (
                            <div
                              key={o.id}
                              className={`kd-ticket ${stage === "ready" ? "kd-ready" : ""}`}
                              style={{
                                borderRadius: q(3.5),
                                overflow: "hidden",
                                background: "rgba(255,255,255,0.1)",
                                border: `1px solid ${late ? "rgba(248,113,113,0.6)" : "rgba(255,255,255,0.1)"}`,
                                boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                              }}
                            >
                              <div
                                className="flex items-center justify-between"
                                style={{
                                  background: color,
                                  color: "#0b0d14",
                                  padding: `${q(1.6)} ${q(4)}`,
                                  fontSize: q(6.6),
                                  fontWeight: 800,
                                  fontFamily: mono,
                                }}
                              >
                                <span>#{o.id}</span>
                                <span>
                                  {tableLabel}
                                  {o.table}
                                </span>
                                <span
                                  style={{
                                    color: late ? "#7F1D1D" : undefined,
                                  }}
                                >
                                  {mmss(
                                    stage === "ready" ? now - o.since : age,
                                  )}
                                </span>
                              </div>
                              <div style={{ padding: `${q(3)} ${q(4)}` }}>
                                <div
                                  dir="auto"
                                  className="truncate"
                                  style={{
                                    fontSize: q(8),
                                    fontWeight: 600,
                                    lineHeight: 1.25,
                                  }}
                                >
                                  {o.name}
                                </div>
                                <div
                                  style={{
                                    fontSize: q(6.6),
                                    color: "rgba(255,255,255,0.55)",
                                    marginTop: q(1),
                                  }}
                                >
                                  {o.price} Af
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        {list.length === 0 && (
                          <div
                            className="text-center"
                            style={{
                              fontSize: q(6.6),
                              color: "rgba(255,255,255,0.28)",
                              paddingTop: q(10),
                            }}
                          >
                            {noOrders}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                className="text-center"
                style={{
                  fontSize: q(5.6),
                  color: "rgba(255,255,255,0.25)",
                  paddingBottom: q(3),
                }}
              >
                {t.kitchenAutoLabel}
              </div>

              {/* screen glare */}
              <div
                className="pointer-events-none absolute inset-0"
                style={{
                  background:
                    "linear-gradient(118deg, rgba(255,255,255,0.09), rgba(255,255,255,0) 36%)",
                }}
              />
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes kd-in {
          0% {
            opacity: 0;
            transform: translateX(-14px) scale(0.96);
          }
          100% {
            opacity: 1;
            transform: translateX(0) scale(1);
          }
        }
        @keyframes kd-readyflash {
          0%,
          100% {
            box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);
          }
          50% {
            box-shadow:
              0 0 0 2px rgba(74, 222, 128, 0.55),
              0 0 14px rgba(74, 222, 128, 0.35);
          }
        }
        @keyframes kd-flame {
          0%,
          100% {
            transform: scaleY(1) scaleX(1);
            opacity: 0.95;
          }
          30% {
            transform: scaleY(1.35) scaleX(0.85);
            opacity: 1;
          }
          60% {
            transform: scaleY(0.8) scaleX(1.1);
            opacity: 0.85;
          }
        }
        @keyframes kd-steam {
          0% {
            opacity: 0;
            transform: translateY(10px);
          }
          30% {
            opacity: 0.9;
          }
          100% {
            opacity: 0;
            transform: translateY(-34px);
          }
        }
        @keyframes kd-bubble {
          0% {
            opacity: 0;
            transform: translateY(2px) scale(0.6);
          }
          40% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-9px) scale(1.2);
          }
        }
        @keyframes kd-ding {
          0% {
            transform: scale(1) rotate(0deg);
          }
          12% {
            transform: scale(0.9, 1.06) rotate(-6deg);
          }
          28% {
            transform: scale(1.04) rotate(5deg);
          }
          46% {
            transform: scale(0.98) rotate(-3deg);
          }
          64% {
            transform: scale(1) rotate(2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
        @keyframes kd-rings {
          0% {
            opacity: 0;
            transform: scale(0.85);
          }
          15% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: scale(1.25);
          }
        }
        @keyframes kd-plate {
          0% {
            opacity: 0;
            transform: translateY(-14px) scale(0.85);
          }
          70% {
            opacity: 1;
            transform: translateY(2px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        @keyframes kd-sway {
          0%,
          100% {
            transform: rotate(-1.4deg);
          }
          50% {
            transform: rotate(1.4deg);
          }
        }
        @keyframes kd-blink {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.25;
          }
        }
        .kd-ticket {
          animation: kd-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .kd-ready {
          animation:
            kd-in 0.45s cubic-bezier(0.22, 1, 0.36, 1) both,
            kd-readyflash 1.4s ease-in-out 0.45s 3;
        }
        .kd-flame {
          transform-box: view-box;
          animation: kd-flame 0.5s ease-in-out infinite;
        }
        .kd-steam {
          animation: kd-steam 2.8s ease-out infinite;
        }
        .kd-bubble {
          animation: kd-bubble 1s ease-out infinite;
        }
        .kd-ding {
          animation: kd-ding 0.9s ease-out both;
        }
        .kd-rings {
          transform-box: view-box;
          transform-origin: 318px 318px;
          animation: kd-rings 1s ease-out both;
        }
        .kd-plate {
          animation: kd-plate 0.55s cubic-bezier(0.22, 1, 0.36, 1) both;
        }
        .kd-sway {
          animation: kd-sway 4.5s ease-in-out infinite;
        }
        .kd-live,
        .kd-led {
          animation: kd-blink 1.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .kd-ticket,
          .kd-ready,
          .kd-flame,
          .kd-steam,
          .kd-bubble,
          .kd-ding,
          .kd-rings,
          .kd-plate,
          .kd-sway,
          .kd-live,
          .kd-led {
            animation: none !important;
          }
          .kd-steam {
            opacity: 0.5;
          }
        }
      `}</style>
    </section>
  );
}
