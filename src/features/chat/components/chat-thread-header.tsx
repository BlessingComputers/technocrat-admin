"use client";

import { useState, type ReactNode } from "react";
import { ChatAvatar } from "./chat-avatar";
import { CustomerProfileDialog } from "./customer-profile-dialog";
import { AppIcon } from "@/components/shared/app-icon";
import type { ChatChannel, ConversationStatus } from "../types/chat";

interface ChatThreadHeaderProps {
  name: string;
  seed: string;
  avatarUrl?: string | null;
  channel: ChatChannel;
  status?: ConversationStatus;
  isOnline: boolean;
  memberCount?: number;
  /** Who owns this conversation, relative to the current staff member. */
  assignmentState?: "unassigned" | "mine" | "other";
  /** Assigned admin's display name (for "Assigned to X"). */
  assignedStaffName?: string | null;
  /** Customer contact for the WhatsApp-style profile card. */
  customerEmail?: string | null;
  customerPhone?: string | null;
  panelOpen: boolean;
  /** Super-admin reassign control, rendered in the actions row when provided. */
  reassignSlot?: ReactNode;
  /** AI stop/resume control (ticket A5), rendered in the actions row. */
  aiControlSlot?: ReactNode;
  /** Mobile back arrow → conversation list; hidden on desktop (lg+). */
  onBack: () => void;
  onTogglePanel: () => void;
  /** Close the conversation (staff flow step 9) — hidden for the staff room. */
  onResolve?: () => void;
}

const STATUS_LABEL: Record<ConversationStatus, string> = {
  WAITING: "Waiting",
  ACTIVE: "Active",
  RESOLVED: "Resolved",
  ABANDONED: "Abandoned",
};

/** Thread header: avatar, name, and online status (or member count for a group). */
export function ChatThreadHeader({
  name,
  seed,
  avatarUrl,
  channel,
  status,
  isOnline,
  memberCount,
  assignmentState,
  assignedStaffName,
  customerEmail,
  customerPhone,
  panelOpen,
  reassignSlot,
  aiControlSlot,
  onBack,
  onTogglePanel,
  onResolve,
}: ChatThreadHeaderProps) {
  const [profileOpen, setProfileOpen] = useState(false);
  const isCustomer = channel === "LIVE_CHAT";

  // "Assigned to X" / "Unassigned" — shown for customer chats so every viewer
  // (incl. a super admin) knows who owns the conversation.
  const assignmentLabel = !isCustomer
    ? null
    : assignmentState === "mine"
      ? "Assigned to you"
      : assignmentState === "other"
        ? `Assigned to ${assignedStaffName ?? "another agent"}`
        : "Unassigned";

  const identity = (
    <>
      <ChatAvatar name={name} seed={seed} avatarUrl={avatarUrl} size="md" />
      <div className="min-w-0 text-left">
        <p className="truncate font-semibold text-foreground">
          {name ?? "Customer"}
        </p>
        {channel === "STAFF_ROOM" ? (
          <p className="text-sm text-muted-foreground">
            {memberCount ?? 0} members
          </p>
        ) : (
          <div className="flex flex-col gap-0.5">
            <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <span
                className={
                  isOnline
                    ? "size-2 rounded-full bg-success"
                    : "size-2 rounded-full bg-muted-foreground/40"
                }
              />
              {isOnline ? "Online" : "Offline"}
            </p>
            {assignmentLabel ? (
              <p
                className={
                  assignmentState === "unassigned"
                    ? "truncate text-xs font-medium text-warning-ink"
                    : "truncate text-xs text-muted-foreground"
                }
              >
                {assignmentLabel}
              </p>
            ) : null}
          </div>
        )}
      </div>
    </>
  );

  return (
    <>
      <div className="flex items-center gap-3 rounded-t-lg bg-muted/50 px-4 py-4 lg:px-6">
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to conversations"
          className="-ml-1 rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden"
        >
          <AppIcon icon="solar:arrow-left-linear" className="size-5" />
        </button>

        {isCustomer ? (
          <button
            type="button"
            onClick={() => setProfileOpen(true)}
            aria-label={`View ${name ?? "customer"} details`}
            className="-m-1 flex min-w-0 items-center gap-3 rounded-lg p-1 text-left transition-colors hover:bg-muted"
          >
            {identity}
          </button>
        ) : (
          <div className="flex min-w-0 items-center gap-3">{identity}</div>
        )}

        <div className="ml-auto flex items-center gap-1">
          {isCustomer && status !== "RESOLVED" ? aiControlSlot : null}
          {isCustomer && status !== "RESOLVED" ? reassignSlot : null}

          {channel === "LIVE_CHAT" && onResolve && status !== "RESOLVED" ? (
            <button
              type="button"
              onClick={onResolve}
              aria-label="Mark conversation as resolved"
              title="Mark as resolved"
              className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-success-ink"
            >
              <AppIcon icon="solar:check-circle-linear" className="size-5" />
            </button>
          ) : null}

          <button
            type="button"
            onClick={onTogglePanel}
            aria-label={panelOpen ? "Hide details panel" : "Show details panel"}
            aria-pressed={panelOpen}
            className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <AppIcon
              icon={
                panelOpen
                  ? "solar:sidebar-minimalistic-bold"
                  : "solar:sidebar-minimalistic-linear"
              }
              className="size-5"
            />
          </button>
        </div>
      </div>

      {isCustomer ? (
        <CustomerProfileDialog
          open={profileOpen}
          onOpenChange={setProfileOpen}
          name={name ?? "Customer"}
          seed={seed}
          avatarUrl={avatarUrl}
          email={customerEmail}
          phone={customerPhone}
          subtitle={status ? STATUS_LABEL[status] : null}
        />
      ) : null}
    </>
  );
}
