"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const inputClass =
  "w-full rounded-lg border border-black/10 bg-white px-3 py-2 text-sm text-[#10243A] dark:border-white/10 dark:bg-[#0F1C2E] dark:text-[#EDEBE3]";
const labelClass =
  "mb-1 block text-sm font-medium text-[#5B6472] dark:text-[#C7CDD6]";

const emptyOtp = () => ["", "", "", "", "", ""];

export default function CreateUserPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [roles, setRoles] = useState([]);
  const [hotels, setHotels] = useState([]);
  const [branches, setBranches] = useState([]);
  const [actorInfo, setActorInfo] = useState({
    isPlatform: false,
    isOwner: false,
    isBranch: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
    pin_code: "",
    role_id: "",
    hotel_id: "",
    branch_id: "",
    hired_at: "",
  });

  // ---- email verification state ----
  const [emailVerified, setEmailVerified] = useState(false);
  const [emailVerificationId, setEmailVerificationId] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpDigits, setOtpDigits] = useState(emptyOtp());
  const [otpSubmitting, setOtpSubmitting] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const otpRefs = useRef([]);

  const selectedRole = roles.find((r) => r.id === form.role_id);

  // ---- load roles + detect actor scope ----
  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const rolesRes = await fetchWithAuth("/api/roles");
        if (rolesRes.status === 401) {
          router.push("/hotel/login");
          return;
        }
        if (!rolesRes.ok) throw new Error(t.users.loadError);
        const rolesData = await rolesRes.json();
        if (cancelled) return;
        setRoles(rolesData.roles || []);

        const [hotelsRes, branchesRes] = await Promise.all([
          fetchWithAuth("/api/hotels"),
          fetchWithAuth("/api/branches"),
        ]);
        if (cancelled) return;

        if (hotelsRes.ok) {
          const hotelsData = await hotelsRes.json();
          setHotels(hotelsData.hotels || []);
        }
        if (branchesRes.ok) {
          const branchesData = await branchesRes.json();
          setBranches(branchesData.branches || []);
        }

        let isPlatform = false;
        let isOwner = false;
        let isBranch = false;
        if (hotelsRes.ok && branchesRes.ok) isOwner = true;
        else if (hotelsRes.ok) isPlatform = true;
        else if (branchesRes.ok) isOwner = true;
        else isBranch = true;

        setActorInfo({ isPlatform, isOwner, isBranch });
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router]);

  // ---- platform actor: reload branches when hotel changes ----
  useEffect(() => {
    if (!actorInfo.isPlatform) return undefined;
    if (!form.hotel_id) {
      setBranches([]);
      return undefined;
    }
    let cancelled = false;
    async function loadBranches() {
      try {
        const res = await fetchWithAuth(
          `/api/branches?hotel_id=${form.hotel_id}`,
        );
        if (res.ok && !cancelled) {
          const data = await res.json();
          setBranches(data.branches || []);
        }
      } catch {
        /* ignore */
      }
    }
    loadBranches();
    return () => {
      cancelled = true;
    };
  }, [form.hotel_id, actorInfo.isPlatform]);

  // ---- email verification helpers ----
  function updateEmail(value) {
    if (value !== form.email) {
      setEmailVerified(false);
      setEmailVerificationId("");
      setOtpSent(false);
      setOtpDigits(emptyOtp());
      setOtpError("");
    }
    setForm((prev) => ({ ...prev, email: value }));
  }

  async function sendOtp() {
    if (!form.email.trim() || !form.email.includes("@")) {
      setOtpError("Please enter a valid email first");
      return;
    }
    setOtpError("");
    setSendingOtp(true);
    try {
      const res = await fetch("/api/email-verifications/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          ownerName: form.full_name.trim(),
          hotelName:
            hotels.find((h) => h.id === form.hotel_id)?.name ||
            t.users.addUser ||
            "Hotel App",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Could not send code");
      setEmailVerificationId(data.verification_id);
      setOtpSent(true);
      setOtpDigits(emptyOtp());
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch (err) {
      setOtpError(err.message);
    } finally {
      setSendingOtp(false);
    }
  }

  async function verifyOtp() {
    const code = otpDigits.join("");
    if (code.length !== 6) {
      setOtpError("Enter all 6 digits.");
      return;
    }
    setOtpError("");
    setOtpSubmitting(true);
    try {
      const res = await fetch("/api/email-verifications/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          verification_id: emailVerificationId,
          otp: code,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Verification failed");
      setEmailVerified(true);
      setOtpSent(false);
    } catch (err) {
      setOtpError(err.message);
      setOtpDigits(emptyOtp());
      otpRefs.current[0]?.focus();
    } finally {
      setOtpSubmitting(false);
    }
  }

  function setOtpDigit(i, val) {
    const clean = val.replace(/\D/g, "").slice(-1);
    setOtpDigits((d) => {
      const next = [...d];
      next[i] = clean;
      return next;
    });
    if (clean && i < 5) otpRefs.current[i + 1]?.focus();
  }

  function otpKeyDown(i, e) {
    if (e.key === "Backspace" && !otpDigits[i] && i > 0)
      otpRefs.current[i - 1]?.focus();
  }

  function otpPaste(e) {
    e.preventDefault();
    const text = (e.clipboardData.getData("text") || "")
      .replace(/\D/g, "")
      .slice(0, 6);
    if (!text) return;
    const next = text.split("");
    while (next.length < 6) next.push("");
    setOtpDigits(next);
    otpRefs.current[Math.min(text.length, 5)]?.focus();
  }

  // ---- generic field updater ----
  function update(field, value) {
    if (field === "email") return updateEmail(value);
    if (field === "hotel_id") {
      setForm((prev) => ({ ...prev, hotel_id: value, branch_id: "" }));
      return;
    }
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateRole(roleId) {
    const role = roles.find((r) => r.id === roleId);
    setForm((prev) => ({
      ...prev,
      role_id: roleId,
      hotel_id: role?.scope === "branch" ? prev.hotel_id : "",
      branch_id: "",
    }));
  }

  // ---- field visibility ----
  const roleScope = selectedRole?.scope || "";
  const showHotelSelect = roleScope === "branch" && actorInfo.isPlatform;
  const showBranchSelect =
    roleScope === "branch" && (actorInfo.isPlatform || actorInfo.isOwner);
  const branchRequired = showBranchSelect;

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!form.full_name.trim()) return setError(`${t.users.name} is required`);
    if (!form.role_id) return setError("Please select a role");
    if (!form.password && !form.pin_code)
      return setError("Set a password or a PIN code");

    if (form.email.trim() && !emailVerified) {
      return setError("Please verify the email address before saving");
    }

    if (showHotelSelect && !form.hotel_id)
      return setError("Please select a hotel");
    if (branchRequired && !form.branch_id)
      return setError("Please select a branch");

    setSaving(true);
    try {
      const payload = {
        ...form,
        hotel_id:
          showHotelSelect || (actorInfo.isOwner && roleScope === "branch")
            ? form.hotel_id || null
            : null,
        branch_id: showBranchSelect ? form.branch_id || null : null,
        hired_at: form.hired_at || null,
        verification_id: emailVerificationId || null,
      };

      const res = await fetchWithAuth("/api/users", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.users.saveError);
      }

      router.push("/admin/users");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6" dir={dir}>
        {t.common.loading}
      </div>
    );
  }

  const emailReady = form.email.trim().includes("@");

  return (
    <div className="mx-auto max-w-4xl p-6" dir={dir}>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-[#10243A] dark:text-[#EDEBE3]">
          + {t.users.addUser}
        </h1>
        <Link
          href="/admin/owners/staff/create"
          className="text-sm font-medium text-[#2F6690] hover:underline"
        >
          ← {t.users.title}
        </Link>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30">
          {error}
        </div>
      )}

      <form
        onSubmit={handleSubmit}
        className="space-y-4 rounded-xl border border-black/10 bg-white p-6 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]"
      >
        {/* ============================================================
            ROW 1 (3 cols): Name | Email | Verify button
            The Verify button sits exactly where Phone used to be.
           ============================================================ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>{t.users.name}</label>
            <input
              className={inputClass}
              value={form.full_name}
              onChange={(e) => update("full_name", e.target.value)}
              required
            />
          </div>

          <div>
            <label className={labelClass}>{t.users.email}</label>
            <input
              type="email"
              className={inputClass}
              value={form.email}
              onChange={(e) => update("email", e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <div>
            {/* Invisible spacer so the button lines up with the inputs */}
            <span className={labelClass} aria-hidden="true">
              &nbsp;
            </span>
            {emailVerified ? (
              <div className="flex h-[38px] w-full items-center justify-center rounded-lg border border-green-200 bg-green-50 px-3 text-sm font-medium text-green-700 dark:border-green-900/40 dark:bg-green-950/30 dark:text-green-400">
                ✓ Verified
              </div>
            ) : (
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendingOtp || !emailReady}
                className="h-[38px] w-full rounded-lg border border-[#2F6690]/40 bg-[#F4F8FC] px-3 text-sm font-medium text-[#2F6690] transition-colors hover:bg-[#E8F1F9] disabled:cursor-not-allowed disabled:opacity-50 dark:border-[#2F6690]/60 dark:bg-[#0B1B2A] dark:text-[#7FB3D5] dark:hover:bg-[#0F2535]"
              >
                {sendingOtp ? "Sending…" : otpSent ? "Resend" : "Verify"}
              </button>
            )}
          </div>
        </div>

        {/* OTP panel */}
        {otpSent && !emailVerified && (
          <div className="rounded-xl border border-[#2F6690]/30 bg-[#F4F8FC] p-4 dark:border-[#2F6690]/40 dark:bg-[#0B1B2A]">
            <p className="text-sm text-[#5B6472] dark:text-[#C7CDD6]">
              Enter the 6-digit code sent to{" "}
              <strong className="text-[#10243A] dark:text-[#EDEBE3]">
                {form.email}
              </strong>
            </p>

            <div className="mt-3 flex items-center gap-2" onPaste={otpPaste}>
              {otpDigits.map((d, i) => (
                <input
                  key={i}
                  ref={(el) => (otpRefs.current[i] = el)}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={1}
                  value={d}
                  onChange={(e) => setOtpDigit(i, e.target.value)}
                  onKeyDown={(e) => otpKeyDown(i, e)}
                  className="h-11 w-10 rounded-lg border border-black/10 bg-white text-center text-lg font-semibold tabular-nums text-[#10243A] outline-none focus:border-[#2F6690] focus:ring-4 focus:ring-[#2F6690]/15 dark:border-white/10 dark:bg-[#0F1C2E] dark:text-[#EDEBE3]"
                />
              ))}
              <button
                type="button"
                onClick={verifyOtp}
                disabled={otpSubmitting || otpDigits.join("").length !== 6}
                className="ml-auto rounded-lg bg-[#10243A] px-3 py-2 text-sm font-medium text-[#EDEBE3] hover:bg-[#0B1826] disabled:opacity-50"
              >
                {otpSubmitting ? "Verifying…" : "Verify"}
              </button>
            </div>

            {otpError && (
              <p className="mt-2 text-xs text-red-600 dark:text-red-400">
                {otpError}
              </p>
            )}

            <p className="mt-3 text-xs text-[#8FA0B3]">
              Didn&apos;t get it? Check spam, or{" "}
              <button
                type="button"
                onClick={sendOtp}
                disabled={sendingOtp}
                className="text-[#2F6690] underline-offset-2 hover:underline disabled:opacity-50 dark:text-[#7FB3D5]"
              >
                {sendingOtp ? "sending…" : "resend code"}
              </button>
              .
            </p>
          </div>
        )}

        {/* ============================================================
            ROW 2 (3 cols): Phone | Username | Hired date
           ============================================================ */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div>
            <label className={labelClass}>Phone</label>
            <input
              className={inputClass}
              value={form.phone}
              onChange={(e) => update("phone", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Username</label>
            <input
              className={inputClass}
              value={form.username}
              onChange={(e) => update("username", e.target.value)}
            />
          </div>
          <div>
            <label className={labelClass}>Hired date</label>
            <input
              type="date"
              className={inputClass}
              value={form.hired_at}
              onChange={(e) => update("hired_at", e.target.value)}
            />
          </div>
        </div>

        {/* ============================================================
            ROW 3 (2 cols): Password | PIN
           ============================================================ */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={labelClass}>Password</label>
            <input
              type="password"
              className={inputClass}
              value={form.password}
              onChange={(e) => update("password", e.target.value)}
              placeholder="Min 8 characters"
            />
          </div>
          <div>
            <label className={labelClass}>POS PIN (quick login)</label>
            <input
              className={inputClass}
              value={form.pin_code}
              onChange={(e) => update("pin_code", e.target.value)}
              maxLength={10}
              placeholder="4–6 digits"
            />
          </div>
        </div>
        <p className="text-xs text-[#8FA0B3]">
          Set at least one of password or PIN. Waiters/cashiers on the floor app
          usually only need a PIN.
        </p>

        <div>
          <label className={labelClass}>{t.users.role}</label>
          <select
            className={inputClass}
            value={form.role_id}
            onChange={(e) => updateRole(e.target.value)}
            required
          >
            <option value="">Select a role</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name} ({r.scope})
              </option>
            ))}
          </select>
        </div>

        {showHotelSelect && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>{t.users.hotel}</label>
              <select
                className={inputClass}
                value={form.hotel_id}
                onChange={(e) => update("hotel_id", e.target.value)}
                required
              >
                <option value="">Select a hotel</option>
                {hotels.map((h) => (
                  <option key={h.id} value={h.id}>
                    {h.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>{t.users.branch}</label>
              <select
                className={inputClass}
                value={form.branch_id}
                onChange={(e) => update("branch_id", e.target.value)}
                disabled={!form.hotel_id}
                required
              >
                <option value="">—</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {!showHotelSelect && showBranchSelect && (
          <div>
            <label className={labelClass}>{t.users.branch}</label>
            <select
              className={inputClass}
              value={form.branch_id}
              onChange={(e) => update("branch_id", e.target.value)}
              required
            >
              <option value="">Select a branch</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {roleScope === "branch" && actorInfo.isBranch && (
          <p className="rounded-lg border border-[#2F6690]/25 bg-[#F4F8FC] px-3 py-2 text-xs text-[#2F6690] dark:border-[#2F6690]/40 dark:bg-[#0B1B2A] dark:text-[#7FB3D5]">
            This user will be assigned to your own branch automatically.
          </p>
        )}

        {roleScope === "hotel" && (
          <p className="rounded-lg border border-[#2F6690]/25 bg-[#F4F8FC] px-3 py-2 text-xs text-[#2F6690] dark:border-[#2F6690]/40 dark:bg-[#0B1B2A] dark:text-[#7FB3D5]">
            Hotel owners are created when setting up a hotel — the hotel will be
            assigned from that flow.
          </p>
        )}

        <div className="flex justify-end gap-3 pt-2">
          <Link
            href="/admin/users"
            className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium text-[#5B6472] hover:bg-black/[0.03] dark:border-white/10 dark:text-[#C7CDD6] dark:hover:bg-white/[0.03]"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="rounded-xl bg-[#10243A] px-4 py-2 text-sm font-medium text-[#EDEBE3] transition-colors hover:bg-[#0B1826] disabled:opacity-50"
          >
            {saving ? t.common.loading : t.users.addUser}
          </button>
        </div>
      </form>
    </div>
  );
}
