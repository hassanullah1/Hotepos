// lib/table-release.js
import prisma from "@/lib/prisma";

// statuses that mean "this order no longer holds the table"
const FINISHED = ["paid", "closed", "cancelled", "rejected"];

/**
 * Close the table session when it has no more running orders,
 * so the table / area becomes free again.
 * Returns true if the table was released.
 */
export async function releaseTableIfIdle(tableSessionId) {
  if (!tableSessionId) return false;

  const stillRunning = await prisma.orders.count({
    where: {
      table_session_id: tableSessionId,
      status: { notIn: FINISHED },
    },
  });
  if (stillRunning > 0) return false;

  await prisma.table_sessions.updateMany({
    where: { id: tableSessionId, status: "open" },
    data: {
      status: "closed",
      // closed_at: new Date(),   // uncomment if your table_sessions has it
    },
  });
  return true;
}
