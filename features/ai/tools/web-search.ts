import { tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { z } from "zod";
import { consumeSearchCredit } from "@/features/ai/utils/usage";
import { searchWeb, type WebSearchResult } from "./firecrawl";

/** Output shape of the `webSearch` tool, rendered by the chat UI. */
export type WebSearchOutput = {
  query: string;
  results: WebSearchResult[];
  /** Set when the user's lifetime search quota is exhausted — no search ran. */
  limitReached?: boolean;
  /** Instruction to the model when no results are available. */
  note?: string;
};

/** Minimal user shape the tools need for quota enforcement. */
type ToolUser = {
  id: string;
  isUnlimited: boolean;
};

/**
 * Builds the web search tool (backed by Firecrawl) for a specific user.
 *
 * Each search consumes one lifetime search credit. When the quota is
 * exhausted the tool returns a `limitReached` result instead of throwing, so
 * the model can still answer from its own knowledge and the stream survives.
 *
 * Real search errors are still thrown so the AI SDK emits an `output-error`
 * tool part — the UI shows the failure and the model can recover.
 */
function createWebSearchTool(user: ToolUser) {
  return tool({
    description:
      "Search the web for up-to-date information. Use this whenever the question involves current events, recent releases, prices, news, live data, or anything that may have changed after your training data ends. Do not guess about time-sensitive facts — search instead.",
    inputSchema: z.object({
      query: z
        .string()
        .min(1)
        .describe("A concise search query, e.g. 'Next.js 16 release date'"),
    }),
    execute: async ({ query }): Promise<WebSearchOutput> => {
      const allowed = await consumeSearchCredit(user);

      if (!allowed) {
        return {
          query,
          results: [],
          limitReached: true,
          note: "The user's free web-search quota is exhausted. Do not call webSearch again in this conversation. Answer from your own knowledge and mention that live results were unavailable.",
        };
      }

      const results = await searchWeb(query);

      if (results.length === 0) {
        throw new Error(`No web results found for "${query}"`);
      }

      return { query, results };
    },
  });
}

/**
 * All tools available to the chat model for one request, keyed by tool name.
 * Built per-user so tools can enforce that user's lifetime quotas.
 */
export function createChatTools(user: ToolUser) {
  return {
    webSearch: createWebSearchTool(user),
  };
}

/** Typed map of chat tools for `UIMessage` inference. */
export type ChatTools = InferUITools<ReturnType<typeof createChatTools>>;

/** UIMessage specialized with this app's tool set — gives typed `tool-webSearch` parts. */
export type ChatUIMessage = UIMessage<unknown, UIDataTypes, ChatTools>;
