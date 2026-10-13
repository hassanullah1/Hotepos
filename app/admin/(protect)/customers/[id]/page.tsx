"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  User as UserIcon,
  Phone,
  Mail,
  Star,
  Receipt,
  BedDouble,
  CreditCard,
  Table2,
  ShoppingBag,
  Calendar,
  RefreshCw,
  FileText,
  CheckCircle2,
  X as XIcon,
  Wallet,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const TOLERANCE = 0.01;

const STAY_STATUS_STYLE = {
  active: "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  checked_out:
    "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

const ORDER_STATUS_STYLE = {
  open: "bg-sky-50 text-sky-700 dark:bg-sky-900/40 dark:text-sky-300",
  in_progress:
    "bg-amber-50 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300",
  served: "bg-teal-50 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300",
  paid: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300",
  closed: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400",
  cancelled: "bg-red-50 text-red-700 dark:bg-red-900/40 dark:text-red-300",
};

function isOrderPayable(o: { status: string }) {
  return !["paid", "closed", "cancelled"].includes(o.status);
}

function getStayBalance(s: {
  status: string;
  balance?: number;
  grand_total: number;
  paid_amount?: number;
}) {
  if (s.status === "cancelled") return 0;
  if (typeof s.balance === "number") return s.balance;
  const grand = Number(s.grand_total || 0);
  const paid = Number(s.paid_amount || 0);
  return Math.max(0, +(grand - paid).toFixed(2));
}

export default function CustomerHistoryPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = params?.id as string | undefined;
  const { t, dir } = useAdminPreferences();

  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("orders");

  const [payOpen, setPayOpen] = useState(false);
  const [selectedKey, setSelectedKey] = useState("");
  const [payAmount, setPayAmount] = useState("");
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");

  function handle401(res: Response) {
    if (res.status === 401) {
      router.push("/login");
      return true;
    }
    return false;
  }

  async function load() {
    if (!customerId) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetchWithAuth(`/api/owners/customers/${customerId}`);
      if (handle401(res)) return;
      const json = await res.json();
      if (!res.ok) {
        setError(json.error || "Failed to load customer");
        return;
      }
      setData(json);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId]);

  const tabs = useMemo(
    () => [
      {
        key: "orders",
        label: t.customerHistory?.tabOrders || "Orders",
        count: data?.orders?.length || 0,
      },
      {
        key: "stays",
        label: t.customerHistory?.tabStays || "Room stays",
        count: data?.stays?.length || 0,
      },
      {
        key: "payments",
        label: t.customerHistory?.tabPayments || "Payments",
        count: data?.payments?.length || 0,
      },
    ],
    [data, t],
  );

  const outstanding = useMemo(() => {
    if (!data) return [] as any[];
    const list: any[] = [];
    for (const o of data.orders || []) {
      if (!isOrderPayable(o)) continue;
      list.push({
        key: `order:${o.id}`,
        type: "order",
        id: o.id,
        label: o.order_number,
        hint: o.room_number
          ? `${t.customerHistory?.room || "Room"} ${o.room_number}`
          : o.table_number
            ? `${t.orders?.scopeTable || "Table"} ${o.table_number}`
            : t.orders?.scopeTakeaway || "Takeaway",
        amount: Number(o.total_amount),
        createdAt: o.created_at,
      });
    }
    for (const s of data.stays || []) {
      const balance = getStayBalance(s);
      if (balance <= TOLERANCE) continue;
      const paid = Number(s.paid_amount || 0);
      list.push({
        key: `room_stay:${s.id}`,
        type: "room_stay",
        id: s.id,
        label: `${t.customerHistory?.room || "Room"} ${s.room_number || ""}`,
        hint:
          paid > 0
            ? `${t.customerHistory?.paid || "Paid"} ${paid.toFixed(2)} / ${Number(s.grand_total).toFixed(2)}`
            : `${t.customerHistory?.nights || "Nights"} ${s.nights}`,
        amount: balance,
        createdAt: s.check_in_at,
      });
    }
    return list;
  }, [data, t]);

  const outstandingCount = outstanding.length;
  const outstandingTotal = useMemo(
    () => +outstanding.reduce((s, x) => s + x.amount, 0).toFixed(2),
    [outstanding],
  );

  const selectedItem = useMemo(
    () => outstanding.find((x) => x.key === selectedKey) || null,
    [outstanding, selectedKey],
  );

  function openPayModal() {
    if (outstanding.length === 0) return;
    setPayError("");
    setSelectedKey(outstanding[0].key);
    setPayAmount(String(outstanding[0].amount));
    setPayOpen(true);
  }

  function closePayModal() {
    setPayOpen(false);
    setSelectedKey("");
    setPayAmount("");
    setPayError("");
  }

  function pickItem(key: string) {
    setSelectedKey(key);
    const item = outstanding.find((x) => x.key === key);
    if (item) setPayAmount(String(item.amount));
  }

  async function submitPay(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedItem) {
      setPayError(t.customerHistory?.pickItem || "Select an item to pay");
      return;
    }
    const amount = Number(payAmount);
    if (!Number.isFinite(amount) || amount <= 0) {
      setPayError(t.customerHistory?.invalidAmount || "Enter a valid amount");
      return;
    }
    setPaying(true);
    setPayError("");
    try {
      const res = await fetchWithAuth(
        `/api/owners/customers/${customerId}/payments`,
        {
          method: "POST",
          body: JSON.stringify({
            item_type: selectedItem.type,
            item_id: selectedItem.id,
            amount,
          }),
        },
      );
      if (handle401(res)) return;
      const json = await res.json();
      if (!res.ok) {
        setPayError(json.error || "Failed to record payment");
        return;
      }
      closePayModal();
      await load();
    } catch (err) {
      setPayError((err as Error).message);
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <div className="p-6 dark:bg-gray-900 dark:text-gray-100" dir={dir}>
        <div className="max-w-4xl mx-auto space-y-4">
          <div className="h-10 w-40 rounded-lg bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
          <div className="h-64 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 dark:bg-gray-900 dark:text-gray-100" dir={dir}>
        <div className="max-w-4xl mx-auto">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1 text-sm text-teal-700 dark:text-teal-400 hover:underline mb-4"
          >
            <ArrowLeft size={14} /> {t.common?.back || "Back"}
          </Link>
          <div className="rounded-xl border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
            {error || "Customer not found"}
          </div>
        </div>
      </div>
    );
  }

  const { customer, summary, orders, stays, payments } = data;

  return (
    <div className="p-6 dark:bg-gray-900 dark:text-gray-100" dir={dir}>
      <div className="max-w-4xl mx-auto">
        {/* TOP BAR */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <Link
            href="/admin/customers"
            className="inline-flex items-center gap-1 text-sm text-teal-700 dark:text-teal-400 hover:underline"
          >
            <ArrowLeft size={14} /> {t.common?.back || "Back"}
          </Link>

          <div className="flex items-center gap-2">
            {outstandingCount > 0 && (
              <button
                onClick={openPayModal}
                className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-md text-sm font-semibold shadow-sm"
              >
                <Wallet size={15} />
                <span>{t.customerHistory?.pay || "Pay"}</span>
                <span className="text-xs bg-white/25 px-2 py-0.5 rounded-full tabular-nums">
                  {outstandingTotal.toFixed(2)}
                </span>
              </button>
            )}
            <button
              onClick={load}
              className="h-9 w-9 rounded-full flex items-center justify-center border border-teal-200 dark:border-teal-800 text-teal-700 dark:text-teal-200 hover:bg-teal-50 dark:hover:bg-teal-900/40"
              title={t.common?.refresh || "Refresh"}
            >
              <RefreshCw size={14} />
            </button>
          </div>
        </div>

        {/* HEADER CARD */}
        <div className="rounded-2xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-5 mb-5">
          <div className="flex flex-wrap items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-teal-100 dark:bg-teal-900/40 flex items-center justify-center text-teal-700 dark:text-teal-300 shrink-0">
              <UserIcon size={26} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-semibold truncate">
                {customer.full_name || t.customers?.unnamed || "Unnamed"}
              </h1>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400 mt-1">
                {customer.phone && (
                  <span className="inline-flex items-center gap-1" dir="ltr">
                    <Phone size={13} /> {customer.phone}
                  </span>
                )}
                {customer.email && (
                  <span className="inline-flex items-center gap-1" dir="ltr">
                    <Mail size={13} /> {customer.email}
                  </span>
                )}
                {customer.created_at && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar size={13} />
                    {new Date(customer.created_at).toLocaleDateString()}
                  </span>
                )}
                <span className="inline-flex items-center gap-1 text-amber-700 dark:text-amber-400 font-semibold">
                  <Star size={13} /> {customer.loyalty_points ?? 0}
                </span>
              </div>
              {customer.notes && (
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 border-t dark:border-gray-700 pt-2">
                  {customer.notes}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
            <StatCard
              icon={<Receipt size={16} />}
              label={t.customerHistory?.orders || "Orders"}
              value={summary.orders_count}
              hint={`${summary.orders_total.toFixed(2)}`}
            />
            <StatCard
              icon={<BedDouble size={16} />}
              label={t.customerHistory?.stays || "Stays"}
              value={summary.stays_count}
              hint={`${summary.stays_total.toFixed(2)}`}
            />
            <StatCard
              icon={<CreditCard size={16} />}
              label={t.customerHistory?.paid || "Paid"}
              value={`${summary.paid_total.toFixed(2)}`}
              accent
            />
            <StatCard
              icon={<FileText size={16} />}
              label={t.customerHistory?.loyalty || "Loyalty"}
              value={customer.loyalty_points ?? 0}
            />
          </div>

          {outstandingCount > 0 && (
            <div className="mt-4 flex items-center justify-between rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 px-3 py-2 text-sm">
              <span className="text-amber-800 dark:text-amber-300">
                {t.customerHistory?.outstanding || "Outstanding balance"} (
                {outstandingCount})
              </span>
              <span className="font-bold text-amber-800 dark:text-amber-300 tabular-nums">
                {outstandingTotal.toFixed(2)}
              </span>
            </div>
          )}
        </div>

        {/* TABS */}
        <div className="flex gap-1 mb-4 border-b dark:border-gray-700">
          {tabs.map((tb) => (
            <button
              key={tb.key}
              onClick={() => setTab(tb.key)}
              className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
                tab === tb.key
                  ? "border-teal-600 text-teal-700 dark:text-teal-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-teal-700 dark:hover:text-teal-400"
              }`}
            >
              {tb.label}
              <span className="ms-1.5 text-xs opacity-70">({tb.count})</span>
            </button>
          ))}
        </div>

        {/* ORDERS */}
        {tab === "orders" && (
          <>
            {orders.length === 0 ? (
              <EmptyState
                icon={<Receipt size={22} />}
                text={t.customerHistory?.noOrders || "No orders yet."}
              />
            ) : (
              <div className="space-y-3">
                {orders.map((o: any) => (
                  <div
                    key={o.id}
                    className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        {o.room_number ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-indigo-100 text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                            <BedDouble size={11} /> {o.room_number}
                          </span>
                        ) : o.table_number ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300 px-2 py-0.5 rounded-md">
                            <Table2 size={11} /> {o.table_number}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300 px-2 py-0.5 rounded-md">
                            <ShoppingBag size={11} />{" "}
                            {t.orders?.scopeTakeaway || "Takeaway"}
                          </span>
                        )}
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {o.order_number}
                        </span>
                        <span
                          className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                            ORDER_STATUS_STYLE[
                              o.status as keyof typeof ORDER_STATUS_STYLE
                            ] || "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {o.status.replace("_", " ")}
                        </span>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(o.created_at).toLocaleString()}
                        </span>
                        <span className="text-sm font-bold tabular-nums">
                          {o.total_amount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <ul className="space-y-0.5 ps-1">
                      {o.items.map((i: any) => (
                        <li
                          key={i.id}
                          className="flex justify-between text-[13px] text-gray-700 dark:text-gray-300"
                        >
                          <span>
                            <span className="font-medium">{i.quantity}×</span>{" "}
                            {i.name}
                          </span>
                          <span className="tabular-nums opacity-70">
                            {i.line_total.toFixed(2)}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ROOM STAYS */}
        {tab === "stays" && (
          <>
            {stays.length === 0 ? (
              <EmptyState
                icon={<BedDouble size={22} />}
                text={t.customerHistory?.noStays || "No room stays yet."}
              />
            ) : (
              <div className="space-y-3">
                {stays.map((s: any) => {
                  const paid = Number(s.paid_amount || 0);
                  const grand = Number(s.grand_total);
                  const balance = getStayBalance(s);
                  const partiallyPaid = paid > 0 && balance > TOLERANCE;
                  const fullyPaid = balance <= TOLERANCE;
                  return (
                    <div
                      key={s.id}
                      className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 p-4"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-800 dark:text-gray-100">
                            <BedDouble size={15} />
                            {t.customerHistory?.room || "Room"}{" "}
                            {s.room_number || "—"}
                          </span>
                          <span
                            className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                              STAY_STATUS_STYLE[
                                s.status as keyof typeof STAY_STATUS_STYLE
                              ] || "bg-gray-100 text-gray-600"
                            }`}
                          >
                            {s.status.replace("_", " ")}
                          </span>
                          {fullyPaid && (
                            <span className="text-[11px] font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300 px-2 py-0.5 rounded-full">
                              {t.customerHistory?.paid || "Paid"}
                            </span>
                          )}
                          {partiallyPaid && (
                            <span className="text-[11px] font-medium bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300 px-2 py-0.5 rounded-full">
                              {t.customerHistory?.partial || "Partial"}
                            </span>
                          )}
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {new Date(s.check_in_at).toLocaleDateString()}
                          {s.actual_check_out
                            ? ` → ${new Date(s.actual_check_out).toLocaleDateString()}`
                            : s.expected_check_out
                              ? ` → ${new Date(s.expected_check_out).toLocaleDateString()}`
                              : ""}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-sm">
                        <Cell
                          label={t.customerHistory?.nights || "Nights"}
                          value={s.nights}
                        />
                        <Cell
                          label={t.customerHistory?.rate || "Rate"}
                          value={s.rate_per_night.toFixed(2)}
                        />
                        <Cell
                          label={t.customerHistory?.rent || "Rent"}
                          value={s.rent_total.toFixed(2)}
                        />
                        <Cell
                          label={t.customerHistory?.orders || "Orders"}
                          value={s.orders_total.toFixed(2)}
                        />
                      </div>

                      <div className="mt-3 grid grid-cols-3 gap-2 text-sm">
                        <MiniStat
                          label={t.customerHistory?.paid || "Paid"}
                          value={paid.toFixed(2)}
                          tone="emerald"
                        />
                        <MiniStat
                          label={t.customerHistory?.grandTotal || "Total"}
                          value={grand.toFixed(2)}
                        />
                        <MiniStat
                          label={t.customerHistory?.balance || "Balance"}
                          value={balance.toFixed(2)}
                          tone={balance > TOLERANCE ? "amber" : "emerald"}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

        {/* PAYMENTS */}
        {tab === "payments" && (
          <>
            {payments.length === 0 ? (
              <EmptyState
                icon={<CreditCard size={22} />}
                text={t.customerHistory?.noPayments || "No payments yet."}
              />
            ) : (
              <div className="rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 text-gray-500 dark:text-gray-400 text-xs uppercase">
                    <tr>
                      <th className="text-start px-4 py-2.5 font-medium">
                        {t.customerHistory?.date || "Date"}
                      </th>
                      <th className="text-start px-4 py-2.5 font-medium">
                        {t.customerHistory?.method || "Method"}
                      </th>
                      <th className="text-start px-4 py-2.5 font-medium">
                        {t.customerHistory?.linkedTo || "Linked to"}
                      </th>
                      <th className="text-end px-4 py-2.5 font-medium">
                        {t.customerHistory?.amount || "Amount"}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y dark:divide-gray-700">
                    {payments.map((p: any) => (
                      <tr key={p.id}>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {p.paid_at
                            ? new Date(p.paid_at).toLocaleString()
                            : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className="font-medium">
                            {p.method_name || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-2.5 text-gray-600 dark:text-gray-400">
                          {p.room_number ? (
                            <span className="inline-flex items-center gap-1">
                              <BedDouble size={12} />{" "}
                              {t.customerHistory?.room || "Room"}{" "}
                              {p.room_number}
                            </span>
                          ) : p.order_number ? (
                            <span className="inline-flex items-center gap-1">
                              <Receipt size={12} /> {p.order_number}
                            </span>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-4 py-2.5 text-end font-bold tabular-nums text-emerald-700 dark:text-emerald-400">
                          {p.amount.toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot className="bg-gray-50 dark:bg-gray-900/50 font-semibold">
                    <tr>
                      <td colSpan={3} className="px-4 py-2.5 text-end">
                        {t.customerHistory?.totalPaid || "Total paid"}
                      </td>
                      <td className="px-4 py-2.5 text-end tabular-nums text-emerald-700 dark:text-emerald-400">
                        {summary.paid_total.toFixed(2)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* PAY MODAL */}
      {payOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-start justify-center p-4 pt-16 z-50 overflow-y-auto"
          dir={dir}
        >
          <form
            onSubmit={submitPay}
            className="bg-white dark:bg-gray-800 rounded-lg w-full max-w-md shadow-xl"
          >
            <div className="flex items-center justify-between px-5 py-3 border-b dark:border-gray-700">
              <h2 className="text-lg font-semibold inline-flex items-center gap-2">
                <Wallet size={18} className="text-emerald-600" />
                {t.customerHistory?.payTitle || "Record payment"}
              </h2>
              <button
                type="button"
                onClick={closePayModal}
                className="h-7 w-7 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                <XIcon size={14} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {payError && (
                <p className="text-red-600 dark:text-red-400 text-sm">
                  {payError}
                </p>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2 block">
                  {t.customerHistory?.pickItem || "Select the item to pay"}
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {outstanding.map((item) => {
                    const active = selectedKey === item.key;
                    return (
                      <button
                        type="button"
                        key={item.key}
                        onClick={() => pickItem(item.key)}
                        className={`w-full text-start rounded-lg border p-3 transition-colors ${
                          active
                            ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/30"
                            : "border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-900/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            {item.type === "room_stay" ? (
                              <BedDouble
                                size={15}
                                className="text-indigo-600 dark:text-indigo-400 shrink-0"
                              />
                            ) : (
                              <Receipt
                                size={15}
                                className="text-teal-600 dark:text-teal-400 shrink-0"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-semibold truncate">
                                {item.label}
                              </div>
                              <div className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                {item.hint}
                              </div>
                            </div>
                          </div>
                          <span className="text-sm font-bold tabular-nums shrink-0">
                            {item.amount.toFixed(2)}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {selectedItem && (
                <div>
                  <label className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1 block">
                    {t.customerHistory?.amount || "Amount"}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full border rounded-md px-3 py-2.5 text-lg font-bold text-emerald-700 dark:text-emerald-400 dark:bg-gray-900 dark:border-gray-700 tabular-nums"
                    autoFocus
                  />
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {t.customerHistory?.paidPhysically ||
                      "Confirm amount received in cash / physically"}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 px-5 py-3 border-t dark:border-gray-700">
              <button
                type="button"
                onClick={closePayModal}
                className="px-4 py-2 text-sm rounded-md border dark:border-gray-700"
              >
                {t.common?.cancel || "Cancel"}
              </button>
              <button
                type="submit"
                disabled={paying || !selectedItem}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-sm rounded-md bg-emerald-600 hover:bg-emerald-700 text-white disabled:opacity-50"
              >
                <CheckCircle2 size={14} />
                {paying
                  ? t.common?.saving || "Saving…"
                  : t.customerHistory?.confirmPaid || "Paid"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}

/* ---------- small helpers ---------- */

function StatCard({
  icon,
  label,
  value,
  hint,
  accent = false,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  hint?: string;
  accent?: boolean;
}) {
  return (
    <div
      className={`rounded-xl border p-3 ${
        accent
          ? "border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30"
          : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800"
      }`}
    >
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400">
        {icon}
        <span>{label}</span>
      </div>
      <div
        className={`text-lg font-bold tabular-nums mt-1 ${
          accent
            ? "text-emerald-700 dark:text-emerald-400"
            : "text-gray-800 dark:text-gray-100"
        }`}
      >
        {value}
      </div>
      {hint !== undefined && (
        <div className="text-xs text-gray-500 dark:text-gray-400 tabular-nums">
          {hint}
        </div>
      )}
    </div>
  );
}

function Cell({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
      <div className="font-semibold tabular-nums">{value}</div>
    </div>
  );
}

function MiniStat({
  label,
  value,
  tone = "gray",
}: {
  label: string;
  value: React.ReactNode;
  tone?: "gray" | "emerald" | "amber";
}) {
  const toneClass =
    tone === "emerald"
      ? "text-emerald-700 dark:text-emerald-400"
      : tone === "amber"
        ? "text-amber-700 dark:text-amber-400"
        : "text-gray-800 dark:text-gray-100";
  return (
    <div className="rounded-md bg-gray-50 dark:bg-gray-900/40 px-2.5 py-1.5">
      <div className="text-[11px] text-gray-500 dark:text-gray-400">
        {label}
      </div>
      <div className={`text-sm font-bold tabular-nums ${toneClass}`}>
        {value}
      </div>
    </div>
  );
}

function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="border border-dashed rounded-xl px-6 py-10 text-center dark:border-gray-700 text-gray-500 dark:text-gray-400">
      <div className="flex justify-center mb-2 text-gray-400">{icon}</div>
      <p className="text-sm">{text}</p>
    </div>
  );
}
