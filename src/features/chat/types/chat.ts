/**
 * Types for the chat feature.
 *
 * The backend chat contract is Socket.IO-first (see the event reference at
 * `/api/v1/chat/socket/events` in the OpenAPI spec). The REST endpoints that
 * seed initial history declare no response schemas in the spec (`content?:
 * never`), so — unlike the rest of the app (ADR-0006) — these response shapes
 * are hand-authored here from the documented socket payloads. When the backend
 * adds response schemas, regenerate `src/types/api.d.ts` and re-alias from it.
 */

// ── Enums (mirror the OpenAPI query enums) ──────────────────────────
import type {
  AiEscalationReason,
  AiState,
  ProductCard,
} from "./chat.contract";

/**
 * One inline product card attached to an AI reply. Re-exported from the pulled
 * wire contract rather than re-typed, so a field change lands as a type error
 * here instead of silently rendering `undefined`.
 */
export type ChatProductCard = ProductCard;

export type ConversationStatus =
  | "WAITING"
  | "ACTIVE"
  | "RESOLVED"
  | "ABANDONED";

export type ChatChannel = "LIVE_CHAT" | "STAFF_ROOM";

export type SenderType = "CUSTOMER" | "STAFF" | "SYSTEM";

/**
 * CRM lead qualification stored against a conversation's notes. Values are the
 * backend's `chat:notes:update` enum (integration guide) — anything else fails
 * validation server-side.
 */
export type LeadStatus =
  | "NEW"
  | "CONTACTED"
  | "QUALIFIED"
  | "CONVERTED"
  | "LOST";

// ── Messages ────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  conversationId: string;
  senderType: SenderType;
  senderId?: string | null;
  senderName: string;
  body: string;
  isInternal?: boolean;
  createdAt: string;
  /** Present on optimistic messages until the `chat:message:saved` ack lands. */
  idempotencyKey?: string;
  tempId?: string;
  /** Read receipt — true once the recipient has seen it. */
  read?: boolean;
  /** Quoted message this one replies to (staff-room threads). */
  replyTo?: {
    id: string;
    senderName: string;
    body: string;
  } | null;
  /**
   * Catalogue products the AI grounded this reply in (contract v4). Only ever
   * non-empty on an AI reply in a customer conversation — `staffroom:history`
   * never carries the field, and neither does any CUSTOMER/STAFF message.
   * Server-sourced rows are normalized to `[]` rather than left undefined, so
   * the renderer has one case; optional because optimistic rows are built
   * locally and never carry one.
   */
  products?: ChatProductCard[];
}

// ── Conversations ───────────────────────────────────────────────────
export interface ConversationParticipant {
  id: string;
  name: string;
  avatarUrl?: string | null;
}

/** Row shape for the left-hand conversation list. */
export interface ConversationSummary {
  id: string;
  publicId?: string;
  channel: ChatChannel;
  status: ConversationStatus;
  /** Display name — customer/guest name, or the staff-room title. */
  name: string;
  subject?: string | null;
  avatarUrl?: string | null;
  /** Customer contact, surfaced to prefill CRM notes. */
  customerEmail?: string | null;
  customerPhone?: string | null;
  assignedStaffId?: string | null;
  /** Assigned admin's display name/avatar (from the backend when available). */
  assignedStaffName?: string | null;
  assignedStaffAvatar?: string | null;
  lastMessagePreview?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  memberCount?: number;
  /**
   * AI first-responder state. `HANDLING` is silent-normal, the AI is
   * answering — including on a conversation an agent has already claimed;
   * `ESCALATED` is a one-way door — it will not reply again until RESOLVED;
   * `OFF` means the AI never engaged, or a staff member explicitly stopped
   * it. "Needs a human" is `ESCALATED | OFF`; "AI handling" is `HANDLING`.
   *
   * Orthogonal to `assignedStaffId` in both directions: claiming a `HANDLING`
   * conversation does not change this field, and no longer quiets the AI
   * either. Only `PATCH /conversations/:id/ai` and the reply cap do that.
   */
  aiState: AiState;
  /**
   * Why the AI escalated, or why it skipped one message. Present on an
   * `ESCALATED` conversation (`CUSTOMER_REQUESTED`, `BLOCKED_TOPIC`,
   * `FRUSTRATION`, `REPLY_CAP`) but also on a still-`HANDLING` one
   * (`CANNOT_ANSWER`, `ERROR`), where it records a single skipped message and
   * clears on the AI's next successful reply. A reason is therefore never
   * evidence that the AI stopped — read `aiState` for that.
   */
  aiEscalationReason?: AiEscalationReason | null;
}

/** Full conversation detail returned by GET /chat/conversations/{id}. */
export interface ConversationDetail extends ConversationSummary {
  customer?: {
    id?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
  } | null;
  assignedStaff?: ConversationParticipant | null;
  participants?: ConversationParticipant[];
  messages: ChatMessage[];
  notes?: ConversationNotes | null;
  /** Cursor for loading older messages, if more exist. */
  nextCursor?: string | null;
}

// ── Internal CRM notes ──────────────────────────────────────────────
export interface ConversationNotes {
  conversationId: string;
  leadName?: string | null;
  leadEmail?: string | null;
  leadPhone?: string | null;
  leadAddress?: string | null;
  leadStatus?: LeadStatus | null;
  productsDiscussed?: string | null;
  pricesDiscussed?: string | null;
  budgetRange?: string | null;
  customerIntent?: string | null;
  handoverNotes?: string | null;
  followUpDate?: string | null;
  followUpNote?: string | null;
}

// ── Presence ────────────────────────────────────────────────────────
export interface StaffPresence {
  staffId: string;
  name: string;
  avatarUrl?: string | null;
}

// ── Staff room ──────────────────────────────────────────────────────
export interface StaffRoomHistory {
  messages: ChatMessage[];
  nextCursor?: string | null;
  members?: ConversationParticipant[];
}

// ── Conversation list filter ────────────────────────────────────────
export type ConversationTab = "all" | "mine" | "queue";
