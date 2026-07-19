"use client";

import { isTextUIPart } from "ai";
import type { ChatStatus } from "ai";
import { GitBranchIcon } from "lucide-react";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageAction,
  MessageActions,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import type { ChatUIMessage } from "@/features/ai/tools/web-search";
import { cn } from "@/lib/utils";
import { useCreateBranch } from "../hooks/use-branch";
import { WebSearchTool } from "./web-search-tool";

type ChatMessagesProps = {
  conversationId: string;
  messages: ChatUIMessage[];
  status: ChatStatus;
};

/**
 * Renders one message part: markdown for text, tool cards for tool invocations.
 */
function MessagePart({ part }: { part: ChatUIMessage["parts"][number] }) {
  if (isTextUIPart(part)) {
    return part.text ? <MessageResponse>{part.text}</MessageResponse> : null;
  }

  if (part.type === "tool-webSearch") {
    return <WebSearchTool part={part} />;
  }

  return null;
}

/**
 * Renders the conversation message list with markdown responses, tool
 * invocation cards, per-message branch actions, and a loading indicator.
 */
export function ChatMessages({
  conversationId,
  messages,
  status,
}: ChatMessagesProps) {
  const createBranch = useCreateBranch();

  const isWaiting = status === "submitted" && messages.at(-1)?.role === "user";
  // While streaming, the newest messages aren't persisted yet — branching
  // needs the message to exist in the database.
  const canBranch = status === "ready" && !createBranch.isPending;

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {message.parts.map((part, index) => (
                <MessagePart
                  key={
                    "toolCallId" in part
                      ? part.toolCallId
                      : `${message.id}-${index}`
                  }
                  part={part}
                />
              ))}
            </MessageContent>

            <MessageActions
              className={cn(
                "opacity-0 transition-opacity group-hover:opacity-100",
                message.role === "user" && "justify-end"
              )}
            >
              <MessageAction
                tooltip="Branch from here"
                label="Branch from here"
                disabled={!canBranch}
                onClick={() =>
                  createBranch.mutate({ conversationId, messageId: message.id })
                }
              >
                <GitBranchIcon className="size-3.5" />
              </MessageAction>
            </MessageActions>
          </Message>
        ))}

        {isWaiting ? (
          <Message from="assistant">
            <MessageContent>
              <Loader />
            </MessageContent>
          </Message>
        ) : null}
      </ConversationContent>
    </Conversation>
  );
}
