"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { chatKeys } from "../api/chat.queries";
import {
  getChatSocket,
  disconnectChatSocket,
  type ChatMessageInput,
  type NotesUpdateInput,
  type StaffRoomMessageInput,
} from "../api/chat-socket";
import { STAFF_ROOM_ID, useChatStore } from "../store/chat.store";
import { notificationKeys } from "@/lib/api/notification-keys";
import { showChatToast } from "../components/chat-toast";
import { notifyDesktop } from "./use-desktop-notifications";
import type { ChatMessage, ConversationSummary } from "../types/chat";

const HEARTBEAT_MS = 30_000;

/**
 * A typing indicator not refreshed within this window self-clears (#28): a
 * missed `chat:typing:stop` (drop, reconnect) must not pin the indicator
 * forever. Matches the documented server behavior, which was never built
 * (no Redis keyspace notifications) — so the client owns it.
 */
export const TYPING_TTL_MS = 5_000;

export type ChatConnectionStatus = "connecting" | "connected" | "reconnecting";

/**
 * Owns the shared chat socket for the workspace: connects on mount, funnels
 * server events into the zustand store (and invalidates the conversation list
 * on structural changes), sends the presence heartbeat, and returns typed emit
 * helpers for the UI. Mount this once, at the workspace root.
 */
export interface UseChatSocketOptions {
  /** Super admins are auto-subscribed to every conversation (notify across the board). */
  superAdmin?: boolean;
  /** Current queue list — the super admin's auto-join set + notification titles. */
  conversations?: ConversationSummary[];
}

export function useChatSocket(opts: UseChatSocketOptions = {}) {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [connectionStatus, setConnectionStatus] =
    useState<ChatConnectionStatus>("connecting");

  // True once the socket has connected at least once in this workspace session
  // — distinguishes a reconnect (recovery needed) from the initial connect.
  const hasConnectedRef = useRef(false);

  // Socket handlers registered once must read the latest role/queue/router, so
  // funnel them through refs rather than the effect's closure.
  const superAdminRef = useRef(Boolean(opts.superAdmin));
  const conversationsRef = useRef<ConversationSummary[]>(opts.conversations ?? []);
  const routerRef = useRef(router);
  // Conversations the super admin has already joined (cleared on reconnect —
  // the server drops staff from rooms when the socket goes away).
  const joinedRef = useRef<Set<string>>(new Set());
  // Per-conversation popup debounce: `chat:dashboard:new` and the conversation's
  // first `chat:message:received` both describe the same opening message.
  const lastToastAtRef = useRef<Record<string, number>>({});

  useEffect(() => {
    superAdminRef.current = Boolean(opts.superAdmin);
  }, [opts.superAdmin]);
  useEffect(() => {
    conversationsRef.current = opts.conversations ?? [];
  }, [opts.conversations]);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  /** Subscribe the super admin to every active conversation for live notifications. */
  const joinAllForSuperAdmin = useCallback(() => {
    if (!superAdminRef.current) return;
    const socket = getChatSocket();
    if (!socket?.connected) return;
    let joined = 0;
    for (const c of conversationsRef.current) {
      if (c.id === STAFF_ROOM_ID || c.channel === "STAFF_ROOM") continue;
      if (c.status === "RESOLVED") continue;
      if (joinedRef.current.has(c.id)) continue;
      socket.emit("chat:join", { conversationId: c.id });
      joinedRef.current.add(c.id);
      joined++;
    }
    if (joined > 0) {
      console.info(
        "[chat][notify] super admin subscribed to",
        joined,
        "conversation(s)",
      );
    }
  }, []);

  /**
   * Fire the WhatsApp-style toast + desktop notification for an incoming chat
   * (unrelated to the header bell, which now reads the REST staff-notification
   * feed — ticket A6). Also refreshes that feed's queries: the backend's own
   * `StaffNotification` row for this event arrives independently, and this
   * socket event is a reliable, low-latency signal that it's worth refetching
   * rather than waiting on the 60s poll.
   */
  const pushNotification = useCallback(
    (conversationId: string, preview: string, kind: "new" | "message") => {
      if (!conversationId) return;
      // Never notify for the conversation already open on screen (WhatsApp-style
      // — you don't get pinged for the thread you're looking at).
      const openId = useChatStore.getState().selectedId;
      if (openId === conversationId) {
        console.info("[chat][notify] skip — conversation is open", conversationId);
        return;
      }

      const match = conversationsRef.current.find(
        (c) => c.id === conversationId,
      );
      const title = match?.name ?? "New chat";
      const body =
        preview || (kind === "new" ? "Started a new chat" : "New message");

      console.info("[chat][notify] push", { conversationId, kind, title });

      void queryClient.invalidateQueries({ queryKey: notificationKeys.all });

      const now = Date.now();
      if (now - (lastToastAtRef.current[conversationId] ?? 0) < 2500) {
        console.info("[chat][notify] toast debounced (bell still updated)", conversationId);
        return;
      }
      lastToastAtRef.current[conversationId] = now;

      const openConversation = () => {
        routerRef.current.push(`/chat?c=${conversationId}`);
      };

      showChatToast({
        title,
        preview: body,
        seed: conversationId,
        onOpen: openConversation,
      });

      // Native OS banner (when the tab is backgrounded) + notification sound,
      // sharing this block's per-conversation debounce and the open-thread
      // suppression above so bursts don't machine-gun the ding.
      notifyDesktop({
        title,
        body,
        conversationId,
        onClick: openConversation,
      });
    },
    [queryClient],
  );

  // Super admin (re)subscribes whenever the queue list or role changes.
  useEffect(() => {
    joinAllForSuperAdmin();
  }, [opts.conversations, opts.superAdmin, joinAllForSuperAdmin]);

  useEffect(() => {
    const socket = getChatSocket();
    if (!socket) return;

    const store = useChatStore.getState();

    // Per-(conversation, user) TTL timers behind the typing indicators.
    const typingTimers = new Map<string, ReturnType<typeof setTimeout>>();
    const typingOn = (conversationId: string, userId: string) => {
      store.setTyping(conversationId, userId, true);
      const key = `${conversationId}:${userId}`;
      const existing = typingTimers.get(key);
      if (existing) clearTimeout(existing);
      typingTimers.set(
        key,
        setTimeout(() => {
          typingTimers.delete(key);
          store.setTyping(conversationId, userId, false);
        }, TYPING_TTL_MS),
      );
    };
    const typingOff = (conversationId: string, userId: string) => {
      const key = `${conversationId}:${userId}`;
      const existing = typingTimers.get(key);
      if (existing) clearTimeout(existing);
      typingTimers.delete(key);
      store.setTyping(conversationId, userId, false);
    };

    const onConnect = () => {
      console.info("[chat] socket connected:", socket.id);
      setConnectionStatus("connected");
      // First heartbeat immediately (the guide's example), then the interval
      // below keeps it alive — otherwise presence only registers after 30s.
      socket.emit("presence:heartbeat");
      // Re-join the open conversation after a (re)connect. A reconnect is a new
      // socket that the server hasn't put back in the conversation room, so
      // without this the admin silently stops receiving after a "transport close".
      const openId = useChatStore.getState().selectedId;
      if (openId && openId !== STAFF_ROOM_ID) {
        socket.emit("chat:join", { conversationId: openId });
        socket.emit("chat:read", { conversationId: openId });
      }
      if (hasConnectedRef.current) {
        // Reconnect after a drop: anything broadcast while we were gone is
        // lost — refetch the REST seeds (conversation detail, list, staff
        // room). The seed effects re-run and `seedMessages` merges without
        // dropping still-pending optimistic sends.
        void queryClient.invalidateQueries({ queryKey: chatKeys.all });
      }
      hasConnectedRef.current = true;

      // The server drops us from every conversation room on disconnect, so a
      // super admin must re-subscribe to all of them after each (re)connect.
      joinedRef.current.clear();
      joinAllForSuperAdmin();
    };
    // Log the reason — "io server disconnect" means the backend dropped us
    // (e.g. it threw handling an event); "transport close"/"ping timeout" are
    // network. Distinguishes a server-side kick from a flaky connection.
    const onDisconnect = (reason: string) => {
      console.warn("[chat] socket disconnected:", reason);
      setConnectionStatus("reconnecting");
    };
    // Surface handshake/upgrade failures — otherwise a websocket-only connection
    // that never establishes is completely silent (no `connect`, no `chat:error`).
    const onConnectError = (err: Error) => {
      console.error("[chat] socket connect_error:", err.message);
      setConnectionStatus((prev) =>
        prev === "connected" ? "reconnecting" : prev,
      );
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);

    socket.on("chat:message:received", (payload) => {
      const message: ChatMessage = {
        id: payload.id,
        conversationId: payload.conversationId,
        senderType: payload.senderType,
        senderName: payload.senderName,
        body: payload.body,
        isInternal: payload.isInternal,
        createdAt: payload.createdAt,
        // The contract keys all echo/reconnect dedup on this — keep it.
        idempotencyKey: payload.idempotencyKey,
      };
      console.info(
        "[chat] message:received",
        payload.conversationId,
        payload.senderType,
      );
      store.receiveMessage(payload.conversationId, message);
      if (useChatStore.getState().selectedId !== payload.conversationId) {
        store.incrementUnread(payload.conversationId);
      }

      // Notify on any customer message that reaches this socket. Rooms are
      // already the access control: a regular admin only receives messages for
      // conversations they've joined (their assigned/opened chats) plus the
      // staff-room broadcast of a new chat's first message; a super admin is
      // auto-joined to every conversation, so this is what gives them the
      // cross-board notifications the backend's assigned-only `notification:new`
      // doesn't. `pushNotification` suppresses the currently-open thread.
      if (payload.senderType === "CUSTOMER" && !payload.isInternal) {
        console.info(
          "[chat][notify] customer message received",
          payload.conversationId,
        );
        pushNotification(payload.conversationId, payload.body, "message");
      }
    });

    // The ack carries no conversationId — the store locates the pending
    // message by idempotencyKey, so switching threads before it lands can't
    // resolve it against the wrong conversation (#26).
    socket.on("chat:message:saved", (ack) => store.ackMessage(ack));

    // Contract v2: AI-originated typing carries `senderName` instead of a
    // `userId`, so the typer key falls back to the name. Neither present means
    // there's nothing stable to key the TTL timer on — drop the event.
    socket.on("chat:typing:start", ({ conversationId, userId, senderName }) => {
      const typer = userId ?? senderName;
      if (typer) typingOn(conversationId, typer);
    });
    socket.on("chat:typing:stop", ({ conversationId, userId, senderName }) => {
      const typer = userId ?? senderName;
      if (typer) typingOff(conversationId, typer);
    });

    socket.on("chat:dashboard:new", (payload) => {
      console.info("[chat] dashboard:new", payload?.conversationId);
      // Seed the left-rail preview from the new-conversation event: the customer's
      // first message never arrives as `chat:message:received` (backend emits it
      // only as this preview + a queued DB write), so without this the new row
      // shows a blank preview until the conversation is opened.
      if (payload?.conversationId && payload?.preview) {
        store.setPreview(
          payload.conversationId,
          payload.preview,
          payload.createdAt,
        );
      }
      // Seed the AI/human split too, so a brand-new row lands on the correct
      // side without waiting on anything else (ticket A4).
      if (payload?.conversationId && payload?.aiState) {
        store.setAiState(payload.conversationId, payload.aiState, null);
      }
      // A brand-new chat is open to every admin — notify all of them so anyone
      // can pick it out of the queue.
      if (payload?.conversationId) {
        pushNotification(payload.conversationId, payload.preview ?? "", "new");
      }
      // Place the row directly instead of invalidating: the event now carries
      // everything the list needs to sort it onto the right side of the split
      // (aiState) immediately, with no full-list refetch (that refetch was the
      // exact poll this event was added to remove — see A4). The 60s
      // `refetchInterval` safety net corrects any field this can't guess (the
      // customer's real name) shortly after. Assignment/resolution still
      // invalidate below — those change fields (assignedStaffId, status) this
      // event doesn't carry at all.
      if (payload?.conversationId) {
        queryClient.setQueryData<ConversationSummary[]>(
          chatKeys.conversations(false),
          (prev) => {
            if (!prev || prev.some((c) => c.id === payload.conversationId)) {
              return prev;
            }
            const synthetic: ConversationSummary = {
              id: payload.conversationId,
              publicId: payload.publicId,
              channel: "LIVE_CHAT",
              status: "WAITING",
              name: "Customer",
              subject: payload.subject ?? null,
              lastMessagePreview: payload.preview ?? null,
              lastMessageAt: payload.createdAt ?? null,
              unreadCount: 0,
              assignedStaffId: null,
              aiState: payload.aiState ?? "OFF",
              aiEscalationReason: null,
            };
            return [synthetic, ...prev];
          },
        );
      }
    });
    socket.on("chat:conversation:assigned", () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    });
    socket.on("chat:conversation:resolved", () => {
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    });
    // The AI escalated a conversation to a human, or was force-stopped
    // (A5) — move the row live, no refetch (that's the whole point).
    socket.on("chat:ai:state", ({ conversationId, aiState, reason }) => {
      console.info("[chat] ai:state", conversationId, aiState, reason);
      store.setAiState(conversationId, aiState, reason);
    });
    socket.on("chat:notes:updated", ({ conversationId }) => {
      queryClient.invalidateQueries({ queryKey: chatKeys.notes(conversationId) });
    });

    // Personal-room ping for a new customer message in a conversation assigned
    // to this staff member — the badge signal when the room isn't joined. Unread
    // counting stays on `chat:message:received` (joined rooms) to avoid double
    // counting when both events arrive.
    socket.on("notification:new", ({ conversationId, preview }) => {
      // A new customer message in a conversation this staff member is assigned to
      // but hasn't joined — update the row preview even though no
      // `chat:message:received` arrives for an unjoined room.
      if (conversationId && preview) {
        store.setPreview(conversationId, preview);
      }
      // The assigned staff member's personal-room ping — a new customer message
      // in one of THEIR conversations. `pushNotification` guards the open thread.
      pushNotification(conversationId, preview ?? "", "message");
      queryClient.invalidateQueries({ queryKey: chatKeys.all });
    });

    // Staff room
    socket.on("staffroom:history", ({ messages }) => {
      // History rows carry no conversationId — they all belong to the
      // staff room by construction.
      store.seedMessages(
        STAFF_ROOM_ID,
        (messages ?? []).map((m) => ({
          id: m.id,
          conversationId: STAFF_ROOM_ID,
          senderType: m.senderType,
          senderId: m.senderId,
          senderName: m.senderName,
          body: m.body,
          isInternal: m.isInternal,
          createdAt: m.createdAt,
        })),
      );
    });
    socket.on("staffroom:message:received", (payload) =>
      store.receiveMessage(STAFF_ROOM_ID, {
        id: payload.id,
        conversationId: STAFF_ROOM_ID,
        senderType: "STAFF",
        senderName: payload.senderName,
        body: payload.body,
        createdAt: payload.createdAt,
        idempotencyKey: payload.idempotencyKey,
      }),
    );
    socket.on("staffroom:typing", ({ userId, isTyping }) =>
      isTyping
        ? typingOn(STAFF_ROOM_ID, userId)
        : typingOff(STAFF_ROOM_ID, userId),
    );

    // Presence
    socket.on("presence:list", (list) => store.setPresence(list));
    socket.on("presence:staff:online", (p) => store.addPresence(p));
    socket.on("presence:staff:offline", ({ staffId }) =>
      store.removePresence(staffId),
    );

    socket.on("chat:error", ({ message }) => {
      console.error("[chat] socket error:", message);
      toast.error(message);
    });

    socket.connect();

    const heartbeat = setInterval(() => {
      if (socket.connected) socket.emit("presence:heartbeat");
    }, HEARTBEAT_MS);

    return () => {
      clearInterval(heartbeat);
      typingTimers.forEach((timer) => clearTimeout(timer));
      typingTimers.clear();
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("chat:message:received");
      socket.off("chat:message:saved");
      socket.off("chat:typing:start");
      socket.off("chat:typing:stop");
      socket.off("chat:dashboard:new");
      socket.off("chat:ai:state");
      socket.off("chat:conversation:assigned");
      socket.off("chat:conversation:resolved");
      socket.off("chat:notes:updated");
      socket.off("notification:new");
      socket.off("staffroom:history");
      socket.off("staffroom:message:received");
      socket.off("staffroom:typing");
      socket.off("presence:list");
      socket.off("presence:staff:online");
      socket.off("presence:staff:offline");
      socket.off("chat:error");
      // Fully hang up when the workspace unmounts (navigating away from chat,
      // or the logout redirect to /login). Removing the listeners alone left the
      // socket connected, so staff kept re-registering as online and the client
      // kept reconnecting in the background. An explicit logout also tears down
      // (see Topbar) for the case where logout fires from another page.
      disconnectChatSocket();
    };
  }, [queryClient, pushNotification, joinAllForSuperAdmin]);

  // ── Emit helpers ──────────────────────────────────────────────────
  const sendMessage = useCallback((payload: ChatMessageInput) => {
    getChatSocket()?.emit("chat:message", payload);
  }, []);

  const sendStaffRoomMessage = useCallback((payload: StaffRoomMessageInput) => {
    getChatSocket()?.emit("staffroom:message", payload);
  }, []);

  const startTyping = useCallback((conversationId: string) => {
    getChatSocket()?.emit("chat:typing:start", { conversationId });
  }, []);

  const stopTyping = useCallback((conversationId: string) => {
    getChatSocket()?.emit("chat:typing:stop", { conversationId });
  }, []);

  const setStaffRoomTyping = useCallback((isTyping: boolean) => {
    getChatSocket()?.emit("staffroom:typing", { isTyping });
  }, []);

  const markRead = useCallback((conversationId: string) => {
    getChatSocket()?.emit("chat:read", { conversationId });
  }, []);

  const joinConversation = useCallback((conversationId: string) => {
    getChatSocket()?.emit("chat:join", { conversationId });
  }, []);

  const assignConversation = useCallback((conversationId: string) => {
    getChatSocket()?.emit("chat:assign", { conversationId });
  }, []);

  const resolveConversation = useCallback((conversationId: string) => {
    getChatSocket()?.emit("chat:resolve", { conversationId });
  }, []);

  const updateNotes = useCallback((payload: NotesUpdateInput) => {
    getChatSocket()?.emit("chat:notes:update", payload);
  }, []);

  return {
    connectionStatus,
    connected: connectionStatus === "connected",
    sendMessage,
    sendStaffRoomMessage,
    startTyping,
    stopTyping,
    setStaffRoomTyping,
    markRead,
    joinConversation,
    assignConversation,
    resolveConversation,
    updateNotes,
  };
}

export type ChatSocketApi = ReturnType<typeof useChatSocket>;
