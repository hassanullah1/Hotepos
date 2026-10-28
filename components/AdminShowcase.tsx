"use client";

import { useEffect, useRef, useState } from "react";
import type { CSSProperties } from "react";
import {
  Utensils,
  Users,
  Hotel,
  LayoutDashboard,
  ShoppingBag,
  Wallet,
  TrendingUp,
  PieChart,
  Clock,
  ChefHat,
  CheckCircle,
  Bell,
  Search,
  BarChart3,
} from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import FloatingBubbles from "./FloatingBubbles";

// scene units (viewBox is 640 wide) -> container-query width units
const q = (v: number) => `${(v / 6.4).toFixed(3)}cqw`;
const sans = "system-ui, -apple-system, 'Segoe UI', sans-serif";
const mono = "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace";

const GOLD = "#E0B93A";
const GREEN = "#4ADE80";
const BLUE = "#60A5FA";
const AMBER = "#FBBF24";
const RED = "#F87171";

const cardBase: CSSProperties = {
  background: "rgba(255,255,255,0.045)",
  border: "1px solid rgba(255,255,255,0.08)",
  borderRadius: q(6),
  padding: q(8),
  minHeight: 0,
};

// ---------- small helpers ----------
function Count({
  to,
  decimals = 0,
  prefix = "",
  suffix = "",
  dur = 1100,
  delay = 0,
}: {
  to: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  dur?: number;
  delay?: number;
}) {
  const [v, setV] = useState(0);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now() + delay;
    const step = (now: number) => {
      const p = Math.min(Math.max((now - t0) / dur, 0), 1);
      setV(to * (1 - Math.pow(1 - p, 3)));
      if (p < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [to, dur, delay]);
  return (
    <>
      {prefix}
      {v.toLocaleString("en-US", { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
      {suffix}
    </>
  );
}

const smooth = (pts: [number, number][]) => {
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const cx = (x0 + x1) / 2;
    d += `C${cx} ${y0} ${cx} ${y1} ${x1} ${y1}`;
  }
  return d;
};

function Delta({ v, down }: { v: string; down?: boolean }) {
  return (
    <span
      style={{
        fontSize: q(5.8),
        fontWeight: 700,
        color: down ? RED : GREEN,
        background: down ? "rgba(248,113,113,0.12)" : "rgba(74,222,128,0.12)",
        padding: `${q(0.9)} ${q(3.2)}`,
        borderRadius: "9999px",
      }}
    >
      {v}
    </span>
  );
}

function Kpi({
  Icon,
  label,
  children,
  delta,
  down,
  gold,
  delay,
}: {
  Icon: any;
  label: string;
  children: React.ReactNode;
  delta?: string;
  down?: boolean;
  gold?: boolean;
  delay: number;
}) {
  return (
    <div
      className="ab-card flex min-w-0 flex-1 items-center"
      style={{
        ...cardBase,
        padding: q(7),
        gap: q(6),
        animationDelay: `${delay}s`,
        background: gold ? "linear-gradient(135deg, rgba(224,185,58,0.22), rgba(224,185,58,0.06))" : cardBase.background,
        border: gold ? "1px solid rgba(224,185,58,0.45)" : cardBase.border,
      }}
    >
      <span
        className="flex shrink-0 items-center justify-center"
        style={{ width: q(19), height: q(19), borderRadius: q(5.5), background: "rgba(224,185,58,0.16)", color: GOLD }}
      >
        <Icon style={{ width: q(10.5), height: q(10.5) }} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate" style={{ fontSize: q(6), color: "rgba(255,255,255,0.55)" }}>{label}</span>
        <span className="flex items-center" style={{ gap: q(4) }}>
          <span style={{ fontSize: q(12.5), fontWeight: 700, lineHeight: 1.15, fontFamily: sans }}>{children}</span>
          {delta && <Delta v={delta} down={down} />}
        </span>
      </span>
    </div>
  );
}

function CardTitle({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between" style={{ marginBottom: q(5) }}>
      <span style={{ fontSize: q(7.4), fontWeight: 700, color: "rgba(255,255,255,0.85)" }}>{children}</span>
      {right}
    </div>
  );
}

// ---------- the three dashboard views ----------
function Overview({ t }: { t: any }) {
  const days = ["M", "T", "W", "T", "F", "S", "S"];
  const rev = [34, 46, 40, 60, 52, 74, 84];
  const pro = [10, 14, 11, 19, 16, 24, 29];
  const W = 260, H = 84;
  const pt = (arr: number[]): [number, number][] => arr.map((v, i) => [(i * W) / 6, H - 4 - v * 0.86]);
  const revPts = pt(rev);
  const proPts = pt(pro);
  const revPath = smooth(revPts);
  const proPath = smooth(proPts);
  const last = revPts[revPts.length - 1];

  const cats = [
    { n: "Kebab", p: 34, c: GOLD },
    { n: "Rice", p: 26, c: GREEN },
    { n: "Burgers", p: 18, c: BLUE },
    { n: "Drinks", p: 12, c: "#F472B6" },
    { n: "Dessert", p: 10, c: "#A78BFA" },
  ];
  let acc = 0;

  const dishes = [
    { n: "Kabuli Pulao", s: 342, w: 100 },
    { n: "Mantu", s: 281, w: 82 },
    { n: "Chicken Tikka", s: 226, w: 66 },
  ];
  const live = [
    { id: 1043, n: "Kabuli Pulao", a: 350, c: BLUE },
    { id: 1042, n: "Chicken Tikka", a: 420, c: AMBER },
    { id: 1041, n: "Green Tea", a: 50, c: GREEN },
  ];

  return (
    <div className="flex h-full min-h-0 flex-col" style={{ gap: q(7) }}>
      <div className="flex" style={{ gap: q(7), height: q(46) }}>
        <Kpi Icon={Wallet} label={t.adminKpiRevenue || "Revenue"} delta="+12.4%" delay={0.05}>
          <Count to={184.5} decimals={1} prefix="Af " suffix="k" />
        </Kpi>
        <Kpi Icon={ShoppingBag} label={t.adminKpiOrders || "Orders"} delta="+8.1%" delay={0.15}>
          <Count to={1248} />
        </Kpi>
        <Kpi Icon={TrendingUp} label={t.adminKpiProfit || "Profit"} delta="+15.2%" gold delay={0.25}>
          <Count to={52.3} decimals={1} prefix="Af " suffix="k" />
        </Kpi>
        <Kpi Icon={PieChart} label={t.adminKpiMargin || "Margin"} delta="+2.1%" delay={0.35}>
          <Count to={28.4} decimals={1} suffix="%" />
        </Kpi>
      </div>

      <div className="flex min-h-0" style={{ gap: q(7), flex: "1.5 1 0" }}>
        <div className="ab-card flex min-w-0 flex-[1.7] flex-col" style={{ ...cardBase, animationDelay: "0.4s" }}>
          <CardTitle
            right={
              <span className="flex items-center" style={{ gap: q(6), fontSize: q(5.8), color: "rgba(255,255,255,0.6)" }}>
                <span className="flex items-center" style={{ gap: q(2.5) }}><i style={{ width: q(5), height: q(5), borderRadius: 9999, background: GOLD }} />{t.adminKpiRevenue || "Revenue"}</span>
                <span className="flex items-center" style={{ gap: q(2.5) }}><i style={{ width: q(5), height: q(5), borderRadius: 9999, background: GREEN }} />{t.adminKpiProfit || "Profit"}</span>
              </span>
            }
          >
            {t.adminChartTitle || "Revenue vs profit · 7 days"}
          </CardTitle>
          <div className="relative min-h-0 flex-1">
            <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none" fill="none">
              <defs>
                <linearGradient id="ab-ar" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GOLD} stopOpacity="0.38" /><stop offset="1" stopColor={GOLD} stopOpacity="0" /></linearGradient>
                <linearGradient id="ab-ap" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={GREEN} stopOpacity="0.3" /><stop offset="1" stopColor={GREEN} stopOpacity="0" /></linearGradient>
              </defs>
              {[21, 42, 63].map((y) => (
                <path key={y} d={`M0 ${y}H${W}`} stroke="rgba(255,255,255,0.08)" strokeDasharray="3 4" vectorEffect="non-scaling-stroke" />
              ))}
              <path className="ab-fade" style={{ animationDelay: "1.2s" }} d={`${revPath}L${W} ${H}L0 ${H}Z`} fill="url(#ab-ar)" />
              <path className="ab-fade" style={{ animationDelay: "1.4s" }} d={`${proPath}L${W} ${H}L0 ${H}Z`} fill="url(#ab-ap)" />
              <path className="ab-draw" pathLength={1} d={revPath} stroke={GOLD} strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
              <path className="ab-draw" style={{ animationDelay: "0.25s" }} pathLength={1} d={proPath} stroke={GREEN} strokeWidth="2.2" strokeLinecap="round" vectorEffect="non-scaling-stroke" />
            </svg>
            {/* last point marker + tooltip (HTML so it never stretches) */}
            <span
              className="ab-fade absolute"
              style={{ left: `${(last[0] / W) * 100}%`, top: `${(last[1] / H) * 100}%`, animationDelay: "1.5s" }}
            >
              <span className="ab-ping absolute rounded-full" style={{ width: q(8), height: q(8), left: q(-4), top: q(-4), background: "rgba(224,185,58,0.5)" }} />
              <span className="absolute rounded-full" style={{ width: q(5), height: q(5), left: q(-2.5), top: q(-2.5), background: GOLD, border: "1.5px solid #0F1320" }} />
              <span
                className="absolute whitespace-nowrap"
                style={{ right: q(6), top: q(-17), fontSize: q(5.8), fontWeight: 700, background: "#0B0E19", border: "1px solid rgba(224,185,58,0.5)", borderRadius: q(3), padding: `${q(1.5)} ${q(4)}` }}
              >
                Sun · Af 42k
              </span>
            </span>
          </div>
          <div className="flex justify-between" style={{ marginTop: q(2), fontSize: q(5.6), color: "rgba(255,255,255,0.4)" }}>
            {days.map((d, i) => <span key={i}>{d}</span>)}
          </div>
        </div>

        <div className="ab-card flex min-w-0 flex-1 flex-col" style={{ ...cardBase, animationDelay: "0.5s" }}>
          <CardTitle>{t.adminDonutTitle || "Sales by category"}</CardTitle>
          <div className="flex min-h-0 flex-1 items-center" style={{ gap: q(7) }}>
            <div className="relative shrink-0" style={{ width: q(60), height: q(60) }}>
              <svg viewBox="0 0 42 42" className="h-full w-full">
                <circle cx="21" cy="21" r="15.9155" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5.5" />
                {cats.map((c) => {
                  const off = acc;
                  acc += c.p;
                  return (
                    <circle
                      key={c.n}
                      className="ab-seg"
                      cx="21"
                      cy="21"
                      r="15.9155"
                      fill="none"
                      stroke={c.c}
                      strokeWidth="5.5"
                      transform="rotate(-90 21 21)"
                      style={{ ["--len" as any]: c.p - 1.2, ["--gap" as any]: 101.2 - c.p, strokeDashoffset: -off, animationDelay: `${0.6 + off / 100}s` }}
                    />
                  );
                })}
              </svg>
              <span className="absolute inset-0 flex flex-col items-center justify-center text-center">
                <span style={{ fontSize: q(10), fontWeight: 700, lineHeight: 1 }}><Count to={1248} delay={400} /></span>
                <span style={{ fontSize: q(4.8), color: "rgba(255,255,255,0.5)" }}>{t.adminKpiOrders || "Orders"}</span>
              </span>
            </div>
            <div className="min-w-0 flex-1" style={{ fontSize: q(6) }}>
              {cats.map((c) => (
                <div key={c.n} className="flex items-center justify-between" style={{ padding: `${q(1.8)} 0` }}>
                  <span className="flex items-center" style={{ gap: q(3.5), color: "rgba(255,255,255,0.8)" }}>
                    <i style={{ width: q(4.5), height: q(4.5), borderRadius: 2, background: c.c }} />
                    {c.n}
                  </span>
                  <span style={{ fontFamily: mono, color: "rgba(255,255,255,0.55)" }}>{c.p}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="flex min-h-0" style={{ gap: q(7), flex: "1 1 0" }}>
        <div className="ab-card min-w-0 flex-1" style={{ ...cardBase, animationDelay: "0.6s" }}>
          <CardTitle>{t.adminTopDishes || "Top dishes"}</CardTitle>
          {dishes.map((d, i) => (
            <div key={d.n} style={{ marginBottom: q(3.5) }}>
              <div className="flex justify-between" style={{ fontSize: q(6) }}>
                <span>{d.n}</span>
                <span style={{ fontFamily: mono, color: "rgba(255,255,255,0.55)" }}>{d.s}</span>
              </div>
              <div style={{ height: q(3.4), borderRadius: 9999, background: "rgba(255,255,255,0.07)", marginTop: q(1.5), overflow: "hidden" }}>
                <div className="ab-w" style={{ width: `${d.w}%`, height: "100%", borderRadius: 9999, background: `linear-gradient(90deg, ${GOLD}, #B8891A)`, animationDelay: `${0.9 + i * 0.12}s` }} />
              </div>
            </div>
          ))}
        </div>
        <div className="ab-card min-w-0 flex-1" style={{ ...cardBase, animationDelay: "0.7s" }}>
          <CardTitle right={<span className="flex items-center" style={{ gap: q(3), fontSize: q(5.4), color: RED, fontWeight: 700 }}><i className="ab-blink" style={{ width: q(4), height: q(4), borderRadius: 9999, background: RED }} />LIVE</span>}>
            {t.adminLiveOrders || "Live orders"}
          </CardTitle>
          {live.map((o, i) => (
            <div key={o.id} className="ab-row flex items-center" style={{ gap: q(5), padding: `${q(2.2)} 0`, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: q(6), animationDelay: `${1 + i * 0.18}s` }}>
              <i style={{ width: q(4.5), height: q(4.5), borderRadius: 9999, background: o.c }} />
              <span style={{ fontFamily: mono, color: "rgba(255,255,255,0.5)" }}>#{o.id}</span>
              <span className="min-w-0 flex-1 truncate">{o.n}</span>
              <span style={{ fontFamily: mono }}>Af {o.a}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function OrdersView({ t }: { t: any }) {
  const hours = [20, 34, 62, 88, 70, 45, 38, 50, 76, 95, 80, 52];
  const labels = ["10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21"];
  const peak = hours.indexOf(Math.max(...hours));
  const rows = [
    { id: 1046, n: "Kabuli Pulao", w: "T4", a: 350, s: "New", c: BLUE },
    { id: 1045, n: "Chicken Tikka", w: "T9", a: 420, s: "Cooking", c: AMBER },
    { id: 1044, n: "Mantu", w: "T2", a: 300, s: "Ready", c: GREEN },
    { id: 1043, n: "Green Tea", w: "T7", a: 50, s: "Paid", c: "#A78BFA" },
  ];
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ gap: q(7) }}>
      <div className="flex" style={{ gap: q(7), height: q(46) }}>
        <Kpi Icon={Clock} label={t.kitchenStatusNew || "New"} delay={0.05}><span style={{ color: BLUE }}><Count to={12} /></span></Kpi>
        <Kpi Icon={ChefHat} label={t.kitchenStatusPreparing || "Preparing"} delay={0.15}><span style={{ color: AMBER }}><Count to={8} /></span></Kpi>
        <Kpi Icon={CheckCircle} label={t.kitchenStatusReady || "Ready"} delay={0.25}><span style={{ color: GREEN }}><Count to={5} /></span></Kpi>
        <Kpi Icon={ShoppingBag} label={t.adminCompleted || "Completed"} gold delta="+8.1%" delay={0.35}><Count to={1223} /></Kpi>
      </div>

      <div className="flex min-h-0" style={{ gap: q(7), flex: "1.2 1 0" }}>
        <div className="ab-card flex min-w-0 flex-[1.8] flex-col" style={{ ...cardBase, animationDelay: "0.4s" }}>
          <CardTitle right={<span style={{ fontSize: q(5.6), color: GOLD }}>{t.adminPeak || "Peak"} 19:00</span>}>{t.adminOrdersHour || "Orders per hour"}</CardTitle>
          <div className="flex min-h-0 flex-1 items-end" style={{ gap: q(4), borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            {hours.map((h, i) => (
              <span
                key={i}
                className="ab-bar flex-1"
                style={{ height: `${h}%`, borderRadius: `${q(2)} ${q(2)} 0 0`, background: i === peak ? `linear-gradient(180deg, #F4D77A, #B8891A)` : "rgba(224,185,58,0.35)", animationDelay: `${0.6 + i * 0.06}s` }}
              />
            ))}
          </div>
          <div className="flex" style={{ gap: q(4), marginTop: q(2) }}>
            {labels.map((l, i) => <span key={i} className="flex-1 text-center" style={{ fontSize: q(5), color: "rgba(255,255,255,0.4)" }}>{l}</span>)}
          </div>
        </div>
        <div className="ab-card flex min-w-0 flex-1 flex-col justify-between" style={{ ...cardBase, animationDelay: "0.5s" }}>
          <CardTitle>{t.adminPrepTime || "Avg prep time"}</CardTitle>
          <div style={{ fontSize: q(19), fontWeight: 700, lineHeight: 1 }}>
            <Count to={11.4} decimals={1} /><span style={{ fontSize: q(7), color: "rgba(255,255,255,0.5)", marginInlineStart: q(3) }}>min</span>
          </div>
          <svg viewBox="0 0 100 26" className="w-full" preserveAspectRatio="none" fill="none">
            <path className="ab-draw" pathLength={1} d={smooth([[0, 18], [14, 14], [28, 19], [42, 10], [56, 13], [70, 7], [84, 11], [100, 5]])} stroke={GREEN} strokeWidth="2" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ animationDelay: "0.8s" }} />
          </svg>
          <span style={{ fontSize: q(5.8), color: GREEN }}>↓ 1.3 min {t.adminVsYesterday || "vs yesterday"}</span>
        </div>
      </div>

      <div className="ab-card min-h-0" style={{ ...cardBase, flex: "1.1 1 0", animationDelay: "0.6s" }}>
        <CardTitle>{t.adminRecentOrders || "Recent orders"}</CardTitle>
        {rows.map((r, i) => (
          <div key={r.id} className="ab-row flex items-center" style={{ gap: q(6), padding: `${q(2.4)} 0`, borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: q(6.2), animationDelay: `${0.9 + i * 0.2}s` }}>
            <span style={{ fontFamily: mono, color: "rgba(255,255,255,0.5)", width: q(26) }}>#{r.id}</span>
            <span className="min-w-0 flex-1 truncate">{r.n}</span>
            <span style={{ color: "rgba(255,255,255,0.55)", width: q(18) }}>{r.w}</span>
            <span style={{ fontFamily: mono, width: q(34), textAlign: "right" }}>Af {r.a}</span>
            <span style={{ width: q(34), textAlign: "center", fontSize: q(5.6), fontWeight: 700, color: r.c, background: `${r.c}22`, borderRadius: 9999, padding: `${q(1)} 0` }}>{r.s}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ProfitView({ t }: { t: any }) {
  // waterfall (percent of revenue)
  const bars = [
    { l: t.adminKpiRevenue || "Revenue", b: 0, h: 100, c: GOLD, v: "184.5k" },
    { l: "Food", b: 57.7, h: 42.3, c: RED, v: "-78k" },
    { l: "Staff", b: 37.1, h: 20.6, c: RED, v: "-38k" },
    { l: "Other", b: 28.3, h: 8.8, c: RED, v: "-16k" },
    { l: t.adminKpiProfit || "Profit", b: 0, h: 28.3, c: GREEN, v: "52.3k" },
  ];
  const branches = [
    { n: "Kabul", v: 21.4, w: 100 },
    { n: "Herat", v: 17.8, w: 83 },
    { n: "Mazar", v: 13.1, w: 61 },
  ];
  return (
    <div className="flex h-full min-h-0 flex-col" style={{ gap: q(7) }}>
      <div className="flex" style={{ gap: q(7), height: q(46) }}>
        <Kpi Icon={Wallet} label={t.adminKpiRevenue || "Revenue"} delta="+12.4%" delay={0.05}><Count to={184.5} decimals={1} prefix="Af " suffix="k" /></Kpi>
        <Kpi Icon={ShoppingBag} label={t.adminCosts || "Costs"} delta="-3.1%" delay={0.15}><Count to={132.2} decimals={1} prefix="Af " suffix="k" /></Kpi>
        <Kpi Icon={TrendingUp} label={t.adminNetProfit || "Net profit"} delta="+15.2%" gold delay={0.25}><Count to={52.3} decimals={1} prefix="Af " suffix="k" /></Kpi>
      </div>

      <div className="flex min-h-0" style={{ gap: q(7), flex: "1.5 1 0" }}>
        <div className="ab-card flex min-w-0 flex-[1.8] flex-col" style={{ ...cardBase, animationDelay: "0.35s" }}>
          <CardTitle>{t.adminWaterfall || "From revenue to profit"}</CardTitle>
          <div className="flex min-h-0 flex-1 items-end" style={{ gap: q(8), paddingTop: q(10), borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
            {bars.map((b, i) => (
              <div key={i} className="relative h-full flex-1">
                <span
                  className="ab-bar absolute inset-x-0"
                  style={{ bottom: `${b.b}%`, height: `${b.h}%`, borderRadius: q(2.5), background: b.c, opacity: 0.92, animationDelay: `${0.55 + i * 0.14}s` }}
                />
                <span className="ab-fade absolute inset-x-0 text-center" style={{ bottom: `calc(${b.b + b.h}% + ${q(2)})`, fontSize: q(5.4), fontFamily: mono, color: "rgba(255,255,255,0.8)", animationDelay: `${0.9 + i * 0.14}s` }}>{b.v}</span>
              </div>
            ))}
          </div>
          <div className="flex" style={{ gap: q(8), marginTop: q(2) }}>
            {bars.map((b, i) => <span key={i} className="flex-1 truncate text-center" style={{ fontSize: q(5.4), color: "rgba(255,255,255,0.5)" }}>{b.l}</span>)}
          </div>
        </div>

        <div className="ab-card flex min-w-0 flex-1 flex-col items-center" style={{ ...cardBase, animationDelay: "0.45s" }}>
          <CardTitle>{t.adminKpiMargin || "Margin"}</CardTitle>
          <div className="relative flex min-h-0 w-full flex-1 items-end justify-center">
            <svg viewBox="0 0 80 46" className="w-[88%]" fill="none">
              <path d="M6 42A34 34 0 0 1 74 42" stroke="rgba(255,255,255,0.09)" strokeWidth="7" strokeLinecap="round" />
              <path className="ab-gauge" pathLength={100} d="M6 42A34 34 0 0 1 74 42" stroke={GREEN} strokeWidth="7" strokeLinecap="round" />
            </svg>
            <span className="absolute inset-x-0 text-center" style={{ bottom: q(2), fontSize: q(15), fontWeight: 700, lineHeight: 1 }}>
              <Count to={28.4} decimals={1} suffix="%" delay={300} />
            </span>
          </div>
        </div>
      </div>

      <div className="flex min-h-0" style={{ gap: q(7), flex: "1 1 0" }}>
        <div className="ab-card min-w-0 flex-[1.8]" style={{ ...cardBase, animationDelay: "0.6s" }}>
          <CardTitle>{t.adminBranches || "Profit by branch"}</CardTitle>
          {branches.map((b, i) => (
            <div key={b.n} className="flex items-center" style={{ gap: q(6), marginBottom: q(3.6), fontSize: q(6) }}>
              <span style={{ width: q(22) }}>{b.n}</span>
              <div className="flex-1" style={{ height: q(4), borderRadius: 9999, background: "rgba(255,255,255,0.07)", overflow: "hidden" }}>
                <div className="ab-w" style={{ width: `${b.w}%`, height: "100%", borderRadius: 9999, background: `linear-gradient(90deg, ${GOLD}, #B8891A)`, animationDelay: `${0.9 + i * 0.14}s` }} />
              </div>
              <span style={{ fontFamily: mono, width: q(30), textAlign: "right", color: "rgba(255,255,255,0.75)" }}>Af {b.v}k</span>
            </div>
          ))}
        </div>
        <div className="ab-card flex min-w-0 flex-1 flex-col justify-center" style={{ ...cardBase, animationDelay: "0.7s" }}>
          <span style={{ fontSize: q(6), color: "rgba(255,255,255,0.55)" }}>{t.adminProfitPerOrder || "Profit / order"}</span>
          <span style={{ fontSize: q(16), fontWeight: 700, color: GREEN, lineHeight: 1.1 }}><Count to={41.9} decimals={1} prefix="Af " /></span>
        </div>
      </div>
    </div>
  );
}

// ---------- keyboard-free dashboard shell ----------
function Screen({ view, t, cycle }: { view: number; t: any; cycle: number }) {
  const nav = [LayoutDashboard, ShoppingBag, Wallet, Hotel, Users, Utensils];
  const titles = [
    t.adminViewOverview || "Overview",
    t.adminViewOrders || "Orders",
    t.adminViewProfit || "Profit",
  ];
  return (
    <div
      className="absolute flex overflow-hidden"
      style={{
        left: q(50),
        top: q(30),
        width: q(540),
        height: q(330),
        borderRadius: q(5),
        background: "#0F1320",
        color: "#F4F1EA",
        fontFamily: sans,
      }}
    >
      {/* sidebar */}
      <div className="flex shrink-0 flex-col items-center" style={{ width: q(56), background: "#0B0E19", borderRight: "1px solid rgba(255,255,255,0.06)", paddingTop: q(10), gap: q(6) }}>
        <span className="flex items-center justify-center" style={{ width: q(22), height: q(22), borderRadius: q(6), background: "linear-gradient(135deg,#F4D77A,#B8891A)", color: "#1D1707", fontWeight: 800, fontSize: q(12), marginBottom: q(8) }}>M</span>
        {nav.map((Icon, i) => (
          <span
            key={i}
            className="flex items-center justify-center"
            style={{
              width: q(32),
              height: q(30),
              borderRadius: q(8),
              background: i === view ? "rgba(224,185,58,0.2)" : "transparent",
              color: i === view ? GOLD : "rgba(255,255,255,0.4)",
              boxShadow: i === view ? "inset 2px 0 0 #E0B93A" : "none",
              transition: "all .35s ease",
            }}
          >
            <Icon style={{ width: q(13), height: q(13) }} />
          </span>
        ))}
      </div>

      {/* main */}
      <div className="flex min-w-0 flex-1 flex-col" style={{ padding: q(10), gap: q(7) }}>
        <div className="flex shrink-0 items-center justify-between" style={{ height: q(22) }}>
          <div>
            <div key={view} className="ab-title" style={{ fontSize: q(11.5), fontWeight: 700, lineHeight: 1.1 }}>{titles[view]}</div>
            <div style={{ fontSize: q(5.8), color: "rgba(255,255,255,0.45)" }}>{t.adminToday || "Today"} · {t.adminAllBranches || "All branches"}</div>
          </div>
          <div className="flex items-center" style={{ gap: q(6) }}>
            <span className="flex items-center" style={{ gap: q(4), width: q(92), height: q(16), padding: `0 ${q(6)}`, borderRadius: 9999, background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}>
              <Search style={{ width: q(7), height: q(7), color: "rgba(255,255,255,0.45)" }} />
              <span style={{ width: q(36), height: q(3), borderRadius: 9999, background: "rgba(255,255,255,0.14)" }} />
            </span>
            <span className="relative flex items-center justify-center" style={{ width: q(16), height: q(16), borderRadius: 9999, background: "rgba(255,255,255,0.06)" }}>
              <Bell className="ab-bell" style={{ width: q(8), height: q(8), color: "rgba(255,255,255,0.7)" }} />
              <span className="ab-blink absolute" style={{ top: q(2), right: q(2.5), width: q(4), height: q(4), borderRadius: 9999, background: RED }} />
            </span>
            <span className="flex items-center justify-center" style={{ width: q(16), height: q(16), borderRadius: 9999, background: "linear-gradient(135deg,#F4D77A,#B8891A)", color: "#1D1707", fontSize: q(7.5), fontWeight: 800 }}>A</span>
          </div>
        </div>

        <div key={`${cycle}-${view}`} className="ab-view min-h-0 flex-1">
          {view === 0 ? <Overview t={t} /> : view === 1 ? <OrdersView t={t} /> : <ProfitView t={t} />}
        </div>
      </div>

      {/* notifications that pop in */}
      {[4.8, 16.8].map((d, i) => (
        <div
          key={`${cycle}-toast-${i}`}
          className="ab-toast absolute flex items-center"
          style={{ right: q(10), top: q(40), gap: q(6), padding: `${q(5)} ${q(8)}`, borderRadius: q(6), background: "#161B2B", border: "1px solid rgba(224,185,58,0.5)", boxShadow: "0 8px 24px rgba(0,0,0,0.5)", fontSize: q(6.4), animationDelay: `${d}s` }}
        >
          <span className="flex items-center justify-center" style={{ width: q(14), height: q(14), borderRadius: q(4), background: "rgba(224,185,58,0.2)", color: GOLD }}>
            <ShoppingBag style={{ width: q(8), height: q(8) }} />
          </span>
          <span>
            <b>{t.adminToastOrder || "New order"} #{1043 + i}</b>
            <span style={{ display: "block", color: "rgba(255,255,255,0.55)", fontSize: q(5.6) }}>Af {i ? 280 : 420}</span>
          </span>
        </div>
      ))}

      {/* mouse pointer */}
      <svg key={`${cycle}-cur`} className="ab-cursor pointer-events-none absolute" style={{ left: 0, top: 0, width: q(11), height: q(14), zIndex: 50 }} viewBox="0 0 20 24">
        <path d="M2 1L2 19L7 14.5L10.5 22L13.5 20.6L10.2 13.2L17 13Z" fill="#fff" stroke="#111" strokeWidth="1.4" strokeLinejoin="round" />
      </svg>

      <div className="pointer-events-none absolute inset-0" style={{ background: "linear-gradient(118deg, rgba(255,255,255,0.07), rgba(255,255,255,0) 34%)" }} />
    </div>
  );
}

export default function AdminShowcase({ isRTL }: { isRTL?: boolean }) {
  const t: any = useTranslation();
  const sectionRef = useRef<HTMLElement | null>(null);
  const [inView, setInView] = useState(false);
  const [cycle, setCycle] = useState(0);
  const [view, setView] = useState(0);

  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        setInView(entry.isIntersecting);
        if (entry.isIntersecting) setCycle((c) => c + 1); // restart the story when it comes into view
      },
      { threshold: 0.2 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // the story: Overview -> Orders -> Profit -> Overview ... (23s)
  useEffect(() => {
    if (!inView) return;
    setView(0);
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const ids = [
      setTimeout(() => setView(1), 7100),
      setTimeout(() => setView(2), 14600),
      setTimeout(() => setView(0), 21400),
      setTimeout(() => setCycle((c) => c + 1), 23000),
    ];
    return () => ids.forEach(clearTimeout);
  }, [inView, cycle]);

  const tabs = [
    t.adminViewOverview || "Overview",
    t.adminViewOrders || "Orders",
    t.adminViewProfit || "Profit",
  ];
  const features = [
    { Icon: BarChart3, label: t.adminFeatSales || "Sales analytics" },
    { Icon: Wallet, label: t.adminFeatProfit || "Profit & costs" },
    { Icon: ShoppingBag, label: t.adminFeatOrders || "Live orders" },
  ];

  return (
    <section
      ref={sectionRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative overflow-hidden py-10 md:py-16"
      style={{ background: "linear-gradient(160deg, #e8ecf2 0%, #c8ced8 40%, #b0b8c6 100%)" }}
    >
      {/* office background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `
            radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 1px, transparent 1px),
            radial-gradient(circle at 80% 70%, rgba(255,255,255,0.10) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px, 60px 60px",
        }}
      />
      <div
        className="absolute inset-0 z-0 opacity-10"
        style={{
          backgroundImage: `
            repeating-linear-gradient(0deg, transparent, transparent 80px, rgba(80,80,100,0.05) 80px, rgba(80,80,100,0.05) 81px),
            repeating-linear-gradient(90deg, transparent, transparent 120px, rgba(80,80,100,0.03) 120px, rgba(80,80,100,0.03) 121px)
          `,
        }}
      />
      <div
        className="absolute z-0 h-56 w-40 rounded-2xl"
        style={{
          right: "2rem",
          top: "2rem",
          background: "radial-gradient(ellipse at 50% 30%, rgba(255,255,240,0.3) 0%, rgba(200,220,255,0.05) 70%)",
          boxShadow: "inset 0 0 60px rgba(255,255,220,0.2), 0 0 40px rgba(200,220,255,0.1)",
        }}
      >
        <div className="absolute inset-0 rounded-2xl border-2 border-white/20" />
        <div className="absolute bottom-0 left-1/2 top-0 w-px bg-white/10" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
      </div>
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.08) 0%, transparent 50%)",
        }}
      />
      <FloatingBubbles count={16} />

      <div className="relative z-10 mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 lg:grid-cols-[1.35fr_0.65fr] lg:gap-10">
        {/* ===== DESK + MONITOR ===== */}
        <div
          className="mx-auto w-full max-w-[680px] transition-all duration-700 ease-out"
          style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0) scale(1)" : "translateY(26px) scale(0.96)" }}
        >
          <div dir="ltr" className="relative w-full" style={{ containerType: "inline-size" }} aria-hidden="true">
          <svg viewBox="0 0 640 530" className="block h-auto w-full" fill="none" style={{ overflow: "visible" }}>
                    <defs>
                      <linearGradient id="ab-body" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4B505E"/><stop offset="0.5" stopColor="#252831"/><stop offset="1" stopColor="#14161C"/></linearGradient>
                      <linearGradient id="ab-chin" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#9097A6"/><stop offset="0.5" stopColor="#DADDE6"/><stop offset="1" stopColor="#8A91A0"/></linearGradient>
                      <linearGradient id="ab-neck" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#7C8291"/><stop offset="0.5" stopColor="#E4E7EE"/><stop offset="1" stopColor="#6E7483"/></linearGradient>
                      <linearGradient id="ab-desk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E4D2B2"/><stop offset="0.08" stopColor="#D2B98F"/><stop offset="1" stopColor="#A9895B"/></linearGradient>
                      <linearGradient id="ab-kb" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2F333E"/><stop offset="1" stopColor="#171920"/></linearGradient>
                      <linearGradient id="ab-key" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#4A4F5C"/><stop offset="1" stopColor="#2B2E38"/></linearGradient>
                      <linearGradient id="ab-mouse" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#4F5462"/><stop offset="1" stopColor="#1B1D25"/></linearGradient>
                      <linearGradient id="ab-mug" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stopColor="#D8D3C6"/><stop offset="0.4" stopColor="#FFFFFF"/><stop offset="1" stopColor="#BEB8A8"/></linearGradient>
                      <linearGradient id="ab-leaf" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stopColor="#5DAE45"/><stop offset="1" stopColor="#245F20"/></linearGradient>
                      <linearGradient id="ab-steamg" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#fff" stopOpacity="0.8"/><stop offset="1" stopColor="#fff" stopOpacity="0"/></linearGradient>
                      <radialGradient id="ab-glow" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#7FA8FF" stopOpacity="0.28"/><stop offset="1" stopColor="#7FA8FF" stopOpacity="0"/></radialGradient>
                      <filter id="ab-blur" x="-30%" y="-100%" width="160%" height="300%"><feGaussianBlur stdDeviation="7"/></filter>
                    </defs>
          
                    {/* screen light spilling onto the desk and wall */}
                    <ellipse cx="320" cy="210" rx="360" ry="250" fill="url(#ab-glow)"/>
          
                    {/* plant (behind the desk edge, right) */}
                    <g className="ab-plant">
                      {[-50, -25, 0, 25, 50].map((a, i) => (
                        <ellipse key={i} cx="618" cy="392" rx="9" ry="34" fill="url(#ab-leaf)" transform={`rotate(${a} 618 440)`}/>
                      ))}
                    </g>
                    <path d="M598 440H638L632 478H604Z" fill="#B5603B"/>
                    <rect x="596" y="436" width="44" height="8" rx="3" fill="#C97048"/>
          
                    {/* desk */}
                    <rect x="-20" y="438" width="680" height="110" rx="6" fill="url(#ab-desk)"/>
                    <rect x="-20" y="438" width="680" height="3" fill="#fff" opacity="0.6"/>
                    <path d="M106 493h176" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M54 470h91" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M33 463h143" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M249 472h182" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M5 504h204" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M222 495h206" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M283 470h183" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M35 508h139" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M0 480h213" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M198 506h177" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M48 479h104" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M22 495h238" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M183 459h94" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/><path d="M163 476h102" stroke="#8C6B3F" strokeOpacity="0.12" strokeWidth="1"/>
          
                    {/* monitor stand + shadow */}
                    <ellipse cx="320" cy="442" rx="110" ry="9" fill="#000" opacity="0.35" filter="url(#ab-blur)"/>
                    <path d="M296 372H344L352 430H288Z" fill="url(#ab-neck)"/>
                    <rect x="228" y="426" width="184" height="13" rx="6.5" fill="url(#ab-chin)"/>
                    <rect x="228" y="426" width="184" height="2" rx="1" fill="#fff" opacity="0.7"/>
          
                    {/* monitor body */}
                    <rect x="44" y="30" width="552" height="350" rx="14" fill="#000" opacity="0.28" filter="url(#ab-blur)"/>
                    <rect x="40" y="20" width="560" height="352" rx="14" fill="url(#ab-body)"/>
                    <rect x="40.5" y="20.5" width="559" height="351" rx="13.5" stroke="#fff" strokeOpacity="0.18"/>
                    <rect x="46" y="26" width="548" height="338" rx="9" fill="#05060A"/>
                    <rect x="40" y="362" width="560" height="10" rx="5" fill="url(#ab-chin)" opacity="0.9"/>
                    <circle cx="320" cy="23.5" r="1.6" fill="#161922"/>
                    <circle cx="570" cy="367" r="1.8" fill="#4ADE80" className="ab-led"/>
          
                    {/* keyboard */}
                    <path d="M196 462H444L482 508H158Z" fill="#000" opacity="0.3" filter="url(#ab-blur)" transform="translate(0 6)"/>
                    <path d="M192 462H448L484 506H156Z" fill="url(#ab-kb)" stroke="#3A3E4A" strokeWidth="0.8"/>
                    <rect x="191.9" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="210.3" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="228.7" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="247.0" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="265.4" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="283.8" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="302.2" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="320.6" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="339.0" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="357.4" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="375.8" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="394.2" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="412.5" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="430.9" y="466.0" width="17.0" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="186.1" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="205.4" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="224.6" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="243.8" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="263.0" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="282.2" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="301.4" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="320.6" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="339.8" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="359.0" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="378.2" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="397.4" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="416.6" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="435.8" y="474.4" width="17.8" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="180.4" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="200.4" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="220.5" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="240.5" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="260.5" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="280.5" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="300.6" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="320.6" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="340.6" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="360.7" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="380.7" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="400.7" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="420.7" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="440.8" y="482.8" width="18.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="174.7" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="195.5" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="216.4" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="237.2" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="258.1" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="278.9" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="299.8" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="320.6" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="341.4" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="362.3" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="383.1" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="404.0" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="424.8" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="445.7" y="491.2" width="19.4" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="169.0" y="499.6" width="32.3" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="202.7" y="499.6" width="32.3" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="236.4" y="499.6" width="32.3" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="269.5" y="499.6" width="114.6" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="404.8" y="499.6" width="32.3" height="6.4" rx="1.4" fill="url(#ab-key)"/><rect x="438.5" y="499.6" width="32.3" height="6.4" rx="1.4" fill="url(#ab-key)"/>
          
                    {/* mouse */}
                    <ellipse cx="540" cy="500" rx="22" ry="7" fill="#000" opacity="0.3" filter="url(#ab-blur)"/>
                    <g className="ab-mouse">
                      <path d="M524 474Q524 458 540 458Q556 458 556 474V492Q556 504 540 504Q524 504 524 492Z" fill="url(#ab-mouse)" stroke="#5A5F6E" strokeWidth="0.8"/>
                      <path d="M540 458V478M524 478H556" stroke="#14161C" strokeWidth="1"/>
                      <rect x="537.5" y="464" width="5" height="10" rx="2.5" fill="#0E1015" stroke="#6A6F7E" strokeWidth="0.6"/>
                      <path d="M528 470Q530 462 538 460" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.6" strokeLinecap="round"/>
                    </g>
          
                    {/* coffee mug */}
                    <ellipse cx="92" cy="492" rx="26" ry="6" fill="#000" opacity="0.28" filter="url(#ab-blur)"/>
                    <path d="M72 462H112L109 492Q92 498 75 492Z" fill="url(#ab-mug)"/>
                    <path d="M112 468Q128 468 126 478Q124 488 110 486" stroke="#E7E2D4" strokeWidth="5" fill="none" strokeLinecap="round"/>
                    <ellipse cx="92" cy="462" rx="20" ry="5.5" fill="#F2EFE6"/>
                    <ellipse cx="92" cy="463" rx="17" ry="4.4" fill="#4A2A17"/>
                    <ellipse cx="86" cy="462" rx="6" ry="1.6" fill="#8A5230" opacity="0.7"/>
                    <g stroke="url(#ab-steamg)" strokeWidth="2.4" strokeLinecap="round">
                      <path className="ab-steam" d="M84 454Q78 444 84 436Q90 428 84 420"/>
                      <path className="ab-steam" style={{ animationDelay: "1.1s" }} d="M98 454Q104 444 98 436Q92 428 98 420"/>
                    </g>
                  </svg>
            <Screen view={view} t={t} cycle={cycle} />
          </div>
        </div>

        {/* ===== TEXT ===== */}
        <div
          className="transition-all duration-700 ease-out delay-150"
          style={{ opacity: inView ? 1 : 0, transform: inView ? "translateY(0)" : "translateY(26px)" }}
        >
          <div className="rounded-2xl border border-white/50 bg-white/45 p-6 shadow-2xl shadow-black/5 backdrop-blur-xl">
            <h2 className="font-serif text-2xl leading-tight text-[#1a1a2e] drop-shadow-sm sm:text-3xl">
              {t.adminTitle}
            </h2>
            <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-[#3d3d5c]">
              {t.adminSubtitle}
            </p>

            <div className="mt-5 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-2 rounded-full border border-blue-200/50 bg-blue-100/80 px-3 py-1 text-sm text-blue-700">
                <Utensils size={14} />
                {t.adminLabelMenu}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-amber-200/50 bg-amber-100/80 px-3 py-1 text-sm text-amber-700">
                <Users size={14} />
                {t.adminLabelWorkers}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-green-200/50 bg-green-100/80 px-3 py-1 text-sm text-green-700">
                <Hotel size={14} />
                {t.adminLabelHotels}
              </span>
            </div>

            <ul className="mt-5 space-y-2.5">
              {features.map(({ Icon, label }, i) => (
                <li key={i} className="flex items-center gap-3 text-sm font-medium text-[#2a2a44]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#C9A227]/20 text-[#8A6E1A]">
                    <Icon size={16} />
                  </span>
                  {label}
                </li>
              ))}
            </ul>

            {/* which dashboard view is on screen right now */}
            <div className="mt-5 flex gap-2 border-t border-black/5 pt-4">
              {tabs.map((label, i) => (
                <span
                  key={i}
                  className="rounded-full px-3 py-1 text-xs font-semibold transition-all duration-300"
                  style={{
                    background: i === view ? "#C9A227" : "rgba(255,255,255,0.6)",
                    color: i === view ? "#1D1707" : "#5b5b78",
                    boxShadow: i === view ? "0 0 0 3px rgba(201,162,39,0.25)" : "none",
                  }}
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @keyframes ab-cursor {
          0.00% { opacity: 0; transform: translate(46.875cqw, 35.938cqw); }
          3.48% { opacity: 1; transform: translate(46.875cqw, 34.375cqw); }
          10.43% { opacity: 1; transform: translate(60.938cqw, 18.750cqw); }
          18.26% { opacity: 1; transform: translate(39.062cqw, 31.250cqw); }
          27.39% { opacity: 1; transform: translate(9.375cqw, 14.062cqw); }
          30.00% { opacity: 1; transform: translate(4.219cqw, 15.312cqw); }
          32.17% { opacity: 1; transform: translate(4.219cqw, 15.312cqw); }
          38.26% { opacity: 1; transform: translate(56.250cqw, 28.125cqw); }
          46.96% { opacity: 1; transform: translate(46.875cqw, 39.062cqw); }
          54.78% { opacity: 1; transform: translate(67.188cqw, 18.750cqw); }
          60.00% { opacity: 1; transform: translate(9.375cqw, 19.531cqw); }
          61.74% { opacity: 1; transform: translate(4.219cqw, 20.938cqw); }
          64.78% { opacity: 1; transform: translate(4.219cqw, 20.938cqw); }
          72.17% { opacity: 1; transform: translate(51.562cqw, 23.438cqw); }
          80.00% { opacity: 1; transform: translate(68.750cqw, 37.500cqw); }
          86.09% { opacity: 1; transform: translate(40.625cqw, 40.625cqw); }
          89.57% { opacity: 1; transform: translate(9.375cqw, 10.938cqw); }
          91.30% { opacity: 1; transform: translate(4.219cqw, 9.688cqw); }
          93.91% { opacity: 1; transform: translate(4.219cqw, 9.688cqw); }
          96.52% { opacity: 1; transform: translate(31.250cqw, 26.562cqw); }
          100.00% { opacity: 0; transform: translate(32.812cqw, 27.344cqw); }
        }
        @keyframes ab-card {
          from { opacity: 0; transform: translateY(1.4cqw) scale(0.96); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        @keyframes ab-view {
          from { opacity: 0; transform: translateX(1.6cqw); }
          to { opacity: 1; transform: translateX(0); }
        }
        @keyframes ab-draw {
          from { stroke-dashoffset: 1; }
          to { stroke-dashoffset: 0; }
        }
        @keyframes ab-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ab-bar {
          from { transform: scaleY(0); }
          to { transform: scaleY(1); }
        }
        @keyframes ab-w {
          from { transform: scaleX(0); }
          to { transform: scaleX(1); }
        }
        @keyframes ab-seg {
          from { stroke-dasharray: 0 101.2; }
          to { stroke-dasharray: var(--len) var(--gap); }
        }
        @keyframes ab-gauge {
          from { stroke-dasharray: 0 100; }
          to { stroke-dasharray: 57 100; }
        }
        @keyframes ab-toast {
          0% { opacity: 0; transform: translateX(3cqw) scale(0.95); }
          10%, 80% { opacity: 1; transform: translateX(0) scale(1); }
          100% { opacity: 0; transform: translateX(3cqw) scale(0.95); }
        }
        @keyframes ab-ping {
          0% { transform: scale(0.6); opacity: 0.8; }
          100% { transform: scale(2.4); opacity: 0; }
        }
        @keyframes ab-blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.25; }
        }
        @keyframes ab-bell {
          0%, 90%, 100% { transform: rotate(0deg); }
          92% { transform: rotate(14deg); }
          95% { transform: rotate(-12deg); }
          98% { transform: rotate(6deg); }
        }
        @keyframes ab-steam {
          0% { opacity: 0; transform: translateY(8px); }
          35% { opacity: 0.9; }
          100% { opacity: 0; transform: translateY(-14px); }
        }
        @keyframes ab-mouse {
          0%, 100% { transform: translate(0, 0) rotate(0deg); }
          20% { transform: translate(5px, -3px) rotate(2deg); }
          45% { transform: translate(-3px, 4px) rotate(-2deg); }
          70% { transform: translate(-7px, 0) rotate(1deg); }
        }
        @keyframes ab-sway {
          0%, 100% { transform: rotate(-1.6deg); }
          50% { transform: rotate(1.6deg); }
        }

        .ab-cursor { opacity: 0; animation: ab-cursor 23s ease-in-out both; will-change: transform; }
        .ab-card { opacity: 0; animation: ab-card 0.5s ease-out both; }
        .ab-view { animation: ab-view 0.45s ease-out both; }
        .ab-title { animation: ab-fade 0.4s ease-out both; }
        .ab-row { opacity: 0; animation: ab-card 0.4s ease-out both; }
        .ab-fade { opacity: 0; animation: ab-fade 0.6s ease-out both; }
        .ab-draw { stroke-dasharray: 1; stroke-dashoffset: 1; animation: ab-draw 1.3s ease-out 0.6s both; }
        .ab-bar { transform-origin: bottom; transform: scaleY(0); animation: ab-bar 0.7s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .ab-w { transform-origin: left; transform: scaleX(0); animation: ab-w 0.8s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .ab-seg { stroke-dasharray: 0 101.2; animation: ab-seg 0.9s cubic-bezier(0.22, 1, 0.36, 1) both; }
        .ab-gauge { stroke-dasharray: 0 100; animation: ab-gauge 1.2s cubic-bezier(0.22, 1, 0.36, 1) 0.5s both; }
        .ab-toast { opacity: 0; animation: ab-toast 3.4s ease-in-out both; }
        .ab-ping { animation: ab-ping 1.6s ease-out infinite; }
        .ab-blink { animation: ab-blink 1.4s ease-in-out infinite; }
        .ab-bell { animation: ab-bell 6s ease-in-out infinite; transform-origin: 50% 10%; }
        .ab-steam { opacity: 0; animation: ab-steam 3.2s ease-out infinite; }
        .ab-mouse { animation: ab-mouse 7s ease-in-out infinite; transform-box: fill-box; transform-origin: center; }
        .ab-plant { transform-box: fill-box; transform-origin: 50% 100%; animation: ab-sway 6s ease-in-out infinite; }
        .ab-led { animation: ab-blink 2.2s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .ab-cursor, .ab-card, .ab-view, .ab-title, .ab-row, .ab-fade, .ab-draw,
          .ab-bar, .ab-w, .ab-seg, .ab-gauge, .ab-toast, .ab-ping, .ab-blink,
          .ab-bell, .ab-steam, .ab-mouse, .ab-plant, .ab-led { animation: none !important; }
          .ab-card, .ab-row, .ab-fade { opacity: 1; }
          .ab-draw { stroke-dashoffset: 0; }
          .ab-bar { transform: scaleY(1); }
          .ab-w { transform: scaleX(1); }
          .ab-seg { stroke-dasharray: var(--len) var(--gap); }
          .ab-gauge { stroke-dasharray: 57 100; }
          .ab-cursor, .ab-toast { opacity: 0; }
        }
      `}</style>
    </section>
  );
}