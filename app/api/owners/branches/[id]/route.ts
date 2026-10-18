import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { ownsHotel } from "@/lib/owner-scope";

function num(v: any) {
  if (v === null || v === undefined) return null;
  const n = typeof v === "number" ? v : Number(v.toString());
  return Number.isFinite(n) ? n : null;
}

function serialize(b: any) {
  return {
    id: b.id,
    hotel_id: b.hotel_id,
    name: b.name,
    code: b.code,
    address: b.address,
    city: b.city,
    phone: b.phone,
    latitude: num(b.latitude),
    longitude: num(b.longitude),
    currency: b.currency,
    timezone: b.timezone,
    tax_rate: num(b.tax_rate) ?? 0,
    service_charge_rate: num(b.service_charge_rate) ?? 0,
    status: b.status,
    created_at: b.created_at,
    updated_at: b.updated_at,
  };
}

async function loadOwnedBranch(branchId: string, userId: string) {
  const branch = await prisma.branches.findUnique({ where: { id: branchId } });
  if (!branch) return null;
  const owns = await ownsHotel(userId, branch.hotel_id);
  return owns ? branch : null;
}

// PATCH /api/branches/[id]
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: branchId } = await params;
  const branch = await loadOwnedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found in your scope" },
      { status: 404 },
    );

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    body = {};
  }

  const data: Record<string, unknown> = {};

  if (body.name !== undefined) {
    const name = typeof body.name === "string" ? body.name.trim() : "";
    if (!name)
      return NextResponse.json(
        { error: "Branch name cannot be empty" },
        { status: 400 },
      );
    data.name = name;
  }

  if (body.code !== undefined) {
    const code =
      typeof body.code === "string" && body.code.trim()
        ? body.code.trim()
        : null;
    if (code) {
      const dupe = await prisma.branches.findFirst({
        where: { hotel_id: branch.hotel_id, code, NOT: { id: branchId } },
        select: { id: true },
      });
      if (dupe)
        return NextResponse.json(
          { error: "A branch with this code already exists" },
          { status: 400 },
        );
    }
    data.code = code;
  }

  for (const k of [
    "address",
    "city",
    "phone",
    "currency",
    "timezone",
    "status",
  ]) {
    if (body[k] !== undefined) {
      data[k] =
        typeof body[k] === "string" && (body[k] as string).trim()
          ? (body[k] as string).trim()
          : null;
    }
  }

  for (const k of [
    "latitude",
    "longitude",
    "tax_rate",
    "service_charge_rate",
  ]) {
    if (body[k] !== undefined) {
      const v = body[k];
      data[k] =
        typeof v === "number" && Number.isFinite(v)
          ? v
          : typeof v === "string" && v.trim() !== "" && !Number.isNaN(Number(v))
            ? Number(v)
            : null;
    }
  }

  if (Object.keys(data).length === 0)
    return NextResponse.json({ error: "Nothing to update" }, { status: 400 });

  try {
    const updated = await prisma.branches.update({
      where: { id: branchId },
      data,
    });
    return NextResponse.json({ branch: serialize(updated) });
  } catch (err) {
    console.error("Update branch error:", err);
    return NextResponse.json(
      { error: "Failed to update branch" },
      { status: 400 },
    );
  }
}

// DELETE /api/branches/[id]
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id: branchId } = await params;
  const branch = await loadOwnedBranch(branchId, user.id);
  if (!branch)
    return NextResponse.json(
      { error: "Branch not found in your scope" },
      { status: 404 },
    );

  const [staffCount, tableCount, orderCount] = await Promise.all([
    prisma.users.count({ where: { branch_id: branchId } }),
    prisma.dining_tables.count({ where: { branch_id: branchId } }),
    prisma.orders.count({ where: { branch_id: branchId } }),
  ]);

  if (staffCount > 0 || tableCount > 0 || orderCount > 0) {
    return NextResponse.json(
      {
        error:
          "Branch still has staff, tables or orders. Remove them first or archive the branch instead.",
      },
      { status: 409 },
    );
  }

  try {
    await prisma.branches.delete({ where: { id: branchId } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete branch error:", err);
    return NextResponse.json(
      { error: "Failed to delete branch" },
      { status: 400 },
    );
  }
}
