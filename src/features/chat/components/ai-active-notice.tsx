"use client";

import { AppIcon } from "@/components/shared/app-icon";
import type { AiState } from "../types/chat.contract";

interface AiActiveNoticeProps {
  aiState: AiState;
  /** Ownership of this conversation, relative to the current staff member. */
  assignmentState?: "unassigned" | "mine" | "other";
  isResolved: boolean;
  isPending: boolean;
  onStop: () => void;
}

/**
 * "The AI is still answering" strip, shown to the agent who owns the chat.
 *
 * Taking a conversation used to silence the AI as a side effect. It no longer
 * does: `assignedStaffId` is pure routing metadata, and the AI keeps replying
 * alongside the agent until someone explicitly stops it. Without this strip an
 * agent takes a chat, watches the machine answer over them, and files a bug.
 *
 * Only on a claimed-by-me conversation. Unassigned rows with the AI handling
 * are the normal flow and need no announcement, and an onlooker is not the
 * person about to be surprised — they still get the header control.
 */
export function AiActiveNotice({
  aiState,
  assignmentState,
  isResolved,
  isPending,
  onStop,
}: AiActiveNoticeProps) {
  if (isResolved) return null;
  if (aiState !== "HANDLING") return null;
  if (assignmentState !== "mine") return null;

  return (
    <div className="flex items-center gap-2 border-b border-border bg-jewel/10 px-4 py-2 text-xs lg:px-6">
      <AppIcon
        icon="solar:magic-stick-3-linear"
        aria-hidden
        className="size-4 shrink-0 text-jewel-ink"
      />
      <p className="min-w-0 flex-1 text-jewel-ink">
        You have this chat, but the AI is still answering the customer. It keeps
        replying until someone stops it.
      </p>
      <button
        type="button"
        onClick={onStop}
        disabled={isPending}
        className="shrink-0 rounded-lg border border-jewel/40 px-2.5 py-1 font-medium text-jewel-ink transition-colors hover:bg-jewel/20 disabled:opacity-50"
      >
        Stop AI
      </button>
    </div>
  );
}
