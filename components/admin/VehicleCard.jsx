"use client";

import Image from "next/image";
import Link from "next/link";
import { memo } from "react";
import { Users, Package, Droplet, Wrench, Snowflake, ArrowUpRight } from "lucide-react";

const capacityConfig = {
  taxi: { icon: Users, label: "Seats" },
  truck: { icon: Package, label: "Tons" },
  "dump-truck": { icon: Package, label: "Tons" },
  tanker: { icon: Droplet, label: "Liters" },
  loader: { icon: Wrench, label: "m³ Bucket" },
};

function VehicleCard({ vehicle, priority = false }) {
  const config = capacityConfig[vehicle.type] || { icon: Package, label: "Capacity" };
  const CapIcon = config.icon;
  const capacityDisplay =
    vehicle.type === "tanker" ? vehicle.capacityValue?.toLocaleString() : vehicle.capacityValue;

  return (
    <Link href={`/${vehicle.type}/${vehicle.id}`} prefetch={false}>
      <div className="group bg-white dark:bg-gray-800 rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1.5 cursor-pointer border border-gray-100 dark:border-gray-700">
        {/* Image — only ONE image ever ships for a card; priority is limited
            to the first row so we don't force-load everything above the fold at once */}
        <div className="relative h-48 w-full bg-gray-100 dark:bg-gray-700 overflow-hidden">
          {vehicle.image ? (
            <Image
              src={vehicle.image}
              alt={vehicle.name}
              fill
              priority={priority}
              loading={priority ? undefined : "lazy"}
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover group-hover:scale-105 transition-transform duration-500"
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center text-gray-300 dark:text-gray-600 text-xs">
              No image
            </div>
          )}
          <div className="absolute bottom-3 left-3 inline-flex items-center gap-1.5 bg-teal-600 dark:bg-teal-500 text-white text-xs font-semibold px-3 py-1.5 rounded-full shadow-md">
            <CapIcon size={13} />
            {capacityDisplay ?? "N/A"} {config.label}
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate">{vehicle.name}</h3>

          <div className="mt-2.5 flex flex-wrap gap-1.5">
            {vehicle.ac !== null && vehicle.ac !== undefined && (
              <span className="inline-flex items-center gap-1 text-[11px] bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                <Snowflake size={11} />
                {vehicle.ac ? "AC" : "No AC"}
              </span>
            )}
            {vehicle.transmission && (
              <span className="text-[11px] bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                {vehicle.transmission}
              </span>
            )}
            {vehicle.fuel && (
              <span className="text-[11px] bg-gray-100 dark:bg-gray-700/70 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-full">
                {vehicle.fuel}
              </span>
            )}
          </div>

          <div className="mt-4 flex items-center justify-between">
            {vehicle.pricePerDay != null && (
              <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
                {vehicle.pricePerDay} / day
              </span>
            )}
            <span className="inline-flex items-center gap-1 text-sm font-semibold text-teal-600 dark:text-teal-400 group-hover:gap-1.5 transition-all">
              Details
              <ArrowUpRight size={15} />
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

// Memoized so appending pages during infinite scroll doesn't re-render
// every existing card, only the new ones.
export default memo(VehicleCard);
