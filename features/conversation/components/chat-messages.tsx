"use client";

import { isTextUIPart } from "ai";
import type { ChatStatus } from "ai";

import {
  Conversation,
  ConversationContent,
} from "@/components/ai-elements/conversation";
import {
  Message,
  MessageContent,
  MessageResponse,
} from "@/components/ai-elements/message";
import { Loader } from "@/components/ai-elements/loader";
import type { ChatUIMessage } from "@/features/ai/tools/web-search";
import { WebSearchTool } from "./web-search-tool";

type ChatMessagesProps = {
  messages: ChatUIMessage[];
  status: ChatStatus;
};

/**
 * Renders one message part: markdown for text, tool cards for tool invocations.
 */
function MessagePart({
  part,
  partIndex,
}: {
  part: ChatUIMessage["parts"][number];
  partIndex: number;
}) {
  if (isTextUIPart(part)) {
    return part.text ? <MessageResponse key={partIndex}>{part.text}</MessageResponse> : null;
  }

  if (part.type === "tool-webSearch") {
    return <WebSearchTool part={part} />;
  }

  return null;
}

/**
 * Renders the conversation message list with markdown responses, tool
 * invocation cards, and a loading indicator.
 */
export function ChatMessages({ messages, status }: ChatMessagesProps) {
  const isWaiting =
    status === "submitted" && messages.at(-1)?.role === "user";

  return (
    <Conversation>
      <ConversationContent className="py-8">
        {messages.map((message) => (
          <Message key={message.id} from={message.role}>
            <MessageContent>
              {message.parts.map((part, index) => (
                <MessagePart
                  key={"toolCallId" in part ? part.toolCallId : `${message.id}-${index}`}
                  part={part}
                  partIndex={index}
                />
              ))}
            </MessageContent>
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
