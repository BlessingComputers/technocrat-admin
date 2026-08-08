"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

import { CONVERSATION_STATUS_STYLE } from "../constants/whatsapp-status";
import type { WhatsAppConversation } from "../types/whatsapp";
import { conversationTitle, formatWaId, relativeTime } from "../utils/whatsapp-format";

interface ConversationListItemProps {
  conversation: WhatsAppConversation;
  isSelected: boolean;
  /** Client-side "something happened since you last looked" badge. */
  hasUnseen: boolean;
  onSelect: (id: string) => void;
}

export function ConversationListItem({
  conversation,
  isSelected,
  hasUnseen,
  onSelect,
}: ConversationListItemProps) {
  const status = CONVERSATION_STATUS_STYLE[conversation.status];
  const title = conversationTitle(conversation);
  const unread = conversation.unreadByStaff ?? 0;

  return (
    <button
      type="button"
      onClick={() => onSelect(conversation.id)}
      aria-current={isSelected ? "true" : undefined}
      className={cn(
        "flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
        isSelected ? "bg-primary/5" : "hover:bg-muted/40",
      )}
    >
      {/* Selection is carried by the bar + background, not colour alone. */}
      <span
        aria-hidden
        className={cn(
          "mt-1 h-8 w-0.5 shrink-0 rounded-full",
          isSelected ? "bg-primary" : "bg-transparent",
        )}
      />

      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <span className="min-w-0 flex-1 truncate text-sm font-semibold text-foreground">
            {title}
          </span>
          <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
            {relativeTime(conversation.lastMessageAt ?? conversation.createdAt)}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="flex min-w-0 flex-1 items-center gap-1.5 text-xs text-muted-foreground">
            <AppIcon
              icon="solar:smartphone-linear"
              className="size-3.5 shrink-0"
            />
            <span className="truncate">{formatWaId(conversation.waId)}</span>
          </span>
          {(unread > 0 || hasUnseen) && (
            <span
              className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-xs font-semibold tabular-nums text-primary-foreground"
              aria-label={
                unread > 0 ? `${unread} unread messages` : "New activity"
              }
            >
              {unread > 0 ? unread : "•"}
            </span>
          )}
        </div>

        <span
          className={cn(
            "inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium",
            status.className,
          )}
        >
          {status.label}
        </span>
      </div>
    </button>
  );
}
