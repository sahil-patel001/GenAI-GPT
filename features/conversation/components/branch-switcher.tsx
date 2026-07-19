"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckIcon, GitBranchIcon, MessageSquareIcon } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { ConversationListItem } from "@/features/conversation/actions/conversation-actions";

type BranchSwitcherProps = {
  conversationId: string;
  conversations: ConversationListItem[] | undefined;
};

/**
 * Header dropdown for navigating a conversation's branch family — the parent
 * chat, sibling branches, and branches created from the current chat.
 * Renders nothing when the conversation has no branch relations.
 */
export function BranchSwitcher({
  conversationId,
  conversations,
}: BranchSwitcherProps) {
  const router = useRouter();

  if (!conversations) return null;

  const current = conversations.find((item) => item.id === conversationId);
  if (!current) return null;

  const parent = current.parentId
    ? conversations.find((item) => item.id === current.parentId)
    : undefined;
  const siblings = parent
    ? conversations.filter(
        (item) => item.parentId === parent.id && item.id !== current.id
      )
    : [];
  const children = conversations.filter(
    (item) => item.parentId === current.id
  );

  const relatedCount = (parent ? 1 : 0) + siblings.length + children.length;
  if (relatedCount === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground" />
        }
      >
        <GitBranchIcon className="size-3.5" />
        <span className="hidden sm:inline">Branches</span>
        <Badge variant="secondary" className="px-1.5 text-[10px]">
          {relatedCount + 1}
        </Badge>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64">
        {parent ? (
          <>
            <DropdownMenuGroup>
              <DropdownMenuLabel>Branched from</DropdownMenuLabel>
              <BranchMenuItem
                conversation={parent}
                icon={<MessageSquareIcon className="size-3.5" />}
                onSelect={() => router.push(`/c/${parent.id}`)}
              />
            </DropdownMenuGroup>
            <DropdownMenuSeparator />
          </>
        ) : null}

        <DropdownMenuGroup>
          <DropdownMenuLabel>
            {parent ? "Branches of that chat" : "Branches of this chat"}
          </DropdownMenuLabel>

          {parent ? (
            <BranchMenuItem
              conversation={current}
              icon={<CheckIcon className="size-3.5" />}
              isCurrent
            />
          ) : null}

          {siblings.map((sibling) => (
            <BranchMenuItem
              key={sibling.id}
              conversation={sibling}
              icon={<GitBranchIcon className="size-3.5" />}
              onSelect={() => router.push(`/c/${sibling.id}`)}
            />
          ))}

          {!parent
            ? children.map((child) => (
                <BranchMenuItem
                  key={child.id}
                  conversation={child}
                  icon={<GitBranchIcon className="size-3.5" />}
                  onSelect={() => router.push(`/c/${child.id}`)}
                />
              ))
            : null}
        </DropdownMenuGroup>

        {parent && children.length > 0 ? (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuLabel>Branches of this chat</DropdownMenuLabel>
              {children.map((child) => (
                <BranchMenuItem
                  key={child.id}
                  conversation={child}
                  icon={<GitBranchIcon className="size-3.5" />}
                  onSelect={() => router.push(`/c/${child.id}`)}
                />
              ))}
            </DropdownMenuGroup>
          </>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/** One row in the branch dropdown. */
function BranchMenuItem({
  conversation,
  icon,
  isCurrent = false,
  onSelect,
}: {
  conversation: ConversationListItem;
  icon: React.ReactNode;
  isCurrent?: boolean;
  onSelect?: () => void;
}) {
  return (
    <DropdownMenuItem
      disabled={isCurrent}
      onClick={onSelect}
      className={isCurrent ? "font-medium opacity-100" : undefined}
    >
      {icon}
      <span className="truncate">{conversation.title}</span>
      {isCurrent ? (
        <span className="ml-auto text-xs text-muted-foreground">Current</span>
      ) : null}
    </DropdownMenuItem>
  );
}

/**
 * Small banner shown under the header of a branched conversation linking back
 * to its parent chat.
 */
export function BranchedFromBanner({
  conversationId,
  conversations,
}: BranchSwitcherProps) {
  const current = conversations?.find((item) => item.id === conversationId);
  const parent = current?.parentId
    ? conversations?.find((item) => item.id === current.parentId)
    : undefined;

  if (!parent) return null;

  return (
    <div className="flex shrink-0 items-center gap-1.5 border-b bg-muted/30 px-4 py-1.5 text-xs text-muted-foreground">
      <GitBranchIcon className="size-3" />
      <span>
        Branched from{" "}
        <Link
          href={`/c/${parent.id}`}
          className="font-medium text-foreground hover:underline"
        >
          {parent.title}
        </Link>
      </span>
    </div>
  );
}
