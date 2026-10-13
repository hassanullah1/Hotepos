"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Search,
  MapPin,
  Loader2,
  Utensils,
  Navigation,
  X,
  ChevronLeft,
  ChevronRight,
  Phone,
  Clock,
} from "lucide-react";

type Branch = {
  id: string;
  name: string;
  hotel_id: string | null;
  hotel_name: string;
  logo_url: string | null;
  address: string | null;
  city: string | null;
  phone: string | null;
  currency: string;
  opening_time: string | null;
  closing_time: string | null;
  latitude: number | null;
  longitude: number | null;
  menu_item_count: number;
  distance_km: number | null;
};

export default function PublicOrderDiscoveryPage() {
  const [q, setQ] = useState("");
  const [debouncedQ, setDebouncedQ] = useState("");
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(
    null,
  );
  const [locating, setLocating] = useState(false);
  const [locationUsed, setLocationUsed] = useState(false);

  // debounce search
  useEffect(() => {
    const id = setTimeout(() => setDebouncedQ(q.trim()), 350);
    return () => clearTimeout(id);
  }, [q]);

  const fetchBranches = useCallback(
    async (p = page) => {
      setLoading(true);
      setError("");
      try {
        const params = new URLSearchParams({
          page: String(p),
          limit: String(limit),
        });
        if (debouncedQ) params.set("q", debouncedQ);
        if (coords) {
          params.set("lat", String(coords.lat));
          params.set("lng", String(coords.lng));
          params.set("radius", "25");
        }

        const res = await fetch(`/api/public/branches?${params.toString()}`);
        if (!res.ok) throw new Error("Failed to load restaurants");
        const data = await res.json();

        setBranches(data.branches || []);
        setTotal(data.total || 0);
        setTotalPages(data.totalPages || 1);
        setLocationUsed(!!data.location_used);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [debouncedQ, coords, limit, page],
  );

  // reset to page 1 when filter/coords change
  useEffect(() => {
    setPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ, coords]);

  useEffect(() => {
    fetchBranches(page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, debouncedQ, coords]);

  function useGPS() {
    if (!navigator.geolocation) {
      setError("Geolocation not supported by this browser");
      return;
    }
    setLocating(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: +pos.coords.latitude.toFixed(6),
          lng: +pos.coords.longitude.toFixed(6),
        });
        setLocating(false);
      },
      (err) => {
        setError(err.message || "Could not get your location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  function clearLocation() {
    setCoords(null);
  }

  const showingRange = useMemo(() => {
    if (total === 0) return "0 results";
    const from = (page - 1) * limit + 1;
    const to = Math.min(page * limit, total);
    return `${from}–${to} of ${total}`;
  }, [page, limit, total]);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* ---- header ---- */}
      <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto max-w-5xl px-4 py-4">
          <div className="mb-3 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-600 text-white">
              <Utensils className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
                Order online
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {locationUsed
                  ? "Showing restaurants near you"
                  : "Find a restaurant and order"}
              </p>
            </div>

            <button
              type="button"
              onClick={coords ? clearLocation : useGPS}
              disabled={locating}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium transition-colors ${
                coords
                  ? "border-teal-600 bg-teal-50 text-teal-700 dark:border-teal-700 dark:bg-teal-950/40 dark:text-teal-300"
                  : "border-slate-200 text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              } disabled:opacity-60`}
            >
              {locating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : coords ? (
                <X className="h-3.5 w-3.5" />
              ) : (
                <Navigation className="h-3.5 w-3.5" />
              )}
              {coords ? "Near me ✓" : "Near me"}
            </button>
          </div>

          {/* search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by restaurant, city, or address…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-100"
            />
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        {error && (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-300">
            {error}
          </div>
        )}

        {/* loading skeleton */}
        {loading && branches.length === 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-40 animate-pulse rounded-2xl bg-slate-200 dark:bg-slate-800"
              />
            ))}
          </div>
        )}

        {/* empty */}
        {!loading && branches.length === 0 && (
          <div className="rounded-2xl border border-dashed border-slate-300 px-6 py-16 text-center dark:border-slate-700">
            <Utensils className="mx-auto mb-3 h-6 w-6 text-slate-400" />
            <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
              No restaurants found
            </p>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {coords
                ? "Try expanding the area or clearing the location filter."
                : "Try a different search term."}
            </p>
          </div>
        )}

        {/* grid */}
        {branches.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {branches.map((b) => (
              <Link
                key={b.id}
                href={`/order/${b.id}`}
                className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:border-teal-400 hover:shadow-md dark:border-slate-800 dark:bg-slate-900 dark:hover:border-teal-600"
              >
                {/* cover */}
                <div className="relative h-32 bg-gradient-to-br from-teal-500/10 to-teal-700/20 dark:from-teal-900/40 dark:to-teal-950/40">
                  {b.logo_url ? (
                    <img
                      src={b.logo_url}
                      alt={b.hotel_name || b.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-teal-700 dark:text-teal-300">
                      <Utensils className="h-8 w-8 opacity-60" />
                    </div>
                  )}

                  {b.distance_km !== null && (
                    <span className="absolute right-2 top-2 rounded-full bg-white/95 px-2 py-0.5 text-[11px] font-semibold text-teal-700 shadow-sm dark:bg-slate-900/90 dark:text-teal-300">
                      {b.distance_km < 1
                        ? `${Math.round(b.distance_km * 1000)} m`
                        : `${b.distance_km.toFixed(1)} km`}
                    </span>
                  )}
                </div>

                {/* body */}
                <div className="flex flex-1 flex-col p-4">
                  <h3 className="truncate text-sm font-semibold text-slate-900 dark:text-white">
                    {b.hotel_name || b.name}
                  </h3>
                  <p className="mt-0.5 truncate text-xs text-slate-500 dark:text-slate-400">
                    {b.name}
                    {b.city ? ` · ${b.city}` : ""}
                  </p>

                  {b.address && (
                    <p className="mt-2 flex items-start gap-1.5 text-xs text-slate-500 dark:text-slate-400">
                      <MapPin className="mt-0.5 h-3 w-3 shrink-0 text-teal-600 dark:text-teal-500" />
                      <span className="line-clamp-1">{b.address}</span>
                    </p>
                  )}

                  <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-slate-500 dark:text-slate-400">
                    {b.phone && (
                      <span className="inline-flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        <span dir="ltr">{b.phone}</span>
                      </span>
                    )}
                    {b.opening_time && b.closing_time && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        <span dir="ltr">
                          {String(b.opening_time).slice(0, 5)}–
                          {String(b.closing_time).slice(0, 5)}
                        </span>
                      </span>
                    )}
                  </div>

                  <div className="mt-auto flex items-center justify-between pt-3">
                    <span className="text-[11px] text-slate-400">
                      {b.menu_item_count} items
                    </span>
                    <span className="rounded-full bg-teal-700 px-3 py-1 text-[11px] font-semibold text-white group-hover:bg-teal-800">
                      Order
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {/* pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-slate-500 dark:text-slate-400">{showingRange}</p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                <ChevronLeft className="h-3.5 w-3.5 rtl:rotate-180" />
                Prev
              </button>
              <span className="px-2 text-xs text-slate-600 dark:text-slate-300">
                Page {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-1.5 text-xs hover:bg-slate-50 disabled:opacity-40 dark:border-slate-700 dark:hover:bg-slate-800"
              >
                Next
                <ChevronRight className="h-3.5 w-3.5 rtl:rotate-180" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
