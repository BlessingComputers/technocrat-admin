"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { AppIcon } from "@/components/shared/app-icon";
import { ChatAvatar } from "./chat-avatar";
import { CustomerProfileDialog } from "./customer-profile-dialog";
import { formatTime } from "../utils/chat-format";
import { AI_ESCALATION_REASON_LABEL } from "../utils/chat-ai-state";
import type { ConversationSummary } from "../types/chat";

const STATUS_LABEL: Record<ConversationSummary["status"], string> = {
  WAITING: "Waiting",
  ACTIVE: "Active",
  RESOLVED: "Resolved",
  ABANDONED: "Abandoned",
};

interface ConversationListItemProps {
  conversation: ConversationSummary;
  isActive: boolean;
  isTyping: boolean;
  unreadCount: number;
  /** Show the "Take" self-assign affordance (Queue tab, unassigned). */
  showTake: boolean;
  /** A take for this row is in flight — disable it and show a pending label. */
  isTaking?: boolean;
  onSelect: () => void;
  onTake: () => void;
}

/** A single conversation row in the left rail. */
export function ConversationListItem({
  conversation,
  isActive,
  isTyping,
  unreadCount,
  showTake,
  isTaking,
  onSelect,
  onTake,
}: ConversationListItemProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const preview = isTyping ? "Typing…" : conversation.lastMessagePreview;
  // The staff-room row is a group, not a customer — no contact card there.
  const hasProfile = conversation.channel !== "STAFF_ROOM";

  return (
    <>
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        "flex w-full items-start gap-3 rounded-lg px-2 py-2.5 text-left transition-colors",
        isActive ? "bg-muted" : "hover:bg-muted/60",
      )}
    >
      {hasProfile ? (
        <span
          role="button"
          tabIndex={0}
          aria-label={`View ${conversation.name ?? "customer"} details`}
          onClick={(e) => {
            e.stopPropagation();
            setProfileOpen(true);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
              setProfileOpen(true);
            }
          }}
          className="rounded-full outline-none transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChatAvatar
            name={conversation.name}
            seed={conversation.id}
            avatarUrl={conversation.avatarUrl}
            size="md"
          />
        </span>
      ) : (
        <ChatAvatar
          name={conversation.name}
          seed={conversation.id}
          avatarUrl={conversation.avatarUrl}
          size="md"
        />
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate font-semibold text-foreground">
            {conversation.name ?? "Customer"}
          </span>
          <span className="shrink-0 text-xs text-muted-foreground">
            {formatTime(conversation.lastMessageAt)}
          </span>
        </div>

        <div className="mt-0.5 flex items-center justify-between gap-2">
          <span
            className={cn(
              "truncate text-sm",
              isTyping
                ? "italic text-primary-ink"
                : "text-muted-foreground",
            )}
          >
            {preview}
          </span>
          {unreadCount > 0 && (
            <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-destructive text-xs font-semibold text-white">
              {unreadCount}
            </span>
          )}
        </div>

        {/* At-a-glance AI state. `OFF` is the silent default (most
            conversations, and every one the AI never touched) — only the two
            states worth calling out get a badge, never colour alone. */}
        {conversation.aiState !== "OFF" && (
          <span
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium",
              conversation.aiState === "HANDLING"
                ? "bg-jewel/10 text-jewel-ink"
                : "bg-warning/10 text-warning-ink",
            )}
          >
            <AppIcon
              icon={
                conversation.aiState === "HANDLING"
                  ? "solar:magic-stick-3-linear"
                  : "solar:user-speak-linear"
              }
              className="size-3.5 shrink-0"
            />
            {conversation.aiState === "HANDLING"
              ? "AI handling"
              : (conversation.aiEscalationReason &&
                  AI_ESCALATION_REASON_LABEL[conversation.aiEscalationReason]) ||
                "Needs a human"}
          </span>
        )}

        {showTake && (
          <span
            role="button"
            tabIndex={isTaking ? -1 : 0}
            aria-disabled={isTaking}
            onClick={(e) => {
              e.stopPropagation();
              if (isTaking) return;
              onTake();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.stopPropagation();
                if (isTaking) return;
                onTake();
              }
            }}
            className={cn(
              "mt-1.5 inline-flex items-center gap-1 rounded-md bg-primary/5 px-2 py-1 text-xs font-medium text-primary-ink hover:bg-primary/10",
              isTaking && "cursor-not-allowed opacity-60 hover:bg-primary/5",
            )}
          >
            <AppIcon
              icon="solar:hand-shake-linear"
              className={cn("size-3.5", isTaking && "animate-pulse")}
            />
            {isTaking ? "Taking…" : "Take"}
          </span>
        )}
      </div>
    </button>

    {hasProfile ? (
      <CustomerProfileDialog
        open={profileOpen}
        onOpenChange={setProfileOpen}
        name={conversation.name ?? "Customer"}
        seed={conversation.id}
        avatarUrl={conversation.avatarUrl}
        email={conversation.customerEmail}
        phone={conversation.customerPhone}
        subtitle={STATUS_LABEL[conversation.status]}
      />
    ) : null}
    </>
  );
}
