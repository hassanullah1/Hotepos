"use client";

import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import VehicleCard from "@/components/admin/VehicleCard";
import { Search, SlidersHorizontal, Snowflake } from "lucide-react";
import Image from "next/image";

const HERO_IMAGE = {
  taxi: "/images/taxi2.png",
  "dump-truck": "/images/du.png",
  tanker: "/images/tan.png",
  loader: "/images/ex.png",
  truck: "/images/tr.png",
};

const CAPACITY_LABEL = {
  taxi: "Min seats",
  truck: "Min load (tons)",
  "dump-truck": "Min payload (tons)",
  tanker: "Min capacity (liters)",
  loader: "Min bucket (m³)",
};

const CAPACITY_OPTIONS = {
  taxi: [4, 6, 8, 10],
  truck: [5, 8, 12, 15],
  "dump-truck": [10, 20, 25],
  tanker: [10000, 20000, 30000],
  loader: [1, 2, 3, 4],
};

const PAGE_SIZE = 12;
const SEARCH_DEBOUNCE_MS = 400;
const AC_CAPABLE_SLUGS = new Set(["taxi"]);

export default function VehicleList() {
  const { vehicleType } = useParams();
  const isKnownType = Boolean(CAPACITY_LABEL[vehicleType]);

  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [minCapacity, setMinCapacity] = useState(0);
  const [acOnly, setAcOnly] = useState(false);
  const [usage, setUsage] = useState(null); // null, "taxi", "rental"

  const [items, setItems] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState(null);

  const abortRef = useRef(null);
  const sentinelRef = useRef(null);

  // Debounce free-text search
  useEffect(() => {
    const t = setTimeout(
      () => setSearch(searchInput.trim()),
      SEARCH_DEBOUNCE_MS,
    );
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchPage = useCallback(
    async (cursor) => {
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      const qs = new URLSearchParams({
        type: vehicleType,
        limit: String(PAGE_SIZE),
        ...(search && { search }),
        ...(minCapacity > 0 && { minCapacity: String(minCapacity) }),
        ...(acOnly && { ac: "true" }),
        ...(usage && { usage }), // <-- new filter
        ...(cursor && { cursor }),
      });

      const res = await fetch(`/api/vehicles?${qs.toString()}`, {
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Failed to load vehicles");
      return res.json();
    },
    [vehicleType, search, minCapacity, acOnly, usage],
  );

  // Reset and fetch when any filter changes
  useEffect(() => {
    if (!isKnownType) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    fetchPage(null)
      .then((data) => {
        if (cancelled) return;
        setItems(data.items);
        setNextCursor(data.nextCursor);
      })
      .catch((err) => {
        if (err.name !== "AbortError" && !cancelled) setError(err.message);
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [fetchPage, isKnownType]);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingMore) return;
    setLoadingMore(true);
    try {
      const data = await fetchPage(nextCursor);
      setItems((prev) => [...prev, ...data.items]);
      setNextCursor(data.nextCursor);
    } catch (err) {
      if (err.name !== "AbortError") setError(err.message);
    } finally {
      setLoadingMore(false);
    }
  }, [nextCursor, loadingMore, fetchPage]);

  // Infinite scroll observer
  useEffect(() => {
    if (!sentinelRef.current) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0].isIntersecting && loadMore(),
      { rootMargin: "400px" },
    );
    observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [loadMore]);

  if (!isKnownType) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-zinc-900">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Vehicle type not found
          </h1>
          <a
            href="/"
            className="text-teal-600 dark:text-teal-400 underline mt-4 block"
          >
            Back to home
          </a>
        </div>
      </div>
    );
  }

  const displayType =
    vehicleType.charAt(0).toUpperCase() + vehicleType.slice(1);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-zinc-900">
      {/* Hero banner */}
      <div className="relative isolate overflow-hidden bg-gradient-to-br from-teal-600 to-teal-800 dark:from-teal-800 dark:to-teal-950">
        <div className="pointer-events-none absolute end-3 -top-20 w-full sm:w-120 sm:h-80 opacity-[0.75] rotate-12 rtl:rotate-[-12deg] rtl:-scale-x-100">
          <Image
            src={HERO_IMAGE[vehicleType]}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, 480px"
            className="object-contain"
          />
        </div>
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "radial-gradient(circle, white 1px, transparent 1px)",
            backgroundSize: "18px 18px",
          }}
        />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
            {displayType} fleet
          </h1>
          <p className="mt-3 text-teal-100 text-sm sm:text-base max-w-md">
            Choose the perfect {vehicleType} for your job
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 -mt-6 pb-12">
        {/* Filters */}
        <div className="relative z-10 flex flex-col sm:flex-row gap-3 sm:gap-4 justify-between items-stretch sm:items-center mb-8 bg-white dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="relative w-full sm:w-64">
            <Search
              size={16}
              className="absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="ps-9 pe-3 py-2 w-full rounded-xl border border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-white text-sm focus:ring-2 focus:ring-teal-500 focus:border-teal-500 outline-none transition"
            />
          </div>

          <div className="flex gap-3 items-center flex-wrap">
            {/* Capacity filter */}
            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl">
              <SlidersHorizontal size={14} className="text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                {CAPACITY_LABEL[vehicleType]}
              </span>
              <select
                value={minCapacity}
                onChange={(e) => setMinCapacity(Number(e.target.value))}
                className="bg-transparent text-sm text-gray-800 dark:text-white outline-none cursor-pointer"
              >
                <option value={0}>Any</option>
                {CAPACITY_OPTIONS[vehicleType].map((v) => (
                  <option key={v} value={v}>
                    {v.toLocaleString()}+
                  </option>
                ))}
              </select>
            </div>

            {/* AC filter (only for taxi) */}
            {AC_CAPABLE_SLUGS.has(vehicleType) && (
              <button
                type="button"
                onClick={() => setAcOnly((v) => !v)}
                aria-pressed={acOnly}
                className={`flex items-center gap-1.5 text-sm px-3 py-2 rounded-xl border transition ${
                  acOnly
                    ? "bg-teal-600 border-teal-600 text-white"
                    : "bg-gray-50 dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300"
                }`}
              >
                <Snowflake size={14} />
                AC only
              </button>
            )}

            {/* NEW: Taxi / Rental filter (only for taxi) */}
            {vehicleType === "taxi" && (
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 px-3 py-2 rounded-xl">
                <span className="text-sm text-gray-600 dark:text-gray-300 whitespace-nowrap">
                  Type
                </span>
                <select
                  value={usage || ""}
                  onChange={(e) => setUsage(e.target.value || null)}
                  className="bg-transparent text-sm text-gray-800 dark:text-white outline-none cursor-pointer"
                >
                  <option value="">Both</option>
                  <option value="taxi">Taxi</option>
                  <option value="rental">Rental</option>
                </select>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="text-center py-6 text-red-500 text-sm">{error}</div>
        )}

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => <CardSkeleton key={i} />)
          ) : items.length === 0 ? (
            <div className="col-span-full text-center py-16 text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700">
              No vehicles found. Try adjusting filters.
            </div>
          ) : (
            items.map((vehicle, i) => (
              <VehicleCard
                key={vehicle.id}
                vehicle={vehicle}
                priority={i < 4}
              />
            ))
          )}
        </div>

        {/* Infinite-scroll sentinel */}
        {!loading && nextCursor && (
          <div ref={sentinelRef} className="flex justify-center mt-8">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 disabled:opacity-60 text-white text-sm font-semibold transition"
            >
              {loadingMore ? "Loading..." : "Load more"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

function CardSkeleton() {
  return (
    <div className="rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-700 bg-white dark:bg-gray-800 animate-pulse">
      <div className="h-48 bg-gray-200 dark:bg-gray-700" />
      <div className="p-4 space-y-2">
        <div className="h-4 w-2/3 bg-gray-200 dark:bg-gray-700 rounded" />
        <div className="h-3 w-1/3 bg-gray-200 dark:bg-gray-700 rounded" />
      </div>
    </div>
  );
}
