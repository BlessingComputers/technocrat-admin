"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

import { ConversationListItem } from "./conversation-list-item";
import type { WhatsAppInboxTab } from "../store/whatsapp.store";
import type { WhatsAppConversation } from "../types/whatsapp";

const TABS: { value: WhatsAppInboxTab; label: string }[] = [
  { value: "mine", label: "Mine" },
  { value: "queue", label: "Queue" },
  { value: "all", label: "All" },
];

interface ConversationListProps {
  conversations: WhatsAppConversation[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  tab: WhatsAppInboxTab;
  onTabChange: (tab: WhatsAppInboxTab) => void;
  /** Count shown on the Queue tab so an unclaimed backlog is visible from anywhere. */
  queueCount: number;
  selectedId: string | null;
  unseen: Record<string, true>;
  onSelect: (id: string) => void;
}

export function ConversationList({
  conversations,
  isLoading,
  isError,
  onRetry,
  tab,
  onTabChange,
  queueCount,
  selectedId,
  unseen,
  onSelect,
}: ConversationListProps) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div
        role="tablist"
        aria-label="Conversation filter"
        className="flex shrink-0 gap-1 border-b border-border bg-muted/30 p-2"
      >
        {TABS.map((t) => {
          const isActive = tab === t.value;
          return (
            <button
              key={t.value}
              role="tab"
              type="button"
              aria-selected={isActive}
              onClick={() => onTabChange(t.value)}
              className={cn(
                "flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-semibold transition-colors",
                isActive
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {t.label}
              {t.value === "queue" && queueCount > 0 && (
                <span className="rounded-full bg-warning/15 px-1.5 text-xs font-semibold tabular-nums text-warning-ink">
                  {queueCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {isLoading ? (
          <ul className="divide-y divide-border/60">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i} className="space-y-2 px-4 py-3">
                <Skeleton className="h-4 w-2/3" />
                <Skeleton className="h-3 w-1/2" />
                <Skeleton className="h-4 w-16 rounded-full" />
              </li>
            ))}
          </ul>
        ) : isError ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AppIcon
              icon="solar:danger-circle-linear"
              className="size-8 text-muted-foreground"
            />
            <p className="text-sm text-muted-foreground">
              Couldn’t load conversations.
            </p>
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try again
            </Button>
          </div>
        ) : conversations.length === 0 ? (
          <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
            <AppIcon
              icon="solar:inbox-linear"
              className="size-8 text-muted-foreground"
            />
            <p className="text-sm font-medium text-foreground">
              {tab === "queue"
                ? "Nothing waiting"
                : tab === "mine"
                  ? "No conversations assigned to you"
                  : "No conversations yet"}
            </p>
            <p className="max-w-[22rem] text-xs text-muted-foreground">
              {tab === "queue"
                ? "New WhatsApp messages land here until an agent claims them."
                : "Claim one from the Queue tab to start replying."}
            </p>
          </div>
        ) : (
          <ul>
            {conversations.map((c) => (
              <li key={c.id}>
                <ConversationListItem
                  conversation={c}
                  isSelected={c.id === selectedId}
                  hasUnseen={Boolean(unseen[c.id])}
                  onSelect={onSelect}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
