"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { useAdminAuth } from "@/providers/AdminAuthProvider";
import { useSubscriptionState } from "@/hooks/useSubscriptionState";
import { fetchWithAuth } from "@/lib/fetchWithAuth";
import {
  LayoutDashboard,
  Building2,
  ScrollText,
  Users,
  GitBranch,
  UserCog,
  UserCheck,
  UtensilsCrossed,
  Table2,
  Wallet,
  CalendarCheck,
  ChevronLeft,
  ChevronDown,
  LogOut,
  Menu,
  X,
  ClipboardList,
  PlusCircle,
  BedDouble,
  Contact,
  UserPlus,
  GraduationCap,
  Clock,
  AlertCircle,
  RefreshCw,
  ShieldCheck,
  ShieldAlert,
  PhoneCall,
  MessageCircle,
  ArrowRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Palette — "midnight & brass"                                      */
/* ------------------------------------------------------------------ */

const NAV_ITEMS = [
  {
    href: "/admin",
    key: "dashboard",
    section: "main",
    roles: ["admin", "hotel_owner", "branch_manager"],
    icon: LayoutDashboard,
  },
  {
    href: "/admin/hotel/profile",
    key: "hotelprofile",
    section: "manage",
    roles: ["hotel_owner"],
    icon: Building2,
  },
  {
    href: "/admin/hotels",
    key: "hotels",
    section: "manage",
    roles: ["super_admin", "admin"],
    icon: Building2,
  },
  {
    href: "/admin/branches",
    key: "branches",
    section: "manage",
    roles: ["admin", "hotel_owner"],
    icon: GitBranch,
  },
  {
    href: "/admin/rooms",
    key: "rooms",
    section: "manage",
    roles: ["hotel_owner", "branch_manager"],
    icon: BedDouble,
    requiresRooms: true,
  },
  {
    href: "/admin/plans",
    key: "plans",
    section: "manage",
    roles: ["super_admin", "admin"],
    icon: ScrollText,
  },
  {
    href: "/admin/users",
    key: "users",
    section: "manage",
    roles: ["super_admin", "admin"],
    icon: Users,
  },
  {
    href: "/admin/owners",
    key: "owners",
    roles: ["super_admin", "admin"],
    icon: UserCog,
  },
  {
    href: "/admin/orders",
    key: "orders",
    section: "ops",
    roles: ["hotel_owner", "branch_manager"],
    icon: ClipboardList,
  },
  // {
  //   href: "/admin/order/create",
  //   key: "createOrder",
  //   section: "ops",
  //   roles: ["waiter", "branch_manager"],
  //   icon: PlusCircle,
  // },
  {
    href: "/admin/expenses",
    key: "expenses",
    section: "ops",
    roles: ["hotel_owner", "branch_manager"],
    icon: Wallet,
  },
  {
    href: "/admin/owners/staff",
    key: "ownerStaff",
    section: "ops",
    roles: ["hotel_owner", "branch_manager"],
    icon: UserCheck,
  },
  {
    href: "/admin/owners/menu",
    key: "ownerMenu",
    section: "ops",
    roles: ["hotel_owner", "branch_manager"],
    icon: UtensilsCrossed,
  },
  {
    href: "/admin/owners/tables",
    key: "ownerTable",
    section: "ops",
    roles: ["hotel_owner", "branch_manager"],
    icon: Table2,
  },
  {
    href: "/admin/owners/attendance",
    key: "attendance",
    section: "ops",
    roles: ["hotel_owner", "branch_manager"],
    icon: CalendarCheck,
  },
  {
    href: "/admin/customers",
    key: "customers",
    section: "ops",
    roles: ["hotel_owner", "branch_manager"],
    icon: Contact,
  },
  {
    href: "/admin/pending-signups",
    key: "newSignups",
    section: "system",
    roles: ["super_admin"],
    icon: UserPlus,
  },
  {
    href: "/admin/learn",
    key: "learn",
    section: "system",
    roles: ["super_admin"],
    icon: GraduationCap,
  },
];

const SECTION_ORDER = ["main", "manage", "ops", "system"];
const LOGO_SRC = "/Melmah.png";
const EXEMPT_ROLES = ["super_admin", "admin"];

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */
const humanize = (s = "") =>
  s
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/[_-]+/g, " ")
    .replace(/^\w/, (c) => c.toUpperCase());

const matchesPath = (href, pathname) =>
  href === "/admin"
    ? pathname === href
    : pathname === href || pathname?.startsWith(href + "/");

/* ------------------------------------------------------------------ */
/*  Reusable pieces                                                    */
/* ------------------------------------------------------------------ */
function NavLabel({ showText, children, className = "" }) {
  return (
    <span
      className={[
        "min-w-0 overflow-hidden whitespace-nowrap transition-[max-width,opacity,transform] duration-300 ease-out motion-reduce:transition-none",
        showText
          ? "max-w-[220px] translate-x-0 opacity-100"
          : "max-w-0 -translate-x-3 opacity-0 rtl:translate-x-3",
        className,
      ].join(" ")}
    >
      {children}
    </span>
  );
}

function IconTile({ icon: Icon, active, sizeIcon, disabled }) {
  return (
    <span
      className={[
        "grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-all duration-200 motion-reduce:transition-none",
        disabled
          ? "text-[#A9B6C6]/50"
          : active
            ? "bg-[#D4A93A] text-[#0B1B2E] shadow-[0_4px_14px_-2px_rgba(212,169,58,0.55)]"
            : "text-[#A9B6C6] group-hover/item:bg-white/[0.07] group-hover/item:text-[#F1ECDD]",
      ].join(" ")}
    >
      {Icon && (
        <Icon
          className={sizeIcon}
          strokeWidth={active && !disabled ? 2.25 : 1.75}
          aria-hidden="true"
        />
      )}
    </span>
  );
}

function ActiveTab({ active }) {
  return (
    <span
      aria-hidden="true"
      className={[
        "pointer-events-none absolute -start-3 top-1/2 h-7 w-1 -translate-y-1/2 rounded-e-full bg-[#D4A93A]",
        "origin-center transition-transform duration-300 ease-out motion-reduce:transition-none",
        "shadow-[0_0_12px_rgba(212,169,58,0.7)]",
        active ? "scale-y-100" : "scale-y-0",
      ].join(" ")}
    />
  );
}

const FOCUS_RING =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-[#D4A93A]/70 focus-visible:ring-offset-0";

/* ------------------------------------------------------------------ */
/*  Subscription banner (soft warning — not blocking)                  */
/* ------------------------------------------------------------------ */
function SubscriptionBanner({ subState, daysLeft, showText }) {
  if (subState !== "expiring_soon") return null;

  return (
    <Link
      href="/admin/renew"
      title={!showText ? `Expires in ${daysLeft} days — renew` : undefined}
      className={[
        "group/sub mx-3 mt-3 flex items-center gap-3 rounded-2xl",
        "bg-gradient-to-r from-[#D4A93A]/[0.22] via-[#D4A93A]/[0.08] to-transparent",
        "px-3 py-2.5 ring-1 ring-inset ring-[#D4A93A]/40",
        "transition-all duration-200 motion-reduce:transition-none",
        "hover:from-[#D4A93A]/[0.32] hover:ring-[#D4A93A]/60",
        "hover:shadow-[0_0_20px_-4px_rgba(212,169,58,0.35)]",
        !showText ? "lg:justify-center lg:px-0" : "",
        FOCUS_RING,
      ].join(" ")}
    >
      <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#D4A93A]/20 text-[#D4A93A]">
        <span
          aria-hidden="true"
          className="absolute inset-0 animate-ping rounded-full bg-[#D4A93A]/25 motion-reduce:animate-none"
        />
        <Clock className="relative h-4 w-4" strokeWidth={2.5} />
      </span>
      {showText && (
        <div className="min-w-0 flex-1 leading-tight">
          <p className="truncate text-[12.5px] font-semibold text-[#F1ECDD]">
            Expires in {daysLeft} {daysLeft === 1 ? "day" : "days"}
          </p>
          <p className="truncate text-[11px] text-[#D4A93A]/90">Tap to renew</p>
        </div>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/*  Subscription expired block — HIGHEST priority                      */
/* ------------------------------------------------------------------ */
function SubscriptionExpiredBlock({ showText }) {
  return (
    <div className="px-3">
      <div
        className={[
          "rounded-2xl bg-gradient-to-br",
          "from-red-500/[0.22] via-red-500/[0.08] to-transparent",
          "ring-1 ring-inset ring-red-400/45",
          "p-4",
          !showText ? "lg:p-2.5" : "",
        ].join(" ")}
      >
        <div
          className={`flex ${showText ? "items-start gap-3" : "lg:flex-col lg:items-center lg:gap-2"}`}
        >
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-red-500/25 text-red-300">
            <AlertCircle className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>

          {showText && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#F1ECDD]">
                Plan expired
              </p>
              <p className="mt-1 text-[11px] leading-relaxed text-red-200/85">
                Renew your plan to restore access to all features.
              </p>
            </div>
          )}
        </div>

        {showText && (
          <Link
            href="/admin/renew"
            className={[
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl",
              "bg-gradient-to-r from-[#D4A93A] to-[#b8902c] text-[#0B1B2E]",
              "px-3 py-2.5 text-[12px] font-bold",
              "shadow-md shadow-[#D4A93A]/25",
              "transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#D4A93A]/35",
              FOCUS_RING,
            ].join(" ")}
          >
            <RefreshCw className="h-3.5 w-3.5" />
            Renew plan
            <ArrowRight className="h-3 w-3 rtl:rotate-180" />
          </Link>
        )}

        {!showText && (
          <Link
            href="/admin/renew"
            title="Renew plan"
            className={[
              "mt-2 hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-gradient-to-r from-[#D4A93A] to-[#b8902c] text-[#0B1B2E]",
              "shadow-md shadow-[#D4A93A]/25",
              "transition hover:-translate-y-0.5",
              FOCUS_RING,
            ].join(" ")}
          >
            <RefreshCw className="h-3.5 w-3.5" />
          </Link>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Verification block — shown only when subscription is fine          */
/* ------------------------------------------------------------------ */
function VerificationBlock({ status, showText }) {
  const config = {
    pending: {
      Icon: Clock,
      title: "Not verified",
      body: "Please wait — our admin will review and approve your hotel soon.",
      ring: "ring-amber-400/45",
      gradFrom: "from-amber-500/[0.22]",
      gradVia: "via-amber-500/[0.08]",
      iconBg: "bg-amber-500/20",
      iconColor: "text-amber-300",
      bodyColor: "text-amber-200/85",
    },
    contacted: {
      Icon: PhoneCall,
      title: "We're in touch",
      body: "Our team has reached out. Please answer the call or message to finish verifying.",
      ring: "ring-sky-400/45",
      gradFrom: "from-sky-500/[0.22]",
      gradVia: "via-sky-500/[0.08]",
      iconBg: "bg-sky-500/20",
      iconColor: "text-sky-300",
      bodyColor: "text-sky-200/85",
    },
    rejected: {
      Icon: ShieldAlert,
      title: "Not verified",
      body: "We couldn't verify your hotel. Please contact us to resolve this.",
      ring: "ring-red-400/45",
      gradFrom: "from-red-500/[0.22]",
      gradVia: "via-red-500/[0.08]",
      iconBg: "bg-red-500/25",
      iconColor: "text-red-300",
      bodyColor: "text-red-200/85",
    },
  }[status];

  if (!config) return null;

  const {
    Icon,
    title,
    body,
    ring,
    gradFrom,
    gradVia,
    iconBg,
    iconColor,
    bodyColor,
  } = config;

  const waText = encodeURIComponent(
    "Hi, I'd like to check on the verification of my hotel.",
  );
  const waUrl = WHATSAPP_NUMBER
    ? `https://wa.me/${WHATSAPP_NUMBER}?text=${waText}`
    : `https://wa.me/?text=${waText}`;

  return (
    <div className="px-3">
      <div
        className={[
          "rounded-2xl bg-gradient-to-br",
          `${gradFrom} ${gradVia} to-transparent`,
          `ring-1 ring-inset ${ring}`,
          "p-4",
          !showText ? "lg:p-2.5" : "",
        ].join(" ")}
      >
        <div
          className={`flex ${showText ? "items-start gap-3" : "lg:flex-col lg:items-center lg:gap-2"}`}
        >
          <span
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${iconBg} ${iconColor}`}
          >
            <Icon className="h-4.5 w-4.5" strokeWidth={2.25} />
          </span>

          {showText && (
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-semibold text-[#F1ECDD]">
                {title}
              </p>
              <p className={`mt-1 text-[11px] leading-relaxed ${bodyColor}`}>
                {body}
              </p>
            </div>
          )}
        </div>

        {showText && (
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            className={[
              "mt-3 inline-flex w-full items-center justify-center gap-2 rounded-xl",
              "bg-gradient-to-r from-[#25D366] to-[#1da851]",
              "px-3 py-2.5 text-[12px] font-semibold text-white",
              "shadow-md shadow-emerald-600/25",
              "transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-emerald-600/35",
              FOCUS_RING,
            ].join(" ")}
          >
            <MessageCircle className="h-3.5 w-3.5" />
            Contact us
          </a>
        )}

        {!showText && (
          <a
            href={waUrl}
            target="_blank"
            rel="noreferrer"
            title={title}
            className={[
              "mt-2 hidden lg:inline-flex h-9 w-9 items-center justify-center rounded-xl",
              "bg-gradient-to-r from-[#25D366] to-[#1da851]",
              "text-white shadow-md shadow-emerald-600/25",
              "transition hover:-translate-y-0.5",
              FOCUS_RING,
            ].join(" ")}
          >
            <MessageCircle className="h-3.5 w-3.5" />
          </a>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, isRtl } = useAdminPreferences();
  const { role, loading, subscription } = useAdminAuth();
  const {
    state: subState,
    locked,
    daysLeft,
  } = useSubscriptionState(subscription);

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const leaveTimer = useRef(null);

  const [verification, setVerification] = useState(null);
  const [verifLoading, setVerifLoading] = useState(true);

  const [hasRooms, setHasRooms] = useState(false);

  const sizeAppName = isRtl ? "text-[20px]" : "text-[18px]";
  const sizeAppSubtitle = isRtl ? "text-[13px]" : "text-[12px]";
  const sizeSection = isRtl ? "text-[13px]" : "text-[12px]";
  const sizeNavText = isRtl ? "text-base" : "text-sm";
  const sizeChildText = isRtl ? "text-[16px]" : "text-[13.5px]";
  const sizeProfileName = isRtl ? "text-base" : "text-sm";
  const sizeProfileRole = isRtl ? "text-[13px]" : "text-[12px]";
  const sizeIcon = isRtl ? "h-5 w-5" : "h-[18px] w-[18px]";

  const label = (key) => t?.nav?.[key] ?? humanize(key);

  const hasHotelRole = role === "hotel_owner" || role === "branch_manager";

  /* ---------- verification fetch ---------- */
  useEffect(() => {
    if (!hasHotelRole) {
      setVerification(null);
      setVerifLoading(false);
      return;
    }

    let cancelled = false;
    setVerifLoading(true);

    (async () => {
      try {
        const res = await fetchWithAuth("/api/owner/verification");
        if (!res.ok) {
          if (!cancelled) setVerification("pending");
          return;
        }
        const data = await res.json();
        if (!cancelled) {
          setVerification(data.hotel?.verification_status || "pending");
        }
      } catch {
        if (!cancelled) setVerification("pending");
      } finally {
        if (!cancelled) setVerifLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHotelRole, pathname]);

  /* ---------- plan fetch — decides whether "rooms" nav shows ---------- */
  useEffect(() => {
    if (!hasHotelRole) {
      setHasRooms(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const res = await fetchWithAuth("/api/owner/plan");
        if (!res.ok) {
          if (!cancelled) setHasRooms(false);
          return;
        }
        const data = await res.json();
        if (!cancelled) setHasRooms(data?.plan?.is_rooms === true);
      } catch {
        if (!cancelled) setHasRooms(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [hasHotelRole, pathname]);

  /* ---------- lock priority ---------- */
  const isExempt = EXEMPT_ROLES.includes(role);

  const subscriptionLocked = locked && !isExempt;

  const verificationLocked =
    hasHotelRole &&
    !isExempt &&
    (verifLoading || (verification && verification !== "verified"));

  const showSubscriptionBlock = subscriptionLocked;
  const showVerificationBlock = !showSubscriptionBlock && verificationLocked;

  const showNav = !showSubscriptionBlock && !showVerificationBlock;

  const navLocked = false;

  /* ---------- breakpoint ---------- */
  useEffect(() => {
    const mql = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsDesktop(mql.matches);
    update();
    mql.addEventListener("change", update);
    return () => mql.removeEventListener("change", update);
  }, []);

  /* ---------- persistence + cleanup ---------- */
  useEffect(() => {
    try {
      if (localStorage.getItem("admin_sidebar_collapsed") === "1")
        setCollapsed(true);
    } catch {}
  }, []);

  useEffect(() => {
    return () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    };
  }, []);

  /* ---------- Escape to close (mobile) ---------- */
  useEffect(() => {
    if (!mobileOpen) return;
    const onKey = (e) => {
      if (e.key === "Escape") setMobileOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [mobileOpen]);

  /* ---------- lock body scroll while mobile drawer is open ---------- */
  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("admin_sidebar_collapsed", next ? "1" : "0");
      } catch {}
      return next;
    });
  }

  const handleEnter = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    setHovered(true);
  };
  const handleLeave = () => {
    if (leaveTimer.current) clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setHovered(false), 80);
  };

  const expanded = mobileOpen || !collapsed || hovered;
  const showText = expanded;

  const asideStyle = {
    backgroundImage: [
      "radial-gradient(90% 38% at 20% 0%, rgba(212,169,58,0.13) 0%, rgba(212,169,58,0) 70%)",
      "radial-gradient(110% 40% at 50% 100%, rgba(91,147,191,0.10) 0%, rgba(91,147,191,0) 70%)",
      "linear-gradient(180deg, #0D2036 0%, #0B1B2E 50%, #07121F 100%)",
    ].join(", "),
    ...(isDesktop ? { width: expanded ? "16.5rem" : "5.25rem" } : {}),
  };

  /* ---------- visible items ---------- */
  const visibleItems = useMemo(
    () =>
      NAV_ITEMS.filter((item) => {
        if (!item.roles.includes(role)) return false;
        if (item.requiresRooms && !hasRooms) return false;
        return true;
      })
        .map((item) =>
          item.children
            ? {
                ...item,
                children: item.children.filter((c) => c.roles.includes(role)),
              }
            : item,
        )
        .filter((item) => !item.children || item.children.length > 0),
    [role, hasRooms],
  );

  const sections = useMemo(() => {
    const labels = {
      main: t?.sections?.main ?? "Overview",
      manage: t?.sections?.manage ?? "Manage",
      ops: t?.sections?.ops ?? "Operations",
      system: t?.sections?.system ?? "System",
    };
    const grouped = new Map();
    visibleItems.forEach((item) => {
      const s = item.section ?? "main";
      if (!grouped.has(s)) grouped.set(s, []);
      grouped.get(s).push(item);
    });
    return SECTION_ORDER.filter((s) => grouped.has(s)).map((s) => ({
      key: s,
      label: labels[s],
      items: grouped.get(s),
    }));
  }, [visibleItems, t]);

  const activeHref = useMemo(() => {
    const hrefs = [];
    visibleItems.forEach((i) => {
      hrefs.push(i.href);
      i.children?.forEach((c) => hrefs.push(c.href));
    });
    return hrefs
      .filter((h) => matchesPath(h, pathname))
      .sort((a, b) => b.length - a.length)[0];
  }, [visibleItems, pathname]);

  const [openGroups, setOpenGroups] = useState({});

  useEffect(() => {
    setOpenGroups((prev) => {
      const next = { ...prev };
      visibleItems.forEach((item) => {
        if (
          item.children &&
          (activeHref === item.href ||
            item.children.some((c) => c.href === activeHref))
        ) {
          next[item.key] = true;
        }
      });
      return next;
    });
  }, [activeHref, visibleItems]);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  function toggleGroup(key) {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  async function handleLogout() {
    if (!confirm(t?.logoutConfirm ?? "Log out?")) return;
    await fetch("/api/auth/logout", { method: "POST" });
    localStorage.removeItem("auth_token");
    router.push("/hotel/login");
    router.refresh();
  }

  function handleLockedClick(e) {
    e.preventDefault();
    router.push("/admin/renew");
  }

  const profileActive = pathname?.startsWith("/admin/profile");
  const roleText = role ? humanize(String(role)) : "";
  const roleInitial = roleText ? roleText[0] : "?";

  const displayFont = {
    fontFamily:
      "var(--font-display, 'Fraunces', 'Playfair Display', Georgia, 'Times New Roman', serif)",
  };

  return (
    <>
      {!mobileOpen && (
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
          className={`fixed start-4 top-3 z-50 flex h-9 w-9 items-center justify-center rounded-2xl bg-[#0B1B2E]/95 text-[#F1ECDD] ring-1 ring-[#D4A93A]/30 shadow-lg shadow-black/30 backdrop-blur transition-transform active:scale-95 lg:hidden ${FOCUS_RING}`}
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </button>
      )}

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#04090F]/70 backdrop-blur-[3px] lg:hidden"
          onClick={() => setMobileOpen(false)}
          aria-hidden="true"
        />
      )}

      <aside
        style={asideStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
        onFocusCapture={handleEnter}
        onBlurCapture={handleLeave}
        className={[
          "group/rail flex shrink-0 flex-col overflow-y-auto overflow-x-hidden",
          "w-[min(18rem,78vw)]",
          "fixed inset-y-0 start-0 z-40",
          "text-[#F1ECDD]",
          "border-e border-[#D4A93A]/15",
          "shadow-2xl shadow-black/50",
          "transition-[transform,width] duration-300 ease-out motion-reduce:transition-none",
          "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.08)_transparent]",
          "[&::-webkit-scrollbar]:w-1.5",
          "[&::-webkit-scrollbar-track]:bg-transparent",
          "[&::-webkit-scrollbar-thumb]:rounded-full",
          "[&::-webkit-scrollbar-thumb]:bg-white/[0.06]",
          "hover:[&::-webkit-scrollbar-thumb]:bg-white/[0.14]",
          mobileOpen
            ? "max-lg:translate-x-0"
            : "max-lg:-translate-x-full max-lg:rtl:translate-x-full",
          "lg:static lg:z-0 lg:max-w-none lg:shadow-none",
        ].join(" ")}
      >
        {/* ───────── Brand ───────── */}
        <div
          className={[
            "flex items-center gap-3 px-4 pb-5 pt-6",
            !expanded ? "lg:flex-col lg:gap-3 lg:px-0" : "",
          ].join(" ")}
        >
          <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-white/[0.06] ring-1 ring-[#D4A93A]/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_6px_18px_-6px_rgba(212,169,58,0.45)]">
            <Image
              src={LOGO_SRC}
              alt={t?.appName ?? "Logo"}
              fill
              sizes="44px"
              priority
              className="object-contain rounded-full"
            />
          </div>

          {showText && (
            <div className="min-w-0 flex-1 leading-tight">
              <p
                style={displayFont}
                className={`truncate ${sizeAppName} font-semibold tracking-tight text-[#F1ECDD]`}
              >
                {t?.appName}
              </p>
              <p
                className={`mt-0.5 truncate ${sizeAppSubtitle} text-[#A9B6C6]/80`}
              >
                {t?.appSubtitle}
              </p>
            </div>
          )}

          {showText && (
            <button
              type="button"
              onClick={toggleCollapsed}
              aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
              title={collapsed ? "Expand" : "Collapse"}
              className={[
                "group/toggle hidden h-8 w-8 shrink-0 place-items-center rounded-full lg:grid",
                "bg-white/[0.05] text-[#A9B6C6] ring-1 ring-white/10",
                "transition-all duration-200 motion-reduce:transition-none",
                "hover:bg-[#D4A93A]/15 hover:text-[#D4A93A] hover:ring-[#D4A93A]/40",
                "active:scale-95",
                FOCUS_RING,
              ].join(" ")}
            >
              <ChevronLeft
                className={[
                  "h-4 w-4 transition-transform duration-300 ease-out motion-reduce:transition-none",
                  collapsed !== !!isRtl ? "rotate-180" : "rotate-0",
                ].join(" ")}
                strokeWidth={2.5}
              />
            </button>
          )}

          {/* Close button (mobile) */}
          <button
            type="button"
            onClick={() => setMobileOpen(false)}
            aria-label="Close menu"
            className={[
              "ms-auto grid h-9 w-9 shrink-0 place-items-center rounded-full lg:hidden",
              "bg-white/[0.08] text-[#F1ECDD] ring-1 ring-white/15",
              "transition-all duration-200 motion-reduce:transition-none",
              "hover:bg-[#D4A93A]/20 hover:text-[#D4A93A] hover:ring-[#D4A93A]/50",
              "active:scale-95",
              FOCUS_RING,
            ].join(" ")}
          >
            <X className="h-5 w-5" strokeWidth={2.5} aria-hidden="true" />
          </button>
        </div>

        {/* ───────── Soft subscription warning (expiring soon) ───────── */}
        {showNav && (
          <SubscriptionBanner
            subState={subState}
            daysLeft={daysLeft}
            showText={showText}
          />
        )}

        {/* ───────── Priority 1: subscription expired ───────── */}
        {showSubscriptionBlock && (
          <div className="flex-1 pt-6">
            <SubscriptionExpiredBlock showText={showText} />
          </div>
        )}

        {/* ───────── Priority 2: verification not approved ───────── */}
        {showVerificationBlock && (
          <div className="flex-1 pt-6">
            <VerificationBlock status={verification} showText={showText} />
          </div>
        )}

        {/* ───────── Nav ───────── */}
        {showNav && (
          <nav className="flex-1 px-3 pb-4">
            {sections.map((section, idx) => (
              <div key={section.key} className="space-y-0.5">
                <div
                  className={[
                    "flex items-center gap-2 px-3",
                    idx === 0 ? "pt-1" : "pt-5",
                    "pb-2",
                  ].join(" ")}
                >
                  <NavLabel
                    showText={showText}
                    className={`${sizeSection} font-medium text-[#D4A93A]/85`}
                  >
                    {section.label}
                  </NavLabel>
                  <span className="h-px flex-1 bg-gradient-to-r from-[#D4A93A]/30 via-white/10 to-transparent rtl:bg-gradient-to-l" />
                </div>

                {section.items.map((item) => {
                  const Icon = item.icon;

                  if (!item.children) {
                    const disabled = navLocked;
                    const active = activeHref === item.href && !disabled;

                    return (
                      <Link
                        key={item.href}
                        href={disabled ? "/admin/renew" : item.href}
                        onClick={(e) => {
                          if (disabled) {
                            handleLockedClick(e);
                            return;
                          }
                          setMobileOpen(false);
                        }}
                        aria-current={active ? "page" : undefined}
                        aria-disabled={disabled || undefined}
                        title={!showText ? label(item.key) : undefined}
                        className={[
                          `group/item relative flex items-center gap-3 rounded-2xl px-2 py-1.5 ${sizeNavText} font-medium transition-colors duration-200 motion-reduce:transition-none`,
                          !showText ? "lg:justify-center lg:px-0" : "",
                          disabled
                            ? "cursor-not-allowed opacity-45"
                            : active
                              ? "bg-white/[0.06] text-[#F1ECDD]"
                              : "text-[#A9B6C6] hover:bg-white/[0.035] hover:text-[#F1ECDD]",
                          FOCUS_RING,
                        ].join(" ")}
                      >
                        <ActiveTab active={active} />
                        <IconTile
                          icon={Icon}
                          active={active}
                          sizeIcon={sizeIcon}
                          disabled={disabled}
                        />
                        <NavLabel showText={showText}>
                          {label(item.key)}
                        </NavLabel>
                      </Link>
                    );
                  }

                  const open = !!openGroups[item.key];
                  const groupDisabled = navLocked;
                  const groupActive =
                    !groupDisabled &&
                    (activeHref === item.href ||
                      item.children.some((c) => c.href === activeHref));

                  return (
                    <div key={item.key}>
                      <div
                        className={[
                          `group/item relative flex items-center gap-1 rounded-2xl pe-1.5 ${sizeNavText} font-medium transition-colors duration-200 motion-reduce:transition-none`,
                          groupDisabled
                            ? "opacity-45"
                            : groupActive
                              ? "bg-white/[0.06] text-[#F1ECDD]"
                              : "text-[#A9B6C6] hover:bg-white/[0.035] hover:text-[#F1ECDD]",
                        ].join(" ")}
                      >
                        <ActiveTab active={groupActive} />
                        <Link
                          href={groupDisabled ? "/admin/renew" : item.href}
                          onClick={(e) => {
                            if (groupDisabled) {
                              handleLockedClick(e);
                              return;
                            }
                            setMobileOpen(false);
                          }}
                          className={[
                            "flex flex-1 items-center gap-3 rounded-2xl px-2 py-1.5",
                            !showText ? "lg:justify-center lg:px-0" : "",
                            groupDisabled && "cursor-not-allowed",
                            FOCUS_RING,
                          ].join(" ")}
                        >
                          <IconTile
                            icon={Icon}
                            active={groupActive}
                            sizeIcon={sizeIcon}
                            disabled={groupDisabled}
                          />
                          <NavLabel showText={showText}>
                            {label(item.key)}
                          </NavLabel>
                        </Link>

                        {showText && !groupDisabled && (
                          <button
                            type="button"
                            onClick={() => toggleGroup(item.key)}
                            aria-expanded={open}
                            aria-label="Toggle submenu"
                            className={`grid h-7 w-7 place-items-center rounded-lg text-[#A9B6C6] transition-colors hover:bg-white/10 hover:text-white ${FOCUS_RING}`}
                          >
                            <ChevronDown
                              className={`h-4 w-4 shrink-0 transition-transform duration-300 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
                              aria-hidden="true"
                            />
                          </button>
                        )}
                      </div>

                      {open && showText && !groupDisabled && (
                        <div className="relative ms-[1.65rem] mt-1 space-y-0.5 border-s border-white/10 ps-3">
                          {item.children.map((child) => {
                            const active = activeHref === child.href;
                            return (
                              <Link
                                key={child.href}
                                href={child.href}
                                onClick={() => setMobileOpen(false)}
                                aria-current={active ? "page" : undefined}
                                className={[
                                  `relative flex items-center gap-2.5 rounded-xl px-3 py-2 ${sizeChildText} font-medium transition-colors duration-150`,
                                  "before:absolute before:-start-3 before:top-1/2 before:h-px before:w-3 before:bg-white/10",
                                  active
                                    ? "bg-white/[0.06] text-[#F1ECDD] before:bg-[#D4A93A]/60"
                                    : "text-[#A9B6C6] hover:bg-white/[0.04] hover:text-[#F1ECDD]",
                                  FOCUS_RING,
                                ].join(" ")}
                              >
                                <span
                                  className={[
                                    "h-1.5 w-1.5 shrink-0 rounded-full transition-colors duration-200",
                                    active
                                      ? "bg-[#D4A93A] shadow-[0_0_8px_rgba(212,169,58,0.8)]"
                                      : "bg-white/20",
                                  ].join(" ")}
                                />
                                <span className="truncate">
                                  {label(child.key)}
                                </span>
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </nav>
        )}

        {/* ───────── Footer ───────── */}
        <div className="space-y-1.5 px-3 pb-4 pt-2">
          <div className="mx-2 mb-2 h-px bg-gradient-to-r from-transparent via-[#D4A93A]/25 to-transparent" />

          {showNav && subState === "expiring_soon" && (
            <Link
              href="/admin/renew"
              title={!showText ? "Renew plan" : undefined}
              className={[
                "group/renew flex items-center gap-3 rounded-2xl px-2 py-2 text-sm font-semibold",
                "bg-gradient-to-r from-[#D4A93A] to-[#b8902c] text-[#0B1B2E]",
                "ring-1 ring-inset ring-[#F1ECDD]/15",
                "shadow-[0_8px_22px_-6px_rgba(212,169,58,0.55)]",
                "transition-all duration-200 motion-reduce:transition-none",
                "hover:from-[#e2b746] hover:to-[#c99a30]",
                "hover:shadow-[0_10px_30px_-6px_rgba(212,169,58,0.7)]",
                "active:scale-[0.98]",
                !showText ? "lg:justify-center lg:px-0" : "",
                FOCUS_RING,
              ].join(" ")}
            >
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-[#0B1B2E]/12 transition-transform duration-300 group-hover/renew:rotate-180">
                <RefreshCw className="h-[18px] w-[18px]" strokeWidth={2.5} />
              </span>
              {showText && <span>Renew plan</span>}
            </Link>
          )}

          {showNav && (
            <Link
              href="/admin/profile"
              onClick={() => setMobileOpen(false)}
              title={!showText ? (t?.nav?.profile ?? "Profile") : undefined}
              aria-current={profileActive ? "page" : undefined}
              className={[
                "group/profile relative flex items-center gap-3 rounded-2xl p-2 ring-1 ring-inset transition-colors duration-200 motion-reduce:transition-none",
                !showText ? "lg:justify-center lg:px-0" : "",
                profileActive
                  ? "bg-white/[0.08] ring-[#D4A93A]/40"
                  : "bg-white/[0.03] ring-white/[0.07] hover:bg-white/[0.06] hover:ring-white/15",
                FOCUS_RING,
              ].join(" ")}
            >
              <div className="relative shrink-0">
                <div
                  style={displayFont}
                  className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-[#16324F] to-[#0B1B2E] text-base font-semibold text-[#D4A93A] ring-2 ring-[#D4A93A]/60"
                >
                  {loading ? "…" : roleInitial}
                </div>
                <span
                  aria-hidden="true"
                  className={[
                    "absolute -end-0.5 -bottom-0.5 h-3 w-3 rounded-full ring-2 ring-[#0B1B2E]",
                    subState === "expired"
                      ? "bg-red-400"
                      : subState === "expiring_soon"
                        ? "bg-amber-400"
                        : verification && verification !== "verified"
                          ? "bg-amber-400"
                          : "bg-emerald-400",
                  ].join(" ")}
                />
              </div>

              {showText && (
                <div className="min-w-0 flex-1 leading-tight">
                  <p
                    className={`truncate ${sizeProfileName} font-semibold text-[#F1ECDD]`}
                  >
                    {t?.nav?.profile ?? "Profile"}
                  </p>
                  <p
                    className={`mt-0.5 truncate ${sizeProfileRole} text-[#A9B6C6]`}
                  >
                    {loading ? "…" : roleText}
                  </p>
                </div>
              )}
            </Link>
          )}

          <button
            type="button"
            onClick={handleLogout}
            title={!showText ? (t?.nav?.logout ?? "Log out") : undefined}
            className={[
              `group/logout flex w-full items-center gap-3 rounded-2xl px-2 py-1.5 ${sizeNavText} font-medium transition-colors duration-200 motion-reduce:transition-none`,
              !showText ? "lg:justify-center lg:px-0" : "",
              "text-[#A9B6C6] hover:bg-red-500/[0.09] hover:text-red-300",
              FOCUS_RING,
            ].join(" ")}
          >
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl transition-colors duration-200 group-hover/logout:bg-red-500/10">
              <LogOut
                className={`${sizeIcon} shrink-0 rtl:-scale-x-100`}
                strokeWidth={1.75}
                aria-hidden="true"
              />
            </span>
            {showText && <span>{t?.nav?.logout ?? "Log out"}</span>}
          </button>
        </div>
      </aside>
    </>
  );
}
