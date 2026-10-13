"use client";

import { useEffect, useState, useRef } from "react";
import { Utensils, Users, Hotel } from "lucide-react";
import { useTranslation } from "@/hooks/useTranslation";
import AdminDashboard from "./AdminDashboard";
import FloatingBubbles from "./FloatingBubbles";

export default function AdminShowcase({ isRTL }) {
  const t = useTranslation();
  const sectionRef = useRef(null);
  const [inView, setInView] = useState(false);

  // --- Observer: updates on every intersection change ---
  useEffect(() => {
    const node = sectionRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.1 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  // Keyboard layout (unchanged)
  const keyRows = [
    ["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "=", "⌫"],
    ["Tab", "Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P", "[", "]", "\\"],
    ["Caps", "A", "S", "D", "F", "G", "H", "J", "K", "L", ";", "'", "Enter"],
    ["Shift", "Z", "X", "C", "V", "B", "N", "M", ",", ".", "/", "Shift"],
    ["Ctrl", "Fn", "Alt", "⌘", "Space", "⌘", "Alt", "Ctrl"],
  ];

  const isSpecialKey = (key) =>
    [
      "Tab",
      "Caps",
      "Shift",
      "Ctrl",
      "Fn",
      "Alt",
      "⌘",
      "Enter",
      "⌫",
      "Space",
    ].includes(key);

  const getKeyWidth = (key) => {
    if (key === "Space") return "w-14";
    if (["Tab", "Caps", "Shift", "Enter", "⌫"].includes(key)) return "w-7";
    if (["Ctrl", "Fn", "Alt", "⌘"].includes(key)) return "w-5";
    return "w-[18px]";
  };

  return (
    <section
      ref={sectionRef}
      dir={isRTL ? "rtl" : "ltr"}
      className="relative py-8 md:py-16 overflow-hidden"
      style={{
        background:
          "linear-gradient(160deg, #e8ecf2 0%, #c8ced8 40%, #b0b8c6 100%)",
      }}
    >
      {/* ===== DEEP OFFICE BACKGROUND ===== (unchanged) */}
      <div className="absolute inset-0 z-0">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `
              radial-gradient(circle at 20% 30%, rgba(255,255,255,0.15) 1px, transparent 1px),
              radial-gradient(circle at 80% 70%, rgba(255,255,255,0.10) 1px, transparent 1px),
              radial-gradient(circle at 40% 90%, rgba(200,200,210,0.08) 1px, transparent 1px),
              radial-gradient(circle at 60% 10%, rgba(200,200,210,0.08) 1px, transparent 1px)
            `,
            backgroundSize: "40px 40px, 60px 60px, 80px 80px, 50px 50px",
          }}
        />
      </div>
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
        className="absolute z-0 right-8 top-8 w-40 h-56 rounded-2xl"
        style={{
          background:
            "radial-gradient(ellipse at 50% 30%, rgba(255,255,240,0.3) 0%, rgba(200,220,255,0.05) 70%)",
          boxShadow:
            "inset 0 0 60px rgba(255,255,220,0.2), 0 0 40px rgba(200,220,255,0.1)",
        }}
      >
        <div className="absolute inset-0 border-2 border-white/20 rounded-2xl" />
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-white/10" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-white/10" />
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at 50% 30%, rgba(255,255,220,0.15) 0%, transparent 70%)",
          }}
        />
      </div>
      <div className="absolute z-0 left-12 top-12 w-16 h-20 rounded-lg border-2 border-white/15 bg-gradient-to-br from-white/5 to-white/20 shadow-lg" />
      <div className="absolute z-0 left-20 top-16 w-10 h-12 rounded-md border border-white/10 bg-gradient-to-br from-white/5 to-white/15 shadow-md" />
      <div
        className="absolute z-0 right-32 bottom-32 w-24 h-24 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,162,39,0.06) 0%, transparent 70%)",
          border: "1px solid rgba(201,162,39,0.08)",
        }}
      />
      <div
        className="absolute z-0 left-1/3 bottom-16 w-16 h-16 rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(34,197,94,0.04) 0%, transparent 70%)",
          border: "1px solid rgba(34,197,94,0.05)",
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.12) 0%, transparent 50%), radial-gradient(ellipse at 70% 80%, rgba(0,0,0,0.04) 0%, transparent 40%), radial-gradient(ellipse at 50% 100%, rgba(0,0,0,0.08) 0%, transparent 50%)",
        }}
      />
      <div
        className="absolute inset-x-0 bottom-0 z-0"
        style={{
          height: "35%",
          background:
            "linear-gradient(to top, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.05) 40%, transparent 100%), linear-gradient(to right, rgba(0,0,0,0.03) 0%, transparent 20%, transparent 80%, rgba(0,0,0,0.03) 100%)",
        }}
      />

      <FloatingBubbles count={16} />

      {/* ===== CONTENT: PC LEFT, TEXT RIGHT ===== */}
      <div className="relative z-10 mx-auto max-w-5xl px-4 grid grid-cols-1 lg:grid-cols-[1fr_1fr] items-center gap-6 lg:gap-8">
        {/* PC (LEFT) – grows from bottom */}
        <div className="flex items-center justify-center order-1 lg:order-1">
          <div
            className={`relative w-full max-w-[320px] transform-gpu transition-all duration-700 ease-out will-change-transform ${
              inView
                ? "opacity-100 translate-y-0 scale-y-100"
                : "opacity-0 translate-y-12 scale-y-0"
            }`}
            style={{ transformOrigin: "bottom center" }}
          >
            {/* Monitor */}
            <div
              className="relative"
              style={{
                transform: "rotateX(2deg) rotateY(-1deg)",
                transformStyle: "preserve-3d",
              }}
            >
              <div className="absolute -inset-2 bg-black/10 rounded-2xl blur-xl -z-10" />
              <div className="bg-[#2a2a3a] rounded-xl p-1.5 shadow-2xl shadow-black/20 border border-[#3a3a4a]">
                <div className="bg-[#0a0a0f] rounded-lg overflow-hidden aspect-[16/10] relative">
                  <AdminDashboard compact={true} />
                  <div
                    className="cursor-anim absolute pointer-events-none z-50 will-change-transform"
                    style={{ top: "25%", left: "35%" }}
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                      <polygon
                        points="1,1 10,4 5,6 7,10 1,1"
                        fill="#C9A227"
                        stroke="#0a0a0f"
                        strokeWidth="0.8"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              <div className="flex justify-center -mt-0.5">
                <div className="w-10 h-2.5 bg-[#2a2a3a] rounded-b-lg shadow-md" />
              </div>
              <div className="absolute bottom-1.5 right-1.5 w-1 h-1 rounded-full bg-green-400 shadow-[0_0_4px_rgba(74,222,128,0.5)]" />
            </div>

            {/* Keyboard + Mouse */}
            <div className="mt-2 flex items-start justify-center gap-3">
              <div
                className="relative w-[70%] will-change-transform"
                style={{
                  transform: "rotateX(4deg) translateY(-2px) translateZ(0)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="absolute -inset-1 bg-black/10 rounded-lg blur-sm -z-10" />
                <div className="bg-[#1a1a2a] rounded-lg p-1 shadow-lg border border-[#2a2a3a]">
                  {keyRows.map((row, rowIndex) => (
                    <div
                      key={rowIndex}
                      className={`flex gap-0.5 ${rowIndex > 0 ? "mt-0.5" : ""} justify-center`}
                    >
                      {row.map((key, keyIndex) => (
                        <div
                          key={keyIndex}
                          className={`
                            ${getKeyWidth(key)}
                            h-3 rounded-[2px]
                            ${isSpecialKey(key) ? "bg-[#2a2a3a] text-[#6a6a8a]" : "bg-[#3a3a4a] text-[#8a8aaa]"}
                            flex items-center justify-center text-[3.5px] font-medium uppercase
                            shadow-[inset_0_0.5px_0_rgba(255,255,255,0.05)]
                            ${key === "Space" ? "px-1.5 text-[5px] text-[#5a5a7a]" : ""}
                          `}
                        >
                          {key === "Space" ? "⌴" : key}
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Mouse */}
              <div
                className="mouse-anim relative will-change-transform"
                style={{
                  transform: "rotateX(4deg) translateY(-2px) translateZ(0)",
                  transformStyle: "preserve-3d",
                }}
              >
                <div className="absolute -inset-1 bg-black/10 rounded-full blur-sm -z-10" />
                <div className="bg-[#1a1a2a] rounded-full p-1.5 shadow-lg border border-[#2a2a3a]">
                  <svg
                    width="20"
                    height="28"
                    viewBox="0 0 20 30"
                    fill="none"
                    className="w-6 h-auto"
                  >
                    <rect
                      x="2"
                      y="1"
                      width="16"
                      height="28"
                      rx="8"
                      fill="#2a2a3a"
                      stroke="#4a4a5a"
                      strokeWidth="1"
                    />
                    <line
                      x1="10"
                      y1="1"
                      x2="10"
                      y2="12"
                      stroke="#4a4a5a"
                      strokeWidth="1"
                    />
                    <rect
                      x="8"
                      y="5"
                      width="4"
                      height="7"
                      rx="2"
                      fill="#1a1a2a"
                      stroke="#5a5a7a"
                      strokeWidth="0.5"
                    />
                    <circle cx="10" cy="26" r="1" fill="#4a5a4a" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Text column (RIGHT) – grows from top */}
        <div className="order-2 lg:order-2">
          <div
            className={`transform-gpu transition-all duration-700 ease-out delay-150 will-change-transform ${
              inView
                ? "opacity-100 translate-y-0 scale-y-100"
                : "opacity-0 -translate-y-8 scale-y-0"
            }`}
            style={{ transformOrigin: "top center" }}
          >
            <div className="bg-white/40 backdrop-blur-xl rounded-2xl p-6 border border-white/50 shadow-2xl shadow-black/5">
              <h2 className="font-serif text-2xl leading-tight text-[#1a1a2e] sm:text-3xl drop-shadow-sm">
                {t.adminTitle}
              </h2>
              <p className="mt-3 max-w-[50ch] text-base leading-relaxed text-[#3d3d5c]">
                {t.adminSubtitle}
              </p>
              <div className="mt-5 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <span className="inline-flex items-center gap-2 bg-blue-100/80 text-blue-700 text-sm px-3 py-1 rounded-full border border-blue-200/50 backdrop-blur-sm">
                    <Utensils size={14} />
                    {t.adminLabelMenu}
                  </span>
                  <span className="inline-flex items-center gap-2 bg-amber-100/80 text-amber-700 text-sm px-3 py-1 rounded-full border border-amber-200/50 backdrop-blur-sm">
                    <Users size={14} />
                    {t.adminLabelWorkers}
                  </span>
                  <span className="inline-flex items-center gap-2 bg-green-100/80 text-green-700 text-sm px-3 py-1 rounded-full border border-green-200/50 backdrop-blur-sm">
                    <Hotel size={14} />
                    {t.adminLabelHotels}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== ANIMATIONS ===== (unchanged) */}
      <style jsx>{`
        @keyframes mouseMove {
          0% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
          20% {
            transform: translateX(6px) translateY(-3px) rotate(2deg);
          }
          40% {
            transform: translateX(2px) translateY(4px) rotate(-1deg);
          }
          60% {
            transform: translateX(-8px) translateY(1px) rotate(-2deg);
          }
          80% {
            transform: translateX(-3px) translateY(-4px) rotate(1deg);
          }
          100% {
            transform: translateX(0px) translateY(0px) rotate(0deg);
          }
        }
        .mouse-anim {
          animation: mouseMove 5s ease-in-out infinite;
          will-change: transform;
        }
        .cursor-anim {
          animation: mouseMove 5s ease-in-out infinite;
          will-change: transform;
        }
        .will-change-transform {
          will-change: transform, opacity;
        }
      `}</style>
    </section>
  );
}
