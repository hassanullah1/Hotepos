// components/Footer.js
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import { Phone, Mail, MapPin, Globe, Send, MessageCircle } from "lucide-react";

function useRevealOnView() {
  const containerRef = useRef(null);
  const [revealed, setRevealed] = useState(false);

  useEffect(() => {
    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (prefersReduced || !("IntersectionObserver" in window)) {
      setRevealed(true);
      return;
    }
    const node = containerRef.current;
    if (!node) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setRevealed(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  return { containerRef, revealed };
}

const socials = [
  { href: "#", label: "Website", Icon: Globe },
  { href: "#", label: "Telegram", Icon: Send },
  { href: "#", label: "WhatsApp", Icon: MessageCircle },
];

export default function Footer() {
  const t = useTranslation();
  const { containerRef, revealed } = useRevealOnView();

  return (
    <footer className="relative isolate overflow-hidden border-t border-slate-200 bg-gradient-to-b from-[#FAF7F0] to-white text-slate-900 transition-colors duration-300 dark:border-[#2E2938] dark:from-[#15121C] dark:to-[#0F0D14] dark:text-[#F0EAE2]">
      {/* Gold accent line */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/60 to-transparent"
        aria-hidden="true"
      />

      {/* Ambient gold glows */}
      <div
        className="glow-drift pointer-events-none absolute -top-24 start-[-4rem] h-72 w-72 rounded-full bg-[#C9A227]/15 blur-3xl dark:bg-[#C9A227]/10"
        aria-hidden="true"
      />
      <div
        className="glow-drift-reverse pointer-events-none absolute -bottom-20 end-0 h-80 w-80 rounded-full bg-[#C9A227]/10 blur-3xl dark:bg-[#C9A227]/[0.08]"
        aria-hidden="true"
      />

      {/* Dot grid — inherits currentColor, adapts to theme */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.06] dark:opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, currentColor 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-12 sm:px-6 sm:pt-14 lg:px-8">
        <div
          ref={containerRef}
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 sm:gap-8 sm:items-start"
        >
          {/* ── Brand ───────────────────────────────── */}
          <div
            className={`reveal ${revealed ? "reveal-in" : ""}`}
            style={{ transitionDelay: "0ms" }}
          >
            <Link
              href="/"
              className="group inline-flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
            >
              <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-[#E0B93A] to-[#8A6E1A] p-[2px] transition-transform duration-300 group-hover:rotate-6">
                <div className="h-full w-full overflow-hidden rounded-full bg-white dark:bg-[#15121C]">
                  <Image
                    src="/Melmah.png"
                    alt={t.appName}
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span
                  className="whitespace-nowrap text-lg font-semibold tracking-tight md:text-xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.appName}
                </span>
                <span className="hidden text-[10px] uppercase tracking-[0.2em] text-slate-500 dark:text-[#6E687A] sm:inline">
                  {t.badge}
                </span>
              </div>
            </Link>

            {/* Social row */}
            <div className="mt-5 flex items-center gap-2">
              {socials.map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="social-icon flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-600 transition-all duration-300 hover:border-[#C9A227]/60 hover:text-[#8A6E1A] dark:border-[#2E2938] dark:bg-[#1B1823] dark:text-[#CFCADB] dark:hover:text-[#E0B93A]"
                >
                  <Icon size={15} />
                </a>
              ))}
            </div>
          </div>

          {/* ── Contact ────────────────────────────── */}
          <div
            className={`reveal ${revealed ? "reveal-in" : ""}`}
            style={{ transitionDelay: "120ms" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500 dark:text-[#6E687A]">
              {t.footerContact}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-start gap-2.5">
                <Phone size={15} className="mt-0.5 shrink-0 text-[#C9A227]" />
                <a
                  href="tel:+93700000000"
                  dir="ltr"
                  className="footer-link text-slate-600 dark:text-[#B7B2C4]"
                >
                  +93 731574174
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail size={15} className="mt-0.5 shrink-0 text-[#C9A227]" />
                <a
                  href="mailto:info@Melmah.af"
                  dir="ltr"
                  className="footer-link break-all text-slate-600 dark:text-[#B7B2C4]"
                >
                  info@Melmah.af
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <MapPin size={15} className="mt-0.5 shrink-0 text-[#C9A227]" />
                <span className="text-slate-600 dark:text-[#B7B2C4]">
                  {t.footerAddress}
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* ── Bottom bar ──────────────────────────── */}
        <div
          className={`reveal ${revealed ? "reveal-in" : ""} mt-10 flex items-center justify-center border-t border-slate-200 pt-6 text-xs text-slate-500 dark:border-[#2E2938] dark:text-[#6E687A]`}
          style={{ transitionDelay: "200ms" }}
        >
          <p>
            © {new Date().getFullYear()} {t.appName}. {t.rights}
          </p>
        </div>
      </div>

      <style jsx>{`
        .reveal {
          opacity: 0;
          transform: translateY(16px);
          transition:
            opacity 0.6s ease-out,
            transform 0.6s ease-out;
        }
        .reveal-in {
          opacity: 1;
          transform: translateY(0);
        }

        .footer-link {
          position: relative;
          display: inline-block;
          transition: color 0.25s ease;
        }
        .footer-link::after {
          content: "";
          position: absolute;
          inset-inline-start: 0;
          bottom: -2px;
          width: 0%;
          height: 1px;
          background: #c9a227;
          transition: width 0.3s ease;
        }
        .footer-link:hover {
          color: #8a6e1a;
        }
        :global(.dark) .footer-link:hover {
          color: #e0b93a;
        }
        .footer-link:hover::after {
          width: 100%;
        }

        .social-icon {
          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            color 0.25s ease,
            background-color 0.25s ease;
        }
        .social-icon:hover {
          transform: translateY(-2px) scale(1.06);
        }

        @keyframes glowDrift {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, 15px) scale(1.08);
          }
        }
        @keyframes glowDriftReverse {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-18px, -12px) scale(1.06);
          }
        }
        .glow-drift {
          animation: glowDrift 14s ease-in-out infinite;
        }
        .glow-drift-reverse {
          animation: glowDriftReverse 17s ease-in-out infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .reveal {
            opacity: 1;
            transform: none;
            transition: none;
          }
          .glow-drift,
          .glow-drift-reverse {
            animation: none;
          }
        }
      `}</style>
    </footer>
  );
}
