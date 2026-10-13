// components/Footer.js
"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useTranslation } from "@/hooks/useTranslation";
import {
  Phone,
  Mail,
  MapPin,
  Globe,
  Send,
  MessageCircle,
  BedDouble,
  ClipboardCheck,
  UtensilsCrossed,
  Receipt,
} from "lucide-react";

const solutions = [
  { icon: BedDouble, key: "rooms", href: "/#rooms", labelKey: "solutionRooms" },
  {
    icon: ClipboardCheck,
    key: "frontdesk",
    href: "/#front-desk",
    labelKey: "solutionFrontdesk",
  },
  {
    icon: UtensilsCrossed,
    key: "restaurant",
    href: "/#restaurant",
    labelKey: "solutionRestaurant",
  },
  {
    icon: Receipt,
    key: "billing",
    href: "/#billing",
    labelKey: "solutionBilling",
  },
];

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

export default function Footer() {
  const t = useTranslation();
  const { containerRef, revealed } = useRevealOnView();

  return (
    <footer className="relative isolate overflow-hidden border-t border-[#2E2938] bg-[#15121C] text-[#F0EAE2]">
      {/* Thin gold line at the top — same signature as the header's scrolled state */}
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C9A227]/60 to-transparent"
        aria-hidden="true"
      />

      {/* Ambient gold glow — matches the mobile drawer's glow */}
      <div
        className="glow-drift pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="glow-drift-reverse pointer-events-none absolute -bottom-20 right-0 h-80 w-80 rounded-full bg-[#C9A227]/8 blur-3xl"
        aria-hidden="true"
      />

      {/* Subtle dot grid, warm-tinted to fit the palette */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, #F0EAE2 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-16 sm:px-6 lg:px-8">
        <div
          ref={containerRef}
          className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4"
        >
          {/* Brand */}
          <div
            className={`reveal ${revealed ? "reveal-in" : ""}`}
            style={{ transitionDelay: "0ms" }}
          >
            <Link
              href="/"
              className="group inline-flex items-center gap-3 rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[#C9A227]/60"
            >
              <div className="relative h-11 w-11 rounded-full bg-gradient-to-br from-[#E0B93A] to-[#8A6E1A] p-[2px] transition-transform duration-300 group-hover:rotate-6">
                <div className="h-full w-full overflow-hidden rounded-full bg-[#15121C]">
                  <Image
                    src="/Melmah.png"
                    alt="Rawan Logistic Logo"
                    width={44}
                    height={44}
                    className="h-full w-full object-cover"
                  />
                </div>
              </div>
              <div className="flex flex-col leading-tight">
                <span
                  className="whitespace-nowrap text-lg font-semibold tracking-tight text-[#F0EAE2] md:text-xl"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {t.appName}
                </span>
                <span className="hidden text-[10px] uppercase tracking-[0.2em] text-[#6E687A] sm:inline">
                  {t.badge}
                </span>
              </div>
            </Link>

            <p className="mt-4 max-w-xs text-sm leading-relaxed text-[#B7B2C4]">
              {t.footerTagline}
            </p>

            <div className="mt-5 flex items-center gap-2">
              <a
                href="#"
                aria-label="Website"
                className="social-icon flex h-9 w-9 items-center justify-center rounded-full border border-[#2E2938] bg-[#1B1823] text-[#CFCADB] transition-all duration-300 hover:border-[#C9A227]/60 hover:text-[#E0B93A]"
              >
                <Globe size={15} />
              </a>
              <a
                href="#"
                aria-label="Telegram"
                className="social-icon flex h-9 w-9 items-center justify-center rounded-full border border-[#2E2938] bg-[#1B1823] text-[#CFCADB] transition-all duration-300 hover:border-[#C9A227]/60 hover:text-[#E0B93A]"
              >
                <Send size={15} />
              </a>
              <a
                href="#"
                aria-label="WhatsApp"
                className="social-icon flex h-9 w-9 items-center justify-center rounded-full border border-[#2E2938] bg-[#1B1823] text-[#CFCADB] transition-all duration-300 hover:border-[#C9A227]/60 hover:text-[#E0B93A]"
              >
                <MessageCircle size={15} />
              </a>
            </div>
          </div>

          {/* Product links */}
          <div
            className={`reveal ${revealed ? "reveal-in" : ""}`}
            style={{ transitionDelay: "80ms" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6E687A]">
              {t.footerProduct}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/" className="footer-link">
                  {t.footerHome}
                </Link>
              </li>
              <li>
                <Link href="/about" className="footer-link">
                  {t.footerAbout}
                </Link>
              </li>
              <li>
                <Link href="/#how-it-works" className="footer-link">
                  {t.footerFeatures}
                </Link>
              </li>
              <li>
                <Link href="/register" className="footer-link">
                  {t.footerRegister}
                </Link>
              </li>
            </ul>
          </div>

          {/* Solutions */}
          <div
            className={`reveal ${revealed ? "reveal-in" : ""}`}
            style={{ transitionDelay: "160ms" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6E687A]">
              {t.footerSolutions}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {solutions.map(({ icon: Icon, key, href, labelKey }) => (
                <li key={key}>
                  <Link
                    href={href}
                    className="footer-link inline-flex items-center gap-2"
                  >
                    <Icon size={14} className="shrink-0 text-[#C9A227]" />
                    {t[labelKey]}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div
            className={`reveal ${revealed ? "reveal-in" : ""}`}
            style={{ transitionDelay: "240ms" }}
          >
            <h3 className="text-xs font-semibold uppercase tracking-[0.2em] text-[#6E687A]">
              {t.footerContact}
            </h3>
            <ul className="mt-4 space-y-3 text-sm">
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0 text-[#C9A227]" />
                <a href="tel:+93700000000" className="footer-link">
                  +93 70 000 0000
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0 text-[#C9A227]" />
                <a
                  href="mailto:info@Melmah.af"
                  className="footer-link break-all"
                >
                  info@Melmah .af
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPin size={15} className="shrink-0 text-[#C9A227]" />
                <span className="text-[#B7B2C4]">{t.footerAddress}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div
          className={`reveal ${revealed ? "reveal-in" : ""} mt-12 flex flex-col items-center justify-between gap-3 border-t border-[#2E2938] pt-6 text-xs text-[#6E687A] sm:flex-row`}
          style={{ transitionDelay: "320ms" }}
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
          color: #b7b2c4;
          transition: color 0.25s ease;
        }
        .footer-link::after {
          content: "";
          position: absolute;
          left: 0;
          bottom: -2px;
          width: 0%;
          height: 1px;
          background: #c9a227;
          transition: width 0.3s ease;
        }
        .footer-link:hover {
          color: #e0b93a;
        }
        .footer-link:hover::after {
          width: 100%;
        }

        .social-icon {
          transition:
            transform 0.25s ease,
            border-color 0.25s ease,
            color 0.25s ease;
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
