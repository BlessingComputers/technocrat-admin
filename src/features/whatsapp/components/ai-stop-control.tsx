"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import type { WhatsAppAiState } from "../types/whatsapp";

interface AiStopControlProps {
  aiState: WhatsAppAiState;
  /** Resolved conversations get no control at all — see A5 decision doc. */
  isResolved: boolean;
  isPending: boolean;
  onStop: () => void;
  onResume: () => void;
}

/**
 * Per-conversation AI stop/resume for the WhatsApp inbox (ticket A5) — the
 * same control and copy as the chat feature's `AiStopControl`, duplicated
 * rather than shared across features (see `api/whatsapp-socket.ts`). Never
 * phrased as taking ownership: stopping the AI does not claim the
 * conversation. Resume only ever shows when `aiState === 'OFF'` — an
 * `ESCALATED` conversation is a one-way door until RESOLVED.
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
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={onResume}
        disabled={isPending}
        aria-label="Resume AI on this conversation"
        title="Resume AI"
        className="h-9 rounded-lg font-medium"
      >
        <AppIcon icon="solar:play-circle-linear" className="mr-1.5 size-4" />
        Resume AI
      </Button>
    );
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={onStop}
      disabled={isPending}
      aria-label="Stop AI on this conversation"
      title="Stop AI on this conversation"
      className="h-9 rounded-lg font-medium"
    >
      <AppIcon icon="solar:stop-circle-linear" className="mr-1.5 size-4" />
      Stop AI
    </Button>
  );
}
