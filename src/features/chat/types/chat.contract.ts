// ─────────────────────────────────────────────────────────────
// CHAT WIRE CONTRACT — single source of truth
//
// Owned by the backend repo:
//   TechnocratBlessingComputersBackend/BlessingComputerBackend
//   → backend/src/modules/chats/chat.contract.ts
//
// The customer app and admin app each hold a byte-identical copy, fetched
// FROM this repo by their own `npm run pull:chat-contract` scripts — the
// three repos share nothing but this file's content. NEVER hand-edit a
// frontend copy — change it here, then re-pull; each app's
// `check:chat-contract` fails CI if a copy drifts from its checksum.
//
// This file must stay dependency-free (no imports) so it can be copied
// verbatim into any repo. Every payload documents what chat.socket.ts
// actually emits/accepts — see CHAT_INTEGRATION.md for prose.
// ─────────────────────────────────────────────────────────────

/** Bump on every wire-visible change, then re-run the sync script. */
export const CHAT_CONTRACT_VERSION = 3;

// ── Event names ───────────────────────────────────────────────

// Client → Server
export const CLIENT_EVENTS = {
    START_CONVERSATION: 'chat:start',
    SEND_MESSAGE: 'chat:message',
    TYPING_START: 'chat:typing:start',
    TYPING_STOP: 'chat:typing:stop',
    MARK_READ: 'chat:read',
    ASSIGN_SELF: 'chat:assign',
    RESOLVE: 'chat:resolve',
    UPDATE_NOTES: 'chat:notes:update',
    JOIN_CONVERSATION: 'chat:join',
    STAFF_ROOM_MESSAGE: 'staffroom:message',
    STAFF_ROOM_TYPING: 'staffroom:typing',
    HEARTBEAT: 'presence:heartbeat',
} as const;

// Server → Client
export const SERVER_EVENTS = {
    CONVERSATION_CREATED: 'chat:conversation:created',
    CONVERSATION_ASSIGNED: 'chat:conversation:assigned',
    CONVERSATION_RESOLVED: 'chat:conversation:resolved',
    CONVERSATION_UPDATED: 'chat:conversation:updated',
    MESSAGE_RECEIVED: 'chat:message:received',
    MESSAGE_SAVED: 'chat:message:saved',
    TYPING_START: 'chat:typing:start',
    TYPING_STOP: 'chat:typing:stop',
    QUEUE_POSITION: 'chat:queue:position',
    STAFF_ROOM_MESSAGE: 'staffroom:message:received',
    STAFF_ROOM_TYPING: 'staffroom:typing',
    STAFF_ROOM_HISTORY: 'staffroom:history',
    NEW_CONVERSATION: 'chat:dashboard:new',
    STAFF_ONLINE: 'presence:staff:online',
    STAFF_OFFLINE: 'presence:staff:offline',
    PRESENCE_LIST: 'presence:list',
    NOTES_UPDATED: 'chat:notes:updated',
    NOTIFICATION: 'notification:new',
    ERROR: 'chat:error',
    /** AI first responder handed a conversation to a human, or was force-stopped. */
    AI_STATE_CHANGED: 'chat:ai:state',
} as const;

// ── Shared unions ─────────────────────────────────────────────

export type SenderType = 'CUSTOMER' | 'STAFF' | 'SYSTEM';
export type ConversationStatus = 'WAITING' | 'ACTIVE' | 'RESOLVED';
export type Audience = 'customer' | 'staff';
export type LeadStatus = 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'CONVERTED' | 'LOST';

/** AI first-responder state on a conversation. See AiStateChangedEvent. */
export type AiState = 'HANDLING' | 'ESCALATED' | 'OFF';

/** Why the AI handed a conversation to a human. */
export type AiEscalationReason =
    | 'CUSTOMER_REQUESTED'
    | 'BLOCKED_TOPIC'
    | 'CANNOT_ANSWER'
    | 'FRUSTRATION'
    | 'REPLY_CAP'
    | 'ERROR';

// ── Client → Server payloads ──────────────────────────────────

/** `chat:start` — customers only. */
export interface StartConversationInput {
    subject?: string;
    initialMessage: string;
    pageUrl?: string;
}

/** `chat:message`. `isInternal` is honoured for staff only. */
export interface SendMessageInput {
    conversationId: string;
    body: string;
    isInternal?: boolean;
    /** Client-generated; echoed in MESSAGE_RECEIVED and the MESSAGE_SAVED ack. */
    idempotencyKey?: string;
}

/**
 * `chat:typing:start` / `chat:typing:stop`. Staff typing an internal note
 * pass `internal: true` so the indicator is delivered to staff only.
 */
export interface TypingInput {
    conversationId: string;
    internal?: boolean;
}

/** `chat:read`, `chat:join`, `chat:assign`, `chat:resolve`. */
export interface ConversationRefInput {
    conversationId: string;
}

/** `chat:notes:update` — staff only. All twelve documented CRM fields. */
export interface NotesUpdateInput {
    conversationId: string;
    leadName?: string;
    leadEmail?: string;
    leadPhone?: string;
    leadAddress?: string;
    leadStatus?: LeadStatus;
    productsDiscussed?: string;
    pricesDiscussed?: string;
    budgetRange?: string;
    customerIntent?: string;
    handoverNotes?: string;
    /** ISO date string. */
    followUpDate?: string;
    followUpNote?: string;
}

/** `staffroom:message` — staff only. */
export interface StaffRoomMessageInput {
    body: string;
    idempotencyKey?: string;
}

/** `staffroom:typing` (client → server direction). */
export interface StaffRoomTypingInput {
    isTyping: boolean;
}

// ── Server → Client payloads ──────────────────────────────────

/** `chat:conversation:created` — reply to `chat:start`. */
export interface ConversationCreatedEvent {
    /** Internal UUID — use this in all socket events. */
    conversationId: string;
    /** Human-readable CONV-XXXXX — display only. */
    publicId: string;
    /** The persisted status; an existing conversation may still be WAITING. */
    status: ConversationStatus;
    isExisting: boolean;
}

/** `chat:conversation:updated` — sent on connect when a conversation is already open. */
export interface ConversationUpdatedEvent {
    conversationId: string;
    publicId: string;
    status: ConversationStatus;
}

/** `chat:conversation:assigned`. */
export interface ConversationAssignedEvent {
    conversationId: string;
    assignedStaffId: string;
}

/** `chat:conversation:resolved`. `resolvedBy` is omitted on the customer's personal-room copy. */
export interface ConversationResolvedEvent {
    conversationId: string;
    resolvedBy?: string;
}

/** `chat:queue:position` — while waiting for an agent. */
export interface QueuePositionEvent {
    conversationId: string;
    position: number;
}

/**
 * `chat:message:received` and `staffroom:message:received`.
 * Delivered to all room members EXCEPT the sender (the sender gets
 * MESSAGE_SAVED). Internal messages travel the staff-only room.
 */
export interface MessageReceivedEvent {
    /** Server-generated message id (pre-persistence). */
    id: string;
    conversationId: string;
    senderId: string;
    senderType: SenderType;
    senderName: string;
    senderAvatar: string | null;
    body: string;
    isInternal: boolean;
    /** ISO date string. */
    createdAt: string;
    /** Key all echo/reconnect dedup on this. */
    idempotencyKey: string;
}

/**
 * `chat:message:saved` — the sender's ack.
 * NOTE: there is no `id` field; reconcile the optimistic message via
 * `tempId` / `idempotencyKey`.
 */
export interface MessageSavedAck {
    idempotencyKey: string;
    tempId: string;
    /** ISO date string. */
    createdAt: string;
}

/**
 * `chat:typing:start`. `audience` is the typer's audience.
 * AI-originated typing has no `userId`/`audience` — it carries `senderName`
 * instead, so a synthetic "AI is typing" indicator fits this same event
 * rather than needing a parallel one.
 */
export interface TypingStartEvent {
    conversationId: string;
    userId?: string;
    audience?: Audience;
    senderName?: string;
}

/** `chat:typing:stop` — no audience field. */
export interface TypingStopEvent {
    conversationId: string;
    userId?: string;
    senderName?: string;
}

/** `chat:dashboard:new` — staff dashboards, on a fresh customer conversation. */
export interface NewConversationEvent {
    conversationId: string;
    publicId: string;
    customerId: string;
    subject: string | null;
    preview: string;
    /** ISO date string. */
    createdAt: string;
    /** Lets the admin queue place the row on the right side of the AI/human split without a refetch. */
    aiState: AiState;
}

/**
 * `chat:notes:updated` — confirmation only; note contents are never
 * broadcast. Delivered via the staff-only room (plus the sender's copy).
 */
export interface NotesUpdatedEvent {
    conversationId: string;
    updatedBy: string;
    saved: true;
}

/** One message row inside `staffroom:history` (and REST history). */
export interface HistoryMessage {
    id: string;
    messageId: string;
    senderId: string;
    senderType: SenderType;
    senderName: string;
    senderAvatar: string | null;
    body: string;
    isInternal: boolean;
    /** ISO date string after socket serialization. */
    createdAt: string;
    /** Stable key shared with the live socket copy — reconcile on this, not createdAt. */
    idempotencyKey: string;
}

/** `staffroom:history` — sent to a staff socket on connect. */
export interface StaffRoomHistoryEvent {
    messages: HistoryMessage[];
    nextCursor: string | null;
}

/** `staffroom:typing` (server → client direction). */
export interface StaffRoomTypingEvent {
    userId: string;
    isTyping: boolean;
}

/** `presence:staff:online`. */
export interface StaffOnlineEvent {
    staffId: string;
    socketId: string;
    name: string;
    avatarUrl: string | null;
}

/** `presence:staff:offline`. */
export interface StaffOfflineEvent {
    staffId: string;
}

/**
 * One entry of `presence:list`.
 * Presence hashes written before contract v1 lack `staffId`; entries refresh
 * within the 5-minute presence TTL after deploy.
 */
export interface PresenceEntry {
    staffId: string;
    socketId: string;
    isOnline: boolean;
    activeChats: number;
    lastHeartbeat: number;
    name: string;
    avatarUrl: string | null;
}

/** `presence:list` — snapshot sent to a staff socket on connect. */
export type PresenceListEvent = PresenceEntry[];

/** `notification:new` — personal-room ping for the assigned staff member. */
export interface NotificationEvent {
    type: string;
    conversationId: string;
    preview: string;
    /** ISO date string. */
    createdAt: string;
}

/** `chat:error` — sent to the socket whose event failed. */
export interface ChatErrorEvent {
    message: string;
}

/**
 * `chat:ai:state` — the AI first responder handed a conversation to a
 * human (or was force-stopped). Delivered to `staff:room` and the
 * conversation's staff-only room so an admin queue can move the row from
 * "AI handling" to "Needs human" in real time.
 */
export interface AiStateChangedEvent {
    conversationId: string;
    aiState: AiState;
    reason: AiEscalationReason | null;
}
