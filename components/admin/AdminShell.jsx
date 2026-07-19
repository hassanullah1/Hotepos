"use client";

import AdminTopbar from "./AdminTopbar";

export default function AdminShell({ children }) {
  return (
    <div className="flex min-h-screen flex-1 flex-col">
      <AdminTopbar />
      <main className="flex-1 overflow-y-auto p-6 text-slate-900 dark:text-slate-100">{children}</main>
    </div>
  );
}
