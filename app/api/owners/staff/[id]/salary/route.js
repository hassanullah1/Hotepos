import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth";
import { loadOwnedStaff } from "@/lib/owner-scope";

const SALARY_TYPES = ["monthly", "hourly", "daily"];

function serializeSalary(s) {
  return {
    id: s.id,
    salary_type: s.salary_type,
    base_amount: s.base_amount,
    bonus_amount: s.bonus_amount,
    currency: s.currency,
    effective_from: s.effective_from,
    effective_to: s.effective_to,
    is_current: s.is_current,
    created_at: s.created_at,
  };
}

export async function GET(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const staff = await loadOwnedStaff(id, user.id);
  if (!staff) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const salaries = await prisma.staff_salaries.findMany({
    where: { user_id: id },
    orderBy: { effective_from: "desc" },
  });

  const current = salaries.find((s) => s.is_current) || null;

  return NextResponse.json({
    current: current ? serializeSalary(current) : null,
    history: salaries.map(serializeSalary),
  });
}

// Sets a new salary as of `effective_from`. Whatever row is currently
// is_current gets closed out (effective_to = the day before the new
// row starts, is_current = false) rather than overwritten, so payroll
// history stays accurate across raises.
export async function POST(request, { params }) {
  const user = await getAuthUser(request);
  if (!user)
    return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { id } = await params;
  const staff = await loadOwnedStaff(id, user.id);
  if (!staff) return NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });

  const body = await request.json();
  const { base_amount, bonus_amount, salary_type, currency, effective_from } =
    body;

  if (
    base_amount === undefined ||
    base_amount === null ||
    isNaN(Number(base_amount))
  )
    return NextResponse.json(
      { error: "BASE_AMOUNT_REQUIRED" },
      { status: 400 },
    );
  if (Number(base_amount) < 0)
    return NextResponse.json(
      { error: "BASE_AMOUNT_NEGATIVE" },
      { status: 400 },
    );

  // bonus is optional — only validate it if the caller actually sent one
  if (
    bonus_amount !== undefined &&
    bonus_amount !== null &&
    bonus_amount !== ""
  ) {
    if (isNaN(Number(bonus_amount)))
      return NextResponse.json(
        { error: "BONUS_AMOUNT_INVALID" },
        { status: 400 },
      );
    if (Number(bonus_amount) < 0)
      return NextResponse.json(
        { error: "BONUS_AMOUNT_NEGATIVE" },
        { status: 400 },
      );
  }

  if (salary_type && !SALARY_TYPES.includes(salary_type))
    return NextResponse.json({ error: "SALARY_TYPE_INVALID" }, { status: 400 });
  if (!effective_from)
    return NextResponse.json(
      { error: "EFFECTIVE_FROM_REQUIRED" },
      { status: 400 },
    );

  const newFrom = new Date(effective_from);
  if (isNaN(newFrom.getTime()))
    return NextResponse.json(
      { error: "EFFECTIVE_FROM_INVALID" },
      { status: 400 },
    );

  // normalize once: "" / null / undefined all mean "no bonus" -> 0
  const bonusValue =
    bonus_amount === undefined || bonus_amount === null || bonus_amount === ""
      ? 0
      : Number(bonus_amount);

  try {
    const result = await prisma.$transaction(async (tx) => {
      const current = await tx.staff_salaries.findFirst({
        where: { user_id: id, is_current: true },
      });

      if (current) {
        const currentFrom = new Date(current.effective_from);

        if (newFrom < currentFrom) {
          throw new Error("EFFECTIVE_FROM_BEFORE_CURRENT");
        }

        // Same start date as the current row = correcting a typo/mistake
        // for the period that's already live, not starting a new period.
        // Update in place instead of spawning a duplicate history row.
        if (newFrom.getTime() === currentFrom.getTime()) {
          return tx.staff_salaries.update({
            where: { id: current.id },
            data: {
              salary_type: salary_type || current.salary_type,
              base_amount,
              bonus_amount: bonusValue,
              currency: currency || current.currency,
            },
          });
        }

        const dayBefore = new Date(newFrom);
        dayBefore.setDate(dayBefore.getDate() - 1);
        await tx.staff_salaries.update({
          where: { id: current.id },
          data: { is_current: false, effective_to: dayBefore },
        });
      }

      return tx.staff_salaries.create({
        data: {
          user_id: id,
          salary_type: salary_type || "monthly",
          base_amount,
          bonus_amount: bonusValue,
          currency: currency || "AFN",
          effective_from: newFrom,
          is_current: true,
        },
      });
    });

    return NextResponse.json(
      { salary: serializeSalary(result) },
      { status: 201 },
    );
  } catch (err) {
    console.error("Set salary error:", err);
    const code =
      err.message === "EFFECTIVE_FROM_BEFORE_CURRENT"
        ? err.message
        : "SALARY_SAVE_FAILED";
    return NextResponse.json({ error: code }, { status: 400 });
  }
}
