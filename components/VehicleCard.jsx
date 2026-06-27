"use client";

import Image from "next/image";
import Link from "next/link";

export default function VehicleCard({ vehicle }) {
  const imageUrl = vehicle.images?.[0] || "/tax.png";

  // Determine primary capacity label and value
  let capacityLabel = "";
  let capacityValue = "";
  switch (vehicle.type) {
    case "taxi":
      capacityLabel = "Seats";
      capacityValue = vehicle.passengerCapacity;
      break;
    case "truck":
    case "dump":
      capacityLabel = "Load (tons)";
      capacityValue = vehicle.loadTons;
      break;
    case "tanker":
      capacityLabel = "Capacity (liters)";
      capacityValue = vehicle.capacityLiters;
      break;
    case "loader":
      capacityLabel = "Bucket (m³)";
      capacityValue = vehicle.bucketCapacity;
      break;
    default:
      capacityLabel = "Capacity";
      capacityValue = "N/A";
  }

  return (
    <Link href={`/${vehicle.type}/${vehicle.id}`}>
      <div className="group bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer border border-gray-100 dark:border-gray-700">
        <div className="relative h-48 w-full bg-gray-200 dark:bg-gray-700">
          <Image
            src={imageUrl}
            alt={vehicle.name}
            fill
            className="object-cover group-hover:scale-105 transition duration-500"
          />
        </div>
        <div className="p-4">
          <h3 className="text-xl font-bold text-gray-800 dark:text-white">
            {vehicle.name}
          </h3>
          <div className="mt-2 flex items-center gap-4 text-sm text-gray-600 dark:text-gray-300">
            <span className="flex items-center gap-1">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4"
                />
              </svg>
              {capacityValue} {capacityLabel}
            </span>
            {vehicle.ac !== undefined && (
              <span className="flex items-center gap-1">
                {vehicle.ac ? "AC" : "No AC"}
              </span>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            {vehicle.transmission && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full">
                {vehicle.transmission}
              </span>
            )}
            {vehicle.fuel && (
              <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full">
                {vehicle.fuel}
              </span>
            )}
          </div>
          <div className="mt-4 flex justify-end">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400 group-hover:underline">
              View details →
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
