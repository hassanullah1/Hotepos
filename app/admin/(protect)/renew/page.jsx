"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { useSubscriptionState } from "@/hooks/useSubscriptionState";

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

const DURATIONS = [
  { months: 2, key: "d2" },
  { months: 4, key: "d4" },
  { months: 6, key: "d6" },
  { months: 12, key: "d12" },
];

const isNil = (v) => v === null || v === undefined;

const fill = (str, vars) =>
  Object.entries(vars || {}).reduce(
    (s, [k, v]) => s.replace(new RegExp(`\\{${k}\\}`, "g"), v),
    str ?? "",
  );

function isPlanEligible(plan, info) {
  const hotelBranches = info?.branch_count ?? 0;
  const hotelPos = info?.pos_device_count ?? 0;
  const branchLimit = isNil(plan.max_branches) ? Infinity : plan.max_branches;
  const posLimit = isNil(plan.max_pos_devices)
    ? Infinity
    : plan.max_pos_devices;
  return hotelBranches <= branchLimit && hotelPos <= posLimit;
}

function ineligibilityReason(plan, info, t) {
  const hotelBranches = info?.branch_count ?? 0;
  const hotelPos = info?.pos_device_count ?? 0;
  const branchLimit = isNil(plan.max_branches) ? Infinity : plan.max_branches;
  const posLimit = isNil(plan.max_pos_devices)
    ? Infinity
    : plan.max_pos_devices;

  if (hotelBranches > branchLimit) {
    return fill(t.renew.planTooSmallBranches, {
      have: hotelBranches,
      allow: plan.max_branches,
    });
  }
  if (hotelPos > posLimit) {
    return fill(t.renew.planTooSmallPos, {
      have: hotelPos,
      allow: plan.max_pos_devices,
    });
  }
  return null;
}

// Extract the UUID from any string — handles the case where HesabPay
// appends "?data={...}" to the value.
const UUID_RE = /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

function extractUuid(raw) {
  if (!raw) return "";
  const m = String(raw).match(UUID_RE);
  return m ? m[0] : "";
}

export default function RenewPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { t, dir } = useAdminPreferences();
  const { subscription } = useAdminAuth();
  const { state: subState, daysLeft } = useSubscriptionState(subscription);

  const [plans, setPlans] = useState([]);
  const [info, setInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [months, setMonths] = useState(2);
  const [submitting, setSubmitting] = useState(null);
  const [error, setError] = useState("");
  const [confirming, setConfirming] = useState(false);

  // ───── redirect-confirm ─────
  // HesabPay appends "?data={...}" instead of "&data={...}", so any of
  // the query values can arrive with garbage appended. Use regex for the
  // UUIDs and parseInt for the month count.
  useEffect(() => {
    const status = searchParams.get("status");
    const refRaw = searchParams.get("ref");
    const planRaw = searchParams.get("plan");
    const monthsRaw = searchParams.get("months") || "";

    const hotelId = extractUuid(refRaw);
    const planId = extractUuid(planRaw);
    const monthsNum = parseInt(monthsRaw, 10);

    if (
      status !== "paid" ||
      !hotelId ||
      !planId ||
      !Number.isFinite(monthsNum) ||
      monthsNum < 1
    )
      return;

    let cancelled = false;
    setConfirming(true);

    (async () => {
      try {
        const res = await fetch("/api/renew/confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ref: hotelId,
            plan: planId,
            months: monthsNum,
          }),
        });
        const data = await res.json();
        if (cancelled) return;
        if (data.ok) {
          window.location.href = "/admin?renewed=1";
        } else {
          setError(data.error || t.renew.confirmError);
          setConfirming(false);
        }
      } catch {
        if (!cancelled) {
          setError(t.renew.confirmErrorSupport);
          setConfirming(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  function AfPayIcon({ className = "" }) {
    return (
      <img src="/afpay.png" alt="AfPay" className={className} loading="lazy" />
    );
  }

  function VisaIcon({ className = "" }) {
    return (
      <svg viewBox="0 0 32 20" className={className} aria-hidden="true">
        <rect x="0.5" y="0.5" width="31" height="19" rx="3.5" fill="#1A1F71" />
        <text
          x="16"
          y="14"
          textAnchor="middle"
          fontFamily="system-ui, sans-serif"
          fontWeight="700"
          fontStyle="italic"
          fontSize="9"
          fill="#FFFFFF"
          letterSpacing="0.5"
        >
          VISA
        </text>
      </svg>
    );
  }

  function MastercardIcon({ className = "" }) {
    return (
      <svg viewBox="0 0 32 20" className={className} aria-hidden="true">
        <rect x="0.5" y="0.5" width="31" height="19" rx="3.5" fill="#1A1A1A" />
        <circle cx="13" cy="10" r="4.5" fill="#EB001B" />
        <circle cx="19" cy="10" r="4.5" fill="#F79E1B" fillOpacity="0.9" />
        <path
          d="M16 6.7a4.5 4.5 0 0 0 0 6.6 4.5 4.5 0 0 0 0-6.6Z"
          fill="#FF5F00"
        />
      </svg>
    );
  }

  // ───── load plans + info ─────
  async function loadData() {
    setLoading(true);
    setError("");
    try {
      const [plansRes, infoRes] = await Promise.all([
        fetchWithAuth("/api/public/subscription-plans"),
        fetchWithAuth("/api/renew/info"),
      ]);
      if (plansRes.status === 401 || infoRes.status === 401) {
        return router.push("/hotel/login");
      }

      const plansData = await plansRes.json();
      const infoData = await infoRes.json();

      const active = (plansData.plans || []).filter(
        (p) => p.is_active !== false,
      );
      active.sort((a, b) => {
        if (isNil(a.price_monthly)) return isNil(b.price_monthly) ? 0 : 1;
        if (isNil(b.price_monthly)) return -1;
        return Number(a.price_monthly) - Number(b.price_monthly);
      });
      setPlans(active);
      setInfo(infoData);

      const current =
        active.find(
          (p) =>
            subscription?.planName &&
            p.name.toLowerCase() === subscription.planName.toLowerCase() &&
            isPlanEligible(p, infoData),
        ) ?? active.find((p) => isPlanEligible(p, infoData));
      setSelectedPlanId(current?.id ?? "");
    } catch (err) {
      setError(err.message || t.renew.loadError);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscription?.planName]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === selectedPlanId) ?? null,
    [plans, selectedPlanId],
  );

  const currentPlan = useMemo(() => {
    if (!subscription?.planName) return null;
    return (
      plans.find(
        (p) => p.name.toLowerCase() === subscription.planName.toLowerCase(),
      ) ?? null
    );
  }, [plans, subscription?.planName]);

  const hasPrice = selectedPlan && !isNil(selectedPlan.price_monthly);
  const perMonth = hasPrice ? Number(selectedPlan.price_monthly) : 0;
  const total = hasPrice ? perMonth * months : 0;

  const effectiveExpiry = subscription?.expiresAt
    ? new Date(subscription.expiresAt)
    : null;

  async function handleHesabPay() {
    if (!selectedPlan || !hasPrice) return;
    setError("");
    setSubmitting("hesabpay");
    try {
      const res = await fetchWithAuth("/api/renew/create-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan_id: selectedPlan.id, months }),
      });
      const data = await res.json();
      if (!res.ok || !data.payment_url) {
        throw new Error(data.error || t.renew.paymentError);
      }
      window.location.href = data.payment_url;
    } catch (err) {
      setError(err.message || t.renew.paymentError);
      setSubmitting(null);
    }
  }

  function handleWhatsApp() {
    if (!selectedPlan || !info) return;
    setError("");

    const lines = [
      t.renew.waIntro,
      "",
      `${t.renew.waHotel}: ${info.hotel_name}`,
      `${t.renew.waOwner}: ${info.owner_name}`,
      `${t.renew.waEmail}: ${info.owner_email}`,
      `${t.renew.waId}: ${info.hotel_id}`,
      "",
      `${t.renew.waPlan}: ${selectedPlan.name}`,
      `${t.renew.waDuration}: ${fill(t.renew.months, { count: months })}`,
      hasPrice
        ? `${t.renew.waTotal}: $${total.toLocaleString()}`
        : `${t.renew.waTotal}: ${t.renew.customPricing}`,
      effectiveExpiry
        ? `${t.renew.waExpiry}: ${effectiveExpiry.toLocaleDateString()}`
        : null,
    ]
      .filter(Boolean)
      .join("\n");

    const url = WHATSAPP_NUMBER
      ? `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`
      : `https://wa.me/?text=${encodeURIComponent(lines)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  // ───── confirming splash ─────
  if (confirming) {
    return (
      <div
        dir={dir}
        className="flex min-h-[60vh] items-center justify-center p-6 dark:bg-gray-900"
      >
        <div className="text-center">
          <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-2 border-black/10 border-t-teal-700 dark:border-gray-700 dark:border-t-teal-400" />
          <p className="text-sm font-medium dark:text-gray-100">
            {t.renew.confirmingTitle}
          </p>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {t.renew.confirmingBody}
          </p>
        </div>
      </div>
    );
  }

  const bannerStyles =
    subState === "expired"
      ? "border-red-200 bg-red-50 dark:border-red-900/40 dark:bg-red-950/30"
      : "border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/30";

  const bannerText =
    subState === "expired"
      ? "text-red-700 dark:text-red-300"
      : "text-amber-700 dark:text-amber-300";

  return (
    <div dir={dir} className="p-6 dark:bg-gray-900 dark:text-gray-100">
      {/* header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{t.renew.title}</h1>
        <Link
          href="/admin"
          className="rounded-xl border border-black/10 px-4 py-2 text-sm font-medium transition-colors hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
        >
          {t.renew.backToDashboard}
        </Link>
      </div>

      {/* status banner */}
      {(subState === "expired" || subState === "expiring_soon") && (
        <div
          className={`mb-5 rounded-lg border px-4 py-3 text-sm ${bannerStyles} ${bannerText}`}
        >
          {subState === "expired" ? (
            <>
              <span className="font-semibold">{t.renew.expiredTitle}</span>{" "}
              {t.renew.expiredBody}
            </>
          ) : (
            <>
              <span className="font-semibold">
                {fill(t.renew.expiringTitle, { days: daysLeft })}
              </span>{" "}
              {t.renew.expiringBody}
            </>
          )}
        </div>
      )}

      {error && (
        <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* LEFT */}
        <div className="space-y-6">
          {currentPlan && (
            <section className="rounded-xl border border-teal-700/20 bg-teal-50/50 p-5 dark:border-teal-400/20 dark:bg-teal-900/10">
              <p className="mb-2 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                {t.renew.yourPlanNow}
              </p>
              <div className="flex items-center justify-between">
                <p className="text-lg font-semibold">{currentPlan.name}</p>
                <span className="rounded-full bg-teal-700 px-2.5 py-1 text-[11px] font-medium text-white dark:bg-teal-500">
                  {t.renew.current}
                </span>
              </div>
              {effectiveExpiry && (
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {t.renew.currentExpiry}:{" "}
                  <span className="font-medium">
                    {effectiveExpiry.toLocaleDateString()}
                  </span>
                </p>
              )}
            </section>
          )}

          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
            <h2 className="mb-4 text-base font-semibold">
              {t.renew.choosePlan}
            </h2>

            {loading ? (
              <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {t.renew.loadingPlans}
              </div>
            ) : plans.length === 0 ? (
              <div className="py-6 text-center text-sm text-gray-500 dark:text-gray-400">
                {t.renew.noPlans}
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {plans.map((plan) => {
                  const active = plan.id === selectedPlanId;
                  const isCurrent = currentPlan && currentPlan.id === plan.id;
                  const price = plan.price_monthly;
                  const ineligible = !isPlanEligible(plan, info);
                  const reason = ineligible
                    ? ineligibilityReason(plan, info, t)
                    : null;

                  return (
                    <button
                      key={plan.id}
                      type="button"
                      disabled={ineligible}
                      onClick={() => !ineligible && setSelectedPlanId(plan.id)}
                      title={reason || undefined}
                      className={`relative rounded-lg border p-4 text-start transition-colors ${
                        ineligible
                          ? "cursor-not-allowed border-black/10 bg-gray-50 opacity-60 dark:border-white/10 dark:bg-gray-900"
                          : active
                            ? "border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-900/20"
                            : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p
                          className={`text-sm font-semibold ${
                            ineligible ? "text-gray-400 dark:text-gray-500" : ""
                          }`}
                        >
                          {plan.name}
                        </p>
                        <div className="flex shrink-0 items-center gap-1.5">
                          {isCurrent && (
                            <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700 dark:bg-amber-950/50 dark:text-amber-300">
                              {t.renew.current}
                            </span>
                          )}
                          {active && !ineligible && (
                            <span className="rounded-full bg-teal-700 px-2 py-0.5 text-[10px] font-medium text-white dark:bg-teal-500">
                              {t.renew.selected}
                            </span>
                          )}
                        </div>
                      </div>

                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {isNil(price)
                          ? t.renew.customPricing
                          : `$${Number(price).toLocaleString()} ${t.renew.perMonthShort}`}
                      </p>

                      {!isNil(plan.max_branches) && (
                        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                          {fill(t.renew.upToBranches, {
                            count: plan.max_branches,
                          })}
                        </p>
                      )}

                      {ineligible && (
                        <p className="mt-2 text-[11px] font-medium text-red-600 dark:text-red-400">
                          {reason}
                        </p>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
            <h2 className="mb-4 text-base font-semibold">{t.renew.duration}</h2>

            <div className="grid gap-3 sm:grid-cols-4">
              {DURATIONS.map((d) => {
                const active = d.months === months;
                return (
                  <button
                    key={d.months}
                    type="button"
                    onClick={() => setMonths(d.months)}
                    className={`rounded-lg border p-4 text-center transition-colors ${
                      active
                        ? "border-teal-700 bg-teal-50 dark:border-teal-400 dark:bg-teal-900/20"
                        : "border-black/10 hover:bg-black/5 dark:border-white/10 dark:hover:bg-white/5"
                    }`}
                  >
                    <p className="text-sm font-semibold">{t.renew[d.key]}</p>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {t.renew[`${d.key}Hint`]}
                    </p>
                  </button>
                );
              })}
            </div>
          </section>

          {info && (
            <section className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
              <h2 className="mb-4 text-base font-semibold">
                {t.renew.account}
              </h2>
              <dl className="grid gap-2 text-sm sm:grid-cols-2">
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    {t.renew.hotel}
                  </dt>
                  <dd>{info.hotel_name}</dd>
                </div>
                <div>
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    {t.renew.owner}
                  </dt>
                  <dd>{info.owner_name || "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-xs text-gray-500 dark:text-gray-400">
                    {t.renew.email}
                  </dt>
                  <dd>{info.owner_email || "—"}</dd>
                </div>
                {!isNil(info.branch_count) && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      {t.renew.currentBranches}
                    </dt>
                    <dd>{info.branch_count}</dd>
                  </div>
                )}
                {!isNil(info.pos_device_count) && info.pos_device_count > 0 && (
                  <div>
                    <dt className="text-xs text-gray-500 dark:text-gray-400">
                      {t.renew.currentPos}
                    </dt>
                    <dd>{info.pos_device_count}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}
        </div>

        {/* RIGHT — summary */}
        <aside className="lg:sticky lg:top-6 lg:self-start">
          <div className="rounded-xl border border-black/10 bg-white p-5 shadow-sm dark:border-white/10 dark:bg-[#0F1C2E]">
            <h2 className="mb-4 text-base font-semibold">{t.renew.summary}</h2>

            <dl className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-gray-500 dark:text-gray-400">
                  {t.renew.plan}
                </dt>
                <dd className="font-medium">{selectedPlan?.name ?? "—"}</dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500 dark:text-gray-400">
                  {t.renew.durationLabel}
                </dt>
                <dd className="font-medium">
                  {fill(t.renew.months, { count: months })}
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-gray-500 dark:text-gray-400">
                  {t.renew.pricePerMonth}
                </dt>
                <dd className="font-medium">
                  {hasPrice
                    ? `$${perMonth.toLocaleString()}`
                    : t.renew.customPricing}
                </dd>
              </div>
              <div className="flex items-center justify-between border-t border-black/10 pt-3 dark:border-white/10">
                <dt className="text-sm font-semibold">{t.renew.total}</dt>
                <dd className="text-lg font-bold">
                  {hasPrice
                    ? `$${total.toLocaleString()}`
                    : t.renew.customPricing}
                </dd>
              </div>
            </dl>

            {effectiveExpiry && (
              <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
                {fill(t.renew.newExpiryNote, {
                  date: effectiveExpiry.toLocaleDateString(),
                })}
              </p>
            )}

            <div className="mt-5 space-y-2">
              <button
                type="button"
                onClick={handleHesabPay}
                disabled={!hasPrice || submitting !== null || loading}
                className="flex w-full flex-col items-center justify-center gap-2 rounded-xl bg-teal-700 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-teal-500 dark:hover:bg-teal-600"
              >
                <span>
                  {submitting === "hesabpay"
                    ? t.renew.starting
                    : t.renew.payWithHesabPay}
                </span>

                <span className="flex w-full items-center justify-center gap-3  border-white/20 ">
                  <AfPayIcon className="h-5 w-8 shrink-0" />
                  <VisaIcon className="h-5 w-8 shrink-0" />
                  <MastercardIcon className="h-5 w-8 shrink-0" />
                </span>
              </button>

              <button
                type="button"
                onClick={handleWhatsApp}
                disabled={!selectedPlan || !info || submitting !== null}
                className="w-full rounded-xl border border-black/10 px-4 py-2.5 text-sm font-medium transition-colors hover:bg-black/5 disabled:opacity-50 dark:border-white/10 dark:hover:bg-white/5"
              >
                {t.renew.renewViaWhatsApp}
              </button>
            </div>

            <p className="mt-4 text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {t.renew.paymentNote}
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
