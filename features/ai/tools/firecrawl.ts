import "server-only";

/** A single web search result returned by Firecrawl. */
export type WebSearchResult = {
  title: string;
  url: string;
  /** Short search-engine snippet for the result. */
  description: string;
  /** Scraped page content (markdown), truncated — present when scraping succeeds. */
  content?: string;
};

type FirecrawlSearchResponse = {
  success: boolean;
  data?: {
    web?: Array<{
      title?: string;
      url?: string;
      description?: string;
      markdown?: string;
    }>;
  };
  error?: string;
};

/** Max characters of scraped page content forwarded to the model per result. */
const MAX_CONTENT_CHARS = 1500;

const SEARCH_ENDPOINT = "https://api.firecrawl.dev/v2/search";
const SEARCH_TIMEOUT_MS = 25_000;

/**
 * Searches the web via the Firecrawl `/v2/search` API.
 *
 * Scrapes the main content of each result (markdown) so the model can ground
 * its answer in more than search snippets. Content is truncated to keep the
 * prompt small.
 *
 * @param query - The search query.
 * @param limit - Number of results to return (default 4).
 * @throws {Error} When the API key is missing, the request times out, or Firecrawl returns an error.
 */
export async function searchWeb(
  query: string,
  limit = 4
): Promise<WebSearchResult[]> {
  const apiKey = process.env.FIRECRAWL_API_KEY;
  if (!apiKey) {
    throw new Error("FIRECRAWL_API_KEY is not configured");
  }

  const response = await fetch(SEARCH_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      query,
      limit,
      scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
    }),
    signal: AbortSignal.timeout(SEARCH_TIMEOUT_MS),
  });

  if (!response.ok) {
    throw new Error(`Web search failed (HTTP ${response.status})`);
  }

  const payload = (await response.json()) as FirecrawlSearchResponse;

  if (!payload.success) {
    throw new Error(payload.error ?? "Web search failed");
  }

  const results = payload.data?.web ?? [];

  return results
    .filter((result) => result.url)
    .map((result) => ({
      title: result.title ?? result.url!,
      url: result.url!,
      description: result.description ?? "",
      content: result.markdown?.slice(0, MAX_CONTENT_CHARS),
    }));
}
