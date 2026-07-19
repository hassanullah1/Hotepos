import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminShell from "@/components/admin/AdminShell";
import { AdminPreferencesProvider } from "@/providers/AdminPreferencesProvider";

// TODO: replace with your real auth/session lookup (NextAuth, custom JWT, etc).
// This just needs to resolve to one of "SUPERADMIN" | "ADMIN" | "STAFF".
async function getCurrentRole() {
  return "SUPERADMIN";
}

export default async function AdminLayout({ children }) {
  const role = await getCurrentRole();

  return (
    <AdminPreferencesProvider>
      <div className="flex min-h-screen bg-slate-50 dark:bg-[#0B1826]">
        <AdminSidebar role={role} />
        <AdminShell>{children}</AdminShell>
      </div>
    </AdminPreferencesProvider>
  );
}
