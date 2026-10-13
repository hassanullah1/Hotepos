import prisma from "@/lib/prisma";

// Resolves the branch a POS staff member (waiter/cashier/kitchen/manager)
// is scoped to. Returns null if not a POS-eligible role or no branch set.
export async function getStaffBranch(userId) {
  const user = await prisma.users.findUnique({
    where: { id: userId },
    select: {
      branch_id: true,
      roles: { select: { name: true } },
    },
  });

  if (!user || !user.branch_id) return null;

  const posRoles = [
    "waiter",
    "super_admin",
    "hotel_owner",
    "branch_manager",
    "kitchen",
  ];
  if (!posRoles.includes(user.roles.name)) return null;

  return { branchId: user.branch_id, role: user.roles.name };
}
