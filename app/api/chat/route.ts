import { loadChatMessages, saveChatMessages } from "@/features/ai/actions/chat-store";
import { MESSAGE_LIMIT } from "@/features/ai/config/limits";
import { createChatTools } from "@/features/ai/tools/web-search";
import { getChatModel } from "@/features/ai/utils/model";
import { consumeMessageCredit } from "@/features/ai/utils/usage";
import { requireUser } from "@/features/auth/action/require-user";
import { prisma } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { convertToModelMessages, createIdGenerator, createUIMessageStreamResponse, stepCountIs, streamText, toUIMessageStream, type UIMessage } from "ai";
/**
 * POST /api/chat — Streams an AI assistant reply for a conversation.
 *
 * Validates auth and ownership, persists the user message, then streams the
 * assistant response via the AI SDK. Final messages are saved when the stream ends.
 */
export async function POST(req: Request) {
    await auth.protect();

    const { message, id }: { message: UIMessage, id: string } = await req.json();

    if (!message || !id) {
        return new Response("Missing message or conversation id", { status: 400 });
    }

    const user = await requireUser();

    const conversation = await prisma.conversation.findFirst({
        where: {
            id,
            userId: user.id
        }
    });

    if (!conversation) {
        return new Response("Conversation not found", { status: 404 });
    }

    const previousMessages = await loadChatMessages(id);

    const alreadySaved = previousMessages.some(
        (storedMessage)=>storedMessage.id === message.id
    )

    const messages = alreadySaved ? previousMessages : [...previousMessages, message];

    if(!alreadySaved){
        // Charge the quota before persisting — a blocked message is neither
        // stored nor answered, so retrying it can't slip past billing.
        const allowed = await consumeMessageCredit(user);

        if (!allowed) {
            return new Response(
                `You've used all ${MESSAGE_LIMIT} free messages. Thanks for trying ChaiGPT!`,
                { status: 429 }
            );
        }

        await saveChatMessages(id, [message]);
    }

    const result =  streamText({
        model: getChatModel(conversation.model),
        system:
            conversation.systemPrompt ??
            `You are ChaiGPT, a helpful assistant. Today's date is ${new Date().toDateString()}. Use the webSearch tool for questions about current events, recent releases, or anything time-sensitive. Web search results are more current than your training data — always trust them over what you remember. Search results may mix old and new information: compare dates carefully and base your answer on the most recent facts. Cite the sources you used in your answer.`,
        messages: await convertToModelMessages(messages, { ignoreIncompleteToolCalls: true }),
        tools: createChatTools(user),
        // Allow tool call → result → follow-up searches → final answer.
        stopWhen: stepCountIs(5),
    });

    result.consumeStream();

    return createUIMessageStreamResponse({
        stream:toUIMessageStream({
           stream:result.stream,
           originalMessages:messages,
           generateMessageId:createIdGenerator({prefix:"msg" , size:16}),
           onEnd:async({messages:finalMessages})=>{
            try {
                await saveChatMessages(id , finalMessages , {updateTitle:false})
            } catch (error) {
                console.error(error);
            }
           }
        })
    })

}