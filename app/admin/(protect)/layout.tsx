import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminShell from "@/components/admin/AdminShell";
import AdminRootWrapper from "@/components/admin/AdminRootWrapper";
import AdminSubscriptionGate from "@/components/admin/AdminSubscriptionGate";
import AdminVerificationGate from "@/components/admin/AdminVerificationGate";
import AdminSetupGate from "@/components/admin/AdminSetupGate";
import { AdminPreferencesProvider } from "@/providers/AdminPreferencesProvider";
import {
  AdminAuthProvider,
  type SetupInfo,
} from "@/providers/AdminAuthProvider";
import { prisma } from "@/lib/prisma";
import { getCurrentUserFromCookies } from "@/lib/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const HESABPAY_PATTERN = /^07\d{8}$/;

async function getSession(): Promise<{
  role: string | null;
  subscription: {
    status: string;
    planName: string | null;
    expiresAt: string | null;
  } | null;
  setup: SetupInfo;
}> {
  const user = await getCurrentUserFromCookies();
  if (!user) return { role: null, subscription: null, setup: null };

  const role = user.roles?.name ?? null;
  if (!role) return { role: null, subscription: null, setup: null };

  // ── hotel_owner: ONE query, hesabpay comes from hotel_owners ──
  if (role === "hotel_owner") {
    const link = await prisma.hotel_owners.findFirst({
      where: { user_id: user.id },
      select: {
        hesabpay_account_number: true, // ✅ lives on hotel_owners
        hotels: {
          select: {
            id: true,
            name: true,
            is_online: true,
            verification_status: true,
            subscription_status: true,
            subscription_expires_at: true,
            subscription_plans: { select: { name: true } },
            branches: {
              select: { id: true, name: true }, // no hesabpay on branches
              orderBy: { created_at: "asc" },
            },
          },
        },
      },
    });

    const hotel = link?.hotels;
    if (!hotel) {
      return {
        role,
        subscription: null,
        setup: {
          verified: false,
          hasHotel: false,
          hasBranch: false,
          hasHesabpay: false,
          hotelId: null,
          hotelName: null,
          isOnline: false,
          branches: [],
        },
      };
    }

    const hesabpay = link?.hesabpay_account_number ?? null;
    const hasHesabpay = HESABPAY_PATTERN.test(String(hesabpay ?? "").trim());

    return {
      role,
      subscription: {
        status: hotel.subscription_status ?? "active",
        planName: hotel.subscription_plans?.name ?? null,
        expiresAt: hotel.subscription_expires_at?.toISOString() ?? null,
      },
      setup: {
        verified: hotel.verification_status === "verified",
        hasHotel: true,
        hasBranch: hotel.branches.length > 0,
        hasHesabpay,
        hotelId: hotel.id,
        hotelName: hotel.name,
        isOnline: hotel.is_online === true,
        // expose hesabpay on every branch so the UI keeps the same shape
        branches: hotel.branches.map((b) => ({
          id: b.id,
          name: b.name,
          hesabpay_account_number: hesabpay,
        })),
      },
    };
  }

  // ── branch_manager: their branch → its hotel → hotel_owner.hesabpay ──
  if (role === "branch_manager" && user.branch_id) {
    const branch = await prisma.branches.findUnique({
      where: { id: user.branch_id },
      select: {
        id: true,
        name: true,
        hotels: {
          select: {
            id: true,
            name: true,
            verification_status: true,
            subscription_status: true,
            subscription_expires_at: true,
            subscription_plans: { select: { name: true } },
            hotel_owner: {
              select: { hesabpay_account_number: true }, // ✅ via relation
            },
          },
        },
      },
    });

    const hotel = branch?.hotels;
    if (!branch || !hotel) {
      return { role, subscription: null, setup: null };
    }

    const hesabpay = hotel.hotel_owner?.hesabpay_account_number ?? null;

    return {
      role,
      subscription: {
        status: hotel.subscription_status ?? "active",
        planName: hotel.subscription_plans?.name ?? null,
        expiresAt: hotel.subscription_expires_at?.toISOString() ?? null,
      },
      setup: {
        verified: hotel.verification_status === "verified",
        hasHotel: true,
        hasBranch: true,
        hasHesabpay: HESABPAY_PATTERN.test(String(hesabpay ?? "").trim()),
        hotelId: hotel.id,
        hotelName: hotel.name,
        isOnline: false,
        branches: [
          {
            id: branch.id,
            name: branch.name,
            hesabpay_account_number: hesabpay,
          },
        ],
      },
    };
  }

  // ── admin / super_admin ──
  return { role, subscription: null, setup: null };
}

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { role, subscription, setup } = await getSession();
  if (!role) redirect("/hotel/login");

  return (
    <AdminPreferencesProvider>
      <AdminAuthProvider
        initialRole={role}
        initialSubscription={subscription}
        initialSetup={setup}
      >
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
