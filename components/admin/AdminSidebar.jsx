"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";

const NAV_ITEMS = [
  { href: "/admin", key: "dashboard", roles: ["SUPERADMIN", "ADMIN", "STAFF"] },
  {
    href: "/admin/vehicles",
    key: "vehicles",
    roles: ["SUPERADMIN", "ADMIN", "STAFF"],
  },
  {
    href: "/admin/provinces",
    key: "provinces",
    roles: ["SUPERADMIN", "ADMIN", "STAFF"],
  },
  { href: "/admin/users", key: "users", roles: ["SUPERADMIN"] },
  { href: "/admin/owners", key: "owners", roles: ["SUPERADMIN"] },
  // Add more links here — give each a translations.js "nav" key and restrict with `roles`.
];

export default function AdminSidebar({ role }) {
  const pathname = usePathname();
  const { t } = useAdminPreferences();
  const visibleItems = NAV_ITEMS.filter((item) => item.roles.includes(role));

  return (
    <aside className="flex w-60 shrink-0 flex-col bg-[#10243A] text-[#EDEBE3] dark:bg-[#0B1826]">
      <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-5">
        <svg
          viewBox="0 0 32 32"
          className="h-8 w-8 shrink-0"
          aria-hidden="true"
        >
          <path d="M2 26 L11 10 L16 18 L20 12 L30 26 Z" fill="#2F6690" />
          <path d="M11 10 L16 18 L13 26 L2 26 Z" fill="#1E3A5F" />
          <circle cx="23" cy="8" r="3" fill="#C9A227" />
        </svg>
        <div className="leading-tight">
          <p className="font-semibold tracking-wide">{t.appName}</p>
          <p className="text-[11px] uppercase tracking-[0.2em] text-[#C9A227]/80">
            {t.appSubtitle}
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {visibleItems.map((item) => {
          const active =
            item.href === "/admin"
              ? pathname === item.href
              : pathname?.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={[
                "flex items-center gap-2.5 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors duration-150",
                "border-s-[3px]",
                active
                  ? "border-s-[#C9A227] bg-white/10 text-white"
                  : "border-s-transparent text-[#C7CDD6] hover:bg-white/5 hover:text-white",
              ].join(" ")}
            >
              {t.nav[item.key] ?? item.key}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/10 px-5 py-4 text-[11px] text-[#8FA0B3]">
        {role}
      </div>
    </aside>
  );
}
