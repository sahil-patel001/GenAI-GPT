import "server-only";

import { prisma } from "@/lib/db";
import { MESSAGE_LIMIT, SEARCH_LIMIT } from "@/features/ai/config/limits";

type QuotaUser = {
  id: string;
  isUnlimited: boolean;
};

/**
 * Atomically consumes one credit from a lifetime counter on the user row.
 *
 * The conditional `updateMany` is a check-and-increment in a single statement,
 * so concurrent requests can never push the counter past the limit.
 *
 * @returns `true` when a credit was consumed (or the user is unlimited).
 */
async function consumeCredit(
  user: QuotaUser,
  field: "messagesUsed" | "searchesUsed",
  limit: number
): Promise<boolean> {
  if (user.isUnlimited) return true;

  const { count } = await prisma.user.updateMany({
    where: { id: user.id, [field]: { lt: limit } },
    data: { [field]: { increment: 1 } },
  });

  return count > 0;
}

/** Consumes one of the user's lifetime message credits. */
export function consumeMessageCredit(user: QuotaUser) {
  return consumeCredit(user, "messagesUsed", MESSAGE_LIMIT);
}

/** Consumes one of the user's lifetime web-search credits. */
export function consumeSearchCredit(user: QuotaUser) {
  return consumeCredit(user, "searchesUsed", SEARCH_LIMIT);
}
