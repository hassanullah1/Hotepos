"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  ArrowLeft,
  Copy,
  Check,
  Snowflake,
  Settings,
  Fuel,
  Loader2,
} from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";
import { vehiclesData } from "@/data/icons";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

// UI translations for the detail page
const detailTranslations = {
  en: {
    back: "Back to {type}s",
    acLabel: "AC",
    yes: "Yes",
    no: "No",
    transmissionLabel: "Transmission",
    fuelLabel: "Fuel",
    orderWhatsApp: "Order on WhatsApp",
    copyMessage: "Copy Message",
    copied: "Copied!",
    currencyUnit: "currency units / day",
    notFoundTitle: "Vehicle not found",
    whatsappMessage: `Hi! I'm interested in the {name}.
Price: {price} / day
Notes: {description}

Please let me know availability and price. Thank you!`,
  },
  ps: {
    back: "بېرته {type} ته",
    acLabel: "یخچال",
    yes: "هو",
    no: "نه",
    transmissionLabel: "ګیربکس",
    fuelLabel: "سوځ",
    orderWhatsApp: "په واټس اپ امر وکړئ",
    copyMessage: "پیغام کاپي کړئ",
    copied: "کاپي شو!",
    currencyUnit: "د اسعارو واحد / ورځ",
    notFoundTitle: "موټر ونه موندل شو",
    whatsappMessage: `سلام! زه د {name} موټر سره علاقه لرم.
بیه: {price} / ورځ
نوټونه: {description}

مهرباني وکړئ ما ته د شتون او بیه په اړه معلومات راکړئ. مننه!`,
  },
  prs: {
    back: "بازگشت به {type}",
    acLabel: "یخچال",
    yes: "بله",
    no: "نه",
    transmissionLabel: "گیربکس",
    fuelLabel: "سوخت",
    orderWhatsApp: "سفارش در واتس‌اپ",
    copyMessage: "کپی پیام",
    copied: "کپی شد!",
    currencyUnit: "واحد پول / روز",
    notFoundTitle: "وسیله پیدا نشد",
    whatsappMessage: `سلام! من به {name} علاقه دارم.
قیمت: {price} / روز
توضیحات: {description}

لطفاً در مورد موجودی و قیمت به من اطلاع دهید. متشکرم!`,
  },
};

export default function VehicleDetail() {
  const { vehicleType, id } = useParams();
  const { language } = useLanguage(); // 'en', 'ps', or 'prs'
  const t = detailTranslations[language] || detailTranslations.en;
  const localizedVehicles = vehiclesData[language] || vehiclesData.en;
  const localizedVehicle = localizedVehicles.find((v) => v.id === vehicleType);

  const [vehicle, setVehicle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [images, setImages] = useState({});
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [loadingIndex, setLoadingIndex] = useState(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetch(`/api/vehicles/${id}`)
      .then((res) => {
        if (!res.ok) throw new Error("Vehicle not found");
        return res.json();
      })
      .then((data) => {
        if (cancelled) return;
        // Merge API data with localized name/description from static data
        setVehicle({
          ...data,
          name: localizedVehicle?.name || data.name,
          description: localizedVehicle?.description || data.description,
        });
        setImages({ 0: data.image });
        setSelectedIndex(0);
      })
      .catch((err) => !cancelled && setError(err.message))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [id, localizedVehicle]);

  // Background image loading for thumbnails (same as before)
  useEffect(() => {
    if (!vehicle || vehicle.imageCount <= 1) return;
    let cancelled = false;

    async function loadRemaining() {
      for (let idx = 1; idx < vehicle.imageCount; idx++) {
        if (cancelled) return;
        let alreadyHave = false;
        setImages((prev) => {
          alreadyHave = Boolean(prev[idx]);
          return prev;
        });
        if (alreadyHave) continue;

        setLoadingIndex(idx);
        try {
          const res = await fetch(`/api/vehicles/${id}/images?index=${idx}`);
          if (!res.ok) continue;
          const data = await res.json();
          if (cancelled) return;
          setImages((prev) =>
            prev[idx] ? prev : { ...prev, [idx]: data.image },
          );
        } catch {
          // skip this one
        }
      }
      if (!cancelled) setLoadingIndex(null);
    }

    loadRemaining();
    return () => {
      cancelled = true;
    };
  }, [vehicle, id]);

  const selectImage = useCallback(
    async (index) => {
      setSelectedIndex(index);
      if (images[index] || loadingIndex === index) return;
      setLoadingIndex(index);
      try {
        const res = await fetch(`/api/vehicles/${id}/images?index=${index}`);
        if (!res.ok) throw new Error("Image not found");
        const data = await res.json();
        setImages((prev) => ({ ...prev, [index]: data.image }));
      } catch {
        // ignore
      } finally {
        setLoadingIndex(null);
      }
    },
    [id, images, loadingIndex],
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-gray-100 dark:from-black dark:to-zinc-900">
        <Loader2 className="animate-spin text-teal-600" size={28} />
      </div>
    );
  }

  if (error || !vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-zinc-50 to-gray-100 dark:from-black dark:to-zinc-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            {t.notFoundTitle}
          </h1>
          <Link
            href={`/${vehicleType}`}
            className="text-teal-600 dark:text-teal-400 underline mt-4 block"
          >
            {t.back.replace("{type}", vehicleType)}
          </Link>
        </div>
      </div>
    );
  }

  const specRows = [
    ...vehicle.specs,
    {
      icon: Snowflake,
      label: t.acLabel,
      value: vehicle.ac ? t.yes : t.no,
    },
    { icon: Settings, label: t.transmissionLabel, value: vehicle.transmission },
    { icon: Fuel, label: t.fuelLabel, value: vehicle.fuel },
  ];

  // Build localized WhatsApp message
  const message = t.whatsappMessage
    .replace("{name}", vehicle.name)
    .replace("{price}", vehicle.pricePerDay ?? "-")
    .replace("{description}", vehicle.description ?? "");

  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(
    /[^0-9]/g,
    "",
  )}?text=${encodeURIComponent(message)}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const activeImage = images[selectedIndex];

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-gray-100 dark:from-black dark:to-zinc-900 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/${vehicleType}`}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-teal-600 dark:hover:text-teal-400 mb-6 transition"
        >
          <ArrowLeft size={16} />
          {t.back.replace("{type}", vehicleType)}
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-xl border border-gray-100 dark:border-gray-700">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="p-4">
              <div className="relative h-80 w-full bg-gray-100 dark:bg-gray-700 rounded-2xl overflow-hidden">
                {activeImage ? (
                  <Image
                    src={activeImage}
                    alt={vehicle.name}
                    fill
                    priority
                    className="object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Loader2 className="animate-spin text-gray-400" size={22} />
                  </div>
                )}
              </div>

              {vehicle.imageCount > 1 && (
                <div className="flex gap-2 mt-4 justify-center">
                  {Array.from({ length: vehicle.imageCount }).map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => selectImage(idx)}
                      aria-label={`View photo ${idx + 1}`}
                      className={`relative w-16 h-16 rounded-xl overflow-hidden border-2 transition flex items-center justify-center bg-gray-100 dark:bg-gray-700 ${
                        selectedIndex === idx
                          ? "border-teal-500"
                          : "border-transparent opacity-70 hover:opacity-100"
                      }`}
                    >
                      {images[idx] ? (
                        <Image
                          src={images[idx]}
                          alt={`${vehicle.name} ${idx + 1}`}
                          fill
                          className="object-cover"
                        />
                      ) : loadingIndex === idx ? (
                        <Loader2
                          className="animate-spin text-gray-400"
                          size={16}
                        />
                      ) : (
                        <span className="text-xs text-gray-400">{idx + 1}</span>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details & Order */}
            <div className="p-6 md:p-8 md:pl-0">
              <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                {vehicle.name}
              </h1>

              {vehicle.pricePerDay != null && (
                <div className="mt-2 inline-flex items-baseline gap-1 text-teal-600 dark:text-teal-400">
                  <span className="text-2xl font-bold">
                    {vehicle.pricePerDay}
                  </span>
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t.currencyUnit}
                  </span>
                </div>
              )}

              <div className="mt-5 divide-y divide-gray-100 dark:divide-gray-700 border-y border-gray-100 dark:border-gray-700">
                {specRows.map((row, i) => {
                  const Icon = row.icon;
                  return (
                    <div key={i} className="flex items-center gap-3 py-2.5">
                      {Icon && (
                        <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-50 dark:bg-gray-700/60 text-gray-500 dark:text-gray-300 shrink-0">
                          <Icon size={15} />
                        </span>
                      )}
                      <span className="text-sm text-gray-500 dark:text-gray-400 w-36">
                        {row.label}
                      </span>
                      <span className="text-sm font-medium text-gray-800 dark:text-white">
                        {row.value ?? "-"}
                      </span>
                    </div>
                  );
                })}
              </div>

              {vehicle.description && (
                <p className="mt-4 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {vehicle.description}
                </p>
              )}

              <div className="mt-6 flex flex-col sm:flex-row gap-3">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2.5 px-4 rounded-xl transition"
                >
                  {t.orderWhatsApp}
                </a>
                <button
                  onClick={copyToClipboard}
                  className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-200 font-semibold py-2.5 px-4 rounded-xl transition"
                >
                  {copied ? <Check size={16} /> : <Copy size={16} />}
                  {copied ? t.copied : t.copyMessage}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
