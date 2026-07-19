"use client";

import { useEffect, useRef, useState } from "react";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

// Lets the user search an existing owner by phone number or Tazkira number
// (or name), select one, or create a brand new owner inline.
//
// Props:
//   value: currently selected owner object ({ id, name, phone, tazkiraNumber, ... }) or null
//   onChange: (owner | null) => void
export default function OwnerPicker({ value, onChange }) {
  const { t } = useAdminPreferences();
  const labels = t.owner || {};

  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [open, setOpen] = useState(false);
  const [showNewForm, setShowNewForm] = useState(false);
  const [newOwner, setNewOwner] = useState({
    name: "",
    phone: "",
    tazkiraNumber: "",
    address: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState(null);
  const boxRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (boxRef.current && !boxRef.current.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (!query.trim()) {
      setResults([]);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(
          `/api/owners/search/?q=${encodeURIComponent(query.trim())}`,
        );
        setResults(res.ok ? await res.json() : []);
      } catch {
        setResults([]);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(debounceRef.current);
  }, [query]);

  function selectOwner(owner) {
    onChange(owner);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function clearOwner() {
    onChange(null);
  }

  async function handleCreateOwner(e) {
    e.preventDefault();
    if (!newOwner.name.trim()) {
      setError(labels.nameRequired || "Name is required");
      return;
    }
    setCreating(true);
    setError(null);
    try {
      const res = await fetch("/api/owners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newOwner),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        selectOwner(data);
        setShowNewForm(false);
        setNewOwner({ name: "", phone: "", tazkiraNumber: "", address: "" });
      } else {
        setError(data.error || t.common.error);
      }
    } catch {
      setError(t.common.error);
    } finally {
      setCreating(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm dark:border-white/10 dark:bg-[#152A42]";

  if (value) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-300 bg-slate-50 px-3 py-2 text-sm dark:border-white/10 dark:bg-white/5">
        <div>
          <div className="font-medium">{value.name}</div>
          <div className="text-xs text-slate-500 dark:text-slate-400">
            {[value.phone, value.tazkiraNumber].filter(Boolean).join(" • ") ||
              "—"}
          </div>
        </div>
        <button
          type="button"
          onClick={clearOwner}
          className="rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10"
        >
          {labels.change || t.common.delete}
        </button>
      </div>
    );
  }

  return (
    <div ref={boxRef} className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        placeholder={
          labels.searchPlaceholder || "Search by phone or Tazkira number"
        }
        className={inputClass}
      />

      {open && (query.trim() || showNewForm) && (
        <div className="absolute z-10 mt-1 w-full rounded-lg border border-slate-200 bg-white p-2 shadow-lg dark:border-white/10 dark:bg-[#152A42]">
          {!showNewForm && (
            <>
              {searching && (
                <div className="px-2 py-2 text-xs text-slate-400">
                  {t.common.loading}
                </div>
              )}
              {!searching && query.trim() && results.length === 0 && (
                <div className="px-2 py-2 text-xs text-slate-400">
                  {labels.noResults || t.common.noResults}
                </div>
              )}
              {results.map((owner) => (
                <button
                  key={owner.id}
                  type="button"
                  onClick={() => selectOwner(owner)}
                  className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-slate-50 dark:hover:bg-white/5"
                >
                  <div className="font-medium">{owner.name}</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    {[owner.phone, owner.tazkiraNumber]
                      .filter(Boolean)
                      .join(" • ") || "—"}
                  </div>
                </button>
              ))}
              <button
                type="button"
                onClick={() => setShowNewForm(true)}
                className="mt-1 block w-full rounded-md border-t border-slate-100 px-2 py-2 text-left text-sm font-medium text-[#2F6690] hover:bg-slate-50 dark:border-white/5 dark:text-[#7FB3D9] dark:hover:bg-white/5"
              >
                + {labels.addNew || "Add new owner"}
              </button>
            </>
          )}

          {showNewForm && (
            <form onSubmit={handleCreateOwner} className="space-y-2 p-1">
              {error && (
                <div className="rounded-md bg-red-50 px-2 py-1 text-xs text-red-600 dark:bg-red-500/10 dark:text-red-400">
                  {error}
                </div>
              )}
              <input
                autoFocus
                placeholder={labels.name || "Name"}
                value={newOwner.name}
                onChange={(e) =>
                  setNewOwner((o) => ({ ...o, name: e.target.value }))
                }
                className={inputClass}
              />
              <input
                placeholder={labels.phone || "Phone"}
                value={newOwner.phone}
                onChange={(e) =>
                  setNewOwner((o) => ({ ...o, phone: e.target.value }))
                }
                className={inputClass}
              />
              <input
                placeholder={labels.tazkiraNumber || "Tazkira number"}
                value={newOwner.tazkiraNumber}
                onChange={(e) =>
                  setNewOwner((o) => ({ ...o, tazkiraNumber: e.target.value }))
                }
                className={inputClass}
              />
              <input
                placeholder={labels.address || "Address"}
                value={newOwner.address}
                onChange={(e) =>
                  setNewOwner((o) => ({ ...o, address: e.target.value }))
                }
                className={inputClass}
              />
              <div className="flex gap-2 pt-1">
                <button
                  type="submit"
                  disabled={creating}
                  className="rounded-lg bg-[#10243A] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#16324f] disabled:opacity-60 dark:bg-[#2F6690]"
                >
                  {creating ? t.common.loading : t.common.save}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewForm(false);
                    setError(null);
                  }}
                  className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs dark:border-white/10"
                >
                  {t.common.cancel}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
