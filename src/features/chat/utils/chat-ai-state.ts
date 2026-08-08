/**
 * Pure `aiState` derivations for the conversation list (ticket A4). Extracted
 * from the components so the "which side of the split" and "did the overlay
 * do the right thing" questions are unit-testable without rendering anything.
 */

import type { ConversationSummary } from "../types/chat";
import type { AiEscalationReason, AiState } from "../types/chat.contract";

/** "Needs a human" is ESCALATED (one-way door) or OFF (AI never engaged). */
export function needsHuman(aiState: AiState): boolean {
  return aiState === "ESCALATED" || aiState === "OFF";
}

/** Human-readable, deliberately neutral — the guardrail case is the system
 * working correctly, not a failure, so nothing here reads as an error. */
export const AI_ESCALATION_REASON_LABEL: Record<AiEscalationReason, string> = {
  CUSTOMER_REQUESTED: "Customer asked for a person",
  BLOCKED_TOPIC: "Flagged for staff review",
  CANNOT_ANSWER: "AI couldn't answer",
  FRUSTRATION: "Customer seemed frustrated",
  REPLY_CAP: "Reply limit reached",
  ERROR: "AI ran into an error",
};

export interface QueueSplit {
  needsHuman: ConversationSummary[];
  aiHandling: ConversationSummary[];
}

/**
 * Partition a conversation list into the two groups the Queue tab shows.
 * Assignment is a separate axis (see `ConversationSummary.aiState` docs) —
 * callers filter to unassigned/queue rows first, this only splits on
 * `aiState`.
 */
export function splitQueueByAiState(
  conversations: ConversationSummary[],
): QueueSplit {
  const split: QueueSplit = { needsHuman: [], aiHandling: [] };
  for (const c of conversations) {
    (needsHuman(c.aiState) ? split.needsHuman : split.aiHandling).push(c);
  }
  return split;
}

/**
 * Overlay live `chat:ai:state` updates onto REST-seeded rows. Matches by id
 * only — an overlay entry for a conversation the base list doesn't contain
 * (an unknown id, or one not yet loaded) is simply never applied, so it can
 * never manifest as a phantom row.
 */
export function applyAiStateOverlay(
  conversations: ConversationSummary[],
  overlay: Record<string, { aiState: AiState; reason: AiEscalationReason | null }>,
): ConversationSummary[] {
  return conversations.map((c) => {
    const live = overlay[c.id];
    if (!live) return c;
    return { ...c, aiState: live.aiState, aiEscalationReason: live.reason };
  });
}
