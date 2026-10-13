"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";

const LANGUAGES = [
  { value: "en", label: "English" },
  { value: "ps", label: "پښتو (Pashto)" },
  { value: "prs", label: "دری (Dari)" },
];

const inputCls =
  "w-full rounded-lg border border-black/10 bg-transparent px-3 py-2 text-sm outline-none focus:border-[#2F6690] focus:ring-2 focus:ring-[#2F6690]/20 dark:border-white/10 dark:bg-transparent dark:text-[#EDEBE3]";

const labelCls =
  "mb-1.5 block text-sm font-medium text-[#10243A] dark:text-[#EDEBE3]";

const hintCls = "mt-1 text-xs text-[#8FA0B3]";

export default function EditTutorialPage() {
  const router = useRouter();
  const { id } = useParams();

  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const res = await fetchWithAuth(`/api/admin/learn?lang=`);
        if (!res.ok) {
          if (res.status === 401) return router.push("/login");
          throw new Error("Could not load tutorial");
        }
        const data = await res.json();
        const found = (data.tutorials || []).find((t) => t.id === id);
        if (!found) throw new Error("Tutorial not found");
        if (!cancelled) {
          setForm({
            language: found.language,
            category: found.category || "",
            title: found.title || "",
            description: found.description || "",
            youtube_id: found.youtube_id || "",
            duration: found.duration || "",
            sort_order: found.sort_order ?? 0,
            is_active: found.is_active !== false,
          });
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => {
      cancelled = true;
    };
  }, [id, router]);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const res = await fetchWithAuth(`/api/admin/learn/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          sort_order: Number(form.sort_order) || 0,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save");
      router.push("/admin/learn");
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  }

  if (loading) {
    return <div className="p-6 text-sm text-[#8FA0B3]">Loading…</div>;
  }

  if (!form) {
    return (
      <div className="p-6">
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error || "Tutorial not found."}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          Edit Tutorial
        </h1>
        <Link
          href="/admin/learn"
          className="text-sm text-[#8FA0B3] hover:text-[#10243A] dark:hover:text-[#EDEBE3]"
        >
          ← Back to list
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-5 rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]"
      >
        {/* Language */}
        <div>
          <label className={labelCls}>Language</label>
          <select
            value={form.language}
            onChange={(e) => update("language", e.target.value)}
            className={inputCls}
          >
            {LANGUAGES.map((l) => (
              <option key={l.value} value={l.value}>
                {l.label}
              </option>
            ))}
          </select>
        </div>

        {/* Title */}
        <div>
          <label className={labelCls}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            required
            className={inputCls}
          />
        </div>

        {/* Category */}
        <div>
          <label className={labelCls}>Category</label>
          <input
            type="text"
            value={form.category}
            onChange={(e) => update("category", e.target.value)}
            className={inputCls}
          />
        </div>

        {/* Description */}
        <div>
          <label className={labelCls}>Description</label>
          <textarea
            value={form.description}
            onChange={(e) => update("description", e.target.value)}
            rows={3}
            className={inputCls + " resize-none"}
          />
        </div>

        {/* YouTube ID */}
        <div>
          <label className={labelCls}>YouTube Video ID</label>
          <input
            type="text"
            value={form.youtube_id}
            onChange={(e) => update("youtube_id", e.target.value)}
            required
            className={inputCls}
          />
          <p className={hintCls}>
            From the URL{" "}
            <code>
              youtube.com/watch?v=<strong>XXXXXXXXXXX</strong>
            </code>
          </p>
        </div>

        {/* Preview */}
        {form.youtube_id && (
          <div>
            <label className={labelCls}>Preview</label>
            <div className="relative aspect-video w-full max-w-sm overflow-hidden rounded-lg border border-black/10 dark:border-white/10">
              <img
                src={`https://img.youtube.com/vi/${form.youtube_id}/hqdefault.jpg`}
                alt=""
                className="h-full w-full object-cover"
              />
            </div>
          </div>
        )}

        {/* Duration + Sort order */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Duration</label>
            <input
              type="text"
              value={form.duration}
              onChange={(e) => update("duration", e.target.value)}
              placeholder="4:30"
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Sort order</label>
            <input
              type="number"
              value={form.sort_order}
              onChange={(e) => update("sort_order", e.target.value)}
              className={inputCls}
            />
          </div>
        </div>

        {/* Active toggle */}
        <label className="flex cursor-pointer items-center gap-3">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => update("is_active", e.target.checked)}
            className="h-4 w-4 rounded border-black/20 accent-[#10243A] dark:border-white/20"
          />
          <span className="text-sm text-[#10243A] dark:text-[#EDEBE3]">
            Visible on the public tutorials page
          </span>
        </label>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2">
          <Link
            href="/admin/learn"
            className="rounded-lg border border-black/10 px-4 py-2 text-sm font-medium text-[#8FA0B3] transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </div>
  );
}
