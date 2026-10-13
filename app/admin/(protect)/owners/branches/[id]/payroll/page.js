"use client";

import { useEffect, useState, use as usePromise } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Eye, FileDown, FileSpreadsheet } from "lucide-react";
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

// Detects Arabic-script text (covers Pashto and Dari, both written in
// Arabic script) so PDF export can route only these strings through the
// canvas-image fallback below — jsPDF's built-in fonts (Helvetica etc.)
// only cover Latin/WinAnsi characters and have no Arabic shaping engine,
// so passing Pashto/Dari straight to doc.text() or autoTable renders
// garbled, disconnected glyphs. Latin/English text is left on jsPDF's
// native text renderer, which stays sharper and selectable.
function isArabicScript(text) {
  return /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/.test(String(text ?? ""));
}

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
      if (res.status === 401) return router.push("/owner/login");
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
      if (res.status === 401) return router.push("/owner/login");
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

  if (loading)
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
        {t.staffDetail?.loading}
      </div>
    );

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

  return (
    <div
      className="p-6 max-w-4xl mx-auto dark:bg-gray-900 dark:text-gray-100"
      dir={dir}
    >
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">{bp.title}</h1>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md text-sm"
        >
          {showForm ? bp.cancelButton : bp.runButton}
        </button>
      </div>

      {error && (
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
      )}
      {skippedNotice?.map((line, i) => (
        <p key={i} className="text-amber-600 dark:text-amber-400 text-sm mb-1">
          {line}
        </p>
      ))}

      {showForm && (
        <form
          onSubmit={generate}
          className="border dark:border-gray-700 rounded-md p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
        >
          <div>
            <label className="block text-xs font-medium mb-1">
              {bp.periodStartLabel} *
            </label>
            <input
              type="date"
              required
              value={form.period_start}
              onChange={(e) =>
                setForm({ ...form, period_start: e.target.value })
              }
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">
              {bp.periodEndLabel} *
            </label>
            <input
              type="date"
              required
              value={form.period_end}
              onChange={(e) => setForm({ ...form, period_end: e.target.value })}
              className="w-full border rounded-md px-3 py-2 text-sm dark:bg-gray-700 dark:border-gray-600"
            />
          </div>
          <div className="sm:col-span-2 flex justify-end">
            <button
              type="submit"
              disabled={generating}
              className="bg-black dark:bg-white text-white dark:text-black px-4 py-2 rounded-md text-sm disabled:opacity-50"
            >
              {generating ? bp.generatingButton : bp.generateButton}
            </button>
          </div>
        </form>
      )}

      {!runs?.length ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">{bp.noRuns}</p>
      ) : (
        <table className="w-full text-sm border-collapse">
          <thead>
            <tr className="text-start border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
              <th className="py-2 pe-4 text-start">{bp.columns.period}</th>
              <th className="pe-4 text-start">{bp.columns.staff}</th>
              <th className="pe-4 text-start">{bp.columns.total}</th>
              <th className="text-start">{bp.columns.status}</th>
              <th className="text-start">{bp.columns.action}</th>
            </tr>
          </thead>
          <tbody>
            {runs.map((run) => (
              <tr
                key={run.id}
                onClick={() => setSelectedRunId(run.id)}
                className="border-b dark:border-gray-700 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                <td className="py-2 pe-4">
                  {fmtDate(run.period_start)} – {fmtDate(run.period_end)}
                </td>
                <td className="pe-4">{run.payslip_count}</td>
                <td className="pe-4 font-medium">{money(run.total_net)}</td>
                <td>{bp.statuses[run.status] || run.status}</td>
                <td className="whitespace-nowrap pe-4">
                 
                    <Eye
                      className="text-teal-700/70 hover:text-teal-700 hover:bg-teal-100 dark:text-teal-300/70 dark:hover:text-teal-200 dark:hover:bg-teal-900 rounded-full transition-colors"
                      size={16}
                    />
                  
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

function RunDetail({ branchId, runId, router, t, dir, onBack }) {
  const bp = t.branchPayroll;
  const [run, setRun] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [updating, setUpdating] = useState(false);
  const [markingId, setMarkingId] = useState(null);

  // --- export controls ---
  const [includePaid, setIncludePaid] = useState(true);
  const [includeUnpaid, setIncludeUnpaid] = useState(true);
  const [exportingPdf, setExportingPdf] = useState(false);
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportError, setExportError] = useState("");

  // Whether the PDF layout itself (column order, alignment, margins)
  // should mirror right-to-left. This is driven by the admin's chosen
  // language direction, not by whether any given string happens to
  // contain Arabic-script characters — a Pashto/Dari report should read
  // right-to-left even for rows that are, say, just numbers or a Latin
  // staff name.
  const isRtl = dir === "rtl";

  async function load() {
    setLoading(true);
    try {
      const res = await fetchWithAuth(
        `/api/owners/branches/${branchId}/payroll-runs/${runId}`,
      );
      if (res.status === 401) return router.push("/owner/login");
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
        { method: "PATCH", body: JSON.stringify({ status }) },
      );
      if (res.status === 401) return router.push("/owner/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      setRun(body.run);
    } catch (err) {
      alert(err.message);
    } finally {
      setUpdating(false);
    }
  }

  // Reuses the same per-staff payslip endpoint the staff detail page uses,
  // so "pay this one person now" behaves identically from either screen.
  async function markLinePaid(payslip) {
    setMarkingId(payslip.id);
    try {
      const res = await fetchWithAuth(
        `/api/owners/staff/${payslip.user.id}/payslips/${payslip.id}`,
        { method: "PATCH", body: JSON.stringify({ status: "paid" }) },
      );
      if (res.status === 401) return router.push("/owner/login");
      const body = await res.json();
      if (!res.ok) throw new Error(errText(t, body.error));
      load();
    } catch (err) {
      alert(err.message);
    } finally {
      setMarkingId(null);
    }
  }

  if (loading)
    return (
      <div className="p-6 text-sm text-gray-500 dark:text-gray-400">
        {t.staffDetail?.loading}
      </div>
    );

  if (error || !run)
    return (
      <div className="p-6">
        <p className="text-red-600 dark:text-red-400 text-sm mb-3">{error}</p>
        <button
          onClick={onBack}
          className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1"
        >
          <ArrowLeft size={14} /> {bp.backToRuns}
        </button>
      </div>
    );

  // Payslips matching the checked statuses. Both checked (default) = all
  // rows; both unchecked = empty (export buttons disable themselves).
  const filteredPayslips = run.payslips.filter((p) => {
    if (p.status === "paid") return includePaid;
    if (p.status === "unpaid") return includeUnpaid;
    return true; // any future status falls through rather than vanishing
  });
  const exportDisabled = filteredPayslips.length === 0;

  // Month label for the PDF/Excel header — e.g. "August 2026" when the
  // period lands cleanly in one calendar month, otherwise the date range.
  function periodHeading() {
    const start = new Date(run.period_start);
    const end = new Date(run.period_end);
    const sameMonth =
      start.getUTCFullYear() === end.getUTCFullYear() &&
      start.getUTCMonth() === end.getUTCMonth();
    if (sameMonth) {
      return start.toLocaleDateString(undefined, {
        month: "long",
        year: "numeric",
      });
    }
    return `${fmtDate(run.period_start)} – ${fmtDate(run.period_end)}`;
  }

  // Renders text via canvas so Arabic-script text (Pashto, Dari) shapes
  // and joins correctly — jsPDF's built-in fonts have no Arabic shaping
  // engine, so feeding such text straight to doc.text() produces garbled,
  // disconnected glyphs. Canvas uses the browser's own text engine, which
  // handles this correctly; the result is then dropped into the PDF as an
  // image. Only used for strings that actually contain Arabic-script
  // characters — Latin text keeps using jsPDF's native, sharper,
  // selectable text.
  function textToImageDataUrl(text, { fontSize = 11, bold = false } = {}) {
    const scale = 3; // supersample for crisp print resolution
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const fontSpec = `${bold ? "bold " : ""}${fontSize * scale}px "Noto Sans Arabic", "Segoe UI", Tahoma, sans-serif`;
    ctx.font = fontSpec;
    const metrics = ctx.measureText(text);
    canvas.width = Math.max(1, Math.ceil(metrics.width) + 8 * scale);
    canvas.height = Math.ceil(fontSize * scale * 1.6);
    // canvas resize clears the context — font must be reapplied
    ctx.font = fontSpec;
    ctx.direction = "rtl";
    ctx.textAlign = "right";
    ctx.textBaseline = "top";
    ctx.fillStyle = "#22eca9";
    ctx.fillText(text, canvas.width - 4 * scale, 2 * scale);
    return {
      dataUrl: canvas.toDataURL("image/png"),
      widthMm: (canvas.width / scale) * (25.4 / 96),
      heightMm: (canvas.height / scale) * (25.4 / 96),
    };
  }

  // Writes one header/summary line.
  //
  // Alignment/positioning now follows the document's overall direction
  // (isRtl), not just whether this particular string contains
  // Arabic-script characters:
  //  - Arabic-script text always goes through the canvas-image fallback
  //    (jsPDF has no Arabic shaping) and is placed on the side dictated
  //    by isRtl.
  //  - Non-Arabic text (numbers, Latin labels) is still drawn with
  //    jsPDF's native, selectable text renderer, but right-aligned
  //    against the right margin when the report is RTL, instead of
  //    always being pinned to the left margin.
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
    if (isRtl) {
      doc.text(text, pageWidth - marginRight, y, { align: "right" });
    } else {
      doc.text(text, marginLeft, y);
    }
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
        bp.payslipStatuses?.[p.status] || p.status,
      ]);

      // Mirror the table's column order for RTL layouts, so the report
      // reads right-to-left the way the rest of the RTL UI does (staff
      // name column ends up on the right, status on the left).
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
        headStyles: { fillColor: [20, 20, 20] },
        // Arabic-script cell text (staff names, translated column
        // headers) would garble under autoTable's own text renderer for
        // the same reason as the header block above. We blank the text
        // here and draw it ourselves as an image in didDrawCell, which
        // fires after autoTable has painted the cell background/borders.
        didParseCell: (data) => {
          const raw = data.cell.raw;
          if (isArabicScript(raw)) {
            data.cell.text = [];
          }
        },
        didDrawCell: (data) => {
          const raw = data.cell.raw;
          if (!isArabicScript(raw)) return;
          const { dataUrl, widthMm, heightMm } = textToImageDataUrl(
            String(raw),
            { fontSize: 9, bold: data.section === "head" },
          );
          const maxWidth = data.cell.width - 4;
          const scaleDown = Math.min(1, maxWidth / widthMm);
          const drawW = widthMm * scaleDown;
          const drawH = heightMm * scaleDown;
          // Keep the Arabic-script image glued to the same edge of the
          // cell that halign is using for everything else, so mixed
          // Arabic/Latin cells in the same column still line up.
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

      const fileSafeStart = run.period_start?.slice(0, 10);
      const fileSafeEnd = run.period_end?.slice(0, 10);
      doc.save(`payroll_${fileSafeStart}_${fileSafeEnd}.pdf`);
    } catch (err) {
      console.error("PDF export error:", err);
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
        [bp.payslipColumns.status]: bp.payslipStatuses?.[p.status] || p.status,
      }));

      // Excel has no font-shaping issue like jsPDF — Arabic-script text
      // is stored as plain Unicode text and rendered correctly by Excel
      // itself, so no image workaround is needed here.
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Payroll");

      const fileSafeStart = run.period_start?.slice(0, 10);
      const fileSafeEnd = run.period_end?.slice(0, 10);
      XLSX.writeFile(wb, `payroll_${fileSafeStart}_${fileSafeEnd}.xlsx`);
    } catch (err) {
      console.error("Excel export error:", err);
      setExportError(bp.excelExportFailed || "Failed to generate Excel file");
    } finally {
      setExportingExcel(false);
    }
  }

  return (
    <div className="p-6 max-w-4xl mx-auto dark:bg-gray-900 dark:text-gray-100">
      <button
        onClick={onBack}
        className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 mb-4"
      >
        <ArrowLeft size={14} /> {bp.backToRuns}
      </button>

      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-xl font-semibold">{periodHeading()}</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {fmtDate(run.period_start)} – {fmtDate(run.period_end)} ·{" "}
            {bp.statuses[run.status] || run.status}
          </p>
        </div>
        {run.status === "draft" && (
          <button
            onClick={() => transition("processed")}
            disabled={updating}
            className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
          >
            {updating ? bp.updatingButton : bp.markProcessedButton}
          </button>
        )}
        {run.status === "processed" && (
          <button
            onClick={() => transition("paid")}
            disabled={updating}
            className="bg-black dark:bg-white text-white dark:text-black px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
          >
            {updating ? bp.updatingButton : bp.markPaidButton}
          </button>
        )}
      </div>

      {/* Export controls */}
      <div className="border dark:border-gray-700 rounded-md p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4 mb-3">
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {bp.exportIncludeLabel || "Include"}:
          </span>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={includePaid}
              onChange={(e) => setIncludePaid(e.target.checked)}
            />
            {bp.payslipStatuses?.paid || "Paid"}
          </label>
          <label className="flex items-center gap-1.5 text-sm">
            <input
              type="checkbox"
              checked={includeUnpaid}
              onChange={(e) => setIncludeUnpaid(e.target.checked)}
            />
            {bp.payslipStatuses?.unpaid || "Unpaid"}
          </label>
          <span className="text-xs text-gray-400 dark:text-gray-500">
            ({filteredPayslips.length} {bp.exportRowsLabel || "rows"})
          </span>
        </div>

        {exportError && (
          <p className="text-red-600 dark:text-red-400 text-sm mb-2">
            {exportError}
          </p>
        )}

        <div className="flex gap-2">
          <button
            onClick={exportPdf}
            disabled={exportDisabled || exportingPdf}
            className="flex items-center gap-1.5 border dark:border-gray-600 px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
          >
            <FileDown size={14} />
            {exportingPdf
              ? bp.exportingButton || "Exporting…"
              : bp.exportPdfButton || "Export PDF"}
          </button>
          <button
            onClick={exportExcel}
            disabled={exportDisabled || exportingExcel}
            className="flex items-center gap-1.5 border dark:border-gray-600 px-3 py-1.5 rounded-md text-sm disabled:opacity-50"
          >
            <FileSpreadsheet size={14} />
            {exportingExcel
              ? bp.exportingButton || "Exporting…"
              : bp.exportExcelButton || "Export Excel"}
          </button>
        </div>
      </div>

      <table className="w-full text-sm border-collapse">
        <thead>
          <tr className="text-start border-b dark:border-gray-700 text-gray-500 dark:text-gray-400">
            <th className="py-2 pe-4 text-start">{bp.payslipColumns.staff}</th>
            <th className="pe-4 text-start">{bp.payslipColumns.base}</th>
            <th className="pe-4 text-start">{bp.payslipColumns.absence}</th>
            <th className="pe-4 text-start">{bp.payslipColumns.bonus}</th>
            <th className="pe-4 text-start">{bp.payslipColumns.advance}</th>
            <th className="pe-4 text-start">{bp.payslipColumns.net}</th>
            <th className="text-start">{bp.payslipColumns.status}</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          {run.payslips.map((p) => {
            const deduction = Number(p.deduction_amount ?? 0);
            return (
              <tr key={p.id} className="border-b dark:border-gray-700">
                <td className="py-2 pe-4">{p.user.full_name}</td>
                <td className="pe-4">{money(p.base_salary)}</td>
                <td className="pe-4">
                  {deduction > 0 ? (
                    <span className="text-red-600 dark:text-red-400">
                      -{money(deduction)}
                    </span>
                  ) : (
                    "—"
                  )}
                </td>
                <td className="pe-4">{money(p.bonus_amount ?? 0)}</td>
                <td className="pe-4">{money(p.advance_deducted ?? 0)}</td>
                <td className="pe-4 font-medium">{money(p.net_pay)}</td>
                <td>{p.status}</td>
                <td className="text-end">
                  {p.status === "unpaid" && run.status !== "draft" && (
                    <button
                      onClick={() => markLinePaid(p)}
                      disabled={markingId === p.id}
                      className="text-green-600 dark:text-green-400 text-xs disabled:opacity-50"
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
  );
}
