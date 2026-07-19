/**
 * Lifetime usage limits per user. Counters live on the `User` model and only
 * ever increase — deleting conversations does not refund credits.
 */

/** Total user messages a non-unlimited account can ever send. */
export const MESSAGE_LIMIT = 10;

/** Total Firecrawl web searches a non-unlimited account can ever trigger. */
export const SEARCH_LIMIT = 5;

/**
 * Models a conversation's per-thread override may resolve to. Anything not in
 * this list falls back to the default so users can't select expensive models.
 */
export const CHAT_MODEL_ALLOWLIST = ["gpt-4.1-mini", "gpt-4.1-nano"] as const;
