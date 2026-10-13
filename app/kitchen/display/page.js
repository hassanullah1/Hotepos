"use client";

import { useEffect, useState, useCallback, useRef, useMemo } from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

// ---------------------------------------------------------------------------
// Status machine
// ---------------------------------------------------------------------------
const NEXT_STATUS = {
  queued: "preparing",
  preparing: "ready",
  ready: "served",
};
const NEXT_LABEL = {
  queued: "Fire ticket",
  preparing: "Order up",
  ready: "Bump",
};

const COLUMN_META = {
  queued: { label: "New", accent: "#C9A227" },
  preparing: { label: "Firing", accent: "#E6C25E" },
  ready: { label: "Up", accent: "#7BD8B4" },
};

const URGENT_THRESHOLD = 15;
const WARN_THRESHOLD = 8;

// ---------------------------------------------------------------------------
// Icons
// ---------------------------------------------------------------------------
const Icon = ({ d, ...props }) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
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
const BellIcon = (p) => (
  <Icon
    d="M6 8a6 6 0 1 1 12 0v4l1.7 2.9A1 1 0 0 1 18.9 17H5.1a1 1 0 0 1-.8-2.1L6 12V8Zm3.5 12a2.5 2.5 0 0 0 5 0"
    {...p}
  />
);
const SendIcon = (p) => <Icon d="M4 12h14M13 6l6 6-6 6" {...p} />;
const TicketIcon = (p) => (
  <Icon
    d="M3 9a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v1a2 2 0 0 0 0 4v1a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-1a2 2 0 0 0 0-4V9Z"
    {...p}
  />
);
const ExpandIcon = (p) => (
  <Icon d="M4 9V4h5M4 15v5h5M20 9V4h-5M20 15v5h-5" {...p} />
);
const CollapseIcon = (p) => (
  <Icon d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5" {...p} />
);

const COLUMN_ICON = {
  queued: TicketIcon,
  preparing: FlameIcon,
  ready: BellIcon,
};
const ACTION_ICON = { queued: FlameIcon, preparing: SendIcon, ready: SendIcon };

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function formatElapsed(secs) {
  if (secs < 60) return `${secs}s`;
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}
function heatLevel(secs) {
  const mins = secs / 60;
  if (mins >= URGENT_THRESHOLD) return "urgent";
  if (mins >= WARN_THRESHOLD) return "warn";
  return "calm";
}
const HEAT_COLOR = { calm: "#C9A227", warn: "#E6C25E", urgent: "#F87171" };

// ---------------------------------------------------------------------------
// Rich animated background
// ---------------------------------------------------------------------------
function AnimatedBackdrop() {
  const { gridCells, particles, embers } = useMemo(() => {
    const occupied = new Set([4, 11, 19, 27, 33, 42, 50, 58]);
    const pulses = new Set([15, 35]);
    const cells = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const i = row * 8 + col;
        cells.push({
          key: i,
          x: 20 + col * 40,
          y: 20 + row * 40,
          fill: occupied.has(i) || pulses.has(i) ? "#C9A227" : "transparent",
          opacity: occupied.has(i) ? 0.9 : pulses.has(i) ? 1 : 0,
          pulse: pulses.has(i),
        });
      }
    }

    let seed = 11;
    const rnd = () => {
      seed = (seed * 9301 + 49297) % 233280;
      return seed / 233280;
    };
    const dust = [];
    for (let i = 0; i < 34; i++) {
      dust.push({
        left: rnd() * 100,
        top: rnd() * 100,
        size: 1 + rnd() * 2.4,
        delay: -rnd() * 24,
        duration: 18 + rnd() * 26,
        opacity: 0.12 + rnd() * 0.5,
        drift: rnd() * 40 - 20,
      });
    }

    const emberList = [];
    for (let i = 0; i < 14; i++) {
      emberList.push({
        left: rnd() * 100,
        delay: rnd() * 22,
        duration: 14 + rnd() * 12,
        size: 2 + rnd() * 3,
        hue: rnd() > 0.55 ? "#E6C25E" : "#C9A227",
      });
    }

    return { gridCells: cells, particles: dust, embers: emberList };
  }, []);

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    >
      <div className="absolute inset-0 bg-[#15121C]" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(110% 80% at 15% 10%, rgba(201,162,39,0.10) 0%, transparent 55%)," +
            "radial-gradient(90% 70% at 90% 85%, rgba(120,90,220,0.10) 0%, transparent 60%)," +
            "radial-gradient(80% 60% at 50% 50%, rgba(30,180,180,0.05) 0%, transparent 70%)",
        }}
      />

      <div
        className="aurora-blob"
        style={{
          width: 620,
          height: 620,
          left: "-14%",
          top: "-22%",
          background:
            "radial-gradient(circle, rgba(201,162,39,0.30), transparent 65%)",
          animation: "drift1 30s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 700,
          height: 700,
          right: "-18%",
          top: "-14%",
          background:
            "radial-gradient(circle, rgba(120,90,220,0.22), transparent 65%)",
          animation: "drift2 38s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 820,
          height: 820,
          left: "15%",
          bottom: "-32%",
          background:
            "radial-gradient(circle, rgba(230,194,94,0.22), transparent 65%)",
          animation: "drift3 44s ease-in-out infinite",
        }}
      />
      <div
        className="aurora-blob"
        style={{
          width: 540,
          height: 540,
          right: "5%",
          bottom: "-22%",
          background:
            "radial-gradient(circle, rgba(30,180,180,0.16), transparent 65%)",
          animation: "drift4 50s ease-in-out infinite",
        }}
      />

      <svg
        className="floor-drift absolute inset-0 h-[115%] w-full"
        viewBox="0 0 320 320"
        preserveAspectRatio="xMidYMid slice"
        style={{ opacity: 0.32 }}
      >
        {gridCells.map((c) => (
          <rect
            key={c.key}
            x={c.x}
            y={c.y}
            width="22"
            height="22"
            rx="5"
            fill={c.fill}
            fillOpacity={c.opacity}
            stroke={c.opacity ? "none" : "rgba(200,180,140,0.18)"}
            strokeWidth="1"
            className={c.pulse ? "table-pulse" : undefined}
          />
        ))}
      </svg>

      <svg
        className="absolute bottom-0 left-0 right-0 h-[42%] w-full"
        viewBox="0 0 1200 400"
        preserveAspectRatio="none"
        style={{ opacity: 0.18 }}
      >
        <defs>
          <linearGradient id="floorFade" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#C9A227" stopOpacity="0" />
            <stop offset="55%" stopColor="#C9A227" stopOpacity="0.7" />
            <stop offset="100%" stopColor="#C9A227" stopOpacity="0" />
          </linearGradient>
          <pattern
            id="floorGrid"
            width="70"
            height="30"
            patternUnits="userSpaceOnUse"
          >
            <path
              d="M 70 0 L 0 0 0 30"
              fill="none"
              stroke="url(#floorFade)"
              strokeWidth="0.7"
            />
          </pattern>
        </defs>
        <rect
          width="1200"
          height="400"
          fill="url(#floorGrid)"
          className="grid-scroll"
        />
      </svg>

      {particles.map((p, i) => (
        <span
          key={`dust-${i}`}
          className="dust-particle"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: `${p.size}px`,
            height: `${p.size}px`,
            opacity: p.opacity,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.duration}s`,
            "--drift": `${p.drift}px`,
            background: "#F5E7B0",
            boxShadow: "0 0 6px rgba(245,231,176,0.7)",
          }}
        />
      ))}

      {embers.map((e, i) => (
        <span
          key={`ember-${i}`}
          className="ember"
          style={{
            left: `${e.left}%`,
            animationDelay: `${e.delay}s`,
            animationDuration: `${e.duration}s`,
            width: `${e.size}px`,
            height: `${e.size}px`,
            background: e.hue,
            boxShadow: `0 0 10px ${e.hue}, 0 0 20px ${e.hue}66`,
          }}
        />
      ))}

      <div className="light-sweep absolute inset-0" />

      <div
        className="absolute inset-0"
        style={{
          background:
            "radial-gradient(120% 90% at 15% 15%, rgba(21,18,28,0.35) 0%, rgba(21,18,28,0.85) 55%, rgba(21,18,28,0.97) 100%)",
        }}
      />

      <div className="noise-layer absolute inset-0" />
      <div className="scanlines absolute inset-0" />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
export default function KitchenDisplayPage() {
  const router = useRouter();
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [now, setNow] = useState(Date.now());
  const [exitingIds, setExitingIds] = useState(() => new Set());
  const [enteringIds, setEnteringIds] = useState(() => new Set());
  const [flashIds, setFlashIds] = useState(() => new Set());
  const [isFullscreen, setIsFullscreen] = useState(false);
  const busyIds = useRef(new Set());
  const knownIdsRef = useRef(new Set());

  function handle401(res) {
    if (res.status === 401) {
      router.push("/login");
      return true;
    }
    return false;
  }

  // ---------- Fullscreen ----------
  useEffect(() => {
    function onChange() {
      setIsFullscreen(
        !!document.fullscreenElement ||
          !!document.webkitFullscreenElement ||
          !!document.mozFullScreenElement ||
          !!document.msFullscreenElement,
      );
    }
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    document.addEventListener("mozfullscreenchange", onChange);
    document.addEventListener("MSFullscreenChange", onChange);
    onChange();
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
      document.removeEventListener("mozfullscreenchange", onChange);
      document.removeEventListener("MSFullscreenChange", onChange);
    };
  }, []);

  async function toggleFullscreen() {
    try {
      const el = document.documentElement;
      if (
        !document.fullscreenElement &&
        !document.webkitFullscreenElement &&
        !document.mozFullScreenElement &&
        !document.msFullscreenElement
      ) {
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
      // Some browsers block fullscreen without a user gesture — ignore
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
        setError(data.error || "Failed to load tickets");
        return;
      }
      setError("");
      const list = data.tickets || [];
      const incoming = new Set(list.map((t) => t.id));
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
      knownIdsRef.current = incoming;
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
    const clock = setInterval(() => setNow(Date.now()), 1000);
    return () => {
      clearInterval(poll);
      clearInterval(clock);
    };
  }, [loadTickets]);

  async function advance(ticket) {
    const next = NEXT_STATUS[ticket.status];
    if (!next || busyIds.current.has(ticket.id)) return;
    busyIds.current.add(ticket.id);

    setFlashIds((prev) => new Set(prev).add(ticket.id));
    setTimeout(() => {
      setFlashIds((prev) => {
        const s = new Set(prev);
        s.delete(ticket.id);
        return s;
      });
    }, 500);

    if (next === "served") {
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
      if (!res.ok) loadTickets();
    } catch {
      loadTickets();
    } finally {
      busyIds.current.delete(ticket.id);
    }
  }

  const columns = useMemo(
    () => ({
      queued: tickets.filter((t) => t.status === "queued"),
      preparing: tickets.filter((t) => t.status === "preparing"),
      ready: tickets.filter((t) => t.status === "ready"),
    }),
    [tickets],
  );

  const totalActive = tickets.length;

  return (
    <div className="relative min-h-screen overflow-hidden text-[#F0EAE2]">
      <AnimatedBackdrop />

      <div className="relative z-10 px-6 py-6 md:px-10 md:py-8">
        {/* Header */}
        <header className="flex items-center justify-between mb-8 gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#2E2938] bg-[#1E1B26]/80 backdrop-blur">
                <FlameIcon className="h-5 w-5 text-[#C9A227] flame-flicker" />
              </div>
              {totalActive > 0 && (
                <span className="absolute -top-1 -right-1 grid h-4 min-w-4 px-1 place-items-center rounded-full bg-[#C9A227] text-[9px] font-bold text-[#1D1707] pulse-ring">
                  {totalActive}
                </span>
              )}
            </div>
            <div>
              <div className="flex items-baseline gap-3">
                <h1
                  className="text-3xl md:text-4xl italic font-medium tracking-tight text-[#F0EAE2]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  Kitchen
                </h1>
                <span
                  className="text-[11px] uppercase tracking-[0.35em] text-[#C9A227] not-italic"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  SERVICE
                </span>
              </div>
              <div
                className="mt-1 flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-[#9691A6]"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                <span className="status-dot inline-block h-1.5 w-1.5 rounded-full bg-[#C9A227]" />
                LIVE ·{" "}
                {new Date(now).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                  second: "2-digit",
                })}
                {totalActive > 0 && (
                  <>
                    {" · "}
                    <span className="text-[#C9A227]">{totalActive} active</span>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {error && (
              <div className="rounded-xl border-l-4 border-[#E5484D] bg-[#E5484D]/10 px-3 py-2 text-sm text-[#FF9B9E] slide-down">
                {error}
              </div>
            )}

            {/* Fullscreen toggle */}
            <button
              onClick={toggleFullscreen}
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              className="group relative grid h-11 w-11 place-items-center rounded-2xl border border-[#2E2938] bg-[#1E1B26]/80 backdrop-blur transition-colors hover:border-[#C9A227] hover:bg-[#C9A227]/10"
            >
              {isFullscreen ? (
                <CollapseIcon className="h-4 w-4 text-[#C9A227] transition-transform group-hover:scale-110" />
              ) : (
                <ExpandIcon className="h-4 w-4 text-[#C9A227] transition-transform group-hover:scale-110" />
              )}
              <span className="pointer-events-none absolute -bottom-8 right-0 whitespace-nowrap rounded-md border border-[#2E2938] bg-[#1E1B26]/95 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-[#B7B2C4] opacity-0 transition-opacity group-hover:opacity-100">
                {isFullscreen ? "Exit" : "Fullscreen"}
              </span>
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[0, 1, 2].map((i) => (
              <div key={i} className="space-y-3">
                <div className="h-7 rounded bg-[#1E1B26]/70 shimmer" />
                <div className="h-40 rounded-2xl bg-[#1E1B26]/70 shimmer" />
                <div className="h-40 rounded-2xl bg-[#1E1B26]/70 shimmer" />
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

      <style jsx global>{`
        /* ---------- Background: aurora blobs ---------- */
        .aurora-blob {
          position: absolute;
          border-radius: 9999px;
          filter: blur(90px);
          opacity: 0.55;
          will-change: transform;
        }
        @keyframes drift1 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(120px, 80px) scale(1.15);
          }
        }
        @keyframes drift2 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-140px, 100px) scale(1.1);
          }
        }
        @keyframes drift3 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(80px, -110px) scale(1.08);
          }
        }
        @keyframes drift4 {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-100px, -70px) scale(1.12);
          }
        }

        /* ---------- Background: table grid drift ---------- */
        .floor-drift {
          animation: floorDrift 50s linear infinite;
        }
        @keyframes floorDrift {
          0% {
            transform: translateY(0) scale(1.02);
          }
          100% {
            transform: translateY(-3%) scale(1.02);
          }
        }
        .table-pulse {
          animation: tablePulse 2.2s ease-in-out infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes tablePulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.4;
          }
        }

        /* ---------- Background: perspective grid ---------- */
        .grid-scroll {
          animation: gridScroll 26s linear infinite;
        }
        @keyframes gridScroll {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(30px);
          }
        }

        /* ---------- Background: dust particles ---------- */
        .dust-particle {
          position: absolute;
          border-radius: 9999px;
          animation-name: dustFloat;
          animation-timing-function: ease-in-out;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @keyframes dustFloat {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(var(--drift, 20px), -36px, 0);
          }
        }

        /* ---------- Background: rising embers ---------- */
        .ember {
          position: absolute;
          bottom: -10px;
          border-radius: 9999px;
          animation-name: emberRise;
          animation-timing-function: linear;
          animation-iteration-count: infinite;
          will-change: transform, opacity;
        }
        @keyframes emberRise {
          0% {
            transform: translateY(0) translateX(0) scale(1);
            opacity: 0;
          }
          10% {
            opacity: 0.9;
          }
          80% {
            opacity: 0.7;
          }
          100% {
            transform: translateY(-105vh) translateX(24px) scale(0.4);
            opacity: 0;
          }
        }

        /* ---------- Background: light sweep ---------- */
        .light-sweep {
          background: linear-gradient(
            115deg,
            transparent 0%,
            transparent 40%,
            rgba(201, 162, 39, 0.06) 50%,
            transparent 60%,
            transparent 100%
          );
          background-size: 300% 100%;
          animation: lightSweep 14s ease-in-out infinite;
          mix-blend-mode: screen;
        }
        @keyframes lightSweep {
          0% {
            background-position: 200% 0;
          }
          50% {
            background-position: -100% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }

        /* ---------- Background: noise + scanlines ---------- */
        .noise-layer {
          opacity: 0.05;
          mix-blend-mode: overlay;
          background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='200' height='200'><filter id='n'><feTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' stitchTiles='stitch'/><feColorMatrix values='0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 0.5 0'/></filter><rect width='100%25' height='100%25' filter='url(%23n)'/></svg>");
        }
        .scanlines {
          background-image: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.025) 0px,
            rgba(255, 255, 255, 0.025) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: overlay;
          opacity: 0.45;
        }

        /* ---------- Status dot ---------- */
        .status-dot {
          animation: statusPulse 2.4s ease-in-out infinite;
        }
        @keyframes statusPulse {
          0%,
          100% {
            opacity: 1;
            box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.55);
          }
          50% {
            opacity: 0.6;
            box-shadow: 0 0 0 4px rgba(201, 162, 39, 0);
          }
        }

        /* ---------- Pulse ring ---------- */
        @keyframes pulseRing {
          0% {
            box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(201, 162, 39, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(201, 162, 39, 0);
          }
        }
        .pulse-ring {
          animation: pulseRing 2s ease-out infinite;
        }

        /* ---------- Shimmer ---------- */
        @keyframes shimmer {
          0% {
            background-position: -400px 0;
          }
          100% {
            background-position: 400px 0;
          }
        }
        .shimmer {
          background: linear-gradient(
            90deg,
            rgba(255, 255, 255, 0.02) 0%,
            rgba(255, 255, 255, 0.06) 50%,
            rgba(255, 255, 255, 0.02) 100%
          );
          background-size: 800px 100%;
          animation: shimmer 1.6s linear infinite;
        }

        /* ---------- Card animations ---------- */
        @keyframes dropIn {
          0% {
            opacity: 0;
            transform: translateY(-24px) scale(0.94);
          }
          55% {
            opacity: 1;
            transform: translateY(4px) scale(1.02);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .card-enter {
          animation: dropIn 520ms cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        @keyframes cardExit {
          0% {
            transform: scale(1);
            opacity: 1;
          }
          30% {
            transform: scale(1.05);
            opacity: 1;
          }
          100% {
            transform: scale(0.8) translateY(-30px);
            opacity: 0;
          }
        }
        .card-exit {
          animation: cardExit 620ms cubic-bezier(0.4, 0, 0.6, 1) forwards;
          pointer-events: none;
        }

        @keyframes cardFlash {
          0% {
            box-shadow: 0 0 0 0 rgba(201, 162, 39, 0.55);
          }
          100% {
            box-shadow: 0 0 0 20px rgba(201, 162, 39, 0);
          }
        }
        .card-flash {
          animation: cardFlash 500ms ease-out;
        }

        @keyframes urgentShake {
          0%,
          100% {
            transform: translateX(0);
          }
          20% {
            transform: translateX(-2px);
          }
          40% {
            transform: translateX(2px);
          }
          60% {
            transform: translateX(-1.5px);
          }
          80% {
            transform: translateX(1.5px);
          }
        }
        .shake-urgent {
          animation: urgentShake 0.6s ease-in-out infinite;
        }

        @keyframes urgentGlow {
          0%,
          100% {
            box-shadow:
              0 0 0 1px rgba(248, 113, 113, 0.5),
              0 0 20px -6px rgba(248, 113, 113, 0.5);
          }
          50% {
            box-shadow:
              0 0 0 1px rgba(248, 113, 113, 0.9),
              0 0 30px -4px rgba(248, 113, 113, 0.9);
          }
        }
        .urgent-glow {
          animation: urgentGlow 1.6s ease-in-out infinite;
        }

        @keyframes steam {
          0% {
            transform: translateY(6px) scale(0.85);
            opacity: 0;
          }
          20% {
            opacity: 0.55;
          }
          100% {
            transform: translateY(-20px) scale(1.15);
            opacity: 0;
          }
        }
        .steam-wisp {
          position: absolute;
          font-size: 13px;
          color: rgba(240, 234, 226, 0.5);
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

        .action-btn {
          transition:
            transform 160ms cubic-bezier(0.34, 1.56, 0.64, 1),
            filter 150ms ease;
        }
        .action-btn:hover {
          transform: translateY(-1px);
          filter: brightness(1.08);
        }
        .action-btn:active {
          transform: scale(0.97);
        }

        .progress-fill {
          transition:
            width 1s linear,
            background-color 0.6s ease;
        }
        .progress-striped {
          background-image: linear-gradient(
            45deg,
            rgba(255, 255, 255, 0.14) 25%,
            transparent 25%,
            transparent 50%,
            rgba(255, 255, 255, 0.14) 50%,
            rgba(255, 255, 255, 0.14) 75%,
            transparent 75%,
            transparent
          );
          background-size: 12px 12px;
          animation: stripeMove 1s linear infinite;
        }
        @keyframes stripeMove {
          from {
            background-position: 0 0;
          }
          to {
            background-position: 12px 0;
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

        /* ---------- Reduced motion ---------- */
        @media (prefers-reduced-motion: reduce) {
          .aurora-blob,
          .floor-drift,
          .table-pulse,
          .grid-scroll,
          .dust-particle,
          .ember,
          .light-sweep,
          .status-dot,
          .pulse-ring,
          .card-enter,
          .card-exit,
          .card-flash,
          .shake-urgent,
          .urgent-glow,
          .steam-wisp,
          .confetti-piece,
          .shimmer,
          .progress-striped,
          .flame-flicker {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Column
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
  const meta = COLUMN_META[col];
  const Icon = COLUMN_ICON[col];
  const count = tickets.length;

  return (
    <section>
      <div className="flex items-center justify-between mb-3">
        <div
          className="flex items-center gap-2 text-[11px] uppercase tracking-[0.25em] text-[#B7B2C4]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          <span
            className="inline-block h-1.5 w-1.5 rounded-full"
            style={{ background: meta.accent }}
          />
          <Icon className="h-3.5 w-3.5" style={{ color: meta.accent }} />
          <span style={{ color: meta.accent }}>{meta.label}</span>
        </div>
        <span
          className="text-[11px] tabular-nums text-[#9691A6]"
          style={{ fontFamily: "var(--font-geist-mono)" }}
        >
          {String(count).padStart(2, "0")}
        </span>
      </div>

      <div
        className="mb-4 h-px"
        style={{
          background: `linear-gradient(90deg, ${meta.accent}80 0%, transparent 100%)`,
        }}
      />

      <div className="space-y-3">
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
        {count === 0 && (
          <div className="rounded-2xl border border-dashed border-[#2E2938] py-10 text-center text-[11px] uppercase tracking-[0.2em] text-[#5E5670]">
            Empty
          </div>
        )}
      </div>
    </section>
  );
}

// ---------------------------------------------------------------------------
// Ticket card
// ---------------------------------------------------------------------------
function TicketCard({
  ticket,
  now,
  isExiting,
  isEntering,
  isFlashing,
  onAdvance,
}) {
  const secs = Math.max(
    0,
    Math.floor((now - new Date(ticket.created_at).getTime()) / 1000),
  );
  const heat = heatLevel(secs);
  const meta = COLUMN_META[ticket.status];
  const ActionIcon = ACTION_ICON[ticket.status];

  const categoryLabel = ticket.order.table_number
    ? `Table ${ticket.order.table_number}`
    : ticket.order.order_type || "Takeaway";

  const progressPct = Math.min(100, (secs / (URGENT_THRESHOLD * 60)) * 100);
  const progressColor = HEAT_COLOR[heat];

  const isNew = secs < 60;
  const isUrgent = heat === "urgent";

  return (
    <article
      className={`relative overflow-hidden rounded-2xl border bg-[#1E1B26]/85 backdrop-blur-md transition-shadow
        ${isEntering ? "card-enter" : ""}
        ${isExiting ? "card-exit" : ""}
        ${isFlashing ? "card-flash" : ""}
        ${isUrgent && !isExiting ? "shake-urgent" : ""}
        ${isUrgent && !isExiting ? "urgent-glow" : ""}
      `}
      style={{
        borderColor: isUrgent ? "rgba(248,113,113,0.5)" : "#2E2938",
      }}
    >
      <div className="h-0.5 w-full bg-[#2E2938]">
        <div
          className={`h-full progress-fill ${
            heat !== "calm" ? "progress-striped" : ""
          }`}
          style={{ width: `${progressPct}%`, background: progressColor }}
        />
      </div>

      {ticket.status === "preparing" && !isExiting && (
        <>
          <span
            className="steam-wisp"
            style={{ top: -4, right: 24, animationDelay: "0ms" }}
          >
            ~
          </span>
          <span
            className="steam-wisp"
            style={{ top: -4, right: 40, animationDelay: "1s" }}
          >
            ~
          </span>
        </>
      )}

      {isExiting && (
        <div className="pointer-events-none absolute inset-0" aria-hidden>
          {[
            { tx: "-40px", ty: "-30px", r: "-70deg", c: "#C9A227" },
            { tx: "34px", ty: "-38px", r: "80deg", c: "#E6C25E" },
            { tx: "-46px", ty: "14px", r: "-40deg", c: "#F5E7B0" },
            { tx: "46px", ty: "10px", r: "60deg", c: "#7BD8B4" },
            { tx: "-14px", ty: "-46px", r: "20deg", c: "#F5E7B0" },
            { tx: "18px", ty: "-50px", r: "-30deg", c: "#C9A227" },
          ].map((c, i) => (
            <span
              key={i}
              className="confetti-piece absolute left-1/2 top-1/2 h-2 w-2 rounded-sm"
              style={{
                "--tx": c.tx,
                "--ty": c.ty,
                "--r": c.r,
                background: c.c,
                animationDelay: `${i * 40}ms`,
              }}
            />
          ))}
        </div>
      )}

      <div className="p-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-lg font-semibold tabular-nums text-[#F0EAE2]"
                style={{ fontFamily: "var(--font-geist-mono)" }}
              >
                #{ticket.order.order_number}
              </span>
              {isNew && ticket.status === "queued" && (
                <span
                  className="text-[10px] uppercase tracking-[0.2em] text-[#C9A227]"
                  style={{ fontFamily: "var(--font-geist-mono)" }}
                >
                  · NEW
                </span>
              )}
            </div>
            <div
              className="mt-1 flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-[#9691A6]"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              <span>{categoryLabel}</span>
              {ticket.prep_station && (
                <>
                  <span className="opacity-40">·</span>
                  <span>{ticket.prep_station}</span>
                </>
              )}
            </div>
          </div>
          <span
            className="shrink-0 tabular-nums text-xs"
            style={{
              fontFamily: "var(--font-geist-mono)",
              color: isUrgent ? "#FF9B9E" : "#B7B2C4",
            }}
          >
            {formatElapsed(secs)}
          </span>
        </div>

        <ul className="space-y-2 mb-4">
          {ticket.items.map((item) => (
            <li key={item.order_item_id} className="flex items-start gap-2.5">
              <span
                className="mt-0.5 inline-flex min-w-7 h-6 items-center justify-center rounded-md border px-1.5 text-xs font-semibold tabular-nums"
                style={{
                  fontFamily: "var(--font-geist-mono)",
                  borderColor: `${meta.accent}40`,
                  color: meta.accent,
                  background: `${meta.accent}14`,
                }}
              >
                {item.quantity}×
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-[15px] leading-snug text-[#F0EAE2]">
                  {item.name}
                </p>
                {item.notes && (
                  <p
                    className="mt-0.5 text-xs italic text-[#C9A227]"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {item.notes}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ul>

        {ticket.order.notes && (
          <div className="mb-3 border-l-2 border-[#C9A227]/60 pl-2.5 text-xs italic text-[#B7B2C4]">
            {ticket.order.notes}
          </div>
        )}

        <button
          onClick={onAdvance}
          className="action-btn w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-[12px] font-semibold uppercase tracking-[0.15em] text-[#1D1707]"
          style={{
            fontFamily: "var(--font-geist-mono)",
            background: `linear-gradient(90deg, ${meta.accent} 0%, ${meta.accent}cc 100%)`,
          }}
        >
          <ActionIcon className="h-3.5 w-3.5" />
          {NEXT_LABEL[ticket.status]}
        </button>
      </div>
    </article>
  );
}
