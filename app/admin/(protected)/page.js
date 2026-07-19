import { prisma } from "@/lib/prisma";
import DashboardCards from "../../../components/admin/DashboardCards";

export default async function DashboardPage() {
  const [vehicles, provinces, users] = await Promise.all([
    prisma.vehicle.count(),
    prisma.province.count(),
    prisma.user.count(),
  ]);

  return <DashboardCards counts={{ vehicles, provinces, users }} />;
}
