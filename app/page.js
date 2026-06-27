// app/page.js
"use client";

import Image from "next/image";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";
import { useEffect, useState } from "react";

// Vehicle data with localized names and descriptions
const vehiclesData = {
  en: [
    {
      id: "taxi",
      name: "City Taxi",
      description: "Quick & comfortable urban rides",
      imageUrl: "/taxi.png",
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: "loader",
      name: "Wheel Loader",
      description: "Heavy construction & earthmoving",
      imageUrl: "/load.png",
      color: "from-gray-700 to-gray-900",
    },
    {
      id: "tanker",
      name: "Fuel Tanker",
      description: "Safe liquid & fuel transport",
      imageUrl: "/tank.png",
      color: "from-blue-600 to-blue-800",
    },
    {
      id: "truck",
      name: "Heavy Truck",
      description: "Powerful long‑haul freight",
      imageUrl: "/tr.png",
      color: "from-red-600 to-red-800",
    },
    {
      id: "dump-truck",
      name: "Dump Truck",
      description: "Massive loads for mining & construction",
      imageUrl: "/dumptruck.png",
      color: "from-green-700 to-emerald-900",
    },
  ],
  ps: [
    {
      id: "taxi",
      name: "د ښار ټکسي",
      description: "چټک او راحته ښاري سفرونه",
      imageUrl: "/taxi.png",
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: "loader",
      name: "ویل لوډر",
      description: "د درنو ساختماني کارونو لپاره",
      imageUrl: "/load.png",
      color: "from-gray-700 to-gray-900",
    },
    {
      id: "tanker",
      name: "د تیلو ټانکر",
      description: "خوندي لېږد د تیلو او مایعاتو",
      imageUrl: "/tank.png",
      color: "from-blue-600 to-blue-800",
    },
    {
      id: "truck",
      name: "درن ټرک",
      description: "د لیرې واټنونو لپاره پیاوړی بار وړونکی",
      imageUrl: "/tr.png",
      color: "from-red-600 to-red-800",
    },
    {
      id: "dump-truck",
      name: "ډمپ ټرک",
      description: "د کان کیندنې او ساختماني درندو بارونو لپاره",
      imageUrl: "/dumptruck.png",
      color: "from-green-700 to-emerald-900",
    },
  ],
  prs: [
    {
      id: "taxi",
      name: "تاکسی شهری",
      description: "سفرهای سریع و راحت شهری",
      imageUrl: "/taxi.png",
      color: "from-yellow-400 to-orange-500",
    },
    {
      id: "loader",
      name: "ویل لودر",
      description: "برای کارهای سنگین ساختمانی و خاکبرداری",
      imageUrl: "/load.png",
      color: "from-gray-700 to-gray-900",
    },
    {
      id: "tanker",
      name: "تانکر سوخت",
      description: "حمل و نقل ایمن مایعات و سوخت",
      imageUrl: "/tank.png",
      color: "from-blue-600 to-blue-800",
    },
    {
      id: "truck",
      name: "تراک سنگین",
      description: "باربری قدرتمند برای مسافت‌های طولانی",
      imageUrl: "/tr.png",
      color: "from-red-600 to-red-800",
    },
    {
      id: "dump-truck",
      name: "کمپرسی",
      description: "بارهای عظیم برای معدن و ساختمان",
      imageUrl: "/dumptruck.png",
      color: "from-green-700 to-emerald-900",
    },
  ],
};

// Localized static text
const pageText = {
  en: {
    title: "Our Fleet",
    subtitle: "Tap any icon to explore vehicle models",
    footer: "Click any card to see detailed options – local vehicle images",
  },
  ps: {
    title: "د کوهستان د وسایطو موندنې خدمات",
    subtitle:
      "خپله اړتیا وړ وسیله وټاکئ او د معلوماتو د لیدلو لپاره په آیکون کلیک وکړئ",
    footer:
      "د تفصيلي اختیارونو لپاره په هر کارت کلیک وکړئ – د موټر محلي انځورونه",
  },
  prs: {
    title: "ناوگان ما",
    subtitle: "برای دیدن مدل‌های وسایط روی هر آیکون کلیک کنید",
    footer: "برای گزینه‌های جزئی‌تر روی هر کارت کلیک کنید – تصاویر محلی وسایط",
  },
};

export default function Home() {
  const { language } = useLanguage();
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  if (!mounted) return null; // avoid hydration mismatch

  const vehicles = vehiclesData[language] || vehiclesData.en;
  const text = pageText[language] || pageText.en;

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-gray-100 dark:from-black dark:to-zinc-900 py-12 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-16">
          <h1 className="text-5xl md:text-6xl font-extrabold bg-gradient-to-r from-gray-800 to-gray-600 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
            {text.title}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-blue-400 to-purple-500 mx-auto mt-4 rounded-full" />
          <p className="mt-4 text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            {text.subtitle}
          </p>
        </div>

        {/* Responsive grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 md:gap-10">
          {vehicles.map((vehicle) => (
            <Link href={`/${vehicle.id}`} key={vehicle.id}>
              <div className="group flex flex-col items-center p-5 rounded-2xl bg-white/60 dark:bg-gray-800/40 backdrop-blur-sm shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-2 cursor-pointer border border-gray-100 dark:border-gray-700">
                <div className="relative w-36 h-36 md:w-40 md:h-40 rounded-full overflow-hidden shadow-md ring-2 ring-gray-200 dark:ring-gray-600 group-hover:ring-blue-400 transition-all duration-300 group-hover:scale-105 bg-white dark:bg-gray-800">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${vehicle.color} opacity-20 group-hover:opacity-30 transition z-0`}
                  />
                  <Image
                    src={vehicle.imageUrl}
                    alt={vehicle.name}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-110"
                    sizes="(max-width: 640px) 144px, 160px"
                  />
                </div>
                <div className="mt-4 text-center">
                  <h2 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                    {vehicle.name}
                  </h2>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 max-w-[140px]">
                    {vehicle.description}
                  </p>
                </div>
                <div className="mt-2 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-1 group-hover:translate-y-0">
                  <svg
                    className="w-4 h-4 text-blue-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-20 text-center text-xs text-gray-400 dark:text-gray-600">
          <p>{text.footer}</p>
        </div>
      </div>
    </div>
  );
}
