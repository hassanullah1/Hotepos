"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { vehiclesData, WHATSAPP_NUMBER } from "@/data/vehicles";
import { useState } from "react";

export default function VehicleDetail() {
  const { vehicleType, id } = useParams();
  const [selectedImage, setSelectedImage] = useState(0);
  const [copied, setCopied] = useState(false);

  const vehicle = vehiclesData.find(
    (v) => v.type === vehicleType && v.id === Number(id),
  );

  if (!vehicle) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Vehicle not found</h1>
          <Link
            href={`/${vehicleType}`}
            className="text-blue-500 underline mt-4 block"
          >
            Back to {vehicleType}s
          </Link>
        </div>
      </div>
    );
  }

  // Build WhatsApp message (Pashto) with type‑specific details
  let capacityText = "";
  let extraSpecs = "";

  switch (vehicle.type) {
    case "taxi":
      capacityText = `👥 د مسافرو ظرفیت: ${vehicle.passengerCapacity} کسان\n🧳 د سامان ظرفیت: ${vehicle.luggageCapacity} کڅوړې`;
      extraSpecs = `❄️ یخچال (AC): ${vehicle.ac ? "هو" : "نه"}\n⚙️ ګیر باکس: ${vehicle.transmission}\n⛽ سون توکي: ${vehicle.fuel}`;
      break;
    case "truck":
      capacityText = `📦 د بار ظرفیت: ${vehicle.loadTons} ټنه\n📏 د کارګو حجم: ${vehicle.cargoVolume} m³`;
      extraSpecs = `❄️ AC: ${vehicle.ac ? "هو" : "نه"}\n⚙️ ګیر باکس: ${vehicle.transmission}\n⛽ سون توکي: ${vehicle.fuel}`;
      break;
    case "dump":
      capacityText = `⛰️ د بار ظرفیت: ${vehicle.loadTons} ټنه\n📈 د ډمپ لوړوالی: ${vehicle.dumpHeight} متره`;
      extraSpecs = `⚙️ ګیر باکس: ${vehicle.transmission}\n⛽ سون توکي: ${vehicle.fuel}`;
      break;
    case "tanker":
      capacityText = `🧴 ظرفیت: ${vehicle.capacityLiters.toLocaleString()} لیتره\n💧 د مایع ډول: ${vehicle.liquidType}`;
      extraSpecs = `⚙️ ګیر باکس: ${vehicle.transmission}\n⛽ سون توکي: ${vehicle.fuel}`;
      break;
    case "loader":
      capacityText = `🪣 د بالټ ظرفیت: ${vehicle.bucketCapacity} m³\n⚖️ عملیاتي وزن: ${vehicle.operatingWeight} ټنه`;
      extraSpecs = `⚙️ ګیر باکس: ${vehicle.transmission}\n⛽ سون توکي: ${vehicle.fuel}`;
      break;
    default:
      capacityText = "";
      extraSpecs = "";
  }

  const message = `سلام! زه د ${vehicle.name} ته اړتیا لرم.
🌍 د موټر ډول: ${vehicle.name}
${capacityText}
${extraSpecs}
💰 بیا په هر کیلومتر: ${vehicle.pricePerKm} واحد
📝 نور معلومات: ${vehicle.description}

مهرباني وکړئ د شتون او نرخ په اړه راځواب کړئ. مننه!`;

  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${WHATSAPP_NUMBER.replace(/[^0-9]/g, "")}?text=${encodedMessage}`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(message);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-gray-100 dark:from-black dark:to-zinc-900 py-12 px-4 sm:px-6">
      <div className="max-w-5xl mx-auto">
        <Link
          href={`/${vehicleType}`}
          className="inline-flex items-center text-blue-600 dark:text-blue-400 mb-6 hover:underline"
        >
          ← Back to {vehicleType}s
        </Link>

        <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-xl">
          <div className="grid md:grid-cols-2 gap-8">
            {/* Image Gallery */}
            <div className="p-4">
              <div className="relative h-80 w-full bg-gray-200 dark:bg-gray-700 rounded-lg overflow-hidden">
                <Image
                  src={vehicle.images[selectedImage] || "/tax.png"}
                  alt={vehicle.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex gap-2 mt-4 justify-center">
                {vehicle.images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImage(idx)}
                    className={`relative w-16 h-16 rounded-md overflow-hidden border-2 ${
                      selectedImage === idx
                        ? "border-blue-500"
                        : "border-transparent"
                    }`}
                  >
                    <Image
                      src={img}
                      alt={`${vehicle.name} ${idx + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Details & Order */}
            <div className="p-6 md:p-8">
              <h1 className="text-3xl font-extrabold text-gray-800 dark:text-white">
                {vehicle.name}
              </h1>
              <div className="mt-4 space-y-3 text-gray-700 dark:text-gray-300">
                {/* Type‑specific details */}
                {vehicle.type === "taxi" && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Passengers:</span>
                      <span>{vehicle.passengerCapacity} persons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Luggage:</span>
                      <span>{vehicle.luggageCapacity} suitcases</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">AC:</span>
                      <span>{vehicle.ac ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Transmission:</span>
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Fuel:</span>
                      <span>{vehicle.fuel}</span>
                    </div>
                  </>
                )}

                {vehicle.type === "truck" && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Load capacity:</span>
                      <span>{vehicle.loadTons} tons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Cargo volume:</span>
                      <span>{vehicle.cargoVolume} m³</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">AC:</span>
                      <span>{vehicle.ac ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Transmission:</span>
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Fuel:</span>
                      <span>{vehicle.fuel}</span>
                    </div>
                  </>
                )}

                {vehicle.type === "dump" && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Load capacity:</span>
                      <span>{vehicle.loadTons} tons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Dump height:</span>
                      <span>{vehicle.dumpHeight} meters</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">AC:</span>
                      <span>{vehicle.ac ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Transmission:</span>
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Fuel:</span>
                      <span>{vehicle.fuel}</span>
                    </div>
                  </>
                )}

                {vehicle.type === "tanker" && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Capacity:</span>
                      <span>
                        {vehicle.capacityLiters.toLocaleString()} liters
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Liquid type:</span>
                      <span>{vehicle.liquidType}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">AC:</span>
                      <span>{vehicle.ac ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Transmission:</span>
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Fuel:</span>
                      <span>{vehicle.fuel}</span>
                    </div>
                  </>
                )}

                {vehicle.type === "loader" && (
                  <>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">
                        Bucket capacity:
                      </span>
                      <span>{vehicle.bucketCapacity} m³</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">
                        Operating weight:
                      </span>
                      <span>{vehicle.operatingWeight} tons</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">AC:</span>
                      <span>{vehicle.ac ? "Yes" : "No"}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Transmission:</span>
                      <span>{vehicle.transmission}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-semibold w-36">Fuel:</span>
                      <span>{vehicle.fuel}</span>
                    </div>
                  </>
                )}

                {/* Common price and description */}
                <div className="flex items-center gap-3">
                  <span className="font-semibold w-36">Price per km:</span>
                  <span>{vehicle.pricePerKm} currency units</span>
                </div>
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-gray-600 dark:text-gray-400">
                    {vehicle.description}
                  </p>
                </div>
              </div>

              {/* Order Buttons */}
              <div className="mt-6 flex flex-col sm:flex-row gap-4">
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.414 3.488 2.245 2.248 3.482 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.306 1.654zm6.597-3.807c1.676.972 3.6 1.488 5.572 1.488 5.469 0 9.923-4.452 9.925-9.922.001-2.645-1.026-5.128-2.89-6.992-1.864-1.864-4.347-2.889-6.992-2.889-5.473 0-9.927 4.454-9.928 9.925 0 1.756.457 3.476 1.328 4.987l1.312 2.2-1.405 1.324-1.312-2.084zm2.252-7.392c.879-.284 1.574.12 1.743.284.17.164.543.96.686 1.315.144.355.077.655-.072.861-.148.206-.58.666-.758.822-.179.156-.347.28-.638.052-.291-.228-1.207-.597-2.261-1.276-1.094-.706-1.851-1.623-2.08-2.122-.229-.499-.156-.8.109-1.071.265-.271.603-.723.845-.972.242-.249.323-.437.48-.756.158-.319.079-.597-.04-.822-.12-.225-.686-1.642-.942-2.249-.248-.591-.5-.5-.688-.5-.165 0-.309-.02-.463-.02-.277 0-.724.107-1.098.521-.374.414-1.424 1.397-1.424 3.397 0 2 1.428 3.94 1.628 4.212.2.272 2.787 4.252 6.69 5.936.974.419 1.753.688 2.353.882.981.301 1.873.257 2.578.155.786-.115 1.496-.456 1.903-.919.407-.463.6-.98.658-1.404.058-.424-.031-.828-.16-1.066-.13-.238-.503-.682-1.04-.972-.537-.289-1.074-.463-1.192-.513-.118-.05-.217-.075-.307.075-.09.15-.347.463-.473.589-.126.126-.252.166-.466.05-.214-.116-1.067-.564-2.023-1.25-1.144-.821-1.994-1.806-2.213-2.122-.166-.227-.018-.362.123-.476.141-.114.314-.26.44-.387.125-.126.166-.228.25-.378.083-.15.041-.27-.021-.378-.061-.108-.514-1.237-.703-1.693-.19-.456-.386-.39-.517-.39-.13 0-.273-.02-.393-.02-.2 0-.514.074-.786.374-.272.3-1.042 1.02-1.042 2.494 0 1.474 1.07 2.896 1.22 3.094.15.198 2.105 3.222 5.099 4.528.73.32 1.305.51 1.752.655.756.24 1.447.206 1.991.124.618-.093 1.168-.376 1.526-.756.358-.38.569-.845.633-1.442.064-.597-.065-1.164-.216-1.328-.151-.164-.43-.3-.726-.424z" />
                  </svg>
                  Order on WhatsApp
                </a>
                <button
                  onClick={copyToClipboard}
                  className="flex items-center justify-center gap-2 bg-gray-600 hover:bg-gray-700 text-white font-semibold py-2 px-4 rounded-lg transition"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2m0 0h2a2 2 0 012 2v3m2 4H10m0 0l3-3m-3 3l3 3"
                    />
                  </svg>
                  {copied ? "Copied!" : "Copy Message"}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
