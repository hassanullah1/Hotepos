import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { vehicleInclude, flattenVehicle } from "@/lib/vehicleSubtypes";
import VehicleForm from "../VehicleForm";

export default async function EditVehiclePage({ params }) {
  const { id } = await params; // ✅ await the promise

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
    include: vehicleInclude(),
  });

  if (!vehicle) notFound();
  return <VehicleForm vehicle={flattenVehicle(vehicle)} />;
}
