import { AdminPreferencesProvider } from "@/providers/AdminPreferencesProvider";

export default function AdminLayout({ children }) {
  return <AdminPreferencesProvider>{children}</AdminPreferencesProvider>;
}
