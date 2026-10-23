// app/contact/page.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import LoadingScreen from "@/components/LoadingScreen";
import { fraunces as displayFont } from "@/app/fonts/fraunces";
import {
  Sparkles,
  Phone,
  Mail,
  MapPin,
  MessageCircle,
  Send,
  Clock,
  Check,
} from "lucide-react";



// WhatsApp number (no +, no spaces, country code included)
const WHATSAPP_NUMBER = "93700000000";

const contactText = {
  en: {
    badge: "Contact us",
    titleA: "Let's talk about your",
    titleHighlight: "hotel",
    subtitle:
      "Questions, demos, or just want to see how it works? Reach out — we usually reply within a few hours.",
    loading: "Loading…",
    methodsLabel: "Reach us directly",
    phoneLabel: "Call us",
    phoneValue: "+93 70 000 0000",
    emailLabel: "Email us",
    emailValue: "info@Melmah.af",
    whatsappLabel: "WhatsApp",
    whatsappValue: "Chat with us",
    whatsappCta: "Open WhatsApp",
    hoursLabel: "Working hours",
    hoursValue: "Sun – Thu, 8:00 – 17:00",
    addressLabel: "Visit us",
    addressValue: "Kabul, Afghanistan",
    formLabel: "Send us a message",
    nameLabel: "Your name",
    namePlaceholder: "Ahmad Khan",
    hotelLabel: "Hotel name",
    hotelPlaceholder: "Kabul Star Hotel",
    emailFormLabel: "Your email",
    emailFormPlaceholder: "you@yourhotel.com",
    messageLabel: "Message",
    messagePlaceholder:
      "Tell us a bit about your hotel and what you'd like to know.",
    sendButton: "Send via WhatsApp",
    sendHint: "This opens WhatsApp with your message ready to send.",
    requiredError: "Please fill in your name and message.",
    sentTitle: "Ready to send",
    sentBody:
      "WhatsApp opened in a new tab with your message. If it didn't, tap the button below.",
    openAgain: "Open WhatsApp again",
  },
  ps: {
    badge: "اړیکه",
    titleA: "راځه چې د خپل هوټل په اړه",
    titleHighlight: "خبرې وکړو",
    subtitle:
      "پوښتنې، ډیمو، یا یوازې غواړئ وګورئ چې څنګه کار کوي؟ اړیکه ونیسئ — موږ معمولاً په څو ساعتونو کې ځواب ورکوو.",
    loading: "بارول…",
    methodsLabel: "مستقیم اړیکه",
    phoneLabel: "زنگ ووهئ",
    phoneValue: "+93 70 000 0000",
    emailLabel: "بریښنالیک",
    emailValue: "info@Melmah.af",
    whatsappLabel: "واټساپ",
    whatsappValue: "زموږ سره خبرې وکړئ",
    whatsappCta: "واټساپ پرانیزئ",
    hoursLabel: "کاري ساعتونه",
    hoursValue: "یکشنبه – پنجشنبه، ۸:۰۰ – ۱۷:۰۰",
    addressLabel: "موږ وګورئ",
    addressValue: "کابل، افغانستان",
    formLabel: "موږ ته پیغام ولېږئ",
    nameLabel: "ستاسو نوم",
    namePlaceholder: "احمد خان",
    hotelLabel: "د هوټل نوم",
    hotelPlaceholder: "کابل ستار هوټل",
    emailFormLabel: "ستاسو بریښنالیک",
    emailFormPlaceholder: "you@yourhotel.com",
    messageLabel: "پیغام",
    messagePlaceholder: "د خپل هوټل په اړه یو څه ووایاست او څه پوهیدل غواړئ.",
    sendButton: "د واټساپ له لارې ولېږئ",
    sendHint: "دا واټساپ د لیږلو لپاره چمتو پیغام سره پرانیزي.",
    requiredError: "مهرباني وکړئ نوم او پیغام ډک کړئ.",
    sentTitle: "د لیږلو لپاره چمتو",
    sentBody:
      "واټساپ په نوي ټب کې ستاسو پیغام سره پرانیستل شو. که نه، لاندې تڼۍ ووهئ.",
    openAgain: "واټساپ بیا پرانیزئ",
  },
  prs: {
    badge: "تماس با ما",
    titleA: "بیایید درباره هوتل شما",
    titleHighlight: "صحبت کنیم",
    subtitle:
      "سوال، دمو، یا فقط می‌خواهید ببینید چطور کار می‌کند؟ تماس بگیرید — معمولاً در چند ساعت پاسخ می‌دهیم.",
    loading: "در حال بارگذاری…",
    methodsLabel: "تماس مستقیم",
    phoneLabel: "تماس تلفنی",
    phoneValue: "+93 70 000 0000",
    emailLabel: "ایمیل",
    emailValue: "info@Melmah.af",
    whatsappLabel: "واتس‌اپ",
    whatsappValue: "با ما چت کنید",
    whatsappCta: "باز کردن واتس‌اپ",
    hoursLabel: "ساعات کاری",
    hoursValue: "یکشنبه – پنجشنبه، ۸:۰۰ – ۱۷:۰۰",
    addressLabel: "ما را ببینید",
    addressValue: "کابل، افغانستان",
    formLabel: "برای ما پیام بفرستید",
    nameLabel: "نام شما",
    namePlaceholder: "احمد خان",
    hotelLabel: "نام هوتل",
    hotelPlaceholder: "هوتل ستاره کابل",
    emailFormLabel: "ایمیل شما",
    emailFormPlaceholder: "you@yourhotel.com",
    messageLabel: "پیام",
    messagePlaceholder: "کمی از هوتل خود بگویید و چه می‌خواهید بدانید.",
    sendButton: "ارسال از طریق واتس‌اپ",
    sendHint: "این واتس‌اپ را با پیام آماده باز می‌کند.",
    requiredError: "لطفاً نام و پیام خود را وارد کنید.",
    sentTitle: "آماده ارسال",
    sentBody:
      "واتس‌اپ در تب جدید با پیام شما باز شد. اگر باز نشد، دکمه زیر را بزنید.",
    openAgain: "واتس‌اپ را دوباره باز کنید",
  },
};

export default function ContactPage() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  const [form, setForm] = useState({
    name: "",
    hotel: "",
    email: "",
    message: "",
  });
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [lastUrl, setLastUrl] = useState("");

  const lang = contactText[language] ? language : "en";
  const t = contactText[lang];
  const isRTL = lang === "ps" || lang === "prs";

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    document.documentElement.setAttribute("lang", lang);
    document.documentElement.setAttribute("dir", isRTL ? "rtl" : "ltr");
  }, [lang, mounted, isRTL]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function buildWhatsAppUrl() {
    const lines = [
      `${t.formLabel}:`,
      "",
      `${t.nameLabel}: ${form.name}`,
      form.hotel ? `${t.hotelLabel}: ${form.hotel}` : null,
      form.email ? `${t.emailFormLabel}: ${form.email}` : null,
      "",
      form.message,
    ]
      .filter(Boolean)
      .join("\n");

    return `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;
  }

  function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.name.trim() || !form.message.trim()) {
      setError(t.requiredError);
      return;
    }

    const url = buildWhatsAppUrl();
    setLastUrl(url);
    window.open(url, "_blank", "noopener,noreferrer");
    setSent(true);
  }

  if (!mounted) {
    return <LoadingScreen text={contactText.en.loading} fullScreen />;
  }

  return (
    <div
      className={`${displayFont.variable} relative min-h-screen overflow-x-hidden bg-[#15121C] text-[#F0EAE2]`}
    >
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full opacity-[0.04]"
        viewBox="0 0 300 300"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden="true"
      >
        {Array.from({ length: 12 }).map((_, row) =>
          Array.from({ length: 12 }).map((_, col) => (
            <rect
              key={`${row}-${col}`}
              x={10 + col * 36}
              y={10 + row * 36}
              width="18"
              height="18"
              rx="4"
              fill="none"
              stroke="#F0EAE2"
              strokeWidth="1"
            />
          )),
        )}
      </svg>

      <div
        className="blob-a pointer-events-none absolute -top-24 -left-24 h-96 w-96 rounded-full bg-[#C9A227]/10 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="blob-b pointer-events-none absolute top-40 -right-32 h-96 w-96 rounded-full bg-[#C9A227]/8 blur-3xl"
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-6 py-20 sm:py-24">
        {/* Hero */}
        <div className="text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#C9A227]/40 bg-[#C9A227]/10 px-3 py-1 text-xs font-semibold text-[#C9A227]">
            <Sparkles size={12} />
            {t.badge}
          </span>

          <h1
            className="mt-5 text-4xl font-medium tracking-tight text-[#F0EAE2] sm:text-5xl"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {t.titleA}{" "}
            <span
              className={"text-[#C9A227] " + (isRTL ? "not-italic" : "italic")}
            >
              {t.titleHighlight}
            </span>
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-[#B7B2C4] sm:text-base">
            {t.subtitle}
          </p>
        </div>

        {/* Two-column: methods (left) + form (right) */}
        <div className="mt-16 grid gap-8 lg:grid-cols-[1fr_1.4fr]">
          {/* Contact methods */}
          <div>
            <h2
              className="text-xs font-semibold uppercase tracking-[0.25em] text-[#C9A227]"
              style={{ fontFamily: "var(--font-geist-mono)" }}
            >
              {t.methodsLabel}
            </h2>

            <div className="mt-5 space-y-3">
              {/* Phone */}
              <a
                href={`tel:${t.phoneValue.replace(/\s/g, "")}`}
                className="group flex items-start gap-3 rounded-xl border border-[#2E2938] bg-[#1E1B26]/80 p-4 transition-all duration-200 hover:border-[#C9A227]/40 hover:bg-[#1E1B26]"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] transition-transform duration-200 group-hover:scale-110">
                  <Phone size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wide text-[#6E687A]">
                    {t.phoneLabel}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-[#F0EAE2] group-hover:text-[#E0B93A]">
                    {t.phoneValue}
                  </span>
                </span>
              </a>

              {/* Email */}
              <a
                href={`mailto:${t.emailValue}`}
                className="group flex items-start gap-3 rounded-xl border border-[#2E2938] bg-[#1E1B26]/80 p-4 transition-all duration-200 hover:border-[#C9A227]/40 hover:bg-[#1E1B26]"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] transition-transform duration-200 group-hover:scale-110">
                  <Mail size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wide text-[#6E687A]">
                    {t.emailLabel}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-[#F0EAE2] group-hover:text-[#E0B93A]">
                    {t.emailValue}
                  </span>
                </span>
              </a>

              {/* WhatsApp */}
              <a
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3 rounded-xl border border-[#2E2938] bg-[#1E1B26]/80 p-4 transition-all duration-200 hover:border-[#C9A227]/40 hover:bg-[#1E1B26]"
              >
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707] transition-transform duration-200 group-hover:scale-110">
                  <MessageCircle size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wide text-[#6E687A]">
                    {t.whatsappLabel}
                  </span>
                  <span className="mt-0.5 block truncate text-sm font-medium text-[#F0EAE2] group-hover:text-[#E0B93A]">
                    {t.whatsappValue}
                  </span>
                </span>
              </a>

              {/* Hours */}
              <div className="flex items-start gap-3 rounded-xl border border-[#2E2938] bg-[#1E1B26]/80 p-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#2E2938] bg-[#15121C] text-[#C9A227]">
                  <Clock size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wide text-[#6E687A]">
                    {t.hoursLabel}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium text-[#F0EAE2]">
                    {t.hoursValue}
                  </span>
                </span>
              </div>

              {/* Address */}
              <div className="flex items-start gap-3 rounded-xl border border-[#2E2938] bg-[#1E1B26]/80 p-4">
                <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg border border-[#2E2938] bg-[#15121C] text-[#C9A227]">
                  <MapPin size={16} />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-xs uppercase tracking-wide text-[#6E687A]">
                    {t.addressLabel}
                  </span>
                  <span className="mt-0.5 block text-sm font-medium text-[#F0EAE2]">
                    {t.addressValue}
                  </span>
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="rounded-2xl border border-[#2E2938] bg-[#1E1B26]/90 p-7 backdrop-blur-sm sm:p-8">
            <h2
              className="text-lg font-medium text-[#F0EAE2]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              {t.formLabel}
            </h2>

            {sent ? (
              <div className="mt-6 rounded-xl border border-[#C9A227]/40 bg-[#C9A227]/5 p-5">
                <div className="flex items-center gap-2 text-[#E0B93A]">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-[#E0B93A] to-[#A9821E] text-[#1D1707]">
                    <Check size={16} />
                  </span>
                  <span
                    className="text-base font-medium"
                    style={{ fontFamily: "var(--font-display)" }}
                  >
                    {t.sentTitle}
                  </span>
                </div>
                <p className="mt-3 text-sm leading-relaxed text-[#B7B2C4]">
                  {t.sentBody}
                </p>
                <a
                  href={lastUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] px-4 py-2 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30"
                >
                  <MessageCircle size={14} />
                  {t.openAgain}
                </a>
                <button
                  type="button"
                  onClick={() => setSent(false)}
                  className="ms-3 text-xs text-[#9691A6] underline-offset-2 hover:text-[#C9A227] hover:underline"
                >
                  {lang === "en"
                    ? "Send another"
                    : lang === "ps"
                      ? "بل ولېږئ"
                      : "ارسال دیگری"}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="mt-5 space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#F0EAE2]">
                      {t.nameLabel}
                    </label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => update("name", e.target.value)}
                      placeholder={t.namePlaceholder}
                      required
                      className="w-full rounded-lg border border-[#332C3E] bg-[#161320] px-3 py-2.5 text-sm text-[#F0EAE2] placeholder:text-[#5E5670] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                    />
                  </div>

                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-[#F0EAE2]">
                      {t.hotelLabel}
                    </label>
                    <input
                      type="text"
                      value={form.hotel}
                      onChange={(e) => update("hotel", e.target.value)}
                      placeholder={t.hotelPlaceholder}
                      className="w-full rounded-lg border border-[#332C3E] bg-[#161320] px-3 py-2.5 text-sm text-[#F0EAE2] placeholder:text-[#5E5670] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#F0EAE2]">
                    {t.emailFormLabel}
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    placeholder={t.emailFormPlaceholder}
                    className="w-full rounded-lg border border-[#332C3E] bg-[#161320] px-3 py-2.5 text-sm text-[#F0EAE2] placeholder:text-[#5E5670] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-[#F0EAE2]">
                    {t.messageLabel}
                  </label>
                  <textarea
                    value={form.message}
                    onChange={(e) => update("message", e.target.value)}
                    placeholder={t.messagePlaceholder}
                    rows={5}
                    required
                    className="w-full resize-none rounded-lg border border-[#332C3E] bg-[#161320] px-3 py-2.5 text-sm text-[#F0EAE2] placeholder:text-[#5E5670] outline-none transition-colors focus:border-[#C9A227] focus:ring-2 focus:ring-[#C9A227]/20"
                  />
                </div>

                {error && (
                  <div className="rounded-lg border-s-4 border-[#E5484D] bg-[#E5484D]/10 px-3 py-2 text-sm text-[#FF9B9E]">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  className="group flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-[#C9A227] to-[#A9821E] py-3 text-sm font-semibold text-[#1D1707] shadow-md shadow-[#C9A227]/20 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#C9A227]/30 active:translate-y-0 active:scale-[0.98]"
                >
                  <Send
                    size={15}
                    className="transition-transform duration-200 group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5"
                  />
                  {t.sendButton}
                </button>

                <p className="text-center text-xs text-[#6E687A]">
                  {t.sendHint}
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Back to home */}
        <div className="mt-16 text-center">
          <Link
            href="/"
            className="text-sm text-[#9691A6] underline-offset-2 hover:text-[#C9A227] hover:underline"
          >
            {lang === "en"
              ? "← Back to home"
              : lang === "ps"
                ? "← کور ته بیرته"
                : "← بازگشت به خانه"}
          </Link>
        </div>
      </div>

      <style jsx>{`
        @keyframes drift-a {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(30px, 40px);
          }
        }
        @keyframes drift-b {
          0%,
          100% {
            transform: translate(0, 0);
          }
          50% {
            transform: translate(-40px, 30px);
          }
        }
        .blob-a {
          animation: drift-a 11s ease-in-out infinite;
        }
        .blob-b {
          animation: drift-b 13s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .blob-a,
          .blob-b {
            animation: none !important;
          }
        }
      `}</style>
    </div>
  );
}
