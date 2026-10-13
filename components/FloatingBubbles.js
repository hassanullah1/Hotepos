"use client";

import { useEffect, useRef, useState } from "react";

const FloatingBubbles = ({ count = 16 }) => {
  const [bubbles, setBubbles] = useState([]);

  useEffect(() => {
    const generateBubbles = () => {
      const newBubbles = [];
      const patterns = [true, true, false, true, true, true, false, true];

      for (let i = 0; i < count; i++) {
        const income = patterns[i % patterns.length];
        const amount = income
          ? Math.floor(Math.random() * 8000 + 200)
          : Math.floor(Math.random() * 4000 + 100);
        newBubbles.push({
          id: i,
          income,
          amount,
          size: Math.random() * 50 + 30,
          left: Math.random() * 90 + 5,
          duration: Math.random() * 10 + 10,
          delay: Math.random() * 12,
          drift: (Math.random() - 0.5) * 40,
          opacity: Math.random() * 0.35 + 0.4,
        });
      }
      return newBubbles;
    };

    setBubbles(generateBubbles());
  }, [count]);

  return (
    <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
      {bubbles.map((bubble) => (
        <div
          key={bubble.id}
          className="absolute font-bold floating-bubble"
          style={{
            left: `${bubble.left}%`,
            bottom: "-10%",
            fontSize: `${Math.max(bubble.size * 0.35, 14)}px`,
            color: bubble.income ? "#22c55e" : "#1e293b",
            opacity: bubble.opacity,
            textShadow: bubble.income
              ? "0 0 30px rgba(34,197,94,0.4), 0 0 60px rgba(34,197,94,0.1)"
              : "0 0 20px rgba(0,0,0,0.15)",
            animationDuration: `${bubble.duration}s`,
            animationDelay: `${bubble.delay}s`,
            "--drift": `${bubble.drift}px`,
            "--drift2": `${bubble.drift * 0.5}px`,
          }}
        >
          <div className="flex flex-col items-center">
            <span className="text-[11px] font-light opacity-70">
              {bubble.income ? "📈" : "📉"}
            </span>
            <span className="font-mono text-sm font-bold tracking-wide">
              {bubble.income ? "+" : "-"}${bubble.amount.toLocaleString()}
            </span>
            <span className="text-[8px] opacity-40 font-light">
              {bubble.income ? "revenue" : "expense"}
            </span>
          </div>
        </div>
      ))}

      <style jsx>{`
        @keyframes floatUp {
          0% {
            bottom: -10%;
            opacity: 0.3;
            transform: translateX(0px) scale(0.7) rotate(0deg);
          }
          15% {
            opacity: 1;
            transform: translateX(var(--drift, 0px)) scale(1.05) rotate(2deg);
          }
          75% {
            opacity: 1;
            transform: translateX(calc(var(--drift, 0px) * 0.3)) scale(1)
              rotate(-1deg);
          }
          100% {
            bottom: 110%;
            opacity: 0;
            transform: translateX(calc(var(--drift, 0px) * -0.2)) scale(0.8)
              rotate(3deg);
          }
        }

        .floating-bubble {
          position: absolute;
          animation: floatUp ease-in-out infinite;
          will-change: transform, opacity;
          font-family: "Inter", "SF Pro Display", sans-serif;
          backdrop-filter: blur(2px);
          padding: 4px 8px;
          border-radius: 12px;
          background: rgba(255, 255, 255, 0.05);
        }
      `}</style>
    </div>
  );
};

export default FloatingBubbles;
