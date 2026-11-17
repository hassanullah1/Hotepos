"use client";

import { useEffect, useMemo, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ChevronRight,
  FileDown,
  FileSpreadsheet,
  Plus,
  X,
  Users,
  Wallet,
  CircleCheck,
  Clock,
  CalendarRange,
  Loader2,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

function money(n, currency = "AFN") {
  if (n === null || n === undefined) return "—";
  return `${Number(n).toLocaleString()} ${currency}`;
}

function fmtDate(d) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString();
}

const ERROR_KEY_MAP = {
  UNAUTHORIZED: ["branchPayroll", "unauthorized"],
  NOT_FOUND: ["branchPayroll", "notFound"],
  PERIOD_REQUIRED: ["branchPayroll", "periodRequired"],
  PERIOD_INVALID: ["branchPayroll", "periodInvalid"],
  PERIOD_END_BEFORE_START: ["branchPayroll", "periodEndBeforeStart"],
  NO_ELIGIBLE_STAFF: ["branchPayroll", "noEligibleStaff"],
  PAYROLL_PERIOD_EXISTS: ["branchPayroll", "payrollPeriodExists"],
  PAYROLL_RUN_FAILED: ["branchPayroll", "payrollRunFailed"],
  PAYROLL_INVALID_TRANSITION: ["branchPayroll", "payrollInvalidTransition"],
  PAYROLL_RUN_UPDATE_FAILED: ["branchPayroll", "payrollRunUpdateFailed"],
  RUN_NOT_FOUND: ["branchPayroll", "loadRunError"],
};

function errText(t, code) {
  const path = ERROR_KEY_MAP[code];
  const resolved = path?.reduce((acc, key) => acc?.[key], t);
  return resolved || t?.common?.error || "Something went wrong";
}

// Detects Arabic-script text (covers Pashto and Dari) so PDF export can route
// only these strings through the canvas-image fallback — jsPDF's built-in
// fonts have no Arabic shaping engine.
function isArabicScript(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(String(text ?? ""));
}

const RUN_STATUS = {
  draft: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200",
  processed: "bg-sky-100 text-sky-800 dark:bg-sky-900/50 dark:text-sky-200",
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
};
const SLIP_STATUS = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-200",
  unpaid:
    "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-200",
};

const inputCls =
  "w-full rounded-xl border border-gray-200 bg-gray-50 px-3.5 py-2.5 text-sm outline-none transition focus:border-teal-500 focus:bg-white focus:ring-4 focus:ring-teal-500/15 dark:border-gray-700 dark:bg-gray-900";

function Pill({ cls, children }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-semibold ${cls || RUN_STATUS.draft}`}
    >
      {children}
    </span>
  );
}

function Stat({ icon: Icon, label, value, tone }) {
  const tones = {
    teal: "bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
    emerald:
      "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
    amber:
      "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
    gray: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  };
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tones[tone]}`}
      >
        <Icon size={20} />
      </div>
      <div className="min-w-0">
        <div className="truncate text-lg font-bold tabular-nums leading-tight sm:text-xl">
          {value}
        </div>
        <div className="truncate text-xs text-gray-500 dark:text-gray-400">
          {label}
        </div>
      </div>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-3 p-4 sm:p-6">
      <div className="h-9 w-48 animate-pulse rounded-xl bg-gray-200/70 dark:bg-gray-800" />
      {Array.from({ length: 4 }).map((_, i) => (
        <div
          key={i}
          className="h-20 animate-pulse rounded-2xl bg-gray-200/70 dark:bg-gray-800"
        />
      ))}
    </div>
  );
}

/* ================= runs list ================= */

export default function BranchPayrollPage({ params }) {
  const { id } = usePromise(params);
  const router = useRouter();
  const { t, dir } = useAdminPreferences();
  const bp = t.branchPayroll;

  const [runs, setRuns] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [form, setForm] = useState({ period_start: "", period_end: "" });
  const [skippedNotice, setSkippedNotice] = useState(null);
  const [selectedRunId, setSelectedRunId] = useState(null);

  async function loadRuns() {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/owners/branches/${id}/payroll-runs`,
      );
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setRuns(body.runs);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadRuns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function generate(ev) {
    ev.preventDefault();
    setGenerating(true);
    setError("");
    setSkippedNotice(null);
    try {
      const res = await fetchWithAuth(
        `/api/owners/branches/${id}/payroll-runs`,
        {
          method: "POST",
          body: JSON.stringify(form),
        },
      );
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      if (body.skipped?.length) {
        const noSalary = body.skipped.filter((s) => s.reason === "no_salary");
        const overlap = body.skipped.filter(
          (s) => s.reason === "period_overlap",
        );
        const notices = [];
        if (noSalary.length)
          notices.push(
            bp.skippedNoSalary
              .replace("{count}", noSalary.length)
              .replace("{names}", noSalary.map((s) => s.full_name).join(", ")),
          );
        if (overlap.length)
          notices.push(
            bp.skippedOverlap
              .replace("{count}", overlap.length)
              .replace("{names}", overlap.map((s) => s.full_name).join(", ")),
          );
        setSkippedNotice(notices);
      }
      setShowForm(false);
      setForm({ period_start: "", period_end: "" });
      loadRuns();
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
    }
  }

  if (selectedRunId) {
    return (
      <RunDetail
        branchId={id}
        runId={selectedRunId}
        router={router}
        t={t}
        dir={dir}
        onBack={() => {
          setSelectedRunId(null);
          loadRuns();
        }}
      />
    );
  }

  if (loading && !runs) return <Skeleton />;

  return (
    <div
      className="mx-auto min-h-screen max-w-5xl bg-gray-50/60 p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:p-6"
      dir={dir}
    >
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {bp.title}
          </h1>
          {runs && (
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              <span className="tabular-nums">{runs.length}</span> ·{" "}
              {bp.columns.period}
            </p>
          )}
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className={`inline-flex w-full items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition sm:w-auto ${
            showForm
              ? "border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200"
              : "bg-teal-700 text-white shadow-lg shadow-teal-700/25 hover:bg-teal-800"
          }`}
        >
          {showForm ? <X size={16} /> : <Plus size={16} />}
          {showForm ? bp.cancelButton : bp.runButton}
        </button>
      </div>

      {error && (
        <p className="mb-4 rounded-xl border border-red-200 bg-red-50 px-3.5 py-2.5 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300">
          {error}
        </p>
      )}
      {skippedNotice?.length > 0 && (
        <div className="mb-4 space-y-1 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-300">
          {skippedNotice.map((line, i) => (
            <p key={i}>{line}</p>
          ))}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={generate}
          className="mb-6 rounded-2xl border border-gray-200 bg-white p-4 shadow-sm dark:border-gray-700 dark:bg-gray-800 sm:p-5"
        >
          <div className="mb-4 flex items-center gap-2 text-sm font-bold">
            <CalendarRange size={16} className="text-teal-600" />
            {bp.runButton}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                {bp.periodStartLabel} *
              </span>
              <input
                type="date"
                required
                value={form.period_start}
                onChange={(e) =>
                  setForm({ ...form, period_start: e.target.value })
                }
                className={inputCls}
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-xs font-semibold text-gray-600 dark:text-gray-300">
                {bp.periodEndLabel} *
              </span>
              <input
                type="date"
                required
                value={form.period_end}
                onChange={(e) =>
                  setForm({ ...form, period_end: e.target.value })
                }
                className={inputCls}
              />
            </label>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 disabled:opacity-50 disabled:shadow-none sm:w-auto"
            >
              {generating && <Loader2 size={15} className="animate-spin" />}
              {generating ? bp.generatingButton : bp.generateButton}
            </button>
          </div>
        </form>
      )}

      {!runs?.length ? (
        <div className="rounded-2xl border border-dashed border-gray-300 px-6 py-14 text-center dark:border-gray-700">
          <Wallet className="mx-auto mb-3 text-gray-400" size={32} />
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {bp.noRuns}
          </p>
        </div>
      ) : (
        <>
          {/* table */}
          <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
            <table className="w-full min-w-[520px] text-sm">
              <thead>
                <tr className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
                  <th className="px-5 py-3 text-start font-semibold">
                    {bp.columns.period}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {bp.columns.staff}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {bp.columns.total}
                  </th>
                  <th className="px-4 py-3 text-start font-semibold">
                    {bp.columns.status}
                  </th>
                  <th className="w-12 px-4 py-3" />
                </tr>
              </thead>
              <tbody>
                {runs.map((run) => (
                  <tr
                    key={run.id}
                    onClick={() => setSelectedRunId(run.id)}
                    className="cursor-pointer border-t border-gray-100 transition hover:bg-teal-50/60 dark:border-gray-700 dark:hover:bg-teal-900/20"
                  >
                    <td className="whitespace-nowrap px-4 py-3 font-medium sm:px-5 sm:py-3.5">
                      {fmtDate(run.period_start)} – {fmtDate(run.period_end)}
                    </td>
                    <td className="px-4 py-3.5 tabular-nums">
                      {run.payslip_count}
                    </td>
                    <td className="px-4 py-3.5 font-semibold tabular-nums">
                      {money(run.total_net)}
                    </td>
                    <td className="px-4 py-3.5">
                      <Pill cls={RUN_STATUS[run.status]}>
                        {bp.statuses[run.status] || run.status}
                      </Pill>
                    </td>
                    <td className="px-4 py-3.5 text-gray-400">
                      <ChevronRight size={18} className="rtl:rotate-180" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

/* ================= run detail ================= */

function RunDetail({ branchId, runId, router, t, dir, onBack }) {
  const bp = t.branchPayroll;
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportError, setExportError] = useState("");

  // PDF layout mirrors the admin's chosen language direction.
  const isRtl = dir === "rtl";

  async function load() {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/owners/branches/${branchId}/payroll-runs/${runId}`,
      );
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setRun(body.run);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runId]);

  async function transition(status) {
    setUpdating(true);
    try {
      const res = await fetchWithAuth(
        `/api/owners/branches/${branchId}/payroll-runs/${runId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status }),
        },
      );
      if (res.status === 401) return router.push("/hotel/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setRun(body.run);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  }

  // Same per-staff payslip endpoint the staff detail page uses.
  async function markLinePaid(payslip) {
    setMarkingId(payslip.id);
    try {
      const res = await fetchWithAuth(
        `/api/owners/staff/${payslip.user.id}/payslips/${payslip.id}`,
        {
          method: "PATCH",
          body: JSON.stringify({ status: "paid" }),
        },
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

  const totals = useMemo(() => {
    const slips = run?.payslips || [];
    const sum = (arr) => arr.reduce((s, p) => s + Number(p.net_pay || 0), 0);
    const paid = slips.filter((p) => p.status === "paid");
    const unpaid = slips.filter((p) => p.status === "unpaid");
    return {
      all: sum(slips),
      paid: sum(paid),
      unpaid: sum(unpaid),
      count: slips.length,
      unpaidCount: unpaid.length,
    };
  }, [run]);

  if (loading && !run) return <Skeleton />;

  if (error || !run)
    return (
      <div className="mx-auto max-w-5xl p-4 sm:p-6" dir={dir}>
        <p className="mb-3 text-sm text-red-600 dark:text-red-400">{error}</p>
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-sm font-semibold text-teal-700 dark:text-teal-300"
        >
          <ArrowLeft size={14} className="rtl:rotate-180" /> {bp.backToRuns}
        </button>
      </div>
    );

  const filteredPayslips = run.payslips; // export always includes every record
  const exportDisabled = filteredPayslips.length === 0;
  const slipLabel = (s) => bp.payslipStatuses?.[s] || s;

  function periodHeading() {
    const start = new Date(run.period_start);
    const end = new Date(run.period_end);
    const sameMonth =
      start.getUTCFullYear() === end.getUTCFullYear() &&
      start.getUTCMonth() === end.getUTCMonth();
    if (sameMonth)
      return start.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    return `${fmtDate(run.period_start)} – ${fmtDate(run.period_end)}`;
  }

  // Renders text via canvas so Arabic-script text shapes and joins correctly,
  // then it is placed into the PDF as an image.
  function textToImageDataUrl(
    text,
    { fontSize = 11, bold = false, color = "#111111" } = {},
  ) {
    const scale = 3;
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontSpec = `${bold ? "bold " : ""}${fontSize * scale}px "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif`;
    ctx.font = fontSpec;
    const metrics = ctx.measureText(text);
    canvas.width = Math.max(1, Math.ceil(metrics.width) + 8 * scale);
    canvas.height = Math.ceil(fontSize * scale * 1.6);
    ctx.font = fontSpec; // resize clears the context
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = color;
    ctx.fillText(text, canvas.width - 4 * scale, 2 * scale);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      widthMm: (canvas.width / scale) * (25.4 / 96),
      heightMm: (canvas.height / scale) * (25.4 / 96),
    };
  }

  function writeHeaderLine(doc, text, y, { fontSize = 11, bold = false } = {}) {
    const pageWidth = doc.internal.pageSize.getWidth();
    const marginLeft = 14;
    const marginRight = 14;

    if (isArabicScript(text)) {
      const { dataUrl, widthMm, heightMm } = textToImageDataUrl(text, {
        fontSize,
        bold,
      });
      const x = isRtl ? pageWidth - marginRight - widthMm : marginLeft;
      doc.addImage(dataUrl, "PNG", x, y - heightMm * 0.75, widthMm, heightMm);
      return y + heightMm + 2;
    }

    doc.setFontSize(fontSize);
    doc.setFont(undefined, bold ? "bold" : "normal");
    if (isRtl) doc.text(text, pageWidth - marginRight, y, { align: "right" });
    else doc.text(text, marginLeft, y);
    return y + fontSize * 0.5 + 2;
  }

  async function exportPdf() {
    setExportError("");
    setExportingPdf(true);
    try {
      const { jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF();
      const heading = periodHeading();

      let y = 18;
      y = writeHeaderLine(doc, bp.pdfTitle || "Payroll Report", y, {
        fontSize: 16,
        bold: true,
      });
      y += 4;
      y = writeHeaderLine(
        doc,
        `${bp.pdfPeriodLabel || "Period"}: ${heading}`,
        y,
      );
      y = writeHeaderLine(
        doc,
        `${bp.pdfDateRangeLabel || "Dates"}: ${fmtDate(run.period_start)} – ${fmtDate(run.period_end)}`,
        y,
      );
      y = writeHeaderLine(
        doc,
        `${bp.columns.status}: ${bp.statuses[run.status] || run.status}`,
        y,
      );

      const headCells = [
        bp.payslipColumns.staff,
        bp.payslipColumns.base,
        bp.payslipColumns.absence,
        bp.payslipColumns.bonus,
        bp.payslipColumns.advance,
        bp.payslipColumns.net,
        bp.payslipColumns.status,
      ];

      const rows = filteredPayslips.map((p) => [
        p.user.full_name,
        money(p.base_salary),
        Number(p.deduction_amount ?? 0) > 0
          ? `-${money(p.deduction_amount)}`
          : "—",
        money(p.bonus_amount ?? 0),
        money(p.advance_deducted ?? 0),
        money(p.net_pay),
        slipLabel(p.status),
      ]);

      const orderedHeadCells = isRtl ? [...headCells].reverse() : headCells;
      const orderedRows = rows.map((r) => (isRtl ? [...r].reverse() : r));

      autoTable(doc, {
        startY: y + 4,
        head: [orderedHeadCells],
        body: orderedRows,
        styles: {
          fontSize: 9,
          minCellHeight: 8,
          valign: "middle",
          halign: isRtl ? "right" : "left",
        },
        headStyles: { fillColor: [15, 118, 110] },
        didParseCell: (data) => {
          if (isArabicScript(data.cell.raw)) data.cell.text = [];
        },
        didDrawCell: (data) => {
          const raw = data.cell.raw;
          if (!isArabicScript(raw)) return;
          const isHead = data.section === "head";
          const { dataUrl, widthMm, heightMm } = textToImageDataUrl(
            String(raw),
            {
              fontSize: 9,
              bold: isHead,
              color: isHead ? "#ffffff" : "#111111",
            },
          );
          const maxWidth = data.cell.width - 4;
          const scaleDown = Math.min(1, maxWidth / widthMm);
          const drawW = widthMm * scaleDown;
          const drawH = heightMm * scaleDown;
          const x = isRtl
            ? data.cell.x + 2
            : data.cell.x + data.cell.width - drawW - 2;
          const yPos = data.cell.y + (data.cell.height - drawH) / 2;
          doc.addImage(dataUrl, "PNG", x, yPos, drawW, drawH);
        },
      });

      const totalNet = filteredPayslips.reduce(
        (sum, p) => sum + Number(p.net_pay),
        0,
      );
      const finalY = doc.lastAutoTable?.finalY || y + 4;
      writeHeaderLine(
        doc,
        `${bp.columns.total}: ${money(totalNet)}`,
        finalY + 10,
        { bold: true },
      );

      doc.save(
        `payroll_${run.period_start?.slice(0, 10)}_${run.period_end?.slice(0, 10)}.pdf`,
      );
    } catch (err) {
  
      setExportError(bp.pdfExportFailed || "Failed to generate PDF");
    } finally {
      setExportingPdf(false);
    }
  }

  async function exportExcel() {
    setExportError("");
    setExportingExcel(true);
    try {
      const XLSX = await import("xlsx");
      const rows = filteredPayslips.map((p) => ({
        [bp.payslipColumns.staff]: p.user.full_name,
        [bp.payslipColumns.base]: Number(p.base_salary),
        [bp.payslipColumns.absence]: Number(p.deduction_amount ?? 0),
        [bp.payslipColumns.bonus]: Number(p.bonus_amount ?? 0),
        [bp.payslipColumns.advance]: Number(p.advance_deducted ?? 0),
        [bp.payslipColumns.net]: Number(p.net_pay),
        [bp.payslipColumns.status]: slipLabel(p.status),
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payroll");
      XLSX.writeFile(
        wb,
        `payroll_${run.period_start?.slice(0, 10)}_${run.period_end?.slice(0, 10)}.xlsx`,
      );
    } catch (err) {
  
      setExportError(bp.excelExportFailed || "Failed to generate Excel file");
    } finally {
      setExportingExcel(false);
    }
  }

  const nextAction =
    run.status === "draft"
      ? { to: "processed", label: bp.markProcessedButton }
      : run.status === "processed"
        ? { to: "paid", label: bp.markPaidButton }
        : null;

  return (
    <div
      className="mx-auto min-h-screen max-w-5xl bg-gray-50/60 p-4 text-gray-900 dark:bg-gray-900 dark:text-gray-100 sm:p-6"
      dir={dir}
    >
      <button
        onClick={onBack}
        className="mb-4 inline-flex items-center gap-1.5 rounded-lg py-1 text-sm font-semibold text-teal-700 hover:text-teal-900 dark:text-teal-300"
      >
        <ArrowLeft size={15} className="rtl:rotate-180" /> {bp.backToRuns}
      </button>

      {/* header */}
      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {periodHeading()}
            </h1>
            <Pill cls={RUN_STATUS[run.status]}>
              {bp.statuses[run.status] || run.status}
            </Pill>
          </div>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {fmtDate(run.period_start)} – {fmtDate(run.period_end)}
          </p>
        </div>
        {nextAction && (
          <button
            onClick={() => transition(nextAction.to)}
            disabled={updating}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-teal-700/25 transition hover:bg-teal-800 disabled:opacity-50 disabled:shadow-none sm:w-auto"
          >
            {updating && <Loader2 size={15} className="animate-spin" />}
            {updating ? bp.updatingButton : nextAction.label}
          </button>
        )}
      </div>

      {/* stats */}
      <div className="mb-5 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat
          icon={Users}
          tone="gray"
          label={bp.columns.staff}
          value={totals.count}
        />
        <Stat
          icon={Wallet}
          tone="teal"
          label={bp.columns.total}
          value={money(totals.all)}
        />
        <Stat
          icon={CircleCheck}
          tone="emerald"
          label={slipLabel("paid")}
          value={money(totals.paid)}
        />
        <Stat
          icon={Clock}
          tone="amber"
          label={slipLabel("unpaid")}
          value={money(totals.unpaid)}
        />
      </div>

      {/* export (all records) */}
      <div className="mb-5 grid grid-cols-1 gap-2 sm:flex sm:justify-end">
        <button
          onClick={exportPdf}
          disabled={exportDisabled || exportingPdf}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          {exportingPdf ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <FileDown size={15} className="text-red-500" />
          )}
          {exportingPdf
            ? bp.exportingButton || "Exporting…"
            : bp.exportPdfButton || "Export PDF"}
        </button>
        <button
          onClick={exportExcel}
          disabled={exportDisabled || exportingExcel}
          className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold shadow-sm transition hover:bg-gray-50 disabled:opacity-50 dark:border-gray-600 dark:bg-gray-800 dark:hover:bg-gray-700"
        >
          {exportingExcel ? (
            <Loader2 size={15} className="animate-spin" />
          ) : (
            <FileSpreadsheet size={15} className="text-emerald-600" />
          )}
          {exportingExcel
            ? bp.exportingButton || "Exporting…"
            : bp.exportExcelButton || "Export Excel"}
        </button>
      </div>
      {exportError && (
        <p className="mb-4 text-sm text-red-600 dark:text-red-400">
          {exportError}
        </p>
      )}

      {/* payslips table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <table className="w-full min-w-[760px] text-sm">
          <thead>
            <tr className="bg-gray-50 text-xs text-gray-500 dark:bg-gray-900/50 dark:text-gray-400">
              <th className="sticky start-0 bg-gray-50 px-4 py-3 text-start font-semibold dark:bg-gray-900 sm:px-5">
                {bp.payslipColumns.staff}
              </th>
              <th className="px-3 py-3 text-start font-semibold">
                {bp.payslipColumns.base}
              </th>
              <th className="px-3 py-3 text-start font-semibold">
                {bp.payslipColumns.absence}
              </th>
              <th className="px-3 py-3 text-start font-semibold">
                {bp.payslipColumns.bonus}
              </th>
              <th className="px-3 py-3 text-start font-semibold">
                {bp.payslipColumns.advance}
              </th>
              <th className="px-3 py-3 text-start font-semibold">
                {bp.payslipColumns.net}
              </th>
              <th className="px-3 py-3 text-start font-semibold">
                {bp.payslipColumns.status}
              </th>
              <th className="px-5 py-3" />
            </tr>
          </thead>
          <tbody>
            {run.payslips.map((p) => {
              const deduction = Number(p.deduction_amount ?? 0);
              const canPay = p.status === "unpaid" && run.status !== "draft";
              return (
                <tr
                  key={p.id}
                  className="border-t border-gray-100 transition hover:bg-gray-50/70 dark:border-gray-700 dark:hover:bg-gray-900/30"
                >
                  <td className="sticky start-0 whitespace-nowrap bg-white px-4 py-3.5 font-medium dark:bg-gray-800 sm:px-5">
                    {p.user.full_name}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 tabular-nums">
                    {money(p.base_salary)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 tabular-nums">
                    {deduction > 0 ? (
                      <span className="text-red-600 dark:text-red-400">
                        -{money(deduction)}
                      </span>
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 tabular-nums">
                    {money(p.bonus_amount ?? 0)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 tabular-nums">
                    {money(p.advance_deducted ?? 0)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3.5 font-bold tabular-nums text-teal-800 dark:text-teal-300">
                    {money(p.net_pay)}
                  </td>
                  <td className="px-3 py-3.5">
                    <Pill cls={SLIP_STATUS[p.status]}>
                      {slipLabel(p.status)}
                    </Pill>
                  </td>
                  <td className="px-5 py-3.5 text-end">
                    {canPay && (
                      <button
                        onClick={() => markLinePaid(p)}
                        disabled={markingId === p.id}
                        className="whitespace-nowrap rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                      >
                        {markingId === p.id
                          ? bp.updatingButton
                          : bp.markLineButton}
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
