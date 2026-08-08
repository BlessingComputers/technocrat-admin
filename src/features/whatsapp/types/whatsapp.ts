/**
 * WhatsApp inbox contracts.
 *
 * Hand-authored against the backend's `modules/whatsapp` (routes, controller,
 * `whatsapp.type.ts`, and the Prisma models) rather than generated — the
 * OpenAPI spec describes these endpoints but types their bodies loosely, and
 * the socket events aren't in the spec at all.
 *
 * This module is deliberately parallel to live chat, never shared with it: the
 * backend keeps its own Redis namespace (`wa:`), its own presence table, and
 * its own event names so the two never collide. Mirror that separation here.
 */

// ── Enums (mirror the Prisma enums) ───────────────────────────────────

export const WHATSAPP_CONVERSATION_STATUSES = [
  "WAITING",
  "ACTIVE",
  "RESOLVED",
  "ABANDONED",
] as const;
export type WhatsAppConversationStatus =
  (typeof WHATSAPP_CONVERSATION_STATUSES)[number];

export type WhatsAppSenderType = "CUSTOMER" | "STAFF" | "SYSTEM";

/**
 * AI first-responder state — the same field/values as the chat feature's
 * `AiState` (see `chat/types/chat.contract.ts`), duplicated rather than
 * imported: features may not import from one another (see
 * `api/whatsapp-socket.ts`). `HANDLING` and `ESCALATED` both count as "the AI
 * has touched this"; `ESCALATED` is a one-way door until RESOLVED (ticket A5).
 */
export type WhatsAppAiState = "HANDLING" | "ESCALATED" | "OFF";

/**
 * Delivery lifecycle of one message. `PENDING` is the local state between
 * queueing and the Graph API accepting it; `SENT`/`DELIVERED`/`READ`/`FAILED`
 * arrive as Meta status webhooks over `whatsapp:message:status`. `SHADOW`
 * never touches the Graph API at all — persisted for staff review only, per
 * `AI_SHADOW_MODE`. Never render a delivery tick for it.
 */
export type WhatsAppMessageStatus =
  | "PENDING"
  | "SENT"
  | "DELIVERED"
  | "READ"
  | "FAILED"
  | "SHADOW";

// ── REST payloads ─────────────────────────────────────────────────────

/** Row shape from `GET /whatsapp/conversations` and `.../queue`. */
export interface WhatsAppConversation {
  /** DB UUID — what every other endpoint's `:id` expects. */
  id: string;
  /** Human reference, e.g. "WA-XXXXXXXX". Display only. */
  conversationId: string;
  /** Customer's WhatsApp number, E.164 without the leading '+'. */
  waId: string;
  /** WhatsApp push name, when the customer has one set. */
  profileName: string | null;
  status: WhatsAppConversationStatus;
  /** Absent on queue rows — the queue only lists unassigned conversations. */
  assignedStaffId?: string | null;
  lastMessageAt: string | null;
  messageCount: number;
  /** Absent on queue rows (the backend omits it from that projection). */
  unreadByStaff?: number;
  createdAt: string;
  /**
   * AI first-responder state (ticket A5). Optional/nullable because — like
   * the chat feature's REST shapes — this isn't schema-guaranteed; a missing
   * value is treated as `OFF` at the call site, matching `chat.service.ts`.
   */
  aiState?: WhatsAppAiState | null;
}

/** Conversation detail — adds the reply window and the assigned-staff card. */
export interface WhatsAppConversationDetail extends WhatsAppConversation {
  customerId: string | null;
  /**
   * When Meta's 24h free-form reply window closes. Past (or null) means staff
   * cannot send until the customer messages again — the backend rejects a send
   * with 422 `WHATSAPP_WINDOW_CLOSED`.
   */
  windowExpiresAt: string | null;
  updatedAt: string;
  staff: {
    firstName: string;
    lastName: string;
    staffId: string;
    avatarUrl: string | null;
  } | null;
}

export interface WhatsAppMessage {
  id: string;
  messageId: string;
  conversationId: string;
  /** Meta's `wamid`. Null until the Graph API accepts an outbound message. */
  waMessageId: string | null;
  senderType: WhatsAppSenderType;
  senderId: string | null;
  senderName: string;
  body: string;
  mediaUrl: string | null;
  status: WhatsAppMessageStatus;
  /**
   * Staff-only — never delivered to the customer. Covers both a shadow-mode
   * AI reply and a genuine internal note. This, not `status === 'SHADOW'`, is
   * the marker to gate any delivery indicator on.
   */
  isInternal?: boolean;
  createdAt: string;
  updatedAt: string;
}

/** `GET /whatsapp/conversations/:id` payload. */
export interface WhatsAppConversationThread {
  conversation: WhatsAppConversationDetail;
  messages: WhatsAppMessage[];
}

export interface WhatsAppListParams {
  status?: WhatsAppConversationStatus;
  /** `true` restricts the list to the caller's own conversations. */
  mine?: boolean;
  // Index signature keeps this assignable to the client's query-param type.
  [key: string]: string | number | boolean | undefined;
}

/** `GET /whatsapp/presence/me`. Absent keys mean "never toggled on". */
export interface WhatsAppPresence {
  staffId: string;
  socketId?: string | null;
  isOnline: boolean;
  activeChats: number;
  lastHeartbeat?: number;
}

// ── Socket events ─────────────────────────────────────────────────────

/**
 * Client → server. Only `JOIN_CONVERSATION` and `HEARTBEAT` are actually
 * handled by the backend's `whatsapp.socket.ts`; assign-self and resolve appear
 * in its event enum but are implemented over REST only, so we never emit them.
 */
export const WA_CLIENT_EVENTS = {
  JOIN_CONVERSATION: "whatsapp:join_conversation",
  HEARTBEAT: "whatsapp:presence:heartbeat",
} as const;

/** Server → client. */
export const WA_SERVER_EVENTS = {
  CONVERSATION_NEW: "whatsapp:conversation:new",
  CONVERSATION_ASSIGNED: "whatsapp:conversation:assigned",
  CONVERSATION_RESOLVED: "whatsapp:conversation:resolved",
  MESSAGE_NEW: "whatsapp:message:new",
  MESSAGE_STATUS: "whatsapp:message:status",
  QUEUE_POSITION: "whatsapp:queue:position",
  PRESENCE_ONLINE: "whatsapp:presence:online",
  PRESENCE_OFFLINE: "whatsapp:presence:offline",
  ERROR: "whatsapp:error",
} as const;

/** A brand-new conversation landed in the queue (broadcast to the staff room). */
export interface WaConversationNewEvent {
  conversationId: string;
  waId: string;
  profileName?: string | null;
  preview: string;
}

export interface WaConversationAssignedEvent {
  conversationId: string;
  assignedStaffId: string;
}

export interface WaConversationResolvedEvent {
  conversationId: string;
}

/**
 * A message was persisted — inbound from the customer or outbound from staff.
 * The two directions carry different keys (the worker publishes a different
 * payload for each), so both sets are optional and the direction is inferred:
 * a present `senderId` means staff sent it.
 */
export interface WaMessageNewEvent {
  conversationId: string;
  body: string;
  createdAt: string;
  /** Inbound only. */
  waId?: string;
  profileName?: string | null;
  assignedStaffId?: string | null;
  /** Outbound only. */
  senderId?: string;
  senderName?: string;
  senderType?: WhatsAppSenderType;
  status?: WhatsAppMessageStatus;
  isInternal?: boolean;
}

/**
 * Delivery receipt. Broadcast to the whole staff room without a conversation
 * id, so the client matches it against open threads by `waMessageId`.
 */
export interface WaMessageStatusEvent {
  waMessageId: string;
  status: WhatsAppMessageStatus;
}
