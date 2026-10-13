import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { getExpenseScope } from "@/lib/expense-scope";

export async function GET(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(request.url);
  const requestedHotelId = searchParams.get("hotel_id");

  // Branch managers are locked to their own hotel; owners must specify one
  // they actually own.
  console.log(scope, user);
  const hotelId =
    scope.role === "branch_manager" ? scope.hotelId : requestedHotelId;
  if (!hotelId || !scope.hotelIds.includes(hotelId)) {
    return NextResponse.json(
      { error: "hotel_id is required" },
      { status: 400 },
    );
  }

  const categories = await prisma.expense_categories.findMany({
    where: { hotel_id: hotelId, is_active: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ categories });
}

export async function POST(request) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const scope = await getExpenseScope(user.id);
  if (!scope) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  if (!body.name)
    return NextResponse.json({ error: "name is required" }, { status: 400 });

  const hotelId =
    scope.role === "branch_manager" ? scope.hotelId : body.hotel_id;
  if (!hotelId || !scope.hotelIds.includes(hotelId)) {
    return NextResponse.json(
      { error: "A valid hotel_id is required" },
      { status: 400 },
    );
  }

  try {
    const category = await prisma.expense_categories.create({
      data: {
        hotel_id: hotelId,
        name: body.name,
        description: body.description || null,
      },
    });
    return NextResponse.json({ category }, { status: 201 });
  } catch (err) {
    if (err.code === "P2002") {
      return NextResponse.json(
        { error: "Category already exists" },
        { status: 409 },
      );
    }
    console.error("Create category error:", err);
    return NextResponse.json(
      { error: "Failed to create category" },
      { status: 400 },
    );
  }
}
