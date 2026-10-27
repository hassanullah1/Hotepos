"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  AtSign,
  Lock,
  Save,
  ShieldCheck,
  Loader2,
  AlertCircle,
  CheckCircle2,
  KeyRound,
  Building2,
  UserCog,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const inputClass =
  "w-full text-sm border border-teal-200 dark:border-teal-800 rounded-lg px-3 py-2  dark:bg-teal-900/40 text-teal-900 dark:text-teal-100 placeholder:text-teal-400/70 focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500";

export default function ProfilePage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [infoForm, setInfoForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
  });
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoMsg, setInfoMsg] = useState("");

  const [pwForm, setPwForm] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwError, setPwError] = useState("");

  function handle401(res: Response) {
    if (res.status === 401) {
      router.push("/hotel/login");
      return true;
    }
    return false;
  }

  async function loadMe() {
    setLoading(true);
    try {
      const res = await fetchWithAuth("/api/auth/me");
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load profile");
      setMe(data.user);
      setInfoForm({
        full_name: data.user.full_name || "",
        email: data.user.email || "",
        phone: data.user.phone || "",
        username: data.user.username || "",
      });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function saveInfo(e: React.FormEvent) {
    e.preventDefault();
    setInfoSaving(true);
    setInfoMsg("");
    setError("");
    try {
      const res = await fetchWithAuth("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify(infoForm),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save");
        return;
      }
      setMe(data.user);
      setInfoMsg(t.profile?.saved || "Profile updated.");
      setTimeout(() => setInfoMsg(""), 2500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setInfoSaving(false);
    }
  }

  async function savePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg("");
    setPwError("");
    if (pwForm.new_password !== pwForm.confirm_password) {
      setPwError(
        t.profile?.passwordMismatch ||
          "New password and confirmation don't match",
      );
      return;
    }
    setPwSaving(true);
    try {
      const res = await fetchWithAuth("/api/auth/me", {
        method: "PATCH",
        body: JSON.stringify({
          current_password: pwForm.current_password,
          new_password: pwForm.new_password,
        }),
      });
      if (handle401(res)) return;
      const data = await res.json();
      if (!res.ok) {
        setPwError(data.error || "Failed to change password");
        return;
      }
      setPwMsg(t.profile?.passwordChanged || "Password changed.");
      setPwForm({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });
      setTimeout(() => setPwMsg(""), 2500);
    } catch (err: any) {
      setPwError(err.message);
    } finally {
      setPwSaving(false);
    }
  }

  if (loading) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        dir={dir}
      >
        <Loader2 className="h-5 w-5 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error && !me) {
    return (
      <div
        className="min-h-screen p-6 flex items-center justify-center"
        dir={dir}
      >
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      </div>
    );
  }

  const roleText = me?.role ? String(me.role).replace(/_/g, " ") : "";
  const roleInitial = roleText ? roleText[0].toUpperCase() : "?";

  return (
    <div className="min-h-screen p-4" dir={dir}>
      <div className="max-w-3xl mx-auto">
        {/* ============ Header ============ */}
        <div className="flex items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-teal-600 flex items-center justify-center text-white shadow-sm">
              <UserCog className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-teal-950 dark:text-teal-50 leading-tight">
                {t.profile?.title || "My Profile"}
              </h1>
              <p className="text-xs text-teal-700/70 dark:text-teal-300/70">
                {t.profile?.subtitle || "Manage your account details and password."}
              </p>
            </div>
          </div>
        </div>

        {/* ============ Identity card ============ */}
        <div className="rounded-2xl border border-teal-200 dark:border-teal-800   shadow-sm p-4 mb-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-500 flex items-center justify-center text-white text-xl font-bold shadow-sm shrink-0">
              {roleInitial}
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-base font-semibold text-teal-950 dark:text-teal-50 truncate">
                {me?.full_name || "—"}
              </div>
              <div className="text-xs text-teal-700/70 dark:text-teal-300/70 truncate">
                {me?.email || me?.phone || "—"}
              </div>
            </div>
            <div className="flex flex-col gap-1.5 items-end shrink-0">
              <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-teal-50 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 ring-1 ring-teal-100 dark:ring-teal-800 capitalize">
                <ShieldCheck className="h-3 w-3" />
                {roleText || "—"}
              </span>
              {me?.branch?.name && (
                <span className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-900/40 text-emerald-800 dark:text-emerald-200 ring-1 ring-emerald-100 dark:ring-emerald-800">
                  <Building2 className="h-3 w-3" />
                  {me.branch.name}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* ============ Info form ============ */}
        <form
          onSubmit={saveInfo}
          className="rounded-2xl border border-teal-200 dark:border-teal-800   shadow-sm p-5 space-y-4 mb-4"
        >
          <h2 className="text-sm font-semibold text-teal-950 dark:text-teal-50">
            {t.profile?.accountInfo || "Account info"}
          </h2>

          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}
          {infoMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{infoMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <User className="h-3.5 w-3.5" />
                  {t.profile?.fullName || "Full name"}
                </span>
              }
            >
              <input
                required
                value={infoForm.full_name}
                onChange={(e) =>
                  setInfoForm({ ...infoForm, full_name: e.target.value })
                }
                className={inputClass}
              />
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <AtSign className="h-3.5 w-3.5" />
                  {t.profile?.username || "Username"}
                </span>
              }
            >
              <input
                value={infoForm.username}
                onChange={(e) =>
                  setInfoForm({ ...infoForm, username: e.target.value })
                }
                dir="ltr"
                className={inputClass}
              />
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" />
                  {t.profile?.email || "Email"}
                </span>
              }
            >
              <input
                type="email"
                value={infoForm.email}
                onChange={(e) =>
                  setInfoForm({ ...infoForm, email: e.target.value })
                }
                dir="ltr"
                className={inputClass}
              />
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5" />
                  {t.profile?.phone || "Phone"}
                </span>
              }
            >
              <input
                value={infoForm.phone}
                onChange={(e) =>
                  setInfoForm({ ...infoForm, phone: e.target.value })
                }
                dir="ltr"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-3 border-t border-teal-100 dark:border-teal-800/60">
            <button
              type="submit"
              disabled={infoSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {infoSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t.common?.saving || "Saving…"}
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  {t.common?.save || "Save changes"}
                </>
              )}
            </button>
          </div>
        </form>

        {/* ============ Password form ============ */}
        <form
          onSubmit={savePassword}
          className="rounded-2xl border border-teal-200 dark:border-teal-800   shadow-sm p-5 space-y-4"
        >
          <h2 className="inline-flex items-center gap-2 text-sm font-semibold text-teal-950 dark:text-teal-50">
            <KeyRound className="h-4 w-4 text-teal-600 dark:text-teal-300" />
            {t.profile?.changePassword || "Change password"}
          </h2>

          {pwError && (
            <div className="flex items-start gap-2 rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{pwError}</span>
            </div>
          )}
          {pwMsg && (
            <div className="flex items-start gap-2 rounded-lg border border-emerald-200 dark:border-emerald-900 bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <span>{pwMsg}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  {t.profile?.currentPassword || "Current password"}
                </span>
              }
            >
              <input
                required
                type="password"
                value={pwForm.current_password}
                onChange={(e) =>
                  setPwForm({ ...pwForm, current_password: e.target.value })
                }
                dir="ltr"
                className={inputClass}
              />
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  {t.profile?.newPassword || "New password"}
                </span>
              }
            >
              <input
                required
                type="password"
                minLength={8}
                value={pwForm.new_password}
                onChange={(e) =>
                  setPwForm({ ...pwForm, new_password: e.target.value })
                }
                dir="ltr"
                className={inputClass}
              />
            </Field>

            <Field
              label={
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3.5 w-3.5" />
                  {t.profile?.confirmPassword || "Confirm new password"}
                </span>
              }
            >
              <input
                required
                type="password"
                minLength={8}
                value={pwForm.confirm_password}
                onChange={(e) =>
                  setPwForm({ ...pwForm, confirm_password: e.target.value })
                }
                dir="ltr"
                className={inputClass}
              />
            </Field>
          </div>

          <div className="flex justify-end pt-3 border-t border-teal-100 dark:border-teal-800/60">
            <button
              type="submit"
              disabled={pwSaving}
              className="inline-flex items-center gap-1.5 px-5 py-2 text-sm rounded-full bg-teal-600 hover:bg-teal-700 text-white font-medium shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {pwSaving ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {t.common?.saving || "Saving…"}
                </>
              ) : (
                <>
                  <KeyRound className="h-3.5 w-3.5" />
                  {t.profile?.changePassword || "Change password"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Field helper                                                       */
/* ------------------------------------------------------------------ */
function Field({
  label,
  children,
}: {
  label: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="min-w-0">
      <label className="block text-xs font-medium text-teal-800 dark:text-teal-200 mb-1.5">
        {label}
      </label>
      {children}
    </div>
  );
}