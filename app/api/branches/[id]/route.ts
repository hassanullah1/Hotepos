import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getOwnerHotelId } from "@/lib/owner-scope";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n =
    typeof v === "number"
      ? v
      : Number((v as { toString(): string }).toString());
  return Number.isFinite(n) ? n : null;
}

function parseLat(v: unknown): number | null | undefined {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -90 || n > 90) return undefined;
  return Number(n.toFixed(7));
}

function parseLng(v: unknown): number | null | undefined {
  if (v === null || v === "" || v === undefined) return null;
  const n = Number(v);
  if (!Number.isFinite(n) || n < -180 || n > 180) return undefined;
  return Number(n.toFixed(7));
}

async function assertBranchInScope(branchId: string, userId: string) {
  const hotelId = await getOwnerHotelId(userId);
  if (!hotelId) return null;
  const branch = await prisma.branches.findFirst({
    where: { id: branchId, hotel_id: hotelId },
    select: { id: true, hotel_id: true },
  });
  return branch;
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const inScope = await assertBranchInScope(id, user.id);
  if (!inScope)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const data: Record<string, unknown> = {};

  if (typeof body.name === "string") {
    const name = body.name.trim();
    if (!name)
      return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
    data.name = name;
  }
  if (body.code !== undefined)
    data.code =
      typeof body.code === "string" && body.code.trim()
        ? body.code.trim()
        : null;
  if (body.address !== undefined)
    data.address =
      typeof body.address === "string" && body.address.trim()
        ? body.address.trim()
        : null;
  if (body.city !== undefined)
    data.city =
      typeof body.city === "string" && body.city.trim()
        ? body.city.trim()
        : null;
  if (body.phone !== undefined)
    data.phone =
      typeof body.phone === "string" && body.phone.trim()
        ? body.phone.trim()
        : null;
  if (body.currency !== undefined)
    data.currency =
      typeof body.currency === "string" && body.currency.trim()
        ? body.currency.trim()
        : "AFN";
  if (body.timezone !== undefined)
    data.timezone =
      typeof body.timezone === "string" && body.timezone.trim()
        ? body.timezone.trim()
        : "Asia/Kabul";
  if (body.tax_rate !== undefined)
    data.tax_rate =
      body.tax_rate === "" || body.tax_rate === null
        ? 0
        : Number(body.tax_rate) || 0;
  if (body.service_charge_rate !== undefined)
    data.service_charge_rate =
      body.service_charge_rate === "" || body.service_charge_rate === null
        ? 0
        : Number(body.service_charge_rate) || 0;
  if (body.status !== undefined)
    data.status =
      typeof body.status === "string" && body.status.trim()
        ? body.status.trim()
        : "active";

  // ---- Province (required if provided) ----
  if (body.province_id !== undefined) {
    const pid =
      typeof body.province_id === "string" ? body.province_id.trim() : "";
    if (!pid)
      return NextResponse.json({ error: "PROVINCE_REQUIRED" }, { status: 400 });
    try {
      const exists = await prisma.provinces.findUnique({
        where: { id: pid },
        select: { id: true },
      });
      if (!exists)
        return NextResponse.json(
          { error: "PROVINCE_NOT_FOUND" },
          { status: 400 },
        );
      data.province_id = pid;
    } catch {
      return NextResponse.json(
        { error: "INVALID_PROVINCE_ID" },
        { status: 400 },
      );
    }
  }

  if (body.latitude !== undefined) {
    const lat = parseLat(body.latitude);
    if (lat === undefined)
      return NextResponse.json({ error: "Invalid latitude" }, { status: 400 });
    data.latitude = lat;
  }
  if (body.longitude !== undefined) {
    const lng = parseLng(body.longitude);
    if (lng === undefined)
      return NextResponse.json({ error: "Invalid longitude" }, { status: 400 });
    data.longitude = lng;
  }

  try {
    const updated = await prisma.branches.update({
      where: { id },
      data,
      include: { provinces: { select: { id: true, name: true } } },
    });

    return NextResponse.json({
      branch: {
        ...updated,
        latitude: num(updated.latitude),
        longitude: num(updated.longitude),
      },
    });
  } catch (err) {
    console.error("Update branch error:", err);
    const code =
      typeof err === "object" && err !== null && "code" in err
        ? (err as { code: string }).code
        : "";
    if (code === "P2002")
      return NextResponse.json(
        { error: "BRANCH_CODE_EXISTS" },
        { status: 409 },
      );
    return NextResponse.json(
      { error: "Failed to update branch" },
      { status: 400 },
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const inScope = await assertBranchInScope(id, user.id);
  if (!inScope)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  try {
    await prisma.branches.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Delete branch error:", err);
    return NextResponse.json(
      { error: "Failed to delete branch" },
      { status: 400 },
    );
  }
}
