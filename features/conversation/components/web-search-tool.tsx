"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";
import type { ChatUIMessage } from "@/features/ai/tools/web-search";
import {
  AlertCircleIcon,
  ChevronDownIcon,
  GlobeIcon,
} from "lucide-react";
import { useState } from "react";

/** The typed `tool-webSearch` part extracted from a chat message. */
export type WebSearchPart = Extract<
  ChatUIMessage["parts"][number],
  { type: "tool-webSearch" }
>;

/** Hostname of a URL, without the `www.` prefix (favicon + display label). */
function getDomain(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * Renders a `webSearch` tool invocation inside an assistant message.
 *
 * States: spinner while the model writes the query / the search runs,
 * a collapsible source list when results arrive, and an error card when
 * the search fails.
 */
export function WebSearchTool({ part }: { part: WebSearchPart }) {
  const [open, setOpen] = useState(false);

  if (part.state === "input-streaming" || part.state === "input-available") {
    return (
      <div className="flex w-fit items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <Spinner className="size-3.5" />
        <span>
          Searching the web
          {part.input?.query ? (
            <>
              {" for "}
              <span className="font-medium text-foreground">
                “{part.input.query}”
              </span>
            </>
          ) : (
            "…"
          )}
        </span>
      </div>
    );
  }

  if (part.state === "output-error") {
    return (
      <div className="flex w-fit items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
        <AlertCircleIcon className="size-3.5 shrink-0" />
        <span>
          Web search failed
          {part.input?.query ? <> for “{part.input.query}”</> : null}
          {part.errorText ? (
            <span className="text-destructive/80"> — {part.errorText}</span>
          ) : null}
        </span>
      </div>
    );
  }

  if (part.state !== "output-available") {
    return null;
  }

  if (part.output.limitReached) {
    return (
      <div className="flex w-fit items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
        <GlobeIcon className="size-3.5 shrink-0" />
        <span>Web search limit reached — answered without live results</span>
      </div>
    );
  }

  const { query, results } = part.output;

  return (
    <Collapsible
      open={open}
      onOpenChange={setOpen}
      className="w-full max-w-md rounded-lg border bg-muted/40"
    >
      <CollapsibleTrigger className="flex w-full items-center gap-2 px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
        <GlobeIcon className="size-3.5 shrink-0" />
        <span className="truncate">
          Searched the web for{" "}
          <span className="font-medium text-foreground">“{query}”</span>
        </span>
        <span className="ml-auto flex shrink-0 items-center gap-1 text-xs">
          {results.length} source{results.length === 1 ? "" : "s"}
          <ChevronDownIcon
            className={cn("size-3.5 transition-transform", open && "rotate-180")}
          />
        </span>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <ul className="space-y-1 border-t px-3 py-2">
          {results.map((result) => (
            <li key={result.url}>
              <a
                href={result.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group/link flex items-start gap-2 rounded-md p-1.5 transition-colors hover:bg-muted"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={`https://www.google.com/s2/favicons?domain=${getDomain(result.url)}&sz=32`}
                  alt=""
                  className="mt-0.5 size-4 shrink-0 rounded-sm"
                />
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium group-hover/link:underline">
                    {result.title}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {getDomain(result.url)}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </CollapsibleContent>
    </Collapsible>
  );
}
