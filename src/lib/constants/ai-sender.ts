/**
 * Server-side id of the AI first responder.
 *
 * `senderType: "SYSTEM"` covers two unrelated things — a client-only connection
 * notice, which is never persisted and carries no `senderId`, and an AI reply,
 * which is persisted and always carries this one. This is the discriminator;
 * `senderType` is not.
 *
 * It lives here rather than inside the chat feature because live chat and the
 * WhatsApp inbox are deliberately parallel modules that share nothing; the one
 * thing they genuinely do share is this backend-owned string, and it should be
 * declared once.
 */
export const AI_SENDER_ID = "ai-assistant";

/** True when a message was written by the AI first responder. */
export function isAiMessage(message: { senderId?: string | null }): boolean {
  return message.senderId === AI_SENDER_ID;
}
