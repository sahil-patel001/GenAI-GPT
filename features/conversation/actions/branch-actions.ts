"use server";

import { revalidatePath } from "next/cache";

import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import type { Message } from "@/lib/generated/prisma/client";

/**
 * Creates a new branch from a message in an existing conversation.
 *
 * The branch is a full conversation of its own: every message up to (and
 * including) the branch-point message is copied into it, so the shared
 * history is preserved even if the parent is later deleted, while anything
 * sent afterwards diverges independently.
 *
 * @param sourceConversationId - Conversation being branched.
 * @param messageId - Message that becomes the branch point (inclusive).
 * @returns The newly created branch conversation.
 * @throws {Error} When the conversation or message is not found / not owned.
 */
export async function createBranch(
  sourceConversationId: string,
  messageId: string
) {
  const user = await requireUser();

  const source = await prisma.conversation.findFirst({
    where: { id: sourceConversationId, userId: user.id },
  });

  if (!source) {
    throw new Error("Conversation not found");
  }

  const branchPoint = await prisma.message.findFirst({
    where: { id: messageId, conversationId: sourceConversationId },
  });

  if (!branchPoint) {
    throw new Error("Message not found in this conversation");
  }

  // Everything up to and including the branch point is the shared history.
  const history = await prisma.message.findMany({
    where: {
      conversationId: sourceConversationId,
      createdAt: { lte: branchPoint.createdAt },
    },
    orderBy: { createdAt: "asc" },
  });

  const branchTitle = `${source.title} (branch)`.slice(0, 64);

  const branch = await prisma.$transaction(async (tx) => {
    const created = await tx.conversation.create({
      data: {
        userId: user.id,
        title: branchTitle,
        model: source.model,
        systemPrompt: source.systemPrompt,
        parentId: source.id,
        branchedFromMessageId: branchPoint.id,
      },
    });

    if (history.length > 0) {
      await tx.message.createMany({
        // `id` is omitted so each copy gets a fresh cuid from the schema default.
        data: history.map((message: Message) => ({
          conversationId: created.id,
          role: message.role,
          status: message.status,
          content: message.content,
          parts: message.parts ?? undefined,
          metadata: message.metadata ?? undefined,
          // Keep original timestamps so the copied history keeps its order.
          createdAt: message.createdAt,
        })),
      });
    }

    return created;
  });

  revalidatePath("/");
  return branch;
}
