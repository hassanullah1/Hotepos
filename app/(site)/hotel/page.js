// app/page.js
"use client";

import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, ArrowLeft } from "lucide-react";
import LoadingScreen from "@/components/LoadingScreen";
import Hero from "@/components/Hero";
import AppShowcase from "@/components/AppShowcase";
import { pageText } from "@/lib/pageText"; // move your translation copy object here

import KitchenTV from "@/components/KitchenBoard";

import AdminShowcase from "@/components/AdminShowcase";

// Placeholder stats — wire up to real counts once the registration backend exists.
const stats = { hotels: "40+", cities: "6", orders: "12,000+" };

export default function Home() {
  const { language } = useLanguage();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return (
      <LoadingScreen
        text={pageText.en.loading}
        brandName="Melmah"
        subtitle="Hotel Management System"
        size="md"
      />
    );
  }

  const text = pageText[language] || pageText.en;
  const lang = pageText[language] ? language : "en";
  const isRTL = lang === "ps" || lang === "prs";
  const ArrowIcon = isRTL ? ArrowLeft : ArrowRight;

  const goToRegister = () => router.push("/pricing");

  const scrollToHow = () => router.push("/hotel/login");

  return (
    <div className="min-h-screen">
      <Hero
        text={text}
        stats={stats}
        ArrowIcon={ArrowIcon}
        onPrimaryCta={goToRegister}

        onSecondaryCta={scrollToHow}
      />
      <div id="how-it-works">
        <AppShowcase text={text} />
      </div>
      <div id="kitchen-screen">
        {" "}
        <KitchenTV />
      </div>
      <div id="admin-showcase">
        <AdminShowcase text={text} />
      </div>
      {/* Next sections (pricing, testimonials, footer, etc.) get added here
          the same way — one component each. */}
    </div>
  );
}
