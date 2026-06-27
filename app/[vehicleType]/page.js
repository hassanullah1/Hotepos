"use client";

import { useParams } from "next/navigation";
import { useState } from "react";
import VehicleCard from "@/components/VehicleCard";
import { vehiclesData } from "@/data/vehicles";

export default function VehicleList() {
  const { vehicleType } = useParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [minCapacity, setMinCapacity] = useState(0);
  const [acOnly, setAcOnly] = useState(false);

  // Filter vehicles by type from URL
  const vehiclesOfType = vehiclesData.filter((v) => v.type === vehicleType);

  // Helper to get capacity value based on type
  const getCapacityValue = (vehicle) => {
    switch (vehicle.type) {
      case "taxi":
        return vehicle.passengerCapacity;
      case "truck":
      case "dump":
        return vehicle.loadTons;
      case "tanker":
        return vehicle.capacityLiters;
      case "loader":
        return vehicle.bucketCapacity;
      default:
        return 0;
    }
  };

  // Helper to get dynamic label for the capacity filter
  const getCapacityLabel = () => {
    switch (vehicleType) {
      case "taxi":
        return "Min seats";
      case "truck":
      case "dump":
        return "Min load (tons)";
      case "tanker":
        return "Min capacity (liters)";
      case "loader":
        return "Min bucket (m³)";
      default:
        return "Min capacity";
    }
  };

  const filteredVehicles = vehiclesOfType.filter((vehicle) => {
    const matchesSearch = vehicle.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase());
    const capacityValue = getCapacityValue(vehicle);
    const matchesCapacity = capacityValue >= minCapacity;
    const matchesAc = !acOnly || vehicle.ac;
    return matchesSearch && matchesCapacity && matchesAc;
  });

  const displayType = vehicleType
    ? vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1)
    : "";

  if (!vehicleType || vehiclesOfType.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold">Vehicle type not found</h1>
          <a href="/" className="text-blue-500 underline mt-4 block">
            Back to home
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-50 to-gray-100 dark:from-black dark:to-zinc-900 py-12 px-4 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-yellow-500 to-orange-600 bg-clip-text text-transparent">
            {displayType} Fleet
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Choose the perfect {vehicleType} for your job
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center mb-10 bg-white/50 dark:bg-gray-800/30 p-4 rounded-xl backdrop-blur-sm">
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-800 dark:text-white w-full sm:w-64 focus:ring-2 focus:ring-blue-500 outline-none"
          />
          <div className="flex gap-4 items-center flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {getCapacityLabel()}:
              </span>
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(Number(e.target.value))}
                className="px-3 py-1 rounded-lg border dark:border-gray-600 bg-white dark:bg-gray-800"
              >
                <option value={0}>Any</option>
                {vehicleType === "taxi" && (
                  <>
                    <option value={4}>4+</option>
                    <option value={6}>6+</option>
                    <option value={8}>8+</option>
                    <option value={10}>10+</option>
                  </>
                )}
                {vehicleType === "truck" && (
                  <>
                    <option value={5}>5+ tons</option>
                    <option value={8}>8+ tons</option>
                    <option value={12}>12+ tons</option>
                    <option value={15}>15+ tons</option>
                  </>
                )}
                {vehicleType === "dump" && (
                  <>
                    <option value={10}>10+ tons</option>
                    <option value={20}>20+ tons</option>
                    <option value={25}>25+ tons</option>
                  </>
                )}
                {vehicleType === "tanker" && (
                  <>
                    <option value={10000}>10,000+ L</option>
                    <option value={20000}>20,000+ L</option>
                    <option value={30000}>30,000+ L</option>
                  </>
                )}
                {vehicleType === "loader" && (
                  <>
                    <option value={1}>1+ m³</option>
                    <option value={2}>2+ m³</option>
                    <option value={3}>3+ m³</option>
                    <option value={4}>4+ m³</option>
                  </>
                )}
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
              <input
                type="checkbox"
                checked={acOnly}
                onChange={(e) => setAcOnly(e.target.checked)}
                className="w-4 h-4"
              />
              Only with AC
            </label>
          </div>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredVehicles.length === 0 ? (
            <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
              No vehicles found. Try adjusting filters.
            </div>
          ) : (
            filteredVehicles.map((vehicle) => (
              <VehicleCard key={vehicle.id} vehicle={vehicle} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
