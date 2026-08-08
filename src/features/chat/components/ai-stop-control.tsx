"use client";

import { AppIcon } from "@/components/shared/app-icon";
import type { AiState } from "../types/chat.contract";

interface AiStopControlProps {
  aiState: AiState;
  /** Resolved conversations get no control at all — see A5 decision doc. */
  isResolved: boolean;
  isPending: boolean;
  onStop: () => void;
  onResume: () => void;
}

/**
 * Per-conversation AI stop/resume (ticket A5). Deliberately worded "Stop AI
 * on this conversation" / "Resume AI" — never "Disable AI", which reads
 * global and would frighten staff. Stopping does not claim the conversation;
 * that distinction is the whole reason this control exists, so it must never
 * be phrased as taking ownership.
 *
 * Resume shows only when `aiState === 'OFF'` — an `ESCALATED` conversation
 * cannot be handed back (one-way door until RESOLVED), so nothing is shown
 * there rather than a disabled button implying a permissions problem.
 */
export function AiStopControl({
  aiState,
  isResolved,
  isPending,
  onStop,
  onResume,
}: AiStopControlProps) {
  if (isResolved) return null;

  if (aiState === "OFF") {
    return (
      <button
        type="button"
        onClick={onResume}
        disabled={isPending}
        aria-label="Resume AI on this conversation"
        title="Resume AI"
        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground disabled:opacity-50"
      >
        <AppIcon icon="solar:play-circle-linear" className="size-5" />
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onStop}
      disabled={isPending}
      aria-label="Stop AI on this conversation"
      title="Stop AI on this conversation"
      className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-destructive disabled:opacity-50"
    >
      <AppIcon icon="solar:stop-circle-linear" className="size-5" />
    </button>
  );
}
