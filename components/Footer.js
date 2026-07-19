// components/Footer.js
"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { vehiclesData } from "@/data/icons";
import {
  Phone,
  Mail,
  MapPin as MapPinIcon,
  Globe,
  Send,
  MessageCircle,
} from "lucide-react";

const footerText = {
  en: {
    tagline:
      "Reliable freight, passenger, and heavy-equipment transport across the region.",
    categories: "Categories",
    quickLinks: "Quick Links",
    contact: "Contact",
    home: "Home",
    about: "About Us",
    services: "Services",
    contactUs: "Contact Us",
    address: "Kabul, Afghanistan",
    rights: "All rights reserved.",
  },
  ps: {
    tagline: "د سیمې لپاره د باور وړ بار، مسافر او درانه ماشین آلاتو لېږد.",
    categories: "کټګورۍ",
    quickLinks: "ګړندي لینکونه",
    contact: "اړیکه",
    home: "کور",
    about: "زموږ په اړه",
    services: "خدمتونه",
    contactUs: "اړیکه ونیسئ",
    address: "کابل، افغانستان",
    rights: "ټول حقونه خوندي دي.",
  },
  prs: {
    tagline: "حمل و نقل مطمئن بار، مسافر و ماشین‌آلات سنگین در سراسر منطقه.",
    categories: "دسته‌بندی‌ها",
    quickLinks: "لینک‌های سریع",
    contact: "تماس",
    home: "خانه",
    about: "درباره ما",
    services: "خدمات",
    contactUs: "با ما تماس بگیرید",
    address: "کابل، افغانستان",
    rights: "تمامی حقوق محفوظ است.",
  },
};

export default function Footer() {
  const { language } = useLanguage();
  const vehicles = vehiclesData[language] || vehiclesData.en;
  const text = footerText[language] || footerText.en;

  // De-duplicate by category so "Truck" and "Dump Truck" don't both show if
  // your data ever collapses them; falls back gracefully if ids repeat.
  const categoryLinks = vehicles.filter(
    (v, i, arr) => arr.findIndex((x) => x.id === v.id) === i,
  );

  return (
    <footer className="relative isolate overflow-hidden bg-gradient-to-br from-teal-700 to-teal-950 dark:from-teal-900 dark:to-black text-white">
      {/* Decorative watermark — single image, same device as the hero banner:
          logical "end" positioning so it stays on the trailing edge in both
          LTR (English) and RTL (Pashto/Dari). */}
      {/* Decorative background image — covers the whole footer, sits behind
    everything else (gradient + dot-grid render on top of it). */}
      {categoryLinks[0] && (
        <div className="pointer-events-none absolute inset-0 opacity-[0.20]">
          <Image
            src="/images/footer.png"
            alt=""
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        </div>
      )}

      {/* Subtle dot-grid texture, matching the hero banner */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "radial-gradient(circle, white 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-14 pb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
          {/* Brand */}
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">
              Kohistan <span className="text-amber-400">Logistics</span>
            </h2>
            <p className="mt-3 text-sm text-teal-100/80 max-w-xs leading-relaxed">
              {text.tagline}
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href="#"
                aria-label="Website"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <Globe size={16} />
              </a>
              <a
                href="#"
                aria-label="Telegram"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <Send size={16} />
              </a>
              <a
                href="#"
                aria-label="WhatsApp"
                className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
              >
                <MessageCircle size={16} />
              </a>
            </div>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="text-sm font-semibold text-teal-100 uppercase tracking-wide">
              {text.quickLinks}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-teal-100/80">
              <li>
                <Link href="/" className="hover:text-white transition">
                  {text.home}
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-white transition">
                  {text.about}
                </Link>
              </li>
              <li>
                <Link href="/services" className="hover:text-white transition">
                  {text.services}
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-white transition">
                  {text.contactUs}
                </Link>
              </li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h3 className="text-sm font-semibold text-teal-100 uppercase tracking-wide">
              {text.categories}
            </h3>
            <ul className="mt-4 space-y-2.5 text-sm text-teal-100/80">
              {categoryLinks.map((vehicle) => (
                <li key={vehicle.id}>
                  <Link
                    href={`/${vehicle.id}`}
                    className="hover:text-white transition"
                  >
                    {vehicle.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold text-teal-100 uppercase tracking-wide">
              {text.contact}
            </h3>
            <ul className="mt-4 space-y-3 text-sm text-teal-100/80">
              <li className="flex items-center gap-2.5">
                <Phone size={15} className="shrink-0 text-amber-400" />
                <a
                  href="tel:+93700000000"
                  className="hover:text-white transition"
                >
                  +93 70 000 0000
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <Mail size={15} className="shrink-0 text-amber-400" />
                <a
                  href="mailto:info@kohistanlogistics.com"
                  className="hover:text-white transition break-all"
                >
                  info@kohistanlogistics.com
                </a>
              </li>
              <li className="flex items-center gap-2.5">
                <MapPinIcon size={15} className="shrink-0 text-amber-400" />
                <span>{text.address}</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-teal-100/60">
          <p>
            © {new Date().getFullYear()} Kohistan Logistics. {text.rights}
          </p>
        </div>
      </div>
    </footer>
  );
}
