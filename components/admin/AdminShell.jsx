"use client";

import AdminTopbar from "./AdminTopbar";

export default function AdminShell({ children }) {
  return (
    <div className="flex min-w-0 flex-1 flex-col bg-slate-50 dark:bg-[#0B1826]">
      <AdminTopbar />
      <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 text-slate-900 sm:p-6 dark:text-slate-100">
        <div className="mx-auto w-full max-w-7xl">{children}</div>
      </main>
    </div>
  );
}
