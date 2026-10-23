"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const TABS = ["overview", "salary", "advances", "payroll"];

function money(n, currency = "AFN") {
  if (n === null || n === undefined) return "—";
  return `${Number(n).toLocaleString()} ${currency}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

// API routes return error CODES (e.g. "EFFECTIVE_FROM_BEFORE_CURRENT"), never
// English sentences, so they can be localized here. Maps each code to the
// flat staffDetail.* key that holds its translation (same convention your
// expenses section already uses — e.g. expenses.loadHotelsError) rather
// than a shared "errors" namespace.
const ERROR_KEY_MAP = {
  UNAUTHORIZED: ["staffDetail", "unauthorized"],
  NOT_FOUND: ["staffDetail", "notFound"],
  SALARY_LOAD_FAILED: ["staffDetail", "salary", "loadSalaryError"],
  SALARY_SAVE_FAILED: ["staffDetail", "salary", "saveSalaryError"],
  BASE_AMOUNT_REQUIRED: ["staffDetail", "salary", "baseAmountRequired"],
  BASE_AMOUNT_NEGATIVE: ["staffDetail", "salary", "baseAmountNegative"],
  SALARY_TYPE_INVALID: ["staffDetail", "salary", "salaryTypeInvalid"],
  EFFECTIVE_FROM_REQUIRED: ["staffDetail", "salary", "effectiveFromRequired"],
  EFFECTIVE_FROM_INVALID: ["staffDetail", "salary", "effectiveFromInvalid"],
  EFFECTIVE_FROM_BEFORE_CURRENT: [
    "staffDetail",
    "salary",
    "effectiveFromBeforeCurrent",
  ],
  ADVANCES_LOAD_FAILED: ["staffDetail", "advances", "loadAdvancesError"],
  ADVANCE_AMOUNT_INVALID: ["staffDetail", "advances", "advanceAmountInvalid"],
  ADVANCE_SAVE_FAILED: ["staffDetail", "advances", "saveAdvanceError"],
  ADVANCE_NOT_FOUND: ["staffDetail", "advances", "advanceNotFound"],
  ADVANCE_INVALID_TRANSITION: [
    "staffDetail",
    "advances",
    "advanceInvalidTransition",
  ],
  ADVANCE_UPDATE_FAILED: ["staffDetail", "advances", "updateAdvanceError"],
  PAYSLIPS_LOAD_FAILED: ["staffDetail", "payroll", "loadPayslipsError"],
};

function errText(t, code) {
  const path = ERROR_KEY_MAP[code];
  const resolved = path?.reduce((acc, key) => acc?.[key], t);
  return resolved || t?.common?.error || "Something went wrong";
}

// ---------------- Shared UI primitives ----------------
// Keeping these in one place is what makes the page read as "one system"
// instead of every tab reinventing its own button/input/card styling.

const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";

const labelClass =
  "block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1";

function PrimaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white shadow-sm transition-colors hover:bg-teal-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function SecondaryButton({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-700 dark:text-teal-400 transition-colors hover:bg-teal-50 dark:hover:bg-teal-900/20 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function TextLink({ children, className = "", ...props }) {
  return (
    <button
      {...props}
      className={`inline-flex items-center gap-1 text-sm font-medium text-teal-700 dark:text-teal-400 hover:text-teal-800 dark:hover:text-teal-300 transition-colors ${className}`}
    >
      {children}
    </button>
  );
}

function Card({ children, className = "" }) {
  return (
    <div
      className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}

const BADGE_STYLES = {
  active: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  current: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  approved: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  paid: "bg-teal-50 text-teal-700 dark:bg-teal-900/30 dark:text-teal-400",
  pending:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  unpaid: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
  repaid: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  past: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  inactive: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  rejected: "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-400",
};

function Badge({ tone = "pending", children }) {
  const cls = BADGE_STYLES[tone] || BADGE_STYLES.pending;
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${cls}`}
    >
      {children}
    </span>
  );
}

function Th({ children, align = "start" }) {
  return (
    <th
      className={`py-2.5 px-4 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400 text-${align}`}
    >
      {children}
    </th>
  );
}

function Td({ children, align = "start", className = "" }) {
  return (
    <td className={`py-3 px-4 text-sm text-${align} ${className}`}>
      {children}
    </td>
  );
}

function TableShell({ children }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div className="flex items-center gap-2 py-8 text-sm text-gray-500 dark:text-gray-400">
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-teal-600 border-t-transparent" />
      {label}
    </div>
  );
}

function EmptyState({ label }) {
  return (
    <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 py-10 text-center text-sm text-gray-500 dark:text-gray-400">
      {label}
    </div>
  );
}

function ErrorBanner({ message }) {
  if (!message) return null;
  return (
    <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/50 dark:bg-red-900/20 dark:text-red-400">
      {message}
    </div>
  );
}

// ---------------- Page ----------------

export default function StaffDetailPage({ params }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const { t, dir } = useAdminPreferences();
  const sd = t.staffDetail;

  const [staff, setStaff] = useState(null);
  const [tab, setTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadStaff() {
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${id}`);
      if (res.status === 401) return router.push("/hotel/login");
      const data = await res.json();
      if (!res.ok) throw new Error(errText(t, data.error));
      setStaff(data.staff);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadStaff();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  if (loading)
    return (
      <div className="p-6 max-w-4xl mx-auto">
        <LoadingState label={sd.loading} />
      </div>
    );

  if (error || !staff)
    return (
      <div className="p-6 max-w-4xl mx-auto" dir={dir}>
        <ErrorBanner message={error || sd.notFound} />
        <TextLink onClick={() => router.push("/")}>
          <ArrowLeft size={14} /> {sd.back}
        </TextLink>
      </div>
    );

  const initials = staff.full_name
    ?.split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div
      className="p-6 max-w-4xl mx-auto text-gray-900 dark:text-gray-100"
      dir={dir}
    >
      <TextLink
        onClick={() => router.push("/admin/owners/staff")}
        className="mb-5"
      >
        <ArrowLeft size={14} /> {sd.back}
      </TextLink>

      <div className="mb-6 flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-600 text-sm font-semibold text-white">
          {initials || "—"}
        </div>
        <div>
          <h1 className="text-2xl font-semibold">{staff.full_name}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.staff.roles[staff.role] || staff.role} ·{" "}
            {staff.branch?.name || "—"}
          </p>
        </div>
        <span className="ms-auto">
          <Badge tone={staff.is_active ? "active" : "inactive"}>
            {staff.is_active ? sd.overview.active : sd.overview.inactive}
          </Badge>
        </span>
      </div>

      <div className="mb-6 flex gap-1 border-b border-gray-200 dark:border-gray-700">
        {TABS.map((tKey) => (
          <button
            key={tKey}
            onClick={() => setTab(tKey)}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              tab === tKey
                ? "border-teal-600 text-teal-700 dark:text-teal-400"
                : "border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            }`}
          >
            {sd.tabs[tKey]}
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview staff={staff} t={t} />}
      {tab === "salary" && <SalaryTab staffId={id} router={router} t={t} />}
      {tab === "advances" && <AdvancesTab staffId={id} router={router} t={t} />}
      {tab === "payroll" && <PayrollTab staffId={id} router={router} t={t} />}
    </div>
  );
}

function Overview({ staff, t }) {
  const o = t.staffDetail.overview;
  return (
    <Card className="grid grid-cols-1 gap-5 sm:grid-cols-2">
      <Field label={o.email} value={staff.email || "—"} />
      <Field label={o.phone} value={staff.phone || "—"} />
      <Field label={o.username} value={staff.username || "—"} />
      <Field
        label={o.status}
        value={
          <Badge tone={staff.is_active ? "active" : "inactive"}>
            {staff.is_active ? o.active : o.inactive}
          </Badge>
        }
      />
      <Field label={o.hired} value={fmtDate(staff.hired_at)} />
      <Field label={o.added} value={fmtDate(staff.created_at)} />
    </Card>
  );
}

function Field({ label, value }) {
  return (
    <div>
      <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
        {label}
      </div>
      <div className="text-sm">{value}</div>
    </div>
  );
}

// ---------------- Salary ----------------

function SalaryTab({ staffId, router, t }) {
  const s = t.staffDetail.salary;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    base_amount: "",
    bonus_amount: "",
    salary_type: "monthly",
    currency: "AFN",
    effective_from: new Date().toISOString().slice(0, 10),
  });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${staffId}/salary`);
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setData(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  async function submit(ev) {
    ev.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${staffId}/salary`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          // send null instead of "" so the API can distinguish "no bonus"
          // from an actual 0, rather than getting an empty string
          bonus_amount: form.bonus_amount === "" ? null : form.bonus_amount,
        }),
      });
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setShowForm(false);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <LoadingState label={t.staffDetail.loading} />;

  return (
    <div>
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {s.currentLabel}
            </div>
            <div className="text-xl font-semibold">
              {data?.current
                ? `${money(data.current.base_amount, data.current.currency)} / ${
                    s.types[data.current.salary_type] ||
                    data.current.salary_type
                  }`
                : s.notSet}
            </div>
            {data?.current?.bonus_amount > 0 && (
              <div className="mt-1 text-sm text-teal-700 dark:text-teal-400">
                +{money(data.current.bonus_amount, data.current.currency)}{" "}
                {s.bonusLabel}
              </div>
            )}
            {data?.current && (
              <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {s.since.replace(
                  "{date}",
                  fmtDate(data.current.effective_from),
                )}
              </div>
            )}
          </div>
          {showForm ? (
            <SecondaryButton onClick={() => setShowForm(false)}>
              {s.cancelButton}
            </SecondaryButton>
          ) : (
            <PrimaryButton onClick={() => setShowForm(true)}>
              {data?.current ? s.changeButton : s.setButton}
            </PrimaryButton>
          )}
        </div>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label className={labelClass}>{s.amountLabel} *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                required
                value={form.base_amount}
                onChange={(e) =>
                  setForm({ ...form, base_amount: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{s.bonusLabel}</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.bonus_amount}
                onChange={(e) =>
                  setForm({ ...form, bonus_amount: e.target.value })
                }
                placeholder="0"
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{s.typeLabel}</label>
              <select
                value={form.salary_type}
                onChange={(e) =>
                  setForm({ ...form, salary_type: e.target.value })
                }
                className={inputClass}
              >
                <option value="monthly">{s.types.monthly}</option>
                <option value="hourly">{s.types.hourly}</option>
                <option value="daily">{s.types.daily}</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>{s.currencyLabel}</label>
              <input
                value={form.currency}
                onChange={(e) => setForm({ ...form, currency: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{s.effectiveFromLabel} *</label>
              <input
                type="date"
                required
                value={form.effective_from}
                onChange={(e) =>
                  setForm({ ...form, effective_from: e.target.value })
                }
                className={inputClass}
              />
            </div>
            <div className="flex items-end justify-end sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? s.savingButton : s.saveButton}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      <div className="mb-2 text-xs font-medium uppercase tracking-wide text-gray-500 dark:text-gray-400">
        {s.historyLabel}
      </div>
      {!data?.history?.length ? (
        <EmptyState label={s.noHistory} />
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <Th>{s.columns.amount}</Th>
              <Th>{s.columns.bonus}</Th>
              <Th>{s.columns.type}</Th>
              <Th>{s.columns.from}</Th>
              <Th>{s.columns.to}</Th>
              <Th>{s.columns.status}</Th>
            </tr>
          </thead>
          <tbody>
            {data.history.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0 dark:border-gray-700/60"
              >
                <Td className="font-medium">
                  {money(row.base_amount, row.currency)}
                </Td>
                <Td>
                  {row.bonus_amount
                    ? money(row.bonus_amount, row.currency)
                    : "—"}
                </Td>
                <Td>{s.types[row.salary_type] || row.salary_type}</Td>
                <Td>{fmtDate(row.effective_from)}</Td>
                <Td>{row.effective_to ? fmtDate(row.effective_to) : "—"}</Td>
                <Td>
                  <Badge tone={row.is_current ? "current" : "past"}>
                    {row.is_current ? s.current : s.past}
                  </Badge>
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

// ---------------- Advances ----------------

function AdvancesTab({ staffId, router, t }) {
  const a = t.staffDetail.advances;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: "", reason: "" });
  const [saving, setSaving] = useState(false);

  async function load() {
    setLoading(true);
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${staffId}/advances`);
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setData(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  async function submit(ev) {
    ev.preventDefault();
    setSaving(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${staffId}/advances`, {
        method: "POST",
        body: JSON.stringify(form),
      });
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setShowForm(false);
      setForm({ amount: "", reason: "" });
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(advanceId, status) {
    try {
      const res = await fetchWithAuth(
        `/api/owners/staff/${staffId}/advances/${advanceId}`,
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      load();
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) return <LoadingState label={t.staffDetail.loading} />;

  return (
    <div>
      <ErrorBanner message={error} />

      <Card className="mb-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {a.outstandingLabel}
            </div>
            <div className="text-xl font-semibold">
              {money(data?.total_outstanding ?? 0)}
            </div>
          </div>
          {showForm ? (
            <SecondaryButton onClick={() => setShowForm(false)}>
              {a.cancelButton}
            </SecondaryButton>
          ) : (
            <PrimaryButton onClick={() => setShowForm(true)}>
              {a.giveButton}
            </PrimaryButton>
          )}
        </div>
      </Card>

      {showForm && (
        <Card className="mb-6">
          <form
            onSubmit={submit}
            className="grid grid-cols-1 gap-4 sm:grid-cols-2"
          >
            <div>
              <label className={labelClass}>{a.amountLabel} *</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                required
                value={form.amount}
                onChange={(e) => setForm({ ...form, amount: e.target.value })}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>{a.reasonLabel}</label>
              <input
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
                className={inputClass}
              />
            </div>
            <div className="flex items-end justify-end sm:col-span-2">
              <PrimaryButton type="submit" disabled={saving}>
                {saving ? a.savingButton : a.saveButton}
              </PrimaryButton>
            </div>
          </form>
        </Card>
      )}

      {!data?.advances?.length ? (
        <EmptyState label={a.noAdvances} />
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <Th>{a.columns.amount}</Th>
              <Th>{a.columns.reason}</Th>
              <Th>{a.columns.date}</Th>
              <Th>{a.columns.status}</Th>
              <Th align="end"> </Th>
            </tr>
          </thead>
          <tbody>
            {data.advances.map((row) => (
              <tr
                key={row.id}
                className="border-b border-gray-100 last:border-0 dark:border-gray-700/60"
              >
                <Td className="font-medium">{money(row.amount)}</Td>
                <Td>{row.reason || "—"}</Td>
                <Td>{fmtDate(row.requested_at)}</Td>
                <Td>
                  <Badge tone={row.status}>{row.status}</Badge>
                </Td>
                <Td align="end">
                  {row.status === "approved" && (
                    <div className="inline-flex gap-3">
                      <TextLink
                        onClick={() => updateStatus(row.id, "repaid")}
                        className="text-teal-700 dark:text-teal-400"
                      >
                        {a.markRepaid}
                      </TextLink>
                      <TextLink
                        onClick={() => updateStatus(row.id, "rejected")}
                        className="text-red-600 dark:text-red-400 hover:text-red-700"
                      >
                        {a.reject}
                      </TextLink>
                    </div>
                  )}
                </Td>
              </tr>
            ))}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}

// ---------------- Payroll history ----------------

function PayrollTab({ staffId, router, t }) {
  const p = t.staffDetail.payroll;
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [markingId, setMarkingId] = useState(null);

  async function load() {
    try {
      const res = await fetchWithAuth(`/api/owners/staff/${staffId}/payslips`);
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setData(body);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [staffId]);

  // Available once the parent payroll run has been processed (amounts
  // locked) — draft-run payslips can still change, so no per-line pay yet.
  async function markPaid(payslipId) {
    setMarkingId(payslipId);
    try {
      const res = await fetchWithAuth(
        `/api/owners/staff/${staffId}/payslips/${payslipId}`,
        { method: "PATCH", body: JSON.stringify({ status: "paid" }) },
      );
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setMarkingId(null);
    }
  }

  if (loading) return <LoadingState label={t.staffDetail.loading} />;
  if (error) return <ErrorBanner message={error} />;

  return (
    <div>
      <Card className="mb-6 inline-block">
        <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
          {p.totalPaidLabel}
        </div>
        <div className="text-xl font-semibold">
          {money(data?.total_paid ?? 0)}
        </div>
      </Card>

      {!data?.payslips?.length ? (
        <EmptyState label={p.noPayslips} />
      ) : (
        <TableShell>
          <thead>
            <tr className="border-b border-gray-200 dark:border-gray-700">
              <Th>{p.columns.period}</Th>
              <Th>{p.columns.base}</Th>
              <Th>{p.columns.bonus}</Th>
              <Th>{p.columns.deductions}</Th>
              <Th>{p.columns.advance}</Th>
              <Th>{p.columns.net}</Th>
              <Th>{p.columns.status}</Th>
              <Th align="end"> </Th>
            </tr>
          </thead>
          <tbody>
            {data.payslips.map((row) => {
              const canMarkPaid =
                row.status === "unpaid" && row.payroll_run.status !== "draft";
              return (
                <tr
                  key={row.id}
                  className="border-b border-gray-100 last:border-0 dark:border-gray-700/60"
                >
                  <Td>
                    {fmtDate(row.payroll_run.period_start)} –{" "}
                    {fmtDate(row.payroll_run.period_end)}
                  </Td>
                  <Td>{money(row.base_salary)}</Td>
                  <Td>{money(row.bonus_amount ?? 0)}</Td>
                  <Td>{money(row.deduction_amount ?? 0)}</Td>
                  <Td>{money(row.advance_deducted ?? 0)}</Td>
                  <Td className="font-semibold">{money(row.net_pay)}</Td>
                  <Td>
                    <Badge tone={row.status}>{row.status}</Badge>
                  </Td>
                  <Td align="end">
                    {row.status === "unpaid" &&
                      (canMarkPaid ? (
                        <TextLink
                          onClick={() => markPaid(row.id)}
                          disabled={markingId === row.id}
                          className="text-teal-700 dark:text-teal-400 disabled:opacity-50"
                        >
                          {markingId === row.id
                            ? p.markingPaidButton
                            : p.markPaidButton}
                        </TextLink>
                      ) : (
                        <span
                          className="text-xs text-gray-400 dark:text-gray-500"
                          title={p.markPaidLocked}
                        >
                          {p.markPaidLocked}
                        </span>
                      ))}
                  </Td>
                </tr>
              );
            })}
          </tbody>
        </TableShell>
      )}
    </div>
  );
}
