"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Search,
  Check,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

// ---------------- Shared UI primitives ----------------
const inputClass =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 shadow-sm transition-colors focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500";
const labelClass =
  "mb-1 block text-sm font-medium text-gray-600 dark:text-gray-400";
const sectionClass =
  "space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm";

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
      className={`inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:ring-offset-2 focus:ring-offset-white dark:focus:ring-offset-gray-900 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {children}
    </button>
  );
}

function SegmentButton({ active, children, ...props }) {
  return (
    <button
      type="button"
      {...props}
      className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
        active
          ? "bg-teal-600 text-white shadow-sm"
          : "text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700"
      }`}
    >
      {children}
    </button>
  );
}

// ---------------- Step Indicator ----------------
function StepIndicator({ currentStep, steps }) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = index < currentStep;
          const stepNumber = index + 1;

          return (
            <div key={index} className="flex flex-1 items-center">
              <div className="flex flex-col items-center flex-1">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-semibold transition-colors ${
                    isCompleted
                      ? "bg-teal-600 text-white"
                      : isActive
                        ? "border-2 border-teal-600 bg-teal-50 text-teal-600 dark:bg-teal-950/30 dark:text-teal-400"
                        : "border-2 border-gray-300 bg-white text-gray-500 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
                  }`}
                >
                  {isCompleted ? <Check size={16} /> : stepNumber}
                </div>
                <span
                  className={`mt-2 text-xs font-medium ${
                    isActive || isCompleted
                      ? "text-teal-600 dark:text-teal-400"
                      : "text-gray-500 dark:text-gray-400"
                  }`}
                >
                  {step.label}
                </span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`h-0.5 flex-1 transition-colors ${
                    index < currentStep
                      ? "bg-teal-600"
                      : "bg-gray-300 dark:bg-gray-600"
                  }`}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------------- Form Steps ----------------
const emptyBranch = {
  name: "",
  code: "",
  address: "",
  city: "",
  phone: "",
  currency: "AFN",
  timezone: "Asia/Kabul",
  tax_rate: 0,
  service_charge_rate: 0,
};

const STEPS = [
  { id: "hotel", label: "Hotel Details" },
  { id: "owner", label: "Owner" },
  { id: "branches", label: "Branches" },
];

export default function CreateHotelPage() {
  const router = useRouter();
  const { t, dir } = useAdminPreferences();

  // Step state
  const [currentStep, setCurrentStep] = useState(0);

  // Data state
  const [plans, setPlans] = useState([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [stepErrors, setStepErrors] = useState({});

  const [hotel, setHotel] = useState({
    name: "",
    slug: "",
    logo_url: "",
    subscription_plan_id: "",
    subscription_status: "trial",
  });

  const [ownerMode, setOwnerMode] = useState("new");
  const [ownerSearch, setOwnerSearch] = useState("");
  const [ownerResults, setOwnerResults] = useState([]);
  const [selectedOwner, setSelectedOwner] = useState(null);
  const [ownerAddress, setOwnerAddress] = useState("");

  const [owner, setOwner] = useState({
    full_name: "",
    email: "",
    phone: "",
    username: "",
    password: "",
  });

  const [branches, setBranches] = useState([{ ...emptyBranch }]);

  // Fetch plans
  useEffect(() => {
    fetchWithAuth("/api/subscription-plans")
      .then((res) => (res.ok ? res.json() : { plans: [] }))
      .then((data) => setPlans(data.plans || []))
      .catch(() => setPlans([]))
      .finally(() => setLoadingPlans(false));
  }, []);

  // Owner search
  useEffect(() => {
    if (ownerMode !== "existing" || !ownerSearch.trim()) {
      setOwnerResults([]);
      return;
    }
    const timer = setTimeout(() => {
      fetchWithAuth(`/api/owners/search?q=${encodeURIComponent(ownerSearch)}`)
        .then((res) => (res.ok ? res.json() : { owners: [] }))
        .then((data) => setOwnerResults(data.owners || []))
        .catch((err) => {
          console.error("Search error:", err);
          setOwnerResults([]);
        });
    }, 300);
    return () => clearTimeout(timer);
  }, [ownerSearch, ownerMode]);

  // Update helpers
  function updateHotel(field, value) {
    setHotel((h) => ({ ...h, [field]: value }));
  }
  function updateOwner(field, value) {
    setOwner((o) => ({ ...o, [field]: value }));
  }
  function updateBranch(index, field, value) {
    setBranches((prev) =>
      prev.map((b, i) => (i === index ? { ...b, [field]: value } : b)),
    );
  }
  function addBranchRow() {
    setBranches((prev) => [...prev, { ...emptyBranch }]);
  }
  function removeBranchRow(index) {
    setBranches((prev) => prev.filter((_, i) => i !== index));
  }

  // Validation
  function validateStep(step) {
    const errors = {};

    if (step === 0) {
      if (!hotel.name.trim())
        errors.name =
          t.createHotel.errors.requiredName || "Hotel name is required";
      if (!hotel.subscription_plan_id)
        errors.plan = t.createHotel.errors.noPlan || "Please select a plan";
    }

    if (step === 1) {
      if (ownerMode === "new") {
        if (!owner.full_name.trim()) errors.full_name = "Full name is required";
        if (!owner.password) errors.password = "Password is required";
      } else {
        if (!selectedOwner)
          errors.owner =
            t.createHotel.errors.noExistingOwner ||
            "Please select an existing owner";
      }
    }

    if (step === 2) {
      const hasName = branches.some((b) => b.name.trim());
      if (!hasName) errors.branches = "At least one branch must have a name";
    }

    setStepErrors((prev) => ({ ...prev, [step]: errors }));
    return Object.keys(errors).length === 0;
  }

  function goToStep(step) {
    if (step < 0 || step >= STEPS.length) return;

    // When going forward, validate current step
    if (step > currentStep) {
      const isValid = validateStep(currentStep);
      if (!isValid) return;
    }

    setCurrentStep(step);
    setError("");
  }

  function goNext() {
    if (currentStep < STEPS.length - 1) {
      const isValid = validateStep(currentStep);
      if (!isValid) return;
      setCurrentStep(currentStep + 1);
      setError("");
    }
  }

  function goBack() {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
      setError("");
    }
  }

  // Submit
  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    // Validate all steps
    const allValid = STEPS.every((_, i) => validateStep(i));
    if (!allValid) {
      setSaving(false);
      // Find first step with errors
      const firstErrorStep = STEPS.findIndex(
        (_, i) => Object.keys(stepErrors[i] || {}).length > 0,
      );
      if (firstErrorStep >= 0) setCurrentStep(firstErrorStep);
      return;
    }

    try {
      const payload = {
        hotel,
        owner_mode: ownerMode,
        owner_id: ownerMode === "existing" ? selectedOwner?.id : undefined,
        owner: ownerMode === "new" ? owner : undefined,
        owner_address: ownerAddress,
        branches: branches.filter((b) => b.name.trim()),
      };

      const res = await fetchWithAuth("/api/hotels", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        if (res.status === 401) return router.push("/login");
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t.createHotel.errors.createFailed);
      }

      const data = await res.json();
      router.push(`/admin/hotels/${data.hotel.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const formatPlanLink = () => {
    const link = (
      <Link
        href="/admin/plans/create"
        className="font-medium text-teal-700 underline hover:text-teal-800 dark:text-teal-400"
      >
        {t.createHotel.planMissingLink}
      </Link>
    );
    return (
      t.createHotel.planMissingWarning?.replace("{link}", link) || (
        <>No subscription plans found. Please {link} first.</>
      )
    );
  };

  // -------- Step Renderers --------
  function renderHotelStep() {
    const errors = stepErrors[0] || {};
    return (
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t.createHotel.hotelDetails}
        </h2>
        {plans.length === 0 && !loadingPlans && (
          <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/30 dark:text-amber-300">
            {formatPlanLink()}
          </p>
        )}
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className={labelClass}>
              {t.createHotel.fields.name}{" "}
              <span className="text-red-500">*</span>
            </label>
            <input
              required
              type="text"
              value={hotel.name}
              onChange={(e) => updateHotel("name", e.target.value)}
              className={`${inputClass} ${errors.name ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
            />
            {errors.name && (
              <p className="mt-1 text-xs text-red-500">{errors.name}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>{t.createHotel.fields.slug}</label>
            <input
              type="text"
              placeholder="my-hotel"
              value={hotel.slug}
              onChange={(e) => updateHotel("slug", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>{t.createHotel.fields.logoUrl}</label>
            <input
              type="url"
              value={hotel.logo_url}
              onChange={(e) => updateHotel("logo_url", e.target.value)}
              className={inputClass}
            />
          </div>
          <div>
            <label className={labelClass}>
              {t.createHotel.fields.subscriptionPlan}{" "}
              <span className="text-red-500">*</span>
            </label>
            <select
              required
              disabled={loadingPlans}
              value={hotel.subscription_plan_id}
              onChange={(e) =>
                updateHotel("subscription_plan_id", e.target.value)
              }
              className={`${inputClass} ${errors.plan ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
            >
              <option value="">{t.createHotel.fields.selectPlan}</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} — {p.price_monthly}/mo
                </option>
              ))}
            </select>
            {errors.plan && (
              <p className="mt-1 text-xs text-red-500">{errors.plan}</p>
            )}
          </div>
          <div>
            <label className={labelClass}>
              {t.createHotel.fields.subscriptionStatus}
            </label>
            <select
              value={hotel.subscription_status}
              onChange={(e) =>
                updateHotel("subscription_status", e.target.value)
              }
              className={inputClass}
            >
              <option value="trial">
                {t.createHotel.statuses?.trial || "Trial"}
              </option>
              <option value="active">
                {t.createHotel.statuses?.active || "Active"}
              </option>
              <option value="past_due">
                {t.createHotel.statuses?.pastDue || "Past Due"}
              </option>
              <option value="cancelled">
                {t.createHotel.statuses?.cancelled || "Cancelled"}
              </option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  function renderOwnerStep() {
    const errors = stepErrors[1] || {};
    return (
      <div className={sectionClass}>
        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
          {t.createHotel.ownerSection?.title || "Owner"}
        </h2>
        <div className="inline-flex gap-1 rounded-lg bg-gray-100 p-1 dark:bg-gray-700/50">
          <SegmentButton
            active={ownerMode === "new"}
            onClick={() => setOwnerMode("new")}
          >
            {t.createHotel.ownerSection?.newOwner || "New Owner"}
          </SegmentButton>
          <SegmentButton
            active={ownerMode === "existing"}
            onClick={() => setOwnerMode("existing")}
          >
            {t.createHotel.ownerSection?.existingOwner || "Existing Owner"}
          </SegmentButton>
        </div>

        {errors.owner && <p className="text-xs text-red-500">{errors.owner}</p>}

        {ownerMode === "existing" ? (
          <div className="space-y-3">
            <div className="relative">
              <Search
                size={16}
                className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 text-gray-400"
              />
              <input
                type="text"
                placeholder={
                  t.createHotel.ownerSection?.searchPlaceholder ||
                  "Search owners..."
                }
                value={ownerSearch}
                onChange={(e) => {
                  setOwnerSearch(e.target.value);
                  setSelectedOwner(null);
                }}
                className={`${inputClass} ps-9`}
              />
            </div>
            {ownerResults.length > 0 && !selectedOwner && (
              <ul className="max-h-48 space-y-1 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 p-2">
                {ownerResults.map((o) => (
                  <li key={o.id}>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedOwner(o);
                        setOwnerSearch(o.full_name);
                        setOwnerResults([]);
                      }}
                      className="w-full rounded-md px-2 py-1.5 text-start text-sm hover:bg-teal-50 dark:hover:bg-teal-900/20"
                    >
                      <div className="font-medium">{o.full_name}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        {o.email || o.phone} · already owns{" "}
                        {o.hotels?.length || 0} hotel(s)
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            {selectedOwner && (
              <div className="flex items-start gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 py-2.5 text-sm text-teal-900 dark:border-teal-900/40 dark:bg-teal-900/10 dark:text-teal-300">
                <Check size={16} className="mt-0.5 shrink-0" />
                <div>
                  {t.createHotel.ownerSection?.selected
                    ?.replace("{name}", selectedOwner.full_name)
                    ?.replace(
                      "{contact}",
                      selectedOwner.email || selectedOwner.phone,
                    ) ||
                    `Selected: ${selectedOwner.full_name} (${selectedOwner.email || selectedOwner.phone})`}
                  {selectedOwner.hotels?.length > 0 && (
                    <div className="text-xs text-teal-700/80 dark:text-teal-400/80">
                      {t.createHotel.ownerSection?.alreadyOwns?.replace(
                        "{hotels}",
                        selectedOwner.hotels.map((h) => h.name).join(", "),
                      ) ||
                        `Already owns: ${selectedOwner.hotels.map((h) => h.name).join(", ")}`}
                    </div>
                  )}
                </div>
              </div>
            )}
            <div>
              <label className={labelClass}>
                {t.createHotel.ownerSection?.addressForHotel ||
                  "Address for this hotel"}
              </label>
              <textarea
                rows={2}
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className={labelClass}>
                {t.createHotel.ownerSection?.fields?.fullName || "Full Name"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="text"
                value={owner.full_name}
                onChange={(e) => updateOwner("full_name", e.target.value)}
                className={`${inputClass} ${errors.full_name ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
              />
              {errors.full_name && (
                <p className="mt-1 text-xs text-red-500">{errors.full_name}</p>
              )}
            </div>
            <div>
              <label className={labelClass}>
                {t.createHotel.ownerSection?.fields?.email || "Email"}
              </label>
              <input
                type="email"
                value={owner.email}
                onChange={(e) => updateOwner("email", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.createHotel.ownerSection?.fields?.phone || "Phone"}
              </label>
              <input
                type="tel"
                value={owner.phone}
                onChange={(e) => updateOwner("phone", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.createHotel.ownerSection?.fields?.username || "Username"}
              </label>
              <input
                type="text"
                value={owner.username}
                onChange={(e) => updateOwner("username", e.target.value)}
                className={inputClass}
              />
            </div>
            <div>
              <label className={labelClass}>
                {t.createHotel.ownerSection?.fields?.password || "Password"}{" "}
                <span className="text-red-500">*</span>
              </label>
              <input
                required
                type="password"
                value={owner.password}
                onChange={(e) => updateOwner("password", e.target.value)}
                className={`${inputClass} ${errors.password ? "border-red-500 focus:ring-red-500 focus:border-red-500" : ""}`}
              />
              {errors.password && (
                <p className="mt-1 text-xs text-red-500">{errors.password}</p>
              )}
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>
                {t.createHotel.ownerSection?.fields?.address || "Address"}
              </label>
              <textarea
                rows={2}
                value={ownerAddress}
                onChange={(e) => setOwnerAddress(e.target.value)}
                className={inputClass}
              />
            </div>
          </div>
        )}
      </div>
    );
  }

  function renderBranchesStep() {
    const errors = stepErrors[2] || {};
    return (
      <div className={sectionClass}>
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
            {t.createHotel.branchesSection?.title || "Branches"}
          </h2>
          <button
            type="button"
            onClick={addBranchRow}
            className="inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
          >
            <Plus size={14} />{" "}
            {t.createHotel.branchesSection?.addBranch || "Add Branch"}
          </button>
        </div>

        {errors.branches && (
          <p className="text-xs text-red-500">{errors.branches}</p>
        )}

        {branches.map((b, i) => (
          <div
            key={i}
            className="rounded-lg border border-gray-200 dark:border-gray-700 p-4"
          >
            <div className="mb-3 flex items-center justify-between">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                {t.createHotel.branchesSection?.branchLabel?.replace(
                  "{number}",
                  i + 1,
                ) || `Branch ${i + 1}`}
              </span>
              {branches.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeBranchRow(i)}
                  className="inline-flex items-center gap-1 text-xs font-medium text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 size={13} />
                  {t.createHotel.branchesSection?.remove || "Remove"}
                </button>
              )}
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.name || "Name"}{" "}
                  <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={b.name}
                  onChange={(e) => updateBranch(i, "name", e.target.value)}
                  className={`${inputClass} ${!b.name.trim() && i === branches.length - 1 ? "border-yellow-400 focus:ring-yellow-400" : ""}`}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.code || "Code"}
                </label>
                <input
                  type="text"
                  value={b.code}
                  onChange={(e) => updateBranch(i, "code", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.city || "City"}
                </label>
                <input
                  type="text"
                  value={b.city}
                  onChange={(e) => updateBranch(i, "city", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.phone || "Phone"}
                </label>
                <input
                  type="tel"
                  value={b.phone}
                  onChange={(e) => updateBranch(i, "phone", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="sm:col-span-2">
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.address || "Address"}
                </label>
                <input
                  type="text"
                  value={b.address}
                  onChange={(e) => updateBranch(i, "address", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.currency ||
                    "Currency"}
                </label>
                <input
                  type="text"
                  value={b.currency}
                  onChange={(e) => updateBranch(i, "currency", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.timezone ||
                    "Timezone"}
                </label>
                <input
                  type="text"
                  value={b.timezone}
                  onChange={(e) => updateBranch(i, "timezone", e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.taxRate ||
                    "Tax Rate (%)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={b.tax_rate}
                  onChange={(e) =>
                    updateBranch(i, "tax_rate", Number(e.target.value))
                  }
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>
                  {t.createHotel.branchesSection?.fields?.serviceCharge ||
                    "Service Charge (%)"}
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={b.service_charge_rate}
                  onChange={(e) =>
                    updateBranch(
                      i,
                      "service_charge_rate",
                      Number(e.target.value),
                    )
                  }
                  className={inputClass}
                />
              </div>
            </div>
          </div>
        ))}
        {branches.length === 0 && (
          <div className="rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-6 text-center text-sm text-gray-500 dark:text-gray-400">
            {t.createHotel.branchesSection?.noBranches ||
              "No branches yet. Click 'Add Branch' to get started."}
          </div>
        )}
      </div>
    );
  }

  // -------- Main Render --------
  return (
    <div className="p-6 max-w-3xl mx-auto" dir={dir}>
      <Link
        href="/admin/hotels"
        className="mb-4 inline-flex items-center gap-1 text-sm font-medium text-teal-700 hover:text-teal-800 dark:text-teal-400 dark:hover:text-teal-300"
      >
        <ArrowLeft size={14} /> {t.createHotel?.back || "Back"}
      </Link>

      <h1 className="mb-2 text-2xl font-semibold text-gray-900 dark:text-gray-100">
        {t.createHotel?.title || "Create Hotel"}
      </h1>
      <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">
        {t.createHotel?.subtitle || "Fill in the details to create a new hotel"}
      </p>

      {/* Step Indicator */}
      <StepIndicator currentStep={currentStep} steps={STEPS} />

      {/* Error banner */}
      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-900/40 dark:bg-red-950/30 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Step Content */}
        <div className="animate-in fade-in slide-in-from-bottom-4 duration-300">
          {currentStep === 0 && renderHotelStep()}
          {currentStep === 1 && renderOwnerStep()}
          {currentStep === 2 && renderBranchesStep()}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {currentStep > 0 && (
              <SecondaryButton type="button" onClick={goBack}>
                <ChevronLeft size={16} />
                {t.createHotel?.buttons?.back || "Back"}
              </SecondaryButton>
            )}
          </div>
          <div className="flex items-center gap-3">
            {currentStep < STEPS.length - 1 ? (
              <PrimaryButton type="button" onClick={goNext}>
                {t.createHotel?.buttons?.next || "Next"}
                <ChevronRight size={16} />
              </PrimaryButton>
            ) : (
              <PrimaryButton type="submit" disabled={saving}>
                {saving
                  ? t.createHotel?.buttons?.saving || "Creating..."
                  : t.createHotel?.buttons?.create || "Create Hotel"}
              </PrimaryButton>
            )}
          </div>
        </div>

        {/* Step counter */}
        <div className="text-center text-xs text-gray-400 dark:text-gray-500">
          {t.createHotel?.stepCounter
            ?.replace("{current}", currentStep + 1)
            ?.replace("{total}", STEPS.length) ||
            `Step ${currentStep + 1} of ${STEPS.length}`}
        </div>
      </form>
    </div>
  );
}
