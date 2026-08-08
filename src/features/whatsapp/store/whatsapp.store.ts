"use client";

import { create } from "zustand";

/** Which slice of the inbox the list is showing. */
export type WhatsAppInboxTab = "queue" | "mine" | "all";

interface WhatsAppState {
  /** DB UUID of the open conversation, or null when nothing is selected. */
  selectedId: string | null;
  tab: WhatsAppInboxTab;
  /**
   * Conversation ids with unseen activity, keyed for O(1) lookup. Cleared when
   * a conversation is opened. Purely a client-side badge — the server's
   * `unreadByStaff` counter is authoritative on reload.
   */
  unseen: Record<string, true>;
  select: (id: string | null) => void;
  setTab: (tab: WhatsAppInboxTab) => void;
  markUnseen: (id: string) => void;
}

/**
 * UI state for the WhatsApp workspace. Conversation and message *data* lives in
 * the React Query cache — the socket layer patches it there — so this store
 * holds only what the server has no opinion about.
 */
export const useWhatsAppStore = create<WhatsAppState>((set) => ({
  selectedId: null,
  tab: "mine",
  unseen: {},
  select: (id) =>
    set((state) => {
      if (!id) return { selectedId: null };
      // Opening a conversation clears its badge.
      const unseen = { ...state.unseen };
      delete unseen[id];
      return { selectedId: id, unseen };
    }),
  setTab: (tab) => set({ tab }),
  markUnseen: (id) =>
    set((state) =>
      // Never badge the conversation already on screen.
      state.selectedId === id
        ? state
        : { unseen: { ...state.unseen, [id]: true } },
    ),
}));
