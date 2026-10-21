"use client";

import { useEffect, useRef, useState } from "react";

const TILE_COUNT = 9;
const ROUND_SECONDS = 30;
const DOT_LIFETIME_MS = 1400;

export default function OfflineGame() {
  const [gameState, setGameState] = useState("idle"); // idle | playing | finished
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(0);
  const [timeLeft, setTimeLeft] = useState(ROUND_SECONDS);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [wrongFlash, setWrongFlash] = useState(-1);
  const [rightFlash, setRightFlash] = useState(-1);
  const [dotKey, setDotKey] = useState(0);
  const [isNewBest, setIsNewBest] = useState(false);

  const gameStateRef = useRef("idle");
  const scoreRef = useRef(0);
  const activeRef = useRef(-1);
  const tickRef = useRef(null);
  const dotTimeoutRef = useRef(null);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    scoreRef.current = score;
  }, [score]);

  useEffect(() => {
    activeRef.current = activeIndex;
  }, [activeIndex]);

  // Load best score + cleanup on unmount
  useEffect(() => {
    try {
      const b = parseInt(localStorage.getItem("offline_game_best") || "0", 10);
      if (Number.isFinite(b)) setBest(b);
    } catch {}
    return () => {
      clearInterval(tickRef.current);
      clearTimeout(dotTimeoutRef.current);
    };
  }, []);

  function moveDot() {
    let next = Math.floor(Math.random() * TILE_COUNT);
    let attempts = 0;
    while (next === activeRef.current && attempts < 20) {
      next = Math.floor(Math.random() * TILE_COUNT);
      attempts++;
    }
    setActiveIndex(next);
    activeRef.current = next;
    setDotKey((k) => k + 1);

    clearTimeout(dotTimeoutRef.current);
    dotTimeoutRef.current = setTimeout(() => {
      if (gameStateRef.current === "playing") {
        moveDot();
      }
    }, DOT_LIFETIME_MS);
  }

  function startGame() {
    setScore(0);
    scoreRef.current = 0;
    setTimeLeft(ROUND_SECONDS);
    setGameState("playing");
    gameStateRef.current = "playing";
    setIsNewBest(false);

    moveDot();

    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(tickRef.current);
          clearTimeout(dotTimeoutRef.current);
          setActiveIndex(-1);
          activeRef.current = -1;
          setGameState("finished");
          gameStateRef.current = "finished";

          const finalScore = scoreRef.current;
          try {
            const b = parseInt(
              localStorage.getItem("offline_game_best") || "0",
              10,
            );
            if (finalScore > b) {
              localStorage.setItem("offline_game_best", String(finalScore));
              setBest(finalScore);
              setIsNewBest(true);
            }
          } catch {}

          return 0;
        }
        return t - 1;
      });
    }, 1000);
  }

  function tapTile(index) {
    if (gameStateRef.current !== "playing") return;
    if (index === activeRef.current) {
      setScore((s) => s + 1);
      setRightFlash(index);
      setTimeout(() => setRightFlash(-1), 180);
      clearTimeout(dotTimeoutRef.current);
      moveDot();
    } else {
      setWrongFlash(index);
      setTimeout(() => setWrongFlash(-1), 200);
    }
  }

  const timerPct = (timeLeft / ROUND_SECONDS) * 100;

  return (
    <div className="w-full max-w-sm rounded-2xl border border-[#2E2938] bg-[#1B1823] p-5 shadow-2xl shadow-black/40">
      {/* Stats row */}
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6E687A]">
            Score
          </p>
          <p
            className="text-2xl font-bold tabular-nums text-[#E0B93A]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {score}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6E687A]">
            Best
          </p>
          <p className="text-base font-semibold tabular-nums text-[#CFCADB]">
            {best}
          </p>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-[0.2em] text-[#6E687A]">
            Time
          </p>
          <p className="text-base font-semibold tabular-nums text-[#CFCADB]">
            {timeLeft}s
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4 h-1 overflow-hidden rounded-full bg-[#2A2534]">
        <div
          className="h-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] transition-[width] duration-1000 ease-linear"
          style={{ width: `${timerPct}%` }}
        />
      </div>

      {/* Game grid / overlay */}
      <div className="relative">
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: TILE_COUNT }).map((_, i) => {
            const isActive = i === activeIndex && gameState === "playing";
            const isWrong = i === wrongFlash;
            const isRight = i === rightFlash;
            return (
              <button
                key={i}
                type="button"
                onClick={() => tapTile(i)}
                disabled={gameState !== "playing"}
                className={`relative aspect-square rounded-xl border transition-all duration-150 ${
                  isActive
                    ? "border-[#C9A227] bg-[#C9A227]/15 ring-2 ring-[#C9A227]/40"
                    : isWrong
                      ? "border-red-500/60 bg-red-500/10"
                      : isRight
                        ? "border-emerald-500/60 bg-emerald-500/15"
                        : "border-[#2E2938] bg-[#161320] hover:border-[#3A3347]"
                }`}
              >
                {isActive && (
                  <span
                    key={dotKey}
                    className="absolute inset-0 flex items-center justify-center"
                  >
                    <span className="dot-pop block h-8 w-8 rounded-full bg-gradient-to-br from-[#F0C94A] to-[#A9821E] shadow-lg shadow-[#C9A227]/40" />
                  </span>
                )}
                {isRight && (
                  <span className="absolute inset-0 flex items-center justify-center text-lg font-bold text-emerald-400">
                    +1
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Overlay — idle / finished */}
        {gameState !== "playing" && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-xl bg-[#15121C]/85 backdrop-blur-sm">
            {gameState === "idle" && (
              <>
                <p className="text-sm font-semibold text-[#F0EAE2]">
                  Tap the gold dot
                </p>
                <p className="text-[11px] text-[#9691A6]">
                  {ROUND_SECONDS}s · How many can you catch?
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-2 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-2 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/30 transition hover:-translate-y-0.5"
                >
                  Play
                </button>
              </>
            )}
            {gameState === "finished" && (
              <>
                {isNewBest && (
                  <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#E0B93A]">
                    🎉 New best!
                  </p>
                )}
                <p
                  className="text-3xl font-bold tabular-nums text-[#E0B93A]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {score}
                </p>
                <p className="text-[11px] text-[#9691A6]">
                  {score === 0
                    ? "Give it another try"
                    : score < 10
                      ? "Not bad"
                      : score < 20
                        ? "Great reflexes"
                        : "You're on fire 🔥"}
                </p>
                <button
                  type="button"
                  onClick={startGame}
                  className="mt-2 rounded-full bg-gradient-to-r from-[#E0B93A] to-[#A9821E] px-5 py-2 text-sm font-bold text-[#1D1707] shadow-md shadow-[#C9A227]/30 transition hover:-translate-y-0.5"
                >
                  Play again
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <p className="mt-4 text-center text-[10px] text-[#6E687A]">
        Fun while you wait — your cart is safe.
      </p>

      <style jsx>{`
        @keyframes dot-pop {
          0% {
            transform: scale(0.3);
            opacity: 0;
          }
          60% {
            transform: scale(1.15);
            opacity: 1;
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }
        .dot-pop {
          animation: dot-pop 0.22s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @media (prefers-reduced-motion: reduce) {
          .dot-pop {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
