import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function GET(req, { params }) {
  const { id } = await params;

  const owner = await prisma.owner.findUnique({
    where: { id },
    include: {
      vehicles: {
        orderBy: { createdAt: "desc" },
        include: {
          province: true,
          orders: {
            include: { client: true },
            orderBy: { createdAt: "desc" },
          },
        },
      },
    },
  });

  if (!owner) {
    return NextResponse.json({ error: "Owner not found" }, { status: 404 });
  }

  // Flatten orders across all of this owner's vehicles
  const orders = owner.vehicles.flatMap((v) =>
    v.orders.map((o) => ({
      ...o,
      vehicle: {
        id: v.id,
        type: v.type,
        plateNumber: v.plateNumber,
        brand: v.brand,
        model: v.model,
      },
    })),
  );

  const totalEarnings = orders
    .filter((o) => o.status === "COMPLETED")
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  const pendingEarnings = orders
    .filter((o) => o.status === "ACTIVE" || o.status === "CONFIRMED")
    .reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  // never send the password hash to the client
  const { password, ...safeOwner } = owner;

  return NextResponse.json({
    ...safeOwner,
    orders,
    stats: {
      vehicleCount: owner.vehicles.length,
      orderCount: orders.length,
      totalEarnings,
      pendingEarnings,
    },
  });
}

export async function PUT(req, { params }) {
  const { id } = await params;
  try {
    const body = await req.json();
    const { name, phone, password, address, tazkiraNumber, notes } = body;

    const data = { name, phone, address, tazkiraNumber, notes };
    if (password) {
      data.password = await bcrypt.hash(password, 10);
    }

    const owner = await prisma.owner.update({ where: { id }, data });
    const { password: _pw, ...safeOwner } = owner;
    return NextResponse.json(safeOwner);
  } catch (err) {
    if (err.code === "P2002") {
      const field = err.meta?.target?.[0] || "field";
      return NextResponse.json(
        { error: `An owner with this ${field} already exists` },
        { status: 409 },
      );
    }
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update owner" },
      { status: 500 },
    );
  }
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  try {
    const vehicleCount = await prisma.vehicle.count({ where: { ownerId: id } });
    if (vehicleCount > 0) {
      return NextResponse.json(
        {
          error:
            "Cannot delete an owner with vehicles assigned. Reassign or remove their vehicles first.",
        },
        { status: 409 },
      );
    }
    await prisma.owner.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err.code === "P2025") {
      return NextResponse.json({ error: "Owner not found" }, { status: 404 });
    }
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete owner" },
      { status: 500 },
    );
  }
}
