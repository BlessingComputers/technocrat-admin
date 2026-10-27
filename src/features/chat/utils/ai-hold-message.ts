import { AI_HOLD_KEY_PREFIX } from "../types/chat.contract";

/**
 * True for the AI's "give me a moment" filler (contract v4). It is never
 * persisted and a real reply follows within seconds, so staff never need it:
 * the socket drops it before it reaches the store, the unread count or the
 * row preview.
 */
export function isAiHoldMessage(message: {
  idempotencyKey?: string | null;
}): boolean {
  return message.idempotencyKey?.startsWith(AI_HOLD_KEY_PREFIX) ?? false;
}
