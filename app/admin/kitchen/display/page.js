"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

// Text comes from your main translations file (t.kitchen), same as expenses.
function useKitchenText() {
  const { t } = useAdminPreferences();
  return t.kitchen;
}

// ---------------------------------------------------------------------------
// Status machine (unchanged logic)
// ---------------------------------------------------------------------------
const NEXT_STATUS = {
  queued: "preparing",
  preparing: "ready",
  ready: "served",
};

const COLUMN_META = {
  queued: {
    emoji: "🎟️",
    panel: "#FFE3EC",
    accent: "#E8457C",
    deep: "#B8265A",
    soft: "#FFC3D7",
  },
  preparing: {
    emoji: "🔥",
    panel: "#FFF1BF",
    accent: "#EE8300",
    deep: "#A85A00",
    soft: "#FFDD80",
  },
  ready: {
    emoji: "🛎️",
    panel: "#D5F6E5",
    accent: "#10A06B",
    deep: "#0B6E49",
    soft: "#9FE8C8",
  },
};

const URGENT_THRESHOLD = 15; // minutes
const WARN_THRESHOLD = 8;
const DAILY_GOAL = 20; // served orders for a full star bar

const LEVELS = [
  { min: 0, key: "rookie", emoji: "🥄" },
  { min: 5, key: "lineCook", emoji: "🍳" },
  { min: 15, key: "sousChef", emoji: "🥘" },
  { min: 30, key: "headChef", emoji: "👨‍🍳" },
  { min: 60, key: "legend", emoji: "👑" },
];
const levelFor = (n) => [...LEVELS].reverse().find((l) => n >= l.min);
const MILESTONES = {
  1: { emoji: "🌱" },
  5: { emoji: "🍳" },
  10: { emoji: "🔥" },
  15: { emoji: "🥘" },
  20: { emoji: "🏆" },
  30: { emoji: "👨‍🍳" },
  50: { emoji: "🚀" },
  60: { emoji: "👑" },
  100: { emoji: "🎆" },
};

const HEAT = {
  calm: { bg: "#DDF7EC", fg: "#0B6E49", bar: "#34C98E", face: "😊" },
  warn: { bg: "#FFEBB8", fg: "#8A4B00", bar: "#FFA81F", face: "😅" },
  urgent: { bg: "#FFD6D6", fg: "#B01E2E", bar: "#FF4F5E", face: "😱" },
};

const INK = "#3A2750";
const INK_SOFT = "#76628C";

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
const Icon = ({ d, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d={d} />
  </svg>
);
const FlameIcon = (p) => (
  <Icon
    d="M12 2s-3 4-3 7a3 3 0 0 0 6 0c0-1-.3-1.7-.8-2.4.6 2-.6 3.4-2 3.4.4-1.7-.4-3.6-1.7-5C10.8 6.6 12 4 12 2Zm-3.5 12A5.5 5.5 0 1 0 14 8.5c-.4 3.5-2.5 4.6-5.5 5.5Z"
    {...p}
  />
);
const SendIcon = (p) => <Icon d="M4 12h14M13 6l6 6-6 6" {...p} />;
const CheckIcon = (p) => <Icon d="M5 12.5l4.5 4.5L19 7.5" {...p} />;
const ClockIcon = (p) => (
  <Icon d="M12 7v5l3 2M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z" {...p} />
);
const ExpandIcon = (p) => (
  <Icon d="M4 9V4h5M4 15v5h5M20 9V4h-5M20 15v5h-5" {...p} />
);
const CollapseIcon = (p) => (
  <Icon d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" {...p} />
);

const ACTION_ICON = {
  queued: FlameIcon,
  preparing: SendIcon,
  ready: CheckIcon,
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatElapsed(secs) {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  return `${m}:${String(secs % 60).padStart(2, "0")}`;
}
function heatLevel(secs) {
  const mins = secs / 60;
  if (mins >= URGENT_THRESHOLD) return "urgent";
  if (mins >= WARN_THRESHOLD) return "warn";
  return "calm";
}
const secsSince = (iso, now) =>
  Math.max(0, Math.floor((now - new Date(iso).getTime()) / 1000));
const sortOld = (list) =>
  [...list].sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

function motivation(k, { total, queued, urgent, served }) {
  const m = k.messages;
  if (urgent > 0)
    return {
      tone: "urgent",
      text: urgent === 1 ? m.lateOne : m.lateMany.replace("{count}", urgent),
    };
  if (total === 0 && served > 0)
    return { tone: "great", text: m.allClear.replace("{count}", served) };
  if (total === 0) return { tone: "calm", text: m.noOrders };
  if (queued >= 4) return { tone: "busy", text: m.rush };
  return { tone: "calm", text: m.steady };
}
const BANNER = {
  urgent: { bg: "#FFE0E0", fg: "#9C1C2B", edge: "#FFB3B8" },
  great: { bg: "#D5F6E5", fg: "#0B6E49", edge: "#9FE8C8" },
  busy: { bg: "#FFEBB8", fg: "#8A4B00", edge: "#FFD36B" },
  calm: { bg: "#FFFFFF", fg: INK, edge: "#E9DDF7" },
};
const MOOD = {
  urgent: "worried",
  great: "party",
  busy: "focus",
  calm: "happy",
};

// ---------------------------------------------------------------------------
// Chef mascot
// ---------------------------------------------------------------------------
function Chef({ mood = "happy", size = 76 }) {
  const mouth = {
    happy: (
      <path
        d="M34 50 Q40 57 46 50"
        stroke="#7A3B3B"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    ),
    focus: (
      <path
        d="M35 51 H45"
        stroke="#7A3B3B"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
    ),
    worried: (
      <path
        d="M34 54 Q40 47 46 54"
        stroke="#7A3B3B"
        strokeWidth="2.6"
        fill="none"
        strokeLinecap="round"
      />
    ),
    party: (
      <path
        d="M33 49 Q40 61 47 49 Z"
        fill="#7A3B3B"
        stroke="#7A3B3B"
        strokeWidth="2"
        strokeLinejoin="round"
      />
    ),
  }[mood];
  const eyes =
    mood === "party" ? (
      <>
        <path
          d="M27 40 Q31 35 35 40"
          stroke={INK}
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
        />
        <path
          d="M45 40 Q49 35 53 40"
          stroke={INK}
          strokeWidth="2.8"
          fill="none"
          strokeLinecap="round"
        />
      </>
    ) : (
      <>
        <circle className="chef-eye" cx="31" cy="40" r="3.4" fill={INK} />
        <circle className="chef-eye" cx="49" cy="40" r="3.4" fill={INK} />
      </>
    );
  return (
    <svg
      className={mood === "party" ? "chef chef-party" : "chef"}
      width={size}
      height={size}
      viewBox="0 0 80 80"
      aria-hidden="true"
    >
      <ellipse cx="40" cy="76" rx="22" ry="3" fill="rgba(58,39,80,0.12)" />
      <g>
        <circle
          cx="26"
          cy="20"
          r="11"
          fill="#fff"
          stroke="#E9DDF7"
          strokeWidth="2"
        />
        <circle
          cx="40"
          cy="15"
          r="13"
          fill="#fff"
          stroke="#E9DDF7"
          strokeWidth="2"
        />
        <circle
          cx="54"
          cy="20"
          r="11"
          fill="#fff"
          stroke="#E9DDF7"
          strokeWidth="2"
        />
        <rect
          x="24"
          y="22"
          width="32"
          height="12"
          rx="4"
          fill="#fff"
          stroke="#E9DDF7"
          strokeWidth="2"
        />
        <rect x="26" y="23" width="28" height="10" fill="#fff" />
      </g>
      <circle
        cx="40"
        cy="48"
        r="22"
        fill="#FFD9B8"
        stroke="#F5BE92"
        strokeWidth="2"
      />
      <circle cx="24" cy="49" r="4.5" fill="#FF9DB5" opacity="0.7" />
      <circle cx="56" cy="49" r="4.5" fill="#FF9DB5" opacity="0.7" />
      {eyes}
      {mouth}
      {mood === "worried" && (
        <path d="M64 30 q3 5 0 8 q-3 -3 0 -8Z" fill="#7CC8F5" />
      )}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// Pastel, playful backdrop
// ---------------------------------------------------------------------------
const FLOATERS = ["🍓", "🥐", "🍕", "🧁", "🥑", "🍋", "🍩", "🌮"];

function Backdrop() {
  const { items, bubbles, sparkles } = useMemo(() => {
    let seed = 7;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    return {
      items: FLOATERS.map((e, i) => ({
        e,
        left: 4 + ((i * 12 + rnd() * 5) % 92),
        top: 8 + rnd() * 84,
        size: 24 + rnd() * 16,
        delay: -rnd() * 14,
        duration: 10 + rnd() * 8,
      })),
      bubbles: Array.from({ length: 16 }, () => ({
        left: rnd() * 100,
        size: 14 + rnd() * 40,
        delay: -rnd() * 30,
        duration: 18 + rnd() * 20,
        sway: rnd() * 60 - 30,
      })),
      sparkles: Array.from({ length: 14 }, () => ({
        left: rnd() * 100,
        top: rnd() * 100,
        size: 10 + rnd() * 12,
        delay: -rnd() * 6,
        duration: 2.5 + rnd() * 3,
        c: ["#FFB02E", "#FF7BA5", "#8B5CF6", "#34C98E"][Math.floor(rnd() * 4)],
      })),
    };
  }, []);

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="bg-shift absolute inset-0" />
      <div className="rays" />
      <div className="dots absolute inset-0" />
      <div
        className="blob"
        style={{
          width: 520,
          height: 520,
          left: "-8%",
          top: "-14%",
          background: "#FFC9DB",
          animation: "blobA 24s ease-in-out infinite",
        }}
      />
      <div
        className="blob"
        style={{
          width: 560,
          height: 560,
          right: "-10%",
          top: "-10%",
          background: "#FFE79A",
          animation: "blobB 30s ease-in-out infinite",
        }}
      />
      <div
        className="blob"
        style={{
          width: 600,
          height: 600,
          left: "20%",
          bottom: "-28%",
          background: "#B8EFD5",
          animation: "blobC 34s ease-in-out infinite",
        }}
      />
      {bubbles.map((u, i) => (
        <span
          key={`b${i}`}
          className="bubble"
          style={{
            left: `${u.left}%`,
            width: u.size,
            height: u.size,
            animationDelay: `${u.delay}s`,
            animationDuration: `${u.duration}s`,
            "--sway": `${u.sway}px`,
          }}
        />
      ))}
      {sparkles.map((sp, i) => (
        <span
          key={`s${i}`}
          className="sparkle"
          style={{
            left: `${sp.left}%`,
            top: `${sp.top}%`,
            fontSize: sp.size,
            color: sp.c,
            animationDelay: `${sp.delay}s`,
            animationDuration: `${sp.duration}s`,
          }}
        >
          ✦
        </span>
      ))}
      {items.map((f, i) => (
        <span
          key={i}
          className="floater"
          style={{
            left: `${f.left}%`,
            top: `${f.top}%`,
            fontSize: f.size,
            animationDelay: `${f.delay}s`,
            animationDuration: `${f.duration}s`,
          }}
        >
          {f.e}
        </span>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function KitchenDisplayPage() {
  const router = useRouter();
  const { locale, dir } = useAdminPreferences();
  const k = useKitchenText();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [exitingIds, setExitingIds] = useState(() => new Set());
  const [enteringIds, setEnteringIds] = useState(() => new Set());
  const [flashIds, setFlashIds] = useState(() => new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [served, setServed] = useState(0);
  const [toast, setToast] = useState(null);
  const busyIds = useRef(new Set());
  const knownIdsRef = useRef(new Set());
  const pendingRef = useRef(new Map()); // ticket id -> { status, at }

  function handle401(res) {
    if (res.status === 401) {
      router.push("/hotel/login");
      return true;
    }
    return false;
  }

  // ---------- Fullscreen ----------
  useEffect(() => {
    const events = [
      "fullscreenchange",
      "webkitfullscreenchange",
      "mozfullscreenchange",
      "MSFullscreenChange",
    ];
    const onChange = () =>
      setIsFullscreen(
        !!(
          document.fullscreenElement ||
          document.webkitFullscreenElement ||
          document.mozFullScreenElement ||
          document.msFullscreenElement
        ),
      );
    events.forEach((e) => document.addEventListener(e, onChange));
    onChange();
    return () =>
      events.forEach((e) => document.removeEventListener(e, onChange));
  }, []);

  async function toggleFullscreen() {
    try {
      const el = document.documentElement;
      if (!isFullscreen) {
        if (el.requestFullscreen) await el.requestFullscreen();
        else if (el.webkitRequestFullscreen) await el.webkitRequestFullscreen();
        else if (el.mozRequestFullScreen) await el.mozRequestFullScreen();
        else if (el.msRequestFullscreen) await el.msRequestFullscreen();
      } else {
        if (document.exitFullscreen) await document.exitFullscreen();
        else if (document.webkitExitFullscreen)
          await document.webkitExitFullscreen();
        else if (document.mozCancelFullScreen)
          await document.mozCancelFullScreen();
        else if (document.msExitFullscreen) await document.msExitFullscreen();
      }
    } catch (err) {
      console.warn("Fullscreen toggle failed:", err);
    }
  }

  // ---------- Data ----------
  const loadTickets = useCallback(async () => {
    try {
      const res = await fetchWithAuth("/api/kitchen/tickets");
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || k?.loadError || "Error");
        return;
      }
      setError("");

      // Keep cards you just moved from jumping back to the old status
      const nowMs = Date.now();
      const pending = pendingRef.current;
      const list = [];
      for (const t of data.tickets || []) {
        const p = pending.get(t.id);
        if (!p) {
          list.push(t);
          continue;
        }
        const expired = nowMs - p.at > 20000;
        const confirmed = p.status !== "served" && t.status === p.status;
        if (expired || confirmed) {
          pending.delete(t.id);
          list.push(t);
          continue;
        }
        if (p.status === "served") continue; // keep served cards hidden
        list.push({ ...t, status: p.status });
      }
      pending.forEach((p, id) => {
        if (nowMs - p.at > 20000) pending.delete(id);
      });

      const fresh = list.filter((t) => !knownIdsRef.current.has(t.id));
      if (fresh.length > 0 && knownIdsRef.current.size > 0) {
        setEnteringIds((prev) => {
          const n = new Set(prev);
          fresh.forEach((t) => n.add(t.id));
          return n;
        });
        setTimeout(() => {
          setEnteringIds((prev) => {
            const n = new Set(prev);
            fresh.forEach((t) => n.delete(t.id));
            return n;
          });
        }, 900);
      }
      knownIdsRef.current = new Set(list.map((t) => t.id));
      setTickets(list);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line
  }, []);

  useEffect(() => {
    loadTickets();
    const poll = setInterval(loadTickets, 7000);
    const clock = setInterval(() => setNow(Date.now()), 2000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [loadTickets]);

  async function advance(ticket) {
    const next = NEXT_STATUS[ticket.status];
    if (!next || busyIds.current.has(ticket.id)) return;
    busyIds.current.add(ticket.id);
    pendingRef.current.set(ticket.id, { status: next, at: Date.now() });

    setFlashIds((prev) => new Set(prev).add(ticket.id));
    setTimeout(() => {
      setFlashIds((prev) => {
        const s = new Set(prev);
        s.delete(ticket.id);
        return s;
      });
    }, 500);

    if (next === "served") {
      const count = served + 1;
      setServed(count);
      const m = MILESTONES[count];
      if (m) {
        setToast({ id: count, ...m });
        setTimeout(
          () => setToast((t) => (t && t.id === count ? null : t)),
          3800,
        );
      }
      setExitingIds((prev) => new Set(prev).add(ticket.id));
      setTimeout(() => {
        setTickets((prev) => prev.filter((t) => t.id !== ticket.id));
        setExitingIds((prev) => {
          const s = new Set(prev);
          s.delete(ticket.id);
          return s;
        });
      }, 620);
    } else {
      setTickets((prev) =>
        prev.map((t) => (t.id === ticket.id ? { ...t, status: next } : t)),
      );
    }

    try {
      const res = await fetchWithAuth(`/api/kitchen/tickets/${ticket.id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: next }),
      });
      if (handle401(res)) return;
      if (!res.ok) {
        pendingRef.current.delete(ticket.id); // save failed: show the real status
        loadTickets();
      } else {
        pendingRef.current.set(ticket.id, { status: next, at: Date.now() }); // restart protection window
      }
    } catch {
      pendingRef.current.delete(ticket.id);
      loadTickets();
    } finally {
      busyIds.current.delete(ticket.id);
    }
  }

  const columns = useMemo(
    () => ({
      queued: sortOld(tickets.filter((t) => t.status === "queued")),
      preparing: sortOld(tickets.filter((t) => t.status === "preparing")),
      ready: sortOld(tickets.filter((t) => t.status === "ready")),
    }),
    [tickets],
  );

  const totalActive = tickets.length;
  const urgentCount = tickets.filter(
    (t) => heatLevel(secsSince(t.created_at, now)) === "urgent",
  ).length;
  const banner = k
    ? motivation(k, {
        total: totalActive,
        queued: columns.queued.length,
        urgent: urgentCount,
        served,
      })
    : { tone: "calm", text: "" };
  const b = BANNER[banner.tone];
  const goalPct = Math.min(100, (served / DAILY_GOAL) * 100);
  const stars = Math.min(5, Math.floor((served / DAILY_GOAL) * 5));
  const level = levelFor(served);
  const longest = tickets.reduce(
    (m, t) => Math.max(m, secsSince(t.created_at, now)),
    0,
  );

  if (!k) {
    return (
      <div className="p-6 text-sm" dir={dir}>
        Missing translations: add the "kitchen" block to this language in your
        translations file.
      </div>
    );
  }

  return (
    <div
      className="kds relative flex min-h-screen flex-col overflow-hidden md:h-screen"
      style={{ color: INK }}
      dir={dir}
    >
      <Backdrop />

      <div className="relative z-10 flex min-h-0 flex-1 flex-col px-3 py-3 md:px-4">
        {/* Compact top bar */}
        <header className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="logo-tile grid h-11 w-11 place-items-center rounded-2xl text-white">
                <FlameIcon className="h-6 w-6 flame-flicker" />
              </div>
              {totalActive > 0 && (
                <span className="pulse-ring absolute -end-2 -top-2 grid h-6 min-w-6 place-items-center rounded-full bg-[#FF4F5E] px-1 text-xs font-extrabold text-white ring-2 ring-white">
                  {totalActive}
                </span>
              )}
            </div>
            <div className="leading-tight">
              <h1 className="font-display text-2xl font-extrabold">
                {k.title}
              </h1>
              <p
                className="flex items-center gap-1.5 text-xs font-bold"
                style={{ color: INK_SOFT }}
              >
                <span className="status-dot inline-block h-2 w-2 rounded-full bg-[#10A06B]" />
                {k.live} ·{" "}
                {new Date(now).toLocaleTimeString(locale, {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
              </p>
            </div>
          </div>

          {/* Mascot message */}
          {!loading && (
            <div
              role="status"
              className="slide-down sticker flex min-w-[260px] flex-1 items-center gap-2 rounded-2xl py-1 ps-2 pe-4"
              style={{ background: b.bg, color: b.fg, "--edge": b.edge }}
            >
              <Chef mood={MOOD[banner.tone]} size={44} />
              <p className="font-display text-base font-bold leading-tight md:text-lg">
                {banner.text}
              </p>
            </div>
          )}

          <div className="ms-auto flex flex-wrap items-center gap-2">
            {error && (
              <div className="slide-down rounded-xl bg-[#FFD6D6] px-3 py-1.5 text-xs font-bold text-[#9C1C2B]">
                {error}
              </div>
            )}

       
            <button
              onClick={toggleFullscreen}
              aria-label={isFullscreen ? k.exitFullscreen : k.enterFullscreen}
              className="sticker group relative grid h-11 w-11 place-items-center rounded-2xl bg-white text-[#8B5CF6] focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-[#8B5CF6]"
              style={{ "--edge": "#E4D8FA" }}
            >
              {isFullscreen ? (
                <CollapseIcon className="h-5 w-5" />
              ) : (
                <ExpandIcon className="h-5 w-5" />
              )}
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-2">
                <div className="shimmer h-12 rounded-2xl bg-white/80" />
                <div className="shimmer h-28 rounded-2xl bg-white/80" />
                <div className="shimmer h-28 rounded-2xl bg-white/80" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 md:grid-cols-3">
            {["queued", "preparing", "ready"].map((col) => (
              <Column
                key={col}
                col={col}
                tickets={columns[col]}
                now={now}
                exitingIds={exitingIds}
                enteringIds={enteringIds}
                flashIds={flashIds}
                onAdvance={advance}
              />
            ))}
          </div>
        )}
      </div>

      {toast && (
        <div
          key={toast.id}
          role="status"
          className="toast fixed bottom-5 left-1/2 z-50 flex items-center gap-3 rounded-full bg-white px-6 py-3 font-display text-xl font-extrabold"
          style={{
            color: INK,
            boxShadow: "0 5px 0 #FFDD80, 0 14px 30px -8px rgba(58,39,80,0.35)",
          }}
        >
          <span className="text-3xl" aria-hidden="true">
            {toast.emoji}
          </span>
          {k.milestones[toast.id]}
        </div>
      )}

      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Baloo+2:wght@600;700;800&family=Nunito:wght@500;600;700;800&family=Vazirmatn:wght@500;700;800&family=Noto+Sans+Arabic:wght@500;700;800&display=swap");
        .kds {
          font-family: "Nunito", "Noto Sans Arabic", system-ui, sans-serif;
        }
        .font-display {
          font-family:
            "Baloo 2", "Noto Sans Arabic", "Nunito", system-ui, sans-serif;
        }

        /* ---------- Pashto / Dari (right-to-left Arabic script) ----------
           Arabic-script fonts look smaller than Latin at the same size, so
           use a better font and bump every text size a little. */
        .kds[dir="rtl"],
        .kds[dir="rtl"] .font-display {
          font-family:
            "Vazirmatn", "Noto Sans Arabic", "Noto Naskh Arabic", "Segoe UI",
            Tahoma, system-ui, sans-serif;
          font-feature-settings: "kern", "liga", "calt";
          letter-spacing: 0 !important;
        }
        .kds[dir="rtl"] .text-xs {
          font-size: 0.82rem;
          line-height: 1.4;
        }
        .kds[dir="rtl"] .text-sm {
          font-size: 1rem;
          line-height: 1.45;
        }
        .kds[dir="rtl"] .text-base {
          font-size: 1.15rem;
          line-height: 1.5;
        }
        .kds[dir="rtl"] .text-lg {
          font-size: 1.3rem;
          line-height: 1.5;
        }
        .kds[dir="rtl"] .text-xl {
          font-size: 1.45rem;
          line-height: 1.5;
        }
        .kds[dir="rtl"] .text-2xl {
          font-size: 1.7rem;
          line-height: 1.4;
        }
        .kds[dir="rtl"] .text-3xl {
          font-size: 2.1rem;
          line-height: 1.3;
        }
        .kds[dir="rtl"] .text-\\[15px\\] {
          font-size: 1.1rem;
          line-height: 1.5;
        }
        .kds[dir="rtl"] .text-\\[10px\\] {
          font-size: 0.8rem;
        }
        .kds[dir="rtl"] .leading-tight {
          line-height: 1.5;
        }
        .kds[dir="rtl"] .leading-none {
          line-height: 1.35;
        }
        .kds[dir="rtl"] .font-extrabold {
          font-weight: 800;
        }

        /* backdrop */
        .dots {
          background-image: radial-gradient(
            rgba(139, 92, 246, 0.14) 1.6px,
            transparent 1.8px
          );
          background-size: 28px 28px;
        }
        .blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(70px);
          opacity: 0.55;
          will-change: transform;
        }
        @keyframes blobA {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(90px, 60px) scale(1.12);
          }
        }
        @keyframes blobB {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-110px, 80px) scale(1.08);
          }
        }
        @keyframes blobC {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(70px, -90px) scale(1.1);
          }
        }
        .floater {
          position: absolute;
          opacity: 0.28;
          animation-name: floaty;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
          filter: saturate(1.1);
        }
        @keyframes floaty {
          0%,
          100% {
            transform: translateY(0) rotate(-8deg);
          }
          50% {
            transform: translateY(-22px) rotate(8deg);
          }
        }

        /* sticker look: chunky coloured bottom edge instead of grey shadow */
        .sticker {
          box-shadow:
            0 5px 0 var(--edge, #e9ddf7),
            0 10px 18px -8px rgba(58, 39, 80, 0.18);
        }
        .logo-tile {
          background: linear-gradient(145deg, #ff7ba5, #e8457c);
          box-shadow:
            0 5px 0 #b8265a,
            0 10px 18px -6px rgba(232, 69, 124, 0.5);
          transform: rotate(-4deg);
        }

        /* chef */
        .chef {
          flex-shrink: 0;
          animation: chefBob 3s ease-in-out infinite;
          transform-origin: 50% 90%;
        }
        .chef-party {
          animation: chefParty 0.7s ease-in-out infinite;
        }
        .chef-eye {
          animation: blink 4.5s infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes chefBob {
          0%,
          100% {
            transform: translateY(0) rotate(-2deg);
          }
          50% {
            transform: translateY(-5px) rotate(2deg);
          }
        }
        @keyframes chefParty {
          0%,
          100% {
            transform: translateY(0) rotate(-6deg);
          }
          50% {
            transform: translateY(-10px) rotate(6deg);
          }
        }
        @keyframes blink {
          0%,
          92%,
          100% {
            transform: scaleY(1);
          }
          96% {
            transform: scaleY(0.1);
          }
        }

        /* goal */
        .goal-fill {
          background: linear-gradient(90deg, #ff7ba5, #ffb02e, #34c98e);
          transition: width 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .star {
          font-size: 20px;
          filter: grayscale(1) opacity(0.28);
          transition:
            filter 0.4s ease,
            transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .star-on {
          filter: none;
          animation: starPop 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes starPop {
          0% {
            transform: scale(0.3) rotate(-30deg);
          }
          100% {
            transform: scale(1) rotate(0);
          }
        }

        /* status */
        .status-dot {
          animation: statusPulse 2.4s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%,
          100% {
            box-shadow: 0 0 0 0 rgba(16, 160, 107, 0.55);
          }
          50% {
            box-shadow: 0 0 0 6px rgba(16, 160, 107, 0);
          }
        }
        .pulse-ring {
          animation: pulseRing 2s ease-out infinite;
        }
        @keyframes pulseRing {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 79, 94, 0.6);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(255, 79, 94, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(255, 79, 94, 0);
          }
        }
        .shimmer {
          animation: shimmer 1.4s ease-in-out infinite;
        }
        @keyframes shimmer {
          0%,
          100% {
            opacity: 0.55;
          }
          50% {
            opacity: 1;
          }
        }

        /* cards */
        @keyframes dropIn {
          0% {
            opacity: 0;
            transform: translateY(-28px) scale(0.92) rotate(-2deg);
          }
          55% {
            opacity: 1;
            transform: translateY(5px) scale(1.03) rotate(1deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1) rotate(0);
          }
        }
        .card-enter {
          animation: dropIn 560ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        @keyframes cardExit {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          30% {
            transform: scale(1.06) rotate(1deg);
            opacity: 1;
          }
          100% {
            transform: scale(0.7) translateY(-40px) rotate(-4deg);
            opacity: 0;
          }
        }
        .card-exit {
          animation: cardExit 620ms cubic-bezier(0.4, 0, 0.6, 1) forwards;
          pointer-events: none;
        }
        @keyframes cardFlash {
          0% {
            box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.5);
          }
          100% {
            box-shadow: 0 0 0 22px rgba(139, 92, 246, 0);
          }
        }
        .card-flash {
          animation: cardFlash 500ms ease-out;
        }
        @keyframes urgentWiggle {
          0%,
          100% {
            transform: rotate(0);
          }
          25% {
            transform: rotate(-0.8deg);
          }
          75% {
            transform: rotate(0.8deg);
          }
        }
        .wiggle-urgent {
          animation: urgentWiggle 0.5s ease-in-out infinite;
        }
        @keyframes urgentGlow {
          0%,
          100% {
            outline-color: rgba(255, 79, 94, 0.5);
          }
          50% {
            outline-color: rgba(255, 79, 94, 1);
          }
        }
        .urgent-glow {
          outline: 3px solid rgba(255, 79, 94, 0.6);
          outline-offset: 0;
          animation: urgentGlow 1.4s ease-in-out infinite;
        }
        @keyframes steam {
          0% {
            transform: translateY(6px) scale(0.85);
            opacity: 0;
          }
          20% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(-22px) scale(1.2);
            opacity: 0;
          }
        }
        .steam-wisp {
          position: absolute;
          font-size: 20px;
          font-weight: 800;
          color: rgba(238, 131, 0, 0.6);
          animation: steam 3s ease-in infinite;
        }
        @keyframes confetti {
          0% {
            transform: translate(-50%, -50%) translate(0, 0) rotate(0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) translate(var(--tx), var(--ty))
              rotate(var(--r)) scale(0.2);
            opacity: 0;
          }
        }
        .confetti-piece {
          animation: confetti 700ms ease-out forwards;
        }

        /* chunky 3D button */
        .action-btn {
          box-shadow: 0 5px 0 var(--deep);
          transition:
            transform 140ms cubic-bezier(0.34, 1.56, 0.64, 1),
            box-shadow 140ms ease,
            filter 150ms ease;
        }
        .action-btn:hover {
          transform: translateY(-2px);
          box-shadow: 0 7px 0 var(--deep);
          filter: brightness(1.05);
        }
        .action-btn:active {
          transform: translateY(4px);
          box-shadow: 0 1px 0 var(--deep);
        }

        .progress-fill {
          transition:
            width 1s linear,
            background-color 0.6s ease;
        }
        .progress-striped {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.35) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.35) 50%,
            rgba(255, 255, 255, 0.35) 75%,
            transparent 75%,
            transparent
          );
          background-size: 14px 14px;
          animation: stripeMove 1s linear infinite;
        }
        @keyframes stripeMove {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 14px 0;
          }
        }
        @keyframes slideDown {
          from {
            transform: translateY(-10px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .slide-down {
          animation: slideDown 260ms ease-out;
        }
        @keyframes flicker {
          0%,
          100% {
            transform: scale(1) rotate(-3deg);
          }
          30% {
            transform: scale(1.12) rotate(3deg);
          }
          60% {
            transform: scale(0.94) rotate(-2deg);
          }
        }
        .flame-flicker {
          animation: flicker 1.6s ease-in-out infinite;
          transform-origin: 50% 90%;
        }
        @keyframes emptyBounce {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-6px);
          }
        }
        .empty-bounce {
          display: inline-block;
          animation: emptyBounce 2.4s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .blob,
          .floater,
          .chef,
          .chef-party,
          .chef-eye,
          .status-dot,
          .pulse-ring,
          .card-enter,
          .card-exit,
          .card-flash,
          .wiggle-urgent,
          .urgent-glow,
          .steam-wisp,
          .confetti-piece,
          .shimmer,
          .progress-striped,
          .flame-flicker,
          .slide-down,
          .star-on,
          .empty-bounce,
          .bg-shift,
          .rays,
          .bubble,
          .sparkle,
          .toast,
          .level-pop {
            animation: none !important;
          }
          .toast {
            transform: translate(-50%, 0);
          }
        }

        /* ---------- compact / high-volume overrides ---------- */
        .kds-scroll {
          scrollbar-width: thin;
          scrollbar-color: rgba(58, 39, 80, 0.25) transparent;
        }
        .kds-scroll::-webkit-scrollbar {
          width: 8px;
        }
        .kds-scroll::-webkit-scrollbar-thumb {
          background: rgba(58, 39, 80, 0.22);
          border-radius: 9999px;
        }
        .sticker {
          box-shadow:
            0 3px 0 var(--edge, #e9ddf7),
            0 6px 12px -6px rgba(58, 39, 80, 0.18);
        }
        .logo-tile {
          box-shadow: 0 3px 0 #b8265a;
        }
        .action-btn {
          box-shadow: 0 3px 0 var(--deep);
        }
        .action-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 0 var(--deep);
        }
        .action-btn:active {
          transform: translateY(2px);
          box-shadow: 0 1px 0 var(--deep);
        }
        .chip {
          animation: none;
        }

        /* ---------- living background ---------- */
        .bg-shift {
          background: linear-gradient(
            120deg,
            #ffeff5,
            #fff8e1,
            #e6faf0,
            #f0eaff,
            #ffeff5
          );
          background-size: 300% 300%;
          animation: bgShift 26s ease infinite;
        }
        @keyframes bgShift {
          0%,
          100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
        .rays {
          position: absolute;
          left: 50%;
          top: -70%;
          width: 170vmax;
          height: 170vmax;
          margin-left: -85vmax;
          background: repeating-conic-gradient(
            rgba(255, 205, 90, 0.1) 0 9deg,
            transparent 9deg 18deg
          );
          animation: raySpin 140s linear infinite;
          -webkit-mask-image: radial-gradient(circle, #000 0%, transparent 62%);
          mask-image: radial-gradient(circle, #000 0%, transparent 62%);
        }
        @keyframes raySpin {
          to {
            transform: rotate(360deg);
          }
        }
        .bubble {
          position: absolute;
          bottom: -80px;
          border-radius: 9999px;
          background: radial-gradient(
            circle at 30% 28%,
            rgba(255, 255, 255, 0.95),
            rgba(255, 255, 255, 0.2) 60%
          );
          border: 2px solid rgba(255, 255, 255, 0.9);
          animation-name: bubbleUp;
          animation-timing-function: ease-in;
          animation-iteration-count: infinite;
          will-change: transform;
        }
        @keyframes bubbleUp {
          0% {
            transform: translate(0, 0);
            opacity: 0;
          }
          10% {
            opacity: 0.8;
          }
          90% {
            opacity: 0.6;
          }
          100% {
            transform: translate(var(--sway), -112vh);
            opacity: 0;
          }
        }
        .sparkle {
          position: absolute;
          animation-name: twinkle;
          animation-iteration-count: infinite;
          animation-timing-function: ease-in-out;
        }
        @keyframes twinkle {
          0%,
          100% {
            transform: scale(0.4) rotate(0);
            opacity: 0.1;
          }
          50% {
            transform: scale(1.1) rotate(45deg);
            opacity: 0.85;
          }
        }

        /* ---------- celebration + level ---------- */
        .toast {
          animation: toastIn 3.8s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
        }
        @keyframes toastIn {
          0% {
            transform: translate(-50%, 120px) scale(0.8);
            opacity: 0;
          }
          10% {
            transform: translate(-50%, 0) scale(1.05);
            opacity: 1;
          }
          14% {
            transform: translate(-50%, 0) scale(1);
          }
          88% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, 40px) scale(0.9);
            opacity: 0;
          }
        }
        .level-pop {
          display: inline-block;
          animation: starPop 0.7s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column: fixed header, scrolling body, cards flow into a multi-column grid
// ---------------------------------------------------------------------------
function Column({
  col,
  tickets,
  now,
  exitingIds,
  enteringIds,
  flashIds,
  onAdvance,
}) {
  const k = useKitchenText();
  const meta = COLUMN_META[col];
  const text = k.columns[col];
  return (
    <section
      className="flex min-h-0 flex-col rounded-3xl p-2.5 md:p-3"
      style={{
        background: `${meta.panel}F2`,
        boxShadow: `0 4px 0 ${meta.soft}`,
      }}
      aria-label={text.label}
    >
      <div className="mb-2.5 flex shrink-0 items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span
            className="grid h-9 w-9 place-items-center rounded-xl text-lg"
            style={{ background: "#fff", boxShadow: `0 2px 0 ${meta.soft}` }}
            aria-hidden="true"
          >
            {meta.emoji}
          </span>
          <div className="leading-tight">
            <h2
              className="font-display text-lg font-extrabold"
              style={{ color: meta.deep }}
            >
              {text.label}
            </h2>
            <p className="text-xs font-bold" style={{ color: INK_SOFT }}>
              {tickets.length
                ? k.oldestWaiting.replace(
                    "{time}",
                    formatElapsed(secsSince(tickets[0].created_at, now)),
                  )
                : text.hint}
            </p>
          </div>
        </div>
        <span
          className="grid h-9 min-w-9 place-items-center rounded-full px-2 font-display text-lg font-extrabold tabular-nums text-white"
          style={{ background: meta.accent, boxShadow: `0 2px 0 ${meta.deep}` }}
        >
          {tickets.length}
        </span>
      </div>

      <div className="kds-scroll min-h-0 flex-1 overflow-y-auto p-1 pe-1.5">
        <div
          className="grid gap-2.5"
          style={{
            gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          }}
        >
          {tickets.map((t) => (
            <TicketCard
              key={t.id}
              ticket={t}
              now={now}
              isExiting={exitingIds.has(t.id)}
              isEntering={enteringIds.has(t.id)}
              isFlashing={flashIds.has(t.id)}
              onAdvance={() => onAdvance(t)}
            />
          ))}
        </div>
        {tickets.length === 0 && (
          <div
            className="rounded-2xl border-[3px] border-dashed py-8 text-center"
            style={{ borderColor: meta.soft, color: meta.deep }}
          >
            <span className="empty-bounce text-3xl" aria-hidden="true">
              {meta.emoji}
            </span>
            <p className="mt-1 font-display text-base font-bold">
              {k.allClearHere}
            </p>
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Ticket card (compact)
// ---------------------------------------------------------------------------
const CONFETTI = [
  { tx: "-36px", ty: "-28px", r: "-70deg", c: "#FFB02E" },
  { tx: "32px", ty: "-34px", r: "80deg", c: "#34C98E" },
  { tx: "-40px", ty: "12px", r: "-40deg", c: "#FF7BA5" },
  { tx: "40px", ty: "10px", r: "60deg", c: "#8B5CF6" },
  { tx: "-12px", ty: "-40px", r: "20deg", c: "#5BB8F5" },
  { tx: "16px", ty: "-42px", r: "-30deg", c: "#FFB02E" },
];

function TicketCard({
  ticket,
  now,
  isExiting,
  isEntering,
  isFlashing,
  onAdvance,
}) {
  const k = useKitchenText();
  const secs = secsSince(ticket.created_at, now);
  const heat = heatLevel(secs);
  const h = HEAT[heat];
  const meta = COLUMN_META[ticket.status];
  const ActionIcon = ACTION_ICON[ticket.status];
  const isUrgent = heat === "urgent";
  const isNew = secs < 60 && ticket.status === "queued";

  const categoryLabel = ticket.order.table_number
    ? k.table.replace("{n}", ticket.order.table_number)
    : ticket.order.order_type || k.takeaway;
  const progressPct = Math.min(100, (secs / (URGENT_THRESHOLD * 60)) * 100);

  return (
    <article
      className={`relative overflow-hidden rounded-2xl bg-white ${isEntering ? "card-enter" : ""} ${isExiting ? "card-exit" : ""} ${isFlashing ? "card-flash" : ""} ${isUrgent && !isExiting ? "urgent-glow" : ""}`}
      style={{
        boxShadow: `0 3px 0 ${meta.soft}, 0 6px 10px -6px rgba(58,39,80,0.2)`,
      }}
    >
      <div className="h-1.5 w-full bg-[#F1EBFF]">
        <div
          className="progress-fill h-full rounded-e-full"
          style={{ width: `${progressPct}%`, background: h.bar }}
        />
      </div>

      {isExiting && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {CONFETTI.map((c, i) => (
            <span
              key={i}
              className="confetti-piece absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
              style={{
                "--tx": c.tx,
                "--ty": c.ty,
                "--r": c.r,
                background: c.c,
                animationDelay: `${i * 35}ms`,
              }}
            />
          ))}
        </div>
      )}

      <div className="p-2.5">
        <div className="mb-2 flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span
                dir="ltr"
                className="inline-block font-display  font-extrabold leading-none tabular-nums"
              >
                #{ticket.order.order_number}
              </span>
              {isNew && (
                <span
                  className="rounded-full px-1.5 py-px text-[10px] font-extrabold text-white"
                  style={{ background: meta.accent }}
                >
                  {k.new}
                </span>
              )}
              {isUrgent && (
                <span className="rounded-full bg-[#FF4F5E] px-1.5 py-px text-[10px] font-extrabold text-white">
                  {k.late}
                </span>
              )}
            </div>
            <p
              className="mt-0.5 truncate text-xs font-bold"
              style={{ color: INK_SOFT }}
            >
              {categoryLabel}
              {ticket.prep_station ? ` · ${ticket.prep_station}` : ""}
            </p>
          </div>
          <span
            className="flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-sm font-extrabold tabular-nums"
            style={{ background: h.bg, color: h.fg }}
          >
            <ClockIcon className="h-3.5 w-3.5" />
            {formatElapsed(secs)}
            <span aria-hidden="true">{h.face}</span>
          </span>
        </div>

        <ul className="mb-2 space-y-1.5">
          {ticket.items.map((item) => (
            <li key={item.order_item_id} className="flex items-start gap-1.5">
              <span
                className="grid h-6 min-w-8 place-items-center rounded-lg px-1.5 font-display text-sm font-extrabold tabular-nums"
                style={{ background: meta.soft, color: meta.deep }}
              >
                {item.quantity}×
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-extrabold leading-tight">
                  {item.name}
                </p>
                {item.notes && (
                  <p className="mt-0.5 inline-block rounded-md bg-[#FFF1BF] px-1.5 text-xs font-bold leading-snug text-[#7A4200]">
                    📝 {item.notes}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {ticket.order.notes && (
          <p
            className="mb-2 line-clamp-2 rounded-lg bg-[#F6F0FF] px-2 py-1 text-xs font-semibold"
            style={{ color: INK_SOFT }}
            title={ticket.order.notes}
          >
            💬 {ticket.order.notes}
          </p>
        )}

        <button
          onClick={onAdvance}
          className="action-btn flex w-full items-center justify-center gap-1.5 rounded-xl py-1.5 font-display text-base font-extrabold text-white focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-2"
          style={{
            background: meta.accent,
            outlineColor: meta.accent,
            "--deep": meta.deep,
          }}
        >
          <ActionIcon className="h-4 w-4 rtl:-scale-x-100" />
          {k.actions[ticket.status]}
        </button>
      </div>
    </article>
  );
}
