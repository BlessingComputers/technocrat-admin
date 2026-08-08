import type {
  WhatsAppConversation,
  WhatsAppConversationDetail,
} from "../types/whatsapp";

/**
 * Display a `waId` (E.164 digits, no leading '+') as a phone number. We don't
 * know the customer's country formatting conventions, so keep it honest: add
 * the '+' and group the digits loosely rather than guessing a national format.
 */
export function formatWaId(waId: string): string {
  const digits = waId.replace(/\D/g, "");
  if (!digits) return waId;
  // Groups of 3-4 from the right read closer to how numbers are spoken than a
  // single run of digits, without claiming a specific national format.
  const tail = digits.slice(-10);
  const head = digits.slice(0, -10);
  const grouped = tail.replace(/(\d{3})(\d{3})(\d{4})/, "$1 $2 $3");
  return `+${head}${head ? " " : ""}${grouped}`.trim();
}

/** Best available name for a conversation — push name, else the number. */
export function conversationTitle(conversation: WhatsAppConversation): string {
  return conversation.profileName?.trim() || formatWaId(conversation.waId);
}

/** Full name of the assigned agent, or null when unassigned. */
export function assignedStaffName(
  conversation: WhatsAppConversationDetail,
): string | null {
  if (!conversation.staff) return null;
  return `${conversation.staff.firstName} ${conversation.staff.lastName}`.trim();
}

/**
 * State of Meta's 24h free-form reply window.
 *
 * `open` is the only state in which the backend will accept a send — anything
 * else gets a 422 `WHATSAPP_WINDOW_CLOSED`, so the composer disables itself
 * rather than letting staff type a message that cannot be delivered.
 */
export interface ReplyWindow {
  isOpen: boolean;
  /** Whole minutes left, or 0 when closed. */
  minutesLeft: number;
  /** Short human summary, e.g. "3h 12m left" or "Closed". */
  label: string;
}

export function replyWindowState(
  windowExpiresAt: string | null,
  now: number = Date.now(),
): ReplyWindow {
  if (!windowExpiresAt) {
    return { isOpen: false, minutesLeft: 0, label: "Closed" };
  }
  const msLeft = new Date(windowExpiresAt).getTime() - now;
  if (!Number.isFinite(msLeft) || msLeft <= 0) {
    return { isOpen: false, minutesLeft: 0, label: "Closed" };
  }
  const minutesLeft = Math.floor(msLeft / 60_000);
  const hours = Math.floor(minutesLeft / 60);
  const minutes = minutesLeft % 60;
  return {
    isOpen: true,
    minutesLeft,
    label: hours > 0 ? `${hours}h ${minutes}m left` : `${minutes}m left`,
  };
}

/** Compact relative timestamp for list rows: "now", "12m", "3h", "2d". */
export function relativeTime(
  iso: string | null,
  now: number = Date.now(),
): string {
  if (!iso) return "";
  const diff = now - new Date(iso).getTime();
  if (!Number.isFinite(diff)) return "";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 1) return "now";
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  return `${Math.floor(hours / 24)}d`;
}

/** Wall-clock time for message bubbles, e.g. "14:05". */
export function messageTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  });
}
