// app/(site)/signup/set-password/set-password-form.tsx
"use client";

import { extractRef } from "@/lib/extractRef";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Loader2, ShieldCheck, CheckCircle2, AlertCircle } from "lucide-react";

export default function SetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const ref = extractRef(searchParams.get("ref"));

  const [signup, setSignup] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!ref) {
      setError("Missing reference.");
      setLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch(`/api/signup/status?ref=${ref}`, {
          cache: "no-store",
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "Couldn't load signup");
        if (!data.can_set_password) {
          if (data.status === "paid") router.replace("/hotel/login");
          else throw new Error("Signup is not ready yet.");
          return;
        }
        setSignup(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [ref, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 8)
      return setError("Password must be at least 8 characters");
    if (password !== confirm) return setError("Passwords do not match");

    setSubmitting(true);
    try {
      const res = await fetch("/api/signup/set-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ref, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not save password");
      setDone(true);
      setTimeout(() => router.push("/hotel/login"), 1800);
    } catch (err: any) {
      setError(err.message);
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="animate-spin text-[#C9A15A]" />
      </div>
    );
  }

  if (done) {
    return (
      <div className="flex min-h-screen items-center justify-center px-6">
        <div className="max-w-sm rounded-2xl border border-emerald-200 bg-white p-8 text-center dark:border-emerald-900/40 dark:bg-[#171B19]">
          <CheckCircle2 size={40} className="mx-auto text-emerald-500" />
          <h1 className="mt-4 text-xl font-bold dark:text-[#F5F1E8]">
            You&apos;re all set
          </h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-[#9B968E]">
            Taking you to the login page…
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 px-6 dark:bg-[#0F1214]">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-8 shadow-sm dark:border-white/10 dark:bg-[#171B19]"
      >
        <div className="flex items-center gap-2 text-[#C9A15A]">
          <ShieldCheck size={16} />
          <span className="text-xs tracking-wide">Final step</span>
        </div>
        <h1 className="mt-3 text-xl font-bold text-slate-900 dark:text-[#F5F1E8]">
          Set your password
        </h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-[#9B968E]">
          {signup?.hotel_name} is ready. Choose a password to finish creating
          your owner account ({signup?.email}).
        </p>

        <label className="mt-5 block text-[13px] text-slate-600 dark:text-[#9B968E]">
          Password
        </label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mt-1 w-full border-0 border-b border-slate-200 bg-transparent px-0 py-1.5 text-sm focus:outline-none dark:border-[#262B2F] dark:text-[#EDEAE4]"
        />

        <label className="mt-4 block text-[13px] text-slate-600 dark:text-[#9B968E]">
          Confirm password
        </label>
        <input
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          className="mt-1 w-full border-0 border-b border-slate-200 bg-transparent px-0 py-1.5 text-sm focus:outline-none dark:border-[#262B2F] dark:text-[#EDEAE4]"
        />

        {error && (
          <p className="mt-4 flex items-center gap-1.5 text-sm text-red-600">
            <AlertCircle size={14} /> {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-[#171B19] px-4 py-2.5 text-sm font-medium text-[#F5F1E8] disabled:opacity-50 dark:bg-[#C9A15A] dark:text-[#0F1214]"
        >
          {submitting && <Loader2 size={15} className="animate-spin" />}
          Create my account
        </button>
      </form>
    </div>
  );
}
