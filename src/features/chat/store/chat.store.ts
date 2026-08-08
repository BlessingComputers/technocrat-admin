import { create } from "zustand";
import type { ChatMessage, ConversationTab, StaffPresence } from "../types/chat";
import type { AiEscalationReason, AiState } from "../types/chat.contract";

/**
 * Live chat state (ADR-0005 zustand exception — ephemeral realtime UI state, not
 * list/filter state). REST history seeds the store; Socket.IO deltas mutate it.
 * Components read the merged view from here so the thread updates in place
 * without refetching.
 *
 * The staff room is keyed by the `STAFF_ROOM_ID` sentinel so it flows through
 * the same message map as customer conversations.
 */

export const STAFF_ROOM_ID = "__staffroom__";

interface ChatState {
  selectedId: string | null;
  activeTab: ConversationTab;
  /** conversationId → merged message list (chronological). */
  messagesByConversation: Record<string, ChatMessage[]>;
  /** conversationId → set of userIds currently typing. */
  typingByConversation: Record<string, string[]>;
  /** staffId → presence. */
  presence: Record<string, StaffPresence>;
  /** conversationId → unread count. */
  unreadByConversation: Record<string, number>;
  /**
   * conversationId → the latest message text for the left-rail row preview.
   * Separate from `messagesByConversation` because the list must show a preview
   * for conversations the staff member has NOT opened (whose message list is
   * empty): `chat:dashboard:new` / `notification:new` carry only a preview
   * string, not a full message. Message mutations keep this in sync too, so an
   * opened thread and its list row never disagree.
   */
  previewByConversation: Record<string, { body: string; at: string | null }>;
  /**
   * conversationId → live `aiState` overlay, driven by `chat:ai:state` and
   * seeded from `chat:dashboard:new`. A flat map like `previewByConversation`
   * — it is only ever read by merging onto a row that already exists in the
   * REST-seeded list, so an entry for an id nothing else knows about never
   * surfaces as a phantom row (see `applyAiStateOverlay`).
   */
  aiStateByConversation: Record<
    string,
    { aiState: AiState; reason: AiEscalationReason | null }
  >;

  select: (id: string | null) => void;
  setTab: (tab: ConversationTab) => void;

  seedMessages: (conversationId: string, messages: ChatMessage[]) => void;
  appendMessage: (conversationId: string, message: ChatMessage) => void;
  receiveMessage: (conversationId: string, message: ChatMessage) => void;
  /**
   * Set the left-rail preview directly from a preview-only event
   * (`chat:dashboard:new`, `notification:new`) that carries no full message.
   */
  setPreview: (conversationId: string, body: string, at?: string | null) => void;
  /**
   * Resolve an optimistic message from its `chat:message:saved` ack. The ack
   * carries NO conversationId (contract), so the owning conversation is found
   * by its pending idempotencyKey — never by the current selection, which
   * corrupts the wrong thread if the user switches before the ack lands (#26).
   */
  ackMessage: (ack: {
    idempotencyKey: string;
    tempId?: string;
    createdAt: string;
  }) => void;

  /** Apply a `chat:ai:state` transition, or seed one from `chat:dashboard:new`. */
  setAiState: (
    conversationId: string,
    aiState: AiState,
    reason?: AiEscalationReason | null,
  ) => void;

  setTyping: (conversationId: string, userId: string, isTyping: boolean) => void;

  setPresence: (list: StaffPresence[]) => void;
  addPresence: (presence: StaffPresence) => void;
  removePresence: (staffId: string) => void;

  setUnread: (conversationId: string, count: number) => void;
  incrementUnread: (conversationId: string) => void;
  clearUnread: (conversationId: string) => void;
}

/** True if `msg` is already present (by id or idempotencyKey). */
function alreadyPresent(list: ChatMessage[], msg: ChatMessage): boolean {
  return list.some(
    (m) =>
      (msg.id && m.id === msg.id) ||
      (msg.idempotencyKey != null && m.idempotencyKey === msg.idempotencyKey),
  );
}

/** A message worth showing as the row preview (has text, not internal/system). */
function isPreviewable(msg: ChatMessage): boolean {
  return Boolean(msg.body) && msg.isInternal !== true && msg.senderType !== "SYSTEM";
}

/** The newest previewable message in a chronological list, if any. */
function lastPreviewable(list: ChatMessage[]): ChatMessage | undefined {
  for (let i = list.length - 1; i >= 0; i--) {
    if (isPreviewable(list[i])) return list[i];
  }
  return undefined;
}

/**
 * Merge a message into the preview map when it's the newest previewable text —
 * shared by the message-mutating actions so the left-rail row always mirrors
 * the thread's last message.
 */
function withPreview(
  previews: ChatState["previewByConversation"],
  conversationId: string,
  msg: ChatMessage | undefined,
): ChatState["previewByConversation"] {
  if (!msg || !isPreviewable(msg)) return previews;
  return {
    ...previews,
    [conversationId]: { body: msg.body, at: msg.createdAt ?? null },
  };
}

export const useChatStore = create<ChatState>((set) => ({
  selectedId: null,
  activeTab: "all",
  messagesByConversation: {},
  typingByConversation: {},
  presence: {},
  unreadByConversation: {},
  previewByConversation: {},
  aiStateByConversation: {},

  select: (id) => set({ selectedId: id }),
  setTab: (tab) => set({ activeTab: tab }),

  seedMessages: (conversationId, messages) =>
    set((s) => {
      // The REST seed is authoritative for persisted history, but a refetch
      // (e.g. reconnect recovery) can land while our own send is still
      // unacked — that optimistic message isn't in the seed yet and must not
      // vanish from the thread. Keep pending entries (no id) the seed doesn't
      // cover; the `chat:message:saved` ack / received echo reconciles them.
      const pending = (s.messagesByConversation[conversationId] ?? []).filter(
        (m) => !m.id && !alreadyPresent(messages, m),
      );
      const merged = [...messages, ...pending];
      return {
        messagesByConversation: {
          ...s.messagesByConversation,
          [conversationId]: merged,
        },
        previewByConversation: withPreview(
          s.previewByConversation,
          conversationId,
          lastPreviewable(merged),
        ),
      };
    }),

  appendMessage: (conversationId, message) =>
    set((s) => {
      const list = s.messagesByConversation[conversationId] ?? [];
      if (alreadyPresent(list, message)) return s;
      return {
        messagesByConversation: {
          ...s.messagesByConversation,
          [conversationId]: [...list, message],
        },
        previewByConversation: withPreview(
          s.previewByConversation,
          conversationId,
          message,
        ),
      };
    }),

  receiveMessage: (conversationId, message) =>
    set((s) => {
      const list = s.messagesByConversation[conversationId] ?? [];
      // Dedup is keyed on id/idempotencyKey ONLY (#26): the payload echoes the
      // sender's idempotencyKey per the contract, and sender+body matching
      // mis-reconciled duplicate-text sends. (The server no longer echoes
      // public messages to their sender at all — spec #92 decision 2.)
      if (alreadyPresent(list, message)) return s;
      return {
        messagesByConversation: {
          ...s.messagesByConversation,
          [conversationId]: [...list, message],
        },
        previewByConversation: withPreview(
          s.previewByConversation,
          conversationId,
          message,
        ),
      };
    }),

  setPreview: (conversationId, body, at) =>
    set((s) => {
      if (!body) return s;
      return {
        previewByConversation: {
          ...s.previewByConversation,
          [conversationId]: { body, at: at ?? null },
        },
      };
    }),

  ackMessage: (ack) =>
    set((s) => {
      for (const [conversationId, list] of Object.entries(
        s.messagesByConversation,
      )) {
        if (!list.some((m) => m.idempotencyKey === ack.idempotencyKey)) {
          continue;
        }
        return {
          messagesByConversation: {
            ...s.messagesByConversation,
            [conversationId]: list.map((m) =>
              m.idempotencyKey === ack.idempotencyKey
                ? { ...m, id: ack.tempId ?? m.id, createdAt: ack.createdAt }
                : m,
            ),
          },
        };
      }
      return s;
    }),

  setAiState: (conversationId, aiState, reason = null) =>
    set((s) => ({
      aiStateByConversation: {
        ...s.aiStateByConversation,
        [conversationId]: { aiState, reason },
      },
    })),

  setTyping: (conversationId, userId, isTyping) =>
    set((s) => {
      const current = s.typingByConversation[conversationId] ?? [];
      const next = isTyping
        ? current.includes(userId)
          ? current
          : [...current, userId]
        : current.filter((u) => u !== userId);
      return {
        typingByConversation: {
          ...s.typingByConversation,
          [conversationId]: next,
        },
      };
    }),

  setPresence: (list) =>
    set(() => ({
      presence: Object.fromEntries(list.map((p) => [p.staffId, p])),
    })),

  addPresence: (presence) =>
    set((s) => ({ presence: { ...s.presence, [presence.staffId]: presence } })),

  removePresence: (staffId) =>
    set((s) => {
      const next = { ...s.presence };
      delete next[staffId];
      return { presence: next };
    }),

  setUnread: (conversationId, count) =>
    set((s) => ({
      unreadByConversation: {
        ...s.unreadByConversation,
        [conversationId]: count,
      },
    })),

  incrementUnread: (conversationId) =>
    set((s) => ({
      unreadByConversation: {
        ...s.unreadByConversation,
        [conversationId]: (s.unreadByConversation[conversationId] ?? 0) + 1,
      },
    })),

  clearUnread: (conversationId) =>
    set((s) => ({
      unreadByConversation: { ...s.unreadByConversation, [conversationId]: 0 },
    })),
}));
