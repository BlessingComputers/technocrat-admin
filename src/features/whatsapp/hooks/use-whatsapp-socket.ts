"use client";

import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import {
  disconnectWhatsAppSocket,
  getWhatsAppSocket,
  isWhatsAppSocketConfigured,
} from "../api/whatsapp-socket";
import { whatsappKeys } from "../api/whatsapp.queries";
import { useWhatsAppStore } from "../store/whatsapp.store";
import {
  WA_CLIENT_EVENTS,
  WA_SERVER_EVENTS,
  type WaConversationAssignedEvent,
  type WaConversationNewEvent,
  type WaMessageNewEvent,
  type WaMessageStatusEvent,
  type WhatsAppConversationThread,
  type WhatsAppMessage,
} from "../types/whatsapp";

/** Heartbeat cadence. The server's presence key expires after 5 minutes. */
const HEARTBEAT_MS = 60_000;

export type WhatsAppConnectionState =
  | "connecting"
  | "connected"
  | "disconnected";

/**
 * Owns the WhatsApp socket for the workspace: connects while mounted, joins the
 * open conversation's room, and folds live events into the React Query cache.
 *
 * Live messages are *appended to* the fetched history, never used instead of it
 * — the thread query stays the source of truth so a refresh never empties the
 * view (the exact failure the live-chat admin app had to fix).
 *
 * @param isOnline Whether the staff member has toggled WhatsApp availability on.
 *   Heartbeats only make sense while online; the socket itself stays connected
 *   either way so an agent still sees their assigned conversations update.
 */
export function useWhatsAppSocket(isOnline: boolean) {
  const queryClient = useQueryClient();
  const selectedId = useWhatsAppStore((s) => s.selectedId);
  const markUnseen = useWhatsAppStore((s) => s.markUnseen);
  // Seeded from a pure check so an unconfigured backend reports "disconnected"
  // without a setState pass through an effect.
  const [connection, setConnection] = useState<WhatsAppConnectionState>(() =>
    isWhatsAppSocketConfigured() ? "connecting" : "disconnected",
  );

  // Read inside handlers without making them a dependency — re-subscribing on
  // every selection change would drop events during the gap.
  const selectedIdRef = useRef(selectedId);
  useEffect(() => {
    selectedIdRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    const socket = getWhatsAppSocket();
    if (!socket) return;

    const onConnect = () => setConnection("connected");
    const onDisconnect = () => setConnection("disconnected");

    /** Append a message to a cached thread, ignoring duplicates. */
    const appendMessage = (
      conversationId: string,
      message: WhatsAppMessage,
    ) => {
      queryClient.setQueryData<WhatsAppConversationThread>(
        whatsappKeys.detail(conversationId),
        (previous) => {
          if (!previous) return previous;
          const isDuplicate = previous.messages.some(
            (m) =>
              m.id === message.id ||
              (Boolean(m.waMessageId) && m.waMessageId === message.waMessageId),
          );
          if (isDuplicate) return previous;
          return { ...previous, messages: [...previous.messages, message] };
        },
      );
    };

    const onMessageNew = (payload: WaMessageNewEvent) => {
      // The event carries the message fields but not a DB row, so synthesise
      // one keyed on the event's own timestamp. Any duplicate is reconciled the
      // next time the thread is refetched.
      const isFromStaff = Boolean(payload.senderId);
      appendMessage(payload.conversationId, {
        id: `live-${payload.conversationId}-${payload.createdAt}`,
        messageId: "",
        conversationId: payload.conversationId,
        waMessageId: null,
        // The backend now sends `senderType` directly (an AI reply carries a
        // `senderId` too, but is SYSTEM, not STAFF) — trust it when present
        // and only fall back to the presence-of-senderId guess otherwise.
        senderType: payload.senderType ?? (isFromStaff ? "STAFF" : "CUSTOMER"),
        senderId: payload.senderId ?? null,
        senderName:
          payload.senderName ?? payload.profileName ?? payload.waId ?? "Customer",
        body: payload.body,
        mediaUrl: null,
        status: payload.status ?? (isFromStaff ? "SENT" : "DELIVERED"),
        isInternal: payload.isInternal,
        createdAt: payload.createdAt,
        updatedAt: payload.createdAt,
      });

      // List previews (last message, ordering) and unread counts moved.
      void queryClient.invalidateQueries({
        queryKey: whatsappKeys.all,
        // The open thread already has the message appended above; refetching it
        // here would fight the optimistic append on every keystroke-fast reply.
        predicate: (query) =>
          query.queryKey[1] !== "detail" ||
          query.queryKey[2] !== payload.conversationId,
      });

      if (!isFromStaff) markUnseen(payload.conversationId);
    };

    const onMessageStatus = (payload: WaMessageStatusEvent) => {
      // Broadcast without a conversation id — patch whichever cached thread
      // holds this wamid.
      const threads = queryClient.getQueriesData<WhatsAppConversationThread>({
        queryKey: whatsappKeys.all,
      });
      for (const [key, thread] of threads) {
        if (!thread?.messages) continue;
        if (!thread.messages.some((m) => m.waMessageId === payload.waMessageId))
          continue;
        queryClient.setQueryData<WhatsAppConversationThread>(key, {
          ...thread,
          messages: thread.messages.map((m) =>
            m.waMessageId === payload.waMessageId
              ? { ...m, status: payload.status }
              : m,
          ),
        });
      }
    };

    const onConversationNew = (payload: WaConversationNewEvent) => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.all });
      markUnseen(payload.conversationId);
      toast("New WhatsApp conversation", {
        description: `${payload.profileName || payload.waId}: ${payload.preview}`,
      });
    };

    const onConversationAssigned = (payload: WaConversationAssignedEvent) => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.all });
      // The server joins the new owner's socket into the room, but only for
      // sockets that existed then — rejoin defensively so this tab receives the
      // thread's traffic either way.
      if (selectedIdRef.current === payload.conversationId) {
        socket.emit(WA_CLIENT_EVENTS.JOIN_CONVERSATION, {
          conversationId: payload.conversationId,
        });
      }
    };

    const onConversationResolved = () => {
      void queryClient.invalidateQueries({ queryKey: whatsappKeys.all });
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on(WA_SERVER_EVENTS.MESSAGE_NEW, onMessageNew);
    socket.on(WA_SERVER_EVENTS.MESSAGE_STATUS, onMessageStatus);
    socket.on(WA_SERVER_EVENTS.CONVERSATION_NEW, onConversationNew);
    socket.on(WA_SERVER_EVENTS.CONVERSATION_ASSIGNED, onConversationAssigned);
    socket.on(WA_SERVER_EVENTS.CONVERSATION_RESOLVED, onConversationResolved);

    if (!socket.connected) socket.connect();

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off(WA_SERVER_EVENTS.MESSAGE_NEW, onMessageNew);
      socket.off(WA_SERVER_EVENTS.MESSAGE_STATUS, onMessageStatus);
      socket.off(WA_SERVER_EVENTS.CONVERSATION_NEW, onConversationNew);
      socket.off(WA_SERVER_EVENTS.CONVERSATION_ASSIGNED, onConversationAssigned);
      socket.off(
        WA_SERVER_EVENTS.CONVERSATION_RESOLVED,
        onConversationResolved,
      );
      disconnectWhatsAppSocket();
    };
  }, [queryClient, markUnseen]);

  // Join the open conversation's room so its traffic reaches this tab.
  useEffect(() => {
    if (!selectedId) return;
    const socket = getWhatsAppSocket();
    if (!socket) return;
    const join = () =>
      socket.emit(WA_CLIENT_EVENTS.JOIN_CONVERSATION, {
        conversationId: selectedId,
      });
    if (socket.connected) join();
    // Re-join after a reconnect — room membership does not survive it.
    socket.on("connect", join);
    return () => {
      socket.off("connect", join);
    };
  }, [selectedId]);

  // Keep the presence key alive while online. The REST heartbeat exists too,
  // but the socket one avoids a request per minute per agent.
  useEffect(() => {
    if (!isOnline) return;
    const socket = getWhatsAppSocket();
    if (!socket) return;
    const beat = () => socket.emit(WA_CLIENT_EVENTS.HEARTBEAT);
    beat();
    const timer = setInterval(beat, HEARTBEAT_MS);
    return () => clearInterval(timer);
  }, [isOnline]);

  return { connection };
}
