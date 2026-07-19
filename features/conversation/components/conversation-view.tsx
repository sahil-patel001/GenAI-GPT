"use client";
import { Separator } from '@/components/ui/separator';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useQueryClient } from '@tanstack/react-query';
import { DefaultChatTransport, type UIMessage } from 'ai';
import { useChat } from "@ai-sdk/react"
import type { ChatUIMessage } from '@/features/ai/tools/web-search';
import React, { useMemo } from 'react'
import { useConversations } from '../hooks/use-conversation';
import { useUsage } from '../hooks/use-usage';
import { queryKeys } from '../utils/query-keys';
import { toast } from 'sonner';
import { ChatEmpty } from './chat-empty';
import { ChatMessages } from './chat-messages';
import { ChatComposer } from './chat-composer';
import { BranchedFromBanner, BranchSwitcher } from './branch-switcher';

type ConversationViewProps = {
    conversationId: string;
    initialMessages: UIMessage[];
};

/**
 * Main chat view — header, message list (or empty state), and composer with streaming.
 */
export const ConversationView = ({ conversationId, initialMessages }: ConversationViewProps) => {

    const queryClient = useQueryClient();
    const { data: conversations } = useConversations();
    const { data: usage } = useUsage();

    const transport = useMemo(() => new DefaultChatTransport<ChatUIMessage>({
        api: "/api/chat",
        prepareSendMessagesRequest: ({ id, messages }) => ({
            body: {
                id, message: messages.at(-1)
            }
        })
    }), []);

    const { messages, sendMessage, status } = useChat<ChatUIMessage>({
        id: conversationId,
        messages: initialMessages as ChatUIMessage[],
        transport,
        onFinish: () => {
            void queryClient.invalidateQueries({
                queryKey: queryKeys.conversations.all,
            });
            void queryClient.invalidateQueries({ queryKey: queryKeys.usage });
        },
        onError: (error) => {
            toast.error(error.message);
            // A 429 (quota exhausted) also lands here — refresh the indicator.
            void queryClient.invalidateQueries({ queryKey: queryKeys.usage });
        },
    })
    const title =
    conversations?.find((item) => item.id === conversationId)?.title ?? "Chat";

    return (
        <div className="flex h-full min-h-0 flex-1 flex-col">
            <header className="flex h-14 shrink-0 items-center gap-2 border-b px-3">
                <SidebarTrigger />
                <Separator orientation="vertical" className="mx-1 h-4" />
                <h1 className="truncate text-sm font-medium">{title}</h1>
                <div className="ml-auto">
                    <BranchSwitcher
                        conversationId={conversationId}
                        conversations={conversations}
                    />
                </div>
            </header>

            <BranchedFromBanner
                conversationId={conversationId}
                conversations={conversations}
            />

            {messages.length === 0 ? (
                <ChatEmpty />
            ) : (
                <ChatMessages
                    conversationId={conversationId}
                    messages={messages}
                    status={status}
                />
            )}

            <ChatComposer
                onSend={(text) => {
                    void sendMessage({ text });
                }}
                isSending={status !== "ready"}
                autoFocus
                usage={
                    usage && !usage.isUnlimited
                        ? { used: usage.messagesUsed, limit: usage.messageLimit }
                        : undefined
                }
            />
        </div>
    )
}
