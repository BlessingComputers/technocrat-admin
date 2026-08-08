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
import type { AiEscalationReason, AiState } from "./chat.contract";

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
   * answering and no one has claimed it; `ESCALATED` is a one-way door — it
   * will not reply again until RESOLVED; `OFF` means the AI never engaged.
   * "Needs a human" is `ESCALATED | OFF`; "AI handling" is `HANDLING`. This
   * is orthogonal to `assignedStaffId` — claiming a `HANDLING` conversation
   * does not itself change this field.
   */
  aiState: AiState;
  /** Why the AI escalated. `null` unless `aiState` is `ESCALATED`. */
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
