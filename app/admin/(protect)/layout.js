import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminShell from "@/components/admin/AdminShell";
import AdminRootWrapper from "@/components/admin/AdminRootWrapper";
import AdminSubscriptionGate from "@/components/admin/AdminSubscriptionGate";
import AdminVerificationGate from "@/components/admin/AdminVerificationGate"; // ← NEW
import { AdminPreferencesProvider } from "@/providers/AdminPreferencesProvider";
import { AdminAuthProvider } from "@/providers/AdminAuthProvider";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminSetupGate from "@/components/admin/AdminSetupGate";

export const dynamic = "force-dynamic";
export const revalidate = 0;

async function getSession() {
  const user = await getCurrentUserFromCookies();

  if (!user) return { role: null, subscription: null };

  const roleName = user.roles?.name ?? null;
  let subscription = null;

  if (roleName === "hotel_owner") {
    const owner = await prisma.hotel_owners.findFirst({
      where: { user_id: user.id },
      select: {
        hotels: {
          select: {
            subscription_status: true,
            subscription_expires_at: true,
            subscription_plans: { select: { name: true } },
          },
        },
      },
    });
    const hotel = owner?.hotels;
    if (hotel) {
      subscription = {
        status: hotel.subscription_status ?? "active",
        planName: hotel.subscription_plans?.name ?? null,
        expiresAt: hotel.subscription_expires_at?.toISOString() ?? null,
      };
    }
  } else if (user.hotel_id) {
    const hotel = await prisma.hotels.findUnique({
      where: { id: user.hotel_id },
      select: {
        subscription_status: true,
        subscription_expires_at: true,
        subscription_plans: { select: { name: true } },
      },
    });
    if (hotel) {
      subscription = {
        status: hotel.subscription_status ?? "active",
        planName: hotel.subscription_plans?.name ?? null,
        expiresAt: hotel.subscription_expires_at?.toISOString() ?? null,
      };
    }
  }

  return { role: roleName, subscription };
}

export default async function AdminLayout({ children }) {
  const { role, subscription } = await getSession();
  if (!role) redirect("/hotel/login");

  return (
    <AdminPreferencesProvider>
      <AdminAuthProvider initialRole={role} initialSubscription={subscription}>
        <AdminSubscriptionGate>
          <AdminVerificationGate>
             <AdminSetupGate>  
            <AdminRootWrapper>
              <AdminSidebar />
              <AdminShell>{children}</AdminShell>
            </AdminRootWrapper>
            </AdminSetupGate> 
          </AdminVerificationGate>
        </AdminSubscriptionGate>
      </AdminAuthProvider>
    </AdminPreferencesProvider>
  );
}
