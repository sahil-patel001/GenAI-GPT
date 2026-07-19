"use client";

import * as React from "react";
import { ArrowUpIcon } from "lucide-react";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group";
import { Spinner } from "@/components/ui/spinner";
import { cn } from "@/lib/utils";

type ChatComposerUsage = {
  used: number;
  limit: number;
};

type ChatComposerProps = {
  onSend: (content: string) => Promise<void> | void;
  isSending?: boolean;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
  /** Lifetime message quota to display; omit to hide the indicator. */
  usage?: ChatComposerUsage;
};

/**
 * Message input form with send button. Enter sends; Shift+Enter inserts a newline.
 */
export function ChatComposer({
  onSend,
  isSending = false,
  placeholder = "Message ChaiGPT…",
  className,
  autoFocus = false,
  usage,
}: ChatComposerProps) {
  const [value, setValue] = React.useState("");
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);

  React.useEffect(() => {
    if (autoFocus) {
      textareaRef.current?.focus();
    }
  }, [autoFocus]);

  const quotaExhausted = usage !== undefined && usage.used >= usage.limit;

  /** Submits the current message when the form is submitted or Enter is pressed. */
  async function handleSubmit(event?: React.FormEvent) {
    event?.preventDefault();
    const content = value.trim();
    if (!content || isSending || quotaExhausted) return;

    setValue("");
    await onSend(content);
    textareaRef.current?.focus();
  }

  /** Handles keyboard shortcuts — Enter to send, Shift+Enter for a new line. */
  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      void handleSubmit();
    }
  }

  const canSend = value.trim().length > 0 && !isSending && !quotaExhausted;

  return (
    <form
      onSubmit={(event) => void handleSubmit(event)}
      className={cn("mx-auto w-full max-w-3xl px-4 pb-4 md:px-6", className)}
    >
      <InputGroup className="h-auto min-h-14 rounded-3xl border-border/80 bg-background shadow-sm dark:bg-input/40">
        <InputGroupTextarea
          ref={textareaRef}
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            quotaExhausted
              ? "You've used all your free messages"
              : placeholder
          }
          disabled={isSending || quotaExhausted}
          rows={1}
          className="max-h-48 min-h-12 py-3.5 pl-4 text-[15px] leading-relaxed"
        />
        <InputGroupAddon align="inline-end" className="pr-2 pb-2 self-end">
          <InputGroupButton
            type="submit"
            size="icon-sm"
            variant="default"
            disabled={!canSend}
            className="size-9 rounded-full"
            aria-label="Send message"
          >
            {isSending ? <Spinner /> : <ArrowUpIcon />}
          </InputGroupButton>
        </InputGroupAddon>
      </InputGroup>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        ChaiGPT can make mistakes. Check important info.
        {usage ? (
          <span
            className={cn(
              "ml-2",
              quotaExhausted && "font-medium text-destructive"
            )}
          >
            {Math.min(usage.used, usage.limit)}/{usage.limit} free messages used
          </span>
        ) : null}
      </p>
    </form>
  );
}
