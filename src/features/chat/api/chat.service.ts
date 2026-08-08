import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  ChatMessage,
  ConversationDetail,
  ConversationNotes,
  ConversationSummary,
  StaffRoomHistory,
} from "../types/chat";
import type { AiEscalationReason, AiState } from "../types/chat.contract";

/**
 * Chat data access. These REST calls seed initial history; live updates arrive
 * over Socket.IO (see `chat-socket.ts`). The backend wraps responses in a
 * `{ status, message, data }` envelope that the shared client does NOT
 * auto-unwrap (it only unwraps a boolean `success` field), so every method peels
 * `.data` via `unwrapEnvelope` before normalizing — matching the rest of the
 * admin app (`customer.service.ts`).
 *
 * The chat REST responses have no schema in the OpenAPI spec (ADR-0006 note in
 * types/chat.ts), so the live shapes aren't guaranteed. Each response is
 * normalized HERE, so the raw backend shapes never leak past this module and
 * hooks/components speak only the app-facing types.
 */

// ── Raw list row ────────────────────────────────────────────────────
// The backend conversation row (real shape, from the live payload) — the display
// name lives in a nested `customers` object and several fields are named
// differently from our app-facing `ConversationSummary` (`conversationId` not
// `publicId`, `unreadByStaff` not `unreadCount`). Fields are optional/nullable
// because the contract isn't schema-guaranteed. We also accept the app-shaped
// names so this stays a no-op if the backend ever aligns.
interface RawConversation {
  id: string;
  conversationId?: string;
  publicId?: string;
  channel?: ConversationSummary["channel"];
  status?: ConversationSummary["status"];
  name?: string | null;
  subject?: string | null;
  avatarUrl?: string | null;
  assignedStaffId?: string | null;
  lastMessagePreview?: string | null;
  /** Current live shape: the preview text itself, not an object (2026-08-01). */
  lastMessage?: string | null;
  lastMessageAt?: string | null;
  unreadCount?: number;
  unreadByStaff?: number;
  memberCount?: number;
  // The field exists on every conversation row and detail payload
  // (`ConversationListItem`/`ConversationDetail` in the OpenAPI spec) — see
  // ticket A4. Optional here only because the hand-authored REST shapes
  // aren't schema-guaranteed; `normalizeConversation` defaults a missing
  // value to `OFF` rather than treating it as unknown.
  aiState?: AiState | null;
  aiEscalationReason?: AiEscalationReason | null;
  customers?: {
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
  } | null;
  // Assigned admin identity (backend BE-5). Nested relation on the row; the
  // detail route exposes the same `staff` relation. Optional/nullable because
  // it isn't schema-guaranteed and older backends omit it entirely.
  assignedStaff?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
  staff?: {
    id?: string | null;
    firstName?: string | null;
    lastName?: string | null;
    name?: string | null;
    avatarUrl?: string | null;
  } | null;
}

/** Full name from a nested staff relation, or undefined when unnamed. */
function staffDisplayName(
  staff: RawConversation["assignedStaff"],
): string | undefined {
  if (!staff) return undefined;
  const full =
    staff.name ??
    `${staff.firstName ?? ""} ${staff.lastName ?? ""}`.trim();
  return full || undefined;
}

/** Coerce the list payload from the common envelope/collection shapes. */
function toRawConversationArray(data: unknown): RawConversation[] {
  if (Array.isArray(data)) return data as RawConversation[];
  if (data && typeof data === "object") {
    const record = data as Record<string, unknown>;
    for (const key of ["conversations", "items", "data", "results"]) {
      if (Array.isArray(record[key])) return record[key] as RawConversation[];
    }
  }
  return [];
}

function customerDisplayName(
  customers: RawConversation["customers"],
): string | undefined {
  if (!customers) return undefined;
  const full = `${customers.firstName ?? ""} ${customers.lastName ?? ""}`.trim();
  return full || undefined;
}

/** Map a raw backend conversation row to the app's `ConversationSummary`. */
function normalizeConversation(raw: RawConversation): ConversationSummary {
  return {
    id: raw.id,
    publicId: raw.publicId ?? raw.conversationId,
    channel: raw.channel ?? "LIVE_CHAT",
    status: raw.status ?? "WAITING",
    name: raw.name ?? customerDisplayName(raw.customers) ?? "Customer",
    subject: raw.subject ?? null,
    avatarUrl: raw.avatarUrl ?? raw.customers?.avatarUrl ?? null,
    customerEmail: raw.customers?.email ?? null,
    customerPhone: raw.customers?.phone ?? null,
    assignedStaffId: raw.assignedStaffId ?? raw.assignedStaff?.id ?? null,
    assignedStaffName:
      staffDisplayName(raw.assignedStaff) ?? staffDisplayName(raw.staff) ?? null,
    assignedStaffAvatar:
      raw.assignedStaff?.avatarUrl ?? raw.staff?.avatarUrl ?? null,
    // `lastMessage` is the current live field (confirmed schema, CONTRACT.md
    // 2026-08-03) — a flat, pre-truncated string. `lastMessagePreview` is
    // kept as a fallback in case an older backend build is ever hit.
    lastMessagePreview: raw.lastMessage ?? raw.lastMessagePreview ?? null,
    lastMessageAt: raw.lastMessageAt ?? null,
    unreadCount: raw.unreadCount ?? raw.unreadByStaff ?? 0,
    memberCount: raw.memberCount,
    aiState: raw.aiState ?? "OFF",
    aiEscalationReason: raw.aiEscalationReason ?? null,
  };
}

// ── Raw detail payload ──────────────────────────────────────────────
// The GET-detail payload (`GET /chat/conversations/{id}`) mirrors the customer
// `my-conversation` shape documented in chat-system-frontend-integration-guide.md:
// `{ conversation: { …, customers }, history: { messages }, notes }`. The message
// history is a SIBLING under `history.messages`, and the customer contact is
// nested in `conversation.customers` — so a top-level `.messages`/`.customers`
// read always misses, and staff would see no history on open.
interface RawDetailMessage {
  id?: string | null;
  conversationId?: string | null;
  senderType?: ChatMessage["senderType"] | null;
  senderId?: string | null;
  senderName?: string | null;
  body?: string | null;
  isInternal?: boolean | null;
  createdAt?: string | null;
}

interface RawConversationDetail {
  conversation?: RawConversation | null;
  history?: {
    messages?: RawDetailMessage[] | null;
    nextCursor?: string | null;
  } | null;
  notes?: ConversationNotes | null;
  // Flat fallbacks, in case the backend ever un-nests.
  messages?: RawDetailMessage[] | null;
  customers?: RawConversation["customers"];
  customer?: RawConversation["customers"];
}

function normalizeDetailMessage(
  raw: RawDetailMessage,
  conversationId: string,
): ChatMessage {
  return {
    id: raw.id != null ? String(raw.id) : "",
    conversationId: raw.conversationId ?? conversationId,
    senderType: raw.senderType ?? "STAFF",
    senderId: raw.senderId ?? null,
    senderName: raw.senderName ?? "",
    body: raw.body ?? "",
    isInternal: raw.isInternal ?? undefined,
    createdAt: raw.createdAt ?? new Date().toISOString(),
  };
}

/** Map a raw GET-detail payload to the app's `ConversationDetail`. */
function normalizeConversationDetail(
  data: unknown,
  conversationId: string,
): ConversationDetail {
  const payload = (
    data && typeof data === "object" ? data : {}
  ) as RawConversationDetail;
  const conv = payload.conversation ?? { id: conversationId };
  const customers =
    conv.customers ?? payload.customers ?? payload.customer ?? null;

  return {
    ...normalizeConversation({ ...conv, id: conv.id ?? conversationId }),
    customer: customers
      ? {
          name: customerDisplayName(customers) ?? "Customer",
          email: customers.email ?? null,
          phone: customers.phone ?? null,
        }
      : null,
    notes: payload.notes ?? null,
    messages: (payload.history?.messages ?? payload.messages ?? []).map((m) =>
      normalizeDetailMessage(m, conversationId),
    ),
    nextCursor: payload.history?.nextCursor ?? null,
  };
}

/**
 * Peel the backend response envelope so normalizers see the real payload.
 *
 * The backend wraps REST responses as `{ status: 'success', message, data }`.
 * The shared client (`lib/api/client.ts`) only auto-unwraps envelopes whose
 * `success` field is a boolean, so this `status`-based envelope reaches services
 * INTACT — every other admin service unwraps `.data` itself (see
 * `customer.service.ts`: `"data" in root ? root.data : root`). The chat detail /
 * notes / staff-room reads previously skipped this step, so they read one level
 * too high (`payload.history` was actually at `payload.data.history`) and came
 * back empty. Idempotent: the inner payload has no top-level `data` key, so a
 * genuinely-unwrapped body passes through unchanged.
 */
function unwrapEnvelope(body: unknown): unknown {
  return body && typeof body === "object" && "data" in body
    ? (body as { data: unknown }).data
    : body;
}

// ── Service ─────────────────────────────────────────────────────────
export const chatService = {
  /** Active conversations; `mine` restricts to the caller's assignments. */
  listConversations: async (mine?: boolean): Promise<ConversationSummary[]> => {
    const data = await api.get<unknown>(API_ENDPOINTS.chat.conversations, {
      params: mine ? { mine: "true" } : undefined,
    });
    return toRawConversationArray(unwrapEnvelope(data)).map(normalizeConversation);
  },

  /** Full detail incl. customer, participants, message history and notes. */
  getConversation: async (
    id: string,
    cursor?: string,
  ): Promise<ConversationDetail> => {
    const data = await api.get<unknown>(API_ENDPOINTS.chat.conversation(id), {
      params: cursor ? { cursor } : undefined,
    });
    return normalizeConversationDetail(unwrapEnvelope(data), id);
  },

  /**
   * Super-admin reassign — move a conversation to another agent. The backend
   * models this as a REST PATCH (SUPER_ADMIN only), NOT a socket event: it
   * validates the target staffer, rebalances presence counters, and publishes
   * `chat:conversation:assigned` so every joined socket (incl. the new owner)
   * updates live. Agents claim unassigned queue chats over the socket
   * (`chat:assign`); reassigning an owned chat is admin-only and goes here.
   */
  reassignConversation: async (id: string, staffId: string): Promise<void> => {
    await api.patch(API_ENDPOINTS.chat.conversationAssign(id), { staffId });
  },

  /**
   * Stop or resume the AI first responder on one conversation (ticket A5).
   * REST `PATCH`, not a socket emit — same precedent as `reassignConversation`.
   * Deliberately does NOT claim the conversation. 409s (resolved conversation
   * on stop; not-`OFF` on resume) are expected outcomes for the caller to
   * handle, not failures this method should swallow.
   */
  setAiState: async (id: string, aiState: AiState): Promise<void> => {
    await api.patch(API_ENDPOINTS.chat.conversationAi(id), { aiState });
  },

  getNotes: async (id: string): Promise<ConversationNotes | null> =>
    unwrapEnvelope(
      await api.get<unknown>(API_ENDPOINTS.chat.conversationNotes(id)),
    ) as ConversationNotes | null,

  getStaffRoomHistory: async (cursor?: string): Promise<StaffRoomHistory> =>
    unwrapEnvelope(
      await api.get<unknown>(API_ENDPOINTS.chat.staffRoomHistory, {
        params: cursor ? { cursor } : undefined,
      }),
    ) as StaffRoomHistory,
};
