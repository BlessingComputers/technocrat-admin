import { api } from "@/lib/api/client";
import { API_ENDPOINTS } from "@/lib/api/endpoints";
import type {
  WhatsAppAiState,
  WhatsAppConversation,
  WhatsAppConversationThread,
  WhatsAppListParams,
  WhatsAppPresence,
} from "../types/whatsapp";

/**
 * WhatsApp inbox data access. Every endpoint requires staff auth; reassign
 * additionally requires SUPER_ADMIN.
 *
 * Path params take the conversation's DB UUID (`id`) — never the human
 * `conversationId` ("WA-XXXXXXXX"). The detail endpoint happens to accept
 * either, but we standardise on `id` the way the chat feature does.
 */

const { whatsapp } = API_ENDPOINTS;

/** List endpoints must degrade to an empty list, never crash the workspace. */
function asArray<T>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export const whatsappService = {
  /** All conversations visible to this staff member, newest activity first. */
  listConversations: async (
    params: WhatsAppListParams = {},
  ): Promise<WhatsAppConversation[]> =>
    asArray<WhatsAppConversation>(
      await api.get<unknown>(whatsapp.conversations, {
        // `mine` is a string flag server-side; only send it when narrowing.
        params: {
          status: params.status,
          ...(params.mine ? { mine: "true" } : {}),
        },
      }),
    ),

  /** Unassigned WAITING conversations — anyone may claim one. */
  getQueue: async (): Promise<WhatsAppConversation[]> =>
    asArray<WhatsAppConversation>(await api.get<unknown>(whatsapp.queue)),

  /** Detail + up to the last 200 messages, oldest first. */
  getConversation: async (id: string): Promise<WhatsAppConversationThread> => {
    const payload = await api.get<WhatsAppConversationThread>(
      whatsapp.conversation(id),
    );
    // The message list iterates `messages` — keep it an array even if the
    // endpoint ever answers without one.
    return { ...payload, messages: asArray(payload?.messages) };
  },

  /**
   * Queue an outbound reply. Returns 202 `{ queued: true }` — the message is
   * persisted and delivered by the worker, then arrives back over
   * `whatsapp:message:new`, so nothing is echoed synchronously here.
   *
   * Rejected with 422 `WHATSAPP_WINDOW_CLOSED` when Meta's 24h free-form reply
   * window has lapsed; the customer must message first.
   */
  sendMessage: async (id: string, body: string): Promise<{ queued: boolean }> =>
    api.post(whatsapp.messages(id), { body }),

  /** Claim an unassigned conversation. 409 if someone else got there first. */
  assignSelf: async (
    id: string,
  ): Promise<{ conversationId: string; assignedStaffId: string }> =>
    api.post(whatsapp.assignSelf(id)),

  /** SUPER_ADMIN only — move an owned conversation to another agent. */
  reassign: async (
    id: string,
    staffId: string,
  ): Promise<{ conversationId: string; assignedStaffId: string }> =>
    api.patch(whatsapp.assign(id), { staffId }),

  resolveConversation: async (
    id: string,
  ): Promise<{ conversationId: string; status: "RESOLVED" }> =>
    api.post(whatsapp.resolve(id)),

  /**
   * Stop or resume the AI first responder on one conversation (ticket A5).
   * Same REST `PATCH` shape as the chat feature's `setAiState`; does NOT
   * claim. Any staff member may call it.
   */
  setAiState: async (id: string, aiState: WhatsAppAiState): Promise<void> => {
    await api.patch(whatsapp.conversationAi(id), { aiState });
  },

  // ── Presence (independent of live-chat presence) ──────────────────
  //
  // Going online also pulls this staff member's existing /ws socket(s) into the
  // WhatsApp staff room server-side, which is what makes queue broadcasts
  // arrive. Nothing is auto-assigned to whoever just came online.

  goOnline: async (): Promise<{ online: boolean }> =>
    api.post(whatsapp.presenceOnline),

  goOffline: async (): Promise<{ online: boolean }> =>
    api.post(whatsapp.presenceOffline),

  heartbeat: async (): Promise<{ ok: boolean }> =>
    api.post(whatsapp.presenceHeartbeat),

  getPresence: async (): Promise<WhatsAppPresence> =>
    api.get(whatsapp.presenceMe),

  /**
   * Active staff, for the SUPER_ADMIN reassign picker. WhatsApp exposes no
   * presence roster to clients (unlike live chat, whose pick list is "who's
   * online"), so this reads the staff directory instead.
   *
   * The endpoint is itself SUPER_ADMIN-only — the same audience allowed to
   * reassign — and doesn't use the standard envelope the client unwraps, so
   * take it raw and normalise.
   */
  listStaff: async (): Promise<WhatsAppStaffOption[]> => {
    const env = await api.get<StaffDirectoryEnvelope>(
      API_ENDPOINTS.staffAuth.list,
      { params: { limit: 100, isActive: "true" }, raw: true },
    );
    const rows = Array.isArray(env?.data) ? env.data : [];
    return rows.map((s) => ({
      id: s.id,
      name: `${s.firstName} ${s.lastName}`.trim() || s.staffId,
    }));
  },
};

/** Minimal staff option the reassign picker consumes (DB id + display name). */
export interface WhatsAppStaffOption {
  id: string;
  name: string;
}

/** Minimal slice of the staff-directory envelope. */
interface StaffDirectoryEnvelope {
  data?: Array<{
    id: string;
    staffId: string;
    firstName: string;
    lastName: string;
  }>;
}
