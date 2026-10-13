"use client";

import Link from "next/link";
import { useAdminPreferences } from "@/providers/AdminPreferencesProvider";
import { NAV_ITEMS, filterNavByRole } from "@/lib/admin-nav-config";

const ICONS = {
  home: (
    <path
      d="M3 11.5 12 4l9 7.5M5 10v9h5v-6h4v6h5v-9"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  building: (
    <path
      d="M4 21V6l8-3 8 3v15M4 21h16M9 21v-4h6v4M9 10h.01M9 14h.01M15 10h.01M15 14h.01"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  tag: (
    <path
      d="M20.5 12.5 12 21l-9-9 8.5-8.5H20.5v8.5Z M16 8h.01"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  users: (
    <path
      d="M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM21 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  crown: (
    <path
      d="m3 8 4 3 5-6 5 6 4-3-2 10H5L3 8ZM5 21h14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  userGroup: (
    <path
      d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM3 20v-1a5 5 0 0 1 5-5h2a5 5 0 0 1 5 5v1M17 11a3 3 0 1 0 0-6M16 20v-1a5 5 0 0 0-2.06-4.06"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
  menu: (
    <path
      d="M4 6h16M4 12h16M4 18h10"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  ),
};

function CardIcon({ name }) {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
      {ICONS[name] ?? ICONS.menu}
    </svg>
  );
}

function Card({ href, label, icon, accent }) {
  return (
    <Link
      href={href}
      className={[
        "group flex flex-col gap-3 rounded-2xl border border-black/5 bg-white p-5",
        "shadow-sm transition-all duration-150 hover:-translate-y-0.5 hover:shadow-md",
        "dark:border-white/10 dark:bg-[#10243A]",
      ].join(" ")}
    >
      <div
        className={[
          "flex h-11 w-11 items-center justify-center rounded-xl",
          accent
            ? "bg-[#C9A227]/15 text-[#C9A227]"
            : "bg-[#1E3A5F]/10 text-[#1E3A5F] dark:bg-white/10 dark:text-[#EDEBE3]",
        ].join(" ")}
      >
        <CardIcon name={icon} />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium text-[#10243A] dark:text-[#EDEBE3]">
          {label}
        </span>
        <svg
          viewBox="0 0 20 20"
          className="h-4 w-4 text-gray-400 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-[#C9A227]"
          aria-hidden="true"
        >
          <path
            d="M7 4l6 6-6 6"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>
    </Link>
  );
}

export default function QuickActionsGrid({ role }) {
  const { t } = useAdminPreferences();
  const items = filterNavByRole(NAV_ITEMS, role);

  return (
    <div>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
        {t.quickActions ?? "Quick actions"}
      </h2>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item) => (
          <div
            key={item.key}
            className={
              item.children ? "col-span-2 sm:col-span-3 lg:col-span-4" : ""
            }
          >
            {item.children ? (
              <div className="rounded-2xl border border-black/5 bg-white/50 p-4 dark:border-white/10 dark:bg-[#10243A]/40">
                <p className="text-xs font-medium text-gray-500 mb-3 px-1">
                  {t.nav[item.key] ?? item.key}
                </p>
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                  <Card
                    href={item.href}
                    label={t.nav[item.key] ?? item.key}
                    icon={item.icon}
                    accent
                  />
                  {item.children.map((child) => (
                    <Card
                      key={child.href}
                      href={child.href}
                      label={t.nav[child.key] ?? child.key}
                      icon={child.icon}
                    />
                  ))}
                </div>
              </div>
            ) : (
              <Card
                href={item.href}
                label={t.nav[item.key] ?? item.key}
                icon={item.icon}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
