"use client";

import { useQuery } from "@tanstack/react-query";

import { getUsage } from "@/features/ai/actions/usage-actions";
import { queryKeys } from "../utils/query-keys";

/**
 * Fetches the signed-in user's lifetime usage (messages / searches) for the
 * quota indicator. Invalidated after each chat turn.
 */
export function useUsage() {
    return useQuery({
        queryKey: queryKeys.usage,
        queryFn: () => getUsage(),
    });
}
