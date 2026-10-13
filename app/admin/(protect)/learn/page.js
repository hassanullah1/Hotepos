"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { ChevronUp, ChevronDown, Trash2, Pencil } from "lucide-react";

const LANG_TABS = [
  { value: "", label: "All" },
  { value: "en", label: "English" },
  { value: "ps", label: "پښتو" },
  { value: "prs", label: "دری" },
];

const LANG_BADGE = {
  en: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
  ps: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  prs: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
};

export default function TutorialsAdminPage() {
  const router = useRouter();
  const [tutorials, setTutorials] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [langFilter, setLangFilter] = useState("");
  const [workingId, setWorkingId] = useState(null);

  async function loadTutorials() {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      if (langFilter) params.set("lang", langFilter);
      const res = await fetchWithAuth(`/api/admin/learn?${params.toString()}`);
      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        throw new Error("Failed to load tutorials");
      }
      const data = await res.json();
      setTutorials(data.tutorials || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadTutorials();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [langFilter]);

  async function handleDelete(tutorial) {
    if (!window.confirm(`Delete "${tutorial.title}"? This can't be undone.`))
      return;

    setWorkingId(tutorial.id);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/admin/learn/${tutorial.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Could not delete tutorial");
      setTutorials((prev) => prev.filter((t) => t.id !== tutorial.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  // Reorder within same-language group by reassigning sort_order 0..n
  async function moveTutorial(tutorial, direction) {
    const siblings = tutorials
      .filter((t) => t.language === tutorial.language)
      .sort((a, b) => {
        if ((a.sort_order ?? 0) !== (b.sort_order ?? 0)) {
          return (a.sort_order ?? 0) - (b.sort_order ?? 0);
        }
        return new Date(a.created_at) - new Date(b.created_at);
      });

    const idx = siblings.findIndex((t) => t.id === tutorial.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= siblings.length) return;

    const reordered = [...siblings];
    [reordered[idx], reordered[swapIdx]] = [reordered[swapIdx], reordered[idx]];

    setWorkingId(tutorial.id);
    setError("");
    try {
      await Promise.all(
        reordered.map((t, i) =>
          fetchWithAuth(`/api/admin/learn/${t.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sort_order: i }),
          }),
        ),
      );
      await loadTutorials();
    } catch (err) {
      setError(err.message);
    } finally {
      setWorkingId(null);
    }
  }

  return (
    <div className="p-6">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          Tutorials
        </h1>
        <Link
          href="/admin/learn/create"
          className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826]"
        >
          + New Tutorial
        </Link>
      </div>

      {/* Language tabs */}
      <div className="mb-4 flex w-fit gap-1 rounded-xl border border-black/10 bg-black/[0.02] p-1 dark:border-white/10 dark:bg-white/[0.03]">
        {LANG_TABS.map((tab) => (
          <button
            key={tab.value}
            type="button"
            onClick={() => setLangFilter(tab.value)}
            className={`rounded-lg px-3.5 py-1.5 text-sm font-medium transition-colors ${
              langFilter === tab.value
                ? "bg-[#10243A] text-[#EDEBE3]"
                : "text-[#8FA0B3] hover:text-[#10243A] dark:hover:text-[#EDEBE3]"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <div className="overflow-x-auto rounded-xl border border-black/10 bg-white shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-black/10 text-xs uppercase text-[#8FA0B3] dark:border-white/10">
            <tr>
              <th className="px-3 py-3 w-20">Order</th>
              <th className="px-3 py-3 w-24">Preview</th>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Category</th>
              <th className="px-4 py-3">Duration</th>
              <th className="px-4 py-3">Language</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-[#8FA0B3]"
                >
                  Loading…
                </td>
              </tr>
            ) : tutorials.length === 0 ? (
              <tr>
                <td
                  colSpan={8}
                  className="px-4 py-6 text-center text-[#8FA0B3]"
                >
                  No tutorials yet.
                </td>
              </tr>
            ) : (
              tutorials.map((t, idx, arr) => {
                const sameLang = arr.filter((x) => x.language === t.language);
                const posInLang = sameLang.findIndex((x) => x.id === t.id);
                const canUp = posInLang > 0;
                const canDown = posInLang < sameLang.length - 1;

                return (
                  <tr
                    key={t.id}
                    className="border-b border-black/5 last:border-0 dark:border-white/5"
                  >
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-0.5">
                        <button
                          type="button"
                          onClick={() => moveTutorial(t, "up")}
                          disabled={!canUp || workingId === t.id}
                          aria-label="Move up"
                          className="rounded-md p-1 text-[#8FA0B3] transition-colors hover:bg-black/5 hover:text-[#10243A] disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10 dark:hover:text-[#EDEBE3]"
                        >
                          <ChevronUp size={14} />
                        </button>
                        <button
                          type="button"
                          onClick={() => moveTutorial(t, "down")}
                          disabled={!canDown || workingId === t.id}
                          aria-label="Move down"
                          className="rounded-md p-1 text-[#8FA0B3] transition-colors hover:bg-black/5 hover:text-[#10243A] disabled:opacity-30 disabled:hover:bg-transparent dark:hover:bg-white/10 dark:hover:text-[#EDEBE3]"
                        >
                          <ChevronDown size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <div className="relative h-12 w-20 overflow-hidden rounded-md bg-black/5 dark:bg-white/5">
                        {t.youtube_id ? (
                          <img
                            src={`https://img.youtube.com/vi/${t.youtube_id}/mqdefault.jpg`}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-[#8FA0B3]">
                            No video
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[#10243A] dark:text-[#EDEBE3]">
                        {t.title}
                      </div>
                      {t.description && (
                        <div className="mt-0.5 line-clamp-1 max-w-xs text-xs text-[#8FA0B3]">
                          {t.description}
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8FA0B3]">
                      {t.category || "—"}
                    </td>
                    <td className="px-4 py-3 text-xs text-[#8FA0B3]">
                      {t.duration || "—"}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase ${LANG_BADGE[t.language] || ""}`}
                      >
                        {t.language}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          t.is_active
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : "bg-black/5 text-[#8FA0B3] dark:bg-white/10"
                        }`}
                      >
                        {t.is_active ? "Active" : "Hidden"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/admin/learn/${t.id}`}
                          className="rounded-lg border border-black/10 p-1.5 text-[#2F6690] transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/10"
                          aria-label="Edit"
                        >
                          <Pencil size={13} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => handleDelete(t)}
                          disabled={workingId === t.id}
                          className="rounded-lg border border-red-300 p-1.5 text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 dark:border-red-900/40 dark:hover:bg-red-950/30"
                          aria-label="Delete"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
