"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { createBranch } from "@/features/conversation/actions/branch-actions";
import { queryKeys } from "../utils/query-keys";

/**
 * Mutation hook that branches a conversation from a given message and
 * navigates to the new branch.
 */
export function useCreateBranch() {
  const queryClient = useQueryClient();
  const router = useRouter();

  return useMutation({
    mutationFn: ({
      conversationId,
      messageId,
    }: {
      conversationId: string;
      messageId: string;
    }) => createBranch(conversationId, messageId),
    onSuccess: (branch) => {
      void queryClient.invalidateQueries({
        queryKey: queryKeys.conversations.all,
      });
      toast.success("Branch created");
      router.push(`/c/${branch.id}`);
    },
    onError: (error: Error) => {
      toast.error(error.message || "Could not create branch");
    },
  });
}
