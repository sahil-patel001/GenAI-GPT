"use server";

import { requireUser } from "@/features/auth/action/require-user";
import { MESSAGE_LIMIT, SEARCH_LIMIT } from "@/features/ai/config/limits";

/** Snapshot of the current user's lifetime quota, for the usage indicator. */
export type UsageSnapshot = {
  messagesUsed: number;
  messageLimit: number;
  searchesUsed: number;
  searchLimit: number;
  isUnlimited: boolean;
};

/** Returns the signed-in user's lifetime usage and limits. */
export async function getUsage(): Promise<UsageSnapshot> {
  const user = await requireUser();

  return {
    messagesUsed: Math.min(user.messagesUsed, MESSAGE_LIMIT),
    messageLimit: MESSAGE_LIMIT,
    searchesUsed: Math.min(user.searchesUsed, SEARCH_LIMIT),
    searchLimit: SEARCH_LIMIT,
    isUnlimited: user.isUnlimited,
  };
}
