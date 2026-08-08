import type {
  WhatsAppConversationStatus,
  WhatsAppMessageStatus,
} from "../types/whatsapp";

/** Badge styling per conversation status. Never colour-only — the label carries the meaning. */
export const CONVERSATION_STATUS_STYLE: Record<
  WhatsAppConversationStatus,
  { label: string; className: string }
> = {
  WAITING: {
    label: "Waiting",
    className:
      "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30",
  },
  ACTIVE: {
    label: "Active",
    className:
      "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30",
  },
  RESOLVED: {
    label: "Resolved",
    className: "bg-muted text-muted-foreground border-border",
  },
  ABANDONED: {
    label: "Abandoned",
    className: "bg-muted text-muted-foreground border-border",
  },
};

/**
 * Delivery-receipt presentation. WhatsApp's own tick vocabulary is what staff
 * expect, so mirror it: one tick sent, two delivered, two "read" emphasised.
 */
export const MESSAGE_STATUS_META: Record<
  WhatsAppMessageStatus,
  { label: string; icon: string; className: string }
> = {
  PENDING: {
    label: "Sending",
    icon: "solar:clock-circle-linear",
    className: "text-muted-foreground",
  },
  SENT: {
    label: "Sent",
    icon: "solar:check-read-linear",
    className: "text-muted-foreground",
  },
  DELIVERED: {
    label: "Delivered",
    icon: "solar:check-read-linear",
    className: "text-muted-foreground",
  },
  READ: {
    label: "Read",
    icon: "solar:check-read-bold",
    className: "text-primary",
  },
  FAILED: {
    label: "Failed to send",
    icon: "solar:danger-triangle-linear",
    className: "text-destructive",
  },
  // Not a delivery tick — a shadow reply never reached the Graph API. Callers
  // should be gating any tick on `isInternal` anyway (see message-bubble),
  // but this entry exists so the map stays total and correct on its own.
  SHADOW: {
    label: "Not sent — shadow mode",
    icon: "solar:eye-closed-linear",
    className: "text-muted-foreground",
  },
};

/** Neutral fallback for a status this build doesn't know about yet. */
const UNKNOWN_MESSAGE_STATUS_META = {
  label: "Unknown status",
  icon: "solar:question-circle-linear",
  className: "text-muted-foreground",
} as const;

/**
 * Total-safe lookup: an enum widening on the backend degrades to the neutral
 * entry instead of `MESSAGE_STATUS_META[status]` returning `undefined` and
 * throwing when a caller reads `.label`/`.icon`.
 */
export function getMessageStatusMeta(status: WhatsAppMessageStatus) {
  return MESSAGE_STATUS_META[status] ?? UNKNOWN_MESSAGE_STATUS_META;
}

/** Meta's free-form reply window. Staff can only send while it is open. */
export const REPLY_WINDOW_HOURS = 24;
