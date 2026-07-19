import { tool, type InferUITools, type UIDataTypes, type UIMessage } from "ai";
import { z } from "zod";
import { searchWeb, type WebSearchResult } from "./firecrawl";

/** Output shape of the `webSearch` tool, rendered by the chat UI. */
export type WebSearchOutput = {
  query: string;
  results: WebSearchResult[];
};

/**
 * Web search tool backed by Firecrawl.
 *
 * The model decides when to invoke it (recent events, prices, versions,
 * anything past its training cutoff). Errors are thrown so the AI SDK emits an
 * `output-error` tool part — the UI shows the failure and the model can
 * recover in the next step.
 */
export const webSearchTool = tool({
  description:
    "Search the web for up-to-date information. Use this whenever the question involves current events, recent releases, prices, news, live data, or anything that may have changed after your training data ends. Do not guess about time-sensitive facts — search instead.",
  inputSchema: z.object({
    query: z
      .string()
      .min(1)
      .describe("A concise search query, e.g. 'Next.js 16 release date'"),
  }),
  execute: async ({ query }): Promise<WebSearchOutput> => {
    const results = await searchWeb(query);

    if (results.length === 0) {
      throw new Error(`No web results found for "${query}"`);
    }

    return { query, results };
  },
});

/** All tools available to the chat model, keyed by tool name. */
export const chatTools = {
  webSearch: webSearchTool,
};

/** Typed map of chat tools for `UIMessage` inference. */
export type ChatTools = InferUITools<typeof chatTools>;

/** UIMessage specialized with this app's tool set — gives typed `tool-webSearch` parts. */
export type ChatUIMessage = UIMessage<unknown, UIDataTypes, ChatTools>;
