"use client";

import { useEffect, useRef, useState } from "react";
import { MapPin, LocateFixed, Search, X, Loader2 } from "lucide-react";

type Props = {
  latitude: number | null;
  longitude: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
  addressHint?: string;
  autoDetectOnMount?: boolean;
};

export default function LocationPicker({
  latitude,
  longitude,
  onChange,
  addressHint = "",
  autoDetectOnMount = false,
}: Props) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<
    { display_name: string; lat: string; lon: string }[]
  >([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const autoRan = useRef(false);

  const hasCoords =
    typeof latitude === "number" && typeof longitude === "number";

  function useMyLocation({ silent = false } = {}) {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      if (!silent) setError("Geolocation not supported by this browser");
      return;
    }
    setLocating(true);
    if (!silent) setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange(
          +pos.coords.latitude.toFixed(6),
          +pos.coords.longitude.toFixed(6),
        );
        setOpen(false);
        setLocating(false);
        reverseGeocode(pos.coords.latitude, pos.coords.longitude);
      },
      (err) => {
        if (!silent) setError(err.message || "Could not get location");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 30000 },
    );
  }

  useEffect(() => {
    if (!autoDetectOnMount || autoRan.current || hasCoords) return;
    autoRan.current = true;
    useMyLocation({ silent: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoDetectOnMount, hasCoords]);

  async function reverseGeocode(lat: number, lng: number) {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`,
        { headers: { Accept: "application/json" } },
      );
      if (!res.ok) return;
      const data = await res.json();
      if (data?.display_name) setQuery(data.display_name);
    } catch {
      /* silent */
    }
  }

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 3) {
      setResults([]);
      return;
    }
    const id = setTimeout(async () => {
      setSearching(true);
      setError("");
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&limit=6&q=${encodeURIComponent(
            q,
          )}`,
          { headers: { Accept: "application/json" } },
        );
        if (!res.ok) throw new Error("Search failed");
        const data = await res.json();
        setResults(Array.isArray(data) ? data : []);
      } catch (err) {
        setError((err as Error).message);
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 450);
    return () => clearTimeout(id);
  }, [query, open]);

  function pickResult(r: { display_name: string; lat: string; lon: string }) {
    onChange(+Number(r.lat).toFixed(6), +Number(r.lon).toFixed(6));
    setQuery(r.display_name);
    setOpen(false);
  }

  const bbox = hasCoords
    ? `${longitude! - 0.005},${latitude! - 0.005},${longitude! + 0.005},${
        latitude! + 0.005
      }`
    : "";
  const mapSrc = hasCoords
    ? `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${latitude},${longitude}`
    : "";

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1.5">
        <div className="relative flex-1 min-w-0">
          <Search className="absolute top-1/2 -translate-y-1/2 ltr:left-2.5 rtl:right-2.5 h-3.5 w-3.5 text-slate-400 pointer-events-none" />
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={addressHint || "Search address or place…"}
            className="w-full text-sm border border-slate-200 rounded-lg ltr:pl-8 ltr:pr-3 rtl:pr-8 rtl:pl-3 py-2 bg-white text-slate-800 outline-none focus:border-teal-600 focus:ring-2 focus:ring-teal-600/20 dark:border-white/10 dark:bg-[#0B1826] dark:text-slate-100"
          />
          {searching && (
            <Loader2 className="absolute top-1/2 -translate-y-1/2 ltr:right-2.5 rtl:left-2.5 h-3.5 w-3.5 text-teal-600 animate-spin" />
          )}

          {open && results.length > 0 && (
            <div className="absolute z-30 mt-1 w-full max-h-56 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-lg dark:border-white/10 dark:bg-[#0F1C2E]">
              {results.map((r) => (
                <button
                  type="button"
                  key={`${r.lat}-${r.lon}`}
                  onClick={() => pickResult(r)}
                  className="w-full text-start px-2.5 py-1.5 text-xs text-slate-700 hover:bg-teal-50 dark:text-slate-200 dark:hover:bg-teal-900/30"
                >
                  {r.display_name}
                </button>
              ))}
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => useMyLocation()}
          disabled={locating}
          title="Use my current location"
          className="inline-flex items-center gap-1 text-xs px-2.5 py-2 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 disabled:opacity-50 whitespace-nowrap dark:border-teal-800 dark:text-teal-200 dark:hover:bg-teal-900/40"
        >
          {locating ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <LocateFixed className="h-3.5 w-3.5" />
          )}
          GPS
        </button>
      </div>

      {error && (
        <p className="text-[11px] text-red-600 dark:text-red-400">{error}</p>
      )}

      <div className="grid grid-cols-2 gap-2">
        <input
          type="number"
          step="0.000001"
          min="-90"
          max="90"
          placeholder="Latitude"
          value={latitude ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(v === "" ? null : Number(v), longitude);
          }}
          dir="ltr"
          className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 dark:border-white/10 dark:bg-[#0B1826] dark:text-slate-100"
        />
        <input
          type="number"
          step="0.000001"
          min="-180"
          max="180"
          placeholder="Longitude"
          value={longitude ?? ""}
          onChange={(e) => {
            const v = e.target.value;
            onChange(latitude, v === "" ? null : Number(v));
          }}
          dir="ltr"
          className="w-full text-sm border border-slate-200 rounded-lg px-2.5 py-2 bg-white text-slate-800 dark:border-white/10 dark:bg-[#0B1826] dark:text-slate-100"
        />
      </div>

      {hasCoords ? (
        <div className="rounded-lg overflow-hidden border border-slate-200 dark:border-white/10">
          <iframe
            title="branch-location"
            src={mapSrc}
            className="w-full h-44"
            loading="lazy"
          />
          <div className="flex items-center justify-between px-2.5 py-1.5 text-[11px] bg-slate-50 text-slate-500 dark:bg-white/5 dark:text-slate-400">
            <span className="inline-flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span dir="ltr">
                {latitude!.toFixed(6)}, {longitude!.toFixed(6)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => {
                onChange(null, null);
                setQuery("");
              }}
              className="inline-flex items-center gap-1 hover:text-red-600 dark:hover:text-red-400"
            >
              <X className="h-3 w-3" /> Clear
            </button>
          </div>
        </div>
      ) : (
        <p className="text-[11px] text-slate-500 dark:text-slate-400">
          No location set — search an address, tap <strong>GPS</strong>, or type
          coordinates.
        </p>
      )}
    </div>
  );
}
