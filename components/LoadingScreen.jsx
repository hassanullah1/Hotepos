// components/LoadingScreen.jsx
"use client";

import styles from "./LoadingScreen.module.css";

const WORD = "MELMAH".split("");

const SPARKLES = [
  { left: "-4%", top: "6%", size: 14, delay: "2.55s" },
  { left: "40%", top: "-18%", size: 11, delay: "2.7s" },
  { left: "78%", top: "-14%", size: 16, delay: "2.6s" },
  { left: "104%", top: "26%", size: 12, delay: "2.8s" },
];

/*
 * Critical styles are inline on purpose.
 * Inline styles are part of the HTML, so size, position and hidden start state
 * are correct on the very first paint, even before any stylesheet is ready.
 * This stops the "big text across the full width" flash at the start.
 * Animations and decoration live in LoadingScreen.module.css.
 */
const FONT =
  'ui-rounded, "Nunito", "Poppins", "Segoe UI", system-ui, sans-serif';

/**
 * Melmah text-only loading screen, centered.
 *
 * 1. A small teal dot pops in at the center.
 * 2. The dot stretches into a line.
 * 3. M, E, L, M, A, H hop up from the bottom one at a time like jelly (squash and stretch).
 * Then the word shines and bounces, and the letters spring away to the top in the same order
 * (M first), and the cycle repeats (5s) until loading ends.
 *
 * Needs LoadingScreen.module.css in the same folder.
 *
 * @param {Object} props
 * @param {boolean} [props.fullScreen=true]  If true, fills the viewport. Otherwise fills its parent area.
 * @param {string}  [props.className=""]     Extra classes for the outer wrapper.
 */
export default function LoadingScreen({ fullScreen = true, className = "" }) {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading Melmah"
      className={`${styles.root} ${className}`}
      style={{
        position: "relative",
        display: "grid",
        placeItems: "center",
        width: "100%",
        minHeight: fullScreen ? "100dvh" : "240px",
        padding: "2.5rem 1.5rem",
        overflow: "hidden",
        background: "#fff",
        boxSizing: "border-box",
      }}
    >
      <div
        className={styles.bg}
        aria-hidden="true"
        style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
      />

      {/* Compact block, centered in the middle of the screen */}
      <div
        aria-hidden="true"
        style={{ position: "relative", width: "fit-content", maxWidth: "100%" }}
      >
        <div
          className={styles.word}
          style={{
            display: "flex",
            justifyContent: "center",
            gap: "0.06em",
            fontFamily: FONT,
            fontWeight: 800,
            fontSize: "clamp(1.9rem, 9vw, 3.5rem)",
            lineHeight: 1,
            letterSpacing: "0.08em",
            color: "#007068",
          }}
        >
          {WORD.map((letter, i) => (
            <span
              key={i}
              className={styles.mask}
              style={{ display: "inline-block" }}
            >
              <span
                className={styles.letter}
                style={{
                  display: "inline-block",
                  opacity: 0,
                  transform: "translateY(120%)",
                  "--dir": i % 2 ? 1 : -1,
                  animationDelay: `${0.45 + i * 0.2}s`,
                }}
              >
                <span
                  className={styles.wave}
                  style={{
                    display: "inline-block",
                    animationDelay: `${0.45 + i * 0.2}s`,
                  }}
                >
                  <span
                    className={styles.ink}
                    style={{
                      display: "inline-block",
                      animationDelay: `${0.45 + i * 0.2}s`,
                    }}
                  >
                    {letter}
                  </span>
                </span>
              </span>
            </span>
          ))}
        </div>

        {/* Loads first: a dot that stretches into a line */}
        <div
          className={styles.lineWrap}
          style={{
            display: "flex",
            justifyContent: "center",
            height: 6,
            marginTop: "0.7rem",
          }}
        >
          <span
            className={styles.line}
            style={{
              display: "block",
              width: 6,
              height: 6,
              borderRadius: 999,
              background: "#12958a",
              opacity: 0,
              transform: "scale(0)",
            }}
          />
        </div>

        {SPARKLES.map((sp, i) => (
          <span
            key={i}
            className={styles.sparkle}
            style={{
              position: "absolute",
              left: sp.left,
              top: sp.top,
              width: sp.size,
              height: sp.size,
              marginLeft: -sp.size / 2,
              marginTop: -sp.size / 2,
              opacity: 0,
              pointerEvents: "none",
              animationDelay: sp.delay,
            }}
          >
            <svg
              viewBox="0 0 24 24"
              width={sp.size}
              height={sp.size}
              style={{ display: "block" }}
            >
              <path
                d="M12 0 C13 8 16 11 24 12 C16 13 13 16 12 24 C11 16 8 13 0 12 C8 11 11 8 12 0Z"
                fill="#12958a"
              />
            </svg>
          </span>
        ))}
      </div>
    </div>
  );
}
