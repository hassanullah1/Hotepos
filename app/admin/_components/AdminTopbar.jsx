"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

const NAV = [
  { href: "/admin/roles", label: "Roles & permissions" },
  { href: "/admin/staff", label: "Staff" },
];

export default function AdminTopbar({ isDark, toggleTheme, currentUser }) {
  const pathname = usePathname();
  const router = useRouter();

 async function handleLogout() {
   if (!confirm(t?.logoutConfirm ?? "Log out?")) return;
   await fetch("/api/auth/logout", { method: "POST" });
   localStorage.removeItem("auth_token"); // cleanup
   router.push("/login");
   router.refresh();
 }

  const borderColor = isDark ? "border-[#243040]" : "border-[#DEDBD1]";
  const textPrimary = isDark ? "text-[#EDEDE7]" : "text-[#171A1E]";
  const textMuted = isDark ? "text-[#8B98AC]" : "text-[#6B7280]";

  return (
    <div className={`border-b ${borderColor} px-5 py-3 sm:px-8`}>
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <div className="flex items-center gap-6">
          <span
            className={`text-lg font-extrabold tracking-tight ${textPrimary}`}
            style={{ fontFamily: "var(--font-display)" }}
          >
            Melmah <span className="text-[#F5A623]">Admin</span>
          </span>
          <nav className="flex items-center gap-1">
            {NAV.map((item) => {
              const active = pathname?.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={[
                    "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                    active
                      ? "bg-[#F5A623] text-[#171205]"
                      : `${textMuted} hover:text-[#F5A623]`,
                  ].join(" ")}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {currentUser && (
            <span className={`text-xs ${textMuted}`}>
              {currentUser.name}
              {currentUser.role ? ` · ${currentUser.role}` : ""}
            </span>
          )}
          <button
            type="button"
            onClick={toggleTheme}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${borderColor} ${textMuted} hover:border-[#F5A623] hover:text-[#F5A623]`}
          >
            {isDark ? "Light" : "Dark"}
          </button>
          <button
            type="button"
            onClick={handleLogout}
            className={`rounded-md border px-2.5 py-1 text-xs font-medium transition-colors ${borderColor} ${textMuted} hover:border-[#F5A623] hover:text-[#F5A623]`}
          >
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}
