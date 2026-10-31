import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function num(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const n =
    typeof v === "number"
      ? v
      : Number((v as { toString(): string }).toString());
  return Number.isFinite(n) ? n : null;
}

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const branch = await prisma.branches.findFirst({
    where: {
      id,
      status: "active",
      hotels: { is_online: true },
    },
    select: {
      id: true,
      name: true,
      address: true,
      city: true,
      phone: true,
      latitude: true,
      longitude: true,
      currency: true,
      opening_time: true,
      closing_time: true,
      hotels: {
        select: {
          id: true,
          name: true,
          logo_url: true,
          delivery_type: true, // "none" | "paid" | "free"
        },
      },
    },
  });

  if (!branch)
    return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const categories = await prisma.menu_categories.findMany({
    where: { branch_id: id, is_active: true },
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      sort_order: true,
      menu_items: {
        where: { is_available: true, is_online: true },
        orderBy: { sort_order: "asc" },
        select: {
          id: true,
          name: true,
          description: true,
          image_url: true,
          price: true,
        },
      },
    },
  });

  const uncategorized = await prisma.menu_items.findMany({
    where: {
      branch_id: id,
      is_available: true,
      is_online: true,
      category_id: null,
    },
    orderBy: { sort_order: "asc" },
    select: {
      id: true,
      name: true,
      description: true,
      image_url: true,
      price: true,
    },
  });

  const mapped = categories
    .filter((c) => c.menu_items.length > 0)
    .map((c) => ({
      id: c.id,
      name: c.name,
      items: c.menu_items.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        image_url: m.image_url,
        price: Number(m.price),
      })),
    }));

  if (uncategorized.length > 0) {
    mapped.push({
      id: "__uncategorized__",
      name: "Other",
      items: uncategorized.map((m) => ({
        id: m.id,
        name: m.name,
        description: m.description,
        image_url: m.image_url,
        price: Number(m.price),
      })),
    });
  }

  return NextResponse.json({
    branch: {
      id: branch.id,
      name: branch.name,
      address: branch.address,
      city: branch.city,
      phone: branch.phone,
      latitude: num(branch.latitude),
      longitude: num(branch.longitude),
      currency: branch.currency || "AFN",
      opening_time: branch.opening_time,
      closing_time: branch.closing_time,
      hotels: branch.hotels || null,
      delivery_type: branch.hotels?.delivery_type ?? "none", // ← NEW
    },
    categories: mapped,
  });
}
