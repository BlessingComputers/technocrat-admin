"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { useConversations } from "../api/chat.queries";
import { useChatSocket, type ChatSocketApi } from "../hooks/use-chat-socket";
import { useDesktopNotifications } from "../hooks/use-desktop-notifications";
import type { ConversationSummary } from "../types/chat";

/** Stable empty fallback so an undefined query result doesn't churn the socket effects. */
const NO_CONVERSATIONS: ConversationSummary[] = [];

/**
 * Keeps ONE chat socket alive for the whole authenticated staff shell (mounted
 * in `(staff)/layout.tsx`), not just the chat page. That's what lets the Topbar
 * bell and the WhatsApp-style popup fire from any route, and it keeps a super
 * admin subscribed to every conversation so they can be notified across the
 * board.
 *
 * The socket API (connection status + emit helpers) is shared through context so
 * the chat workspace consumes the same connection instead of opening a second
 * one.
 */

const ChatRealtimeContext = createContext<ChatSocketApi | null>(null);

export function ChatRealtimeProvider({ children }: { children: ReactNode }) {
  const { staffSession } = useStaffSession();
  const superAdmin = isSuperAdmin(staffSession);

  // Arm native desktop notifications + the notification sound for all staff:
  // requests permission and unlocks audio on the first user gesture.
  useDesktopNotifications();

  // The queue list doubles as the super admin's auto-join set and the source of
  // customer names for notification titles. Kept fresh over the socket + a slow
  // poll (see chat.queries).
  const { data: conversations } = useConversations(false);

  const api = useChatSocket({
    superAdmin,
    conversations: conversations ?? NO_CONVERSATIONS,
  });

  return (
    <ChatRealtimeContext.Provider value={api}>
      {children}
    </ChatRealtimeContext.Provider>
  );
}

/** Consume the shared chat socket API. Must be under `ChatRealtimeProvider`. */
export function useChatRealtime(): ChatSocketApi {
  const ctx = useContext(ChatRealtimeContext);
  if (!ctx) {
    throw new Error("useChatRealtime must be used within a ChatRealtimeProvider");
  }
  return ctx;
}
