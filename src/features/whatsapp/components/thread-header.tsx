"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

import { ReassignMenu } from "./reassign-menu";
import { AiStopControl } from "./ai-stop-control";
import { CONVERSATION_STATUS_STYLE } from "../constants/whatsapp-status";
import type { WhatsAppStaffOption } from "../api/whatsapp.service";
import type { WhatsAppConversationDetail } from "../types/whatsapp";
import {
  assignedStaffName,
  conversationTitle,
  formatWaId,
  type ReplyWindow,
} from "../utils/whatsapp-format";

interface ThreadHeaderProps {
  conversation: WhatsAppConversationDetail;
  replyWindow: ReplyWindow;
  isAssignedToMe: boolean;
  isUnassigned: boolean;
  canReassign: boolean;
  staff: WhatsAppStaffOption[];
  isClaiming: boolean;
  isResolving: boolean;
  isAiStatePending: boolean;
  onClaim: () => void;
  onResolve: () => void;
  onReassign: (staffId: string) => void;
  onStopAi: () => void;
  onResumeAi: () => void;
  /** Back affordance for the mobile single-pane layout. */
  onBack: () => void;
}

export function ThreadHeader({
  conversation,
  replyWindow,
  isAssignedToMe,
  isUnassigned,
  canReassign,
  staff,
  isClaiming,
  isResolving,
  isAiStatePending,
  onClaim,
  onResolve,
  onReassign,
  onStopAi,
  onResumeAi,
  onBack,
}: ThreadHeaderProps) {
  const status = CONVERSATION_STATUS_STYLE[conversation.status];
  const owner = assignedStaffName(conversation);
  const isResolved = conversation.status === "RESOLVED";

  return (
    <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-3">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onBack}
        aria-label="Back to conversations"
        className="shrink-0 lg:hidden"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-5" />
      </Button>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <h2 className="min-w-0 truncate font-heading text-base font-bold text-foreground">
            {conversationTitle(conversation)}
          </h2>
          <span
            className={cn(
              "shrink-0 rounded-full border px-2 py-0.5 text-xs font-medium",
              status.className,
            )}
          >
            {status.label}
          </span>
        </div>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-muted-foreground">
          <span className="tabular-nums">{formatWaId(conversation.waId)}</span>
          <span aria-hidden>·</span>
          <span>{conversation.conversationId}</span>
          {owner && (
            <>
              <span aria-hidden>·</span>
              <span>
                {isAssignedToMe ? "Assigned to you" : `Assigned to ${owner}`}
              </span>
            </>
          )}
          {!isResolved && (
            <>
              <span aria-hidden>·</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1",
                  !replyWindow.isOpen && "text-destructive",
                )}
              >
                <AppIcon icon="solar:hourglass-linear" className="size-3.5" />
                {replyWindow.isOpen
                  ? `Reply window ${replyWindow.label}`
                  : "Reply window closed"}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        {isUnassigned && (
          <Button
            type="button"
            size="sm"
            onClick={onClaim}
            disabled={isClaiming}
            className="h-9 rounded-lg font-semibold"
          >
            <AppIcon icon="solar:hand-shake-linear" className="mr-1.5 size-4" />
            {isClaiming ? "Claiming…" : "Claim"}
          </Button>
        )}
        {!isResolved && (
          <AiStopControl
            aiState={conversation.aiState ?? "OFF"}
            isResolved={isResolved}
            isPending={isAiStatePending}
            onStop={onStopAi}
            onResume={onResumeAi}
          />
        )}
        {canReassign && !isResolved && (
          <ReassignMenu
            staff={staff}
            currentAssignedStaffId={conversation.assignedStaffId}
            onReassign={onReassign}
          />
        )}
        {!isResolved && !isUnassigned && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onResolve}
            disabled={isResolving}
            className="h-9 rounded-lg font-medium"
          >
            <AppIcon
              icon="solar:check-circle-linear"
              className="mr-1.5 size-4"
            />
            {isResolving ? "Resolving…" : "Resolve"}
          </Button>
        )}
      </div>
    </header>
  );
}
