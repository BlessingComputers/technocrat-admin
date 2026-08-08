/**
 * Socket.IO connection for the staff chat.
 *
 * The live path is Socket.IO on the backend's `/ws` namespace, authenticated by
 * the same JWT cookie the REST client uses. Because Socket.IO upgrades to a
 * WebSocket, it can't ride the same-origin `/api` HTTP proxy — it connects
 * directly to the backend origin (`publicEnv.backendUrl`) with
 * `withCredentials: true` so the cookie is sent.
 *
 * A single shared connection is reused across the whole chat workspace; the
 * React layer (`use-chat-socket`) owns its lifecycle.
 */

"use client";

import { io, type Socket } from "socket.io-client";
import { publicEnv } from "@/config/env";
import { fetchSocketToken } from "@/lib/api/socket-token";
import {
  CLIENT_EVENTS,
  SERVER_EVENTS,
  type SendMessageInput,
  type TypingInput,
  type ConversationRefInput,
  type NotesUpdateInput,
  type StaffRoomMessageInput,
  type StaffRoomTypingInput,
  type MessageReceivedEvent,
  type MessageSavedAck,
  type TypingStartEvent,
  type TypingStopEvent,
  type NewConversationEvent,
  type ConversationAssignedEvent,
  type ConversationResolvedEvent,
  type NotesUpdatedEvent,
  type StaffRoomHistoryEvent,
  type StaffRoomTypingEvent,
  type StaffOnlineEvent,
  type StaffOfflineEvent,
  type PresenceListEvent,
  type NotificationEvent,
  type ChatErrorEvent,
  type AiStateChangedEvent,
} from "../types/chat.contract";

// The wire contract (event names + payload shapes) is the synced
// chat.contract.ts, owned by the backend repo — never hand-edit it.
// Re-export what the rest of the slice consumes, keeping the pre-contract
// aliases so call sites don't churn.
export { CLIENT_EVENTS, SERVER_EVENTS };
export type {
  NotesUpdateInput,
  StaffRoomMessageInput,
  MessageReceivedEvent,
  ConversationAssignedEvent,
  ConversationResolvedEvent,
  NotesUpdatedEvent,
  StaffRoomHistoryEvent,
  StaffRoomTypingEvent,
  NotificationEvent,
  AiStateChangedEvent,
};
export type ChatMessageInput = SendMessageInput;
export type MessageSavedEvent = MessageSavedAck;
export type TypingEvent = TypingStartEvent;
export type DashboardNewEvent = NewConversationEvent;
/** staffroom:message:received carries the same payload as chat:message:received. */
export type StaffRoomMessageEvent = MessageReceivedEvent;

interface ClientToServerEvents {
  [CLIENT_EVENTS.SEND_MESSAGE]: (payload: SendMessageInput) => void;
  [CLIENT_EVENTS.TYPING_START]: (payload: TypingInput) => void;
  [CLIENT_EVENTS.TYPING_STOP]: (payload: TypingInput) => void;
  [CLIENT_EVENTS.MARK_READ]: (payload: ConversationRefInput) => void;
  [CLIENT_EVENTS.JOIN_CONVERSATION]: (payload: ConversationRefInput) => void;
  [CLIENT_EVENTS.ASSIGN_SELF]: (payload: ConversationRefInput) => void;
  [CLIENT_EVENTS.RESOLVE]: (payload: ConversationRefInput) => void;
  [CLIENT_EVENTS.UPDATE_NOTES]: (payload: NotesUpdateInput) => void;
  [CLIENT_EVENTS.STAFF_ROOM_MESSAGE]: (payload: StaffRoomMessageInput) => void;
  [CLIENT_EVENTS.STAFF_ROOM_TYPING]: (payload: StaffRoomTypingInput) => void;
  [CLIENT_EVENTS.HEARTBEAT]: () => void;
}

interface ServerToClientEvents {
  [SERVER_EVENTS.CONVERSATION_ASSIGNED]: (payload: ConversationAssignedEvent) => void;
  [SERVER_EVENTS.CONVERSATION_RESOLVED]: (payload: ConversationResolvedEvent) => void;
  [SERVER_EVENTS.MESSAGE_RECEIVED]: (payload: MessageReceivedEvent) => void;
  [SERVER_EVENTS.MESSAGE_SAVED]: (payload: MessageSavedAck) => void;
  [SERVER_EVENTS.TYPING_START]: (payload: TypingStartEvent) => void;
  [SERVER_EVENTS.TYPING_STOP]: (payload: TypingStopEvent) => void;
  [SERVER_EVENTS.NEW_CONVERSATION]: (payload: NewConversationEvent) => void;
  [SERVER_EVENTS.STAFF_ROOM_MESSAGE]: (payload: MessageReceivedEvent) => void;
  [SERVER_EVENTS.STAFF_ROOM_HISTORY]: (payload: StaffRoomHistoryEvent) => void;
  [SERVER_EVENTS.STAFF_ROOM_TYPING]: (payload: StaffRoomTypingEvent) => void;
  [SERVER_EVENTS.STAFF_ONLINE]: (payload: StaffOnlineEvent) => void;
  [SERVER_EVENTS.STAFF_OFFLINE]: (payload: StaffOfflineEvent) => void;
  [SERVER_EVENTS.PRESENCE_LIST]: (payload: PresenceListEvent) => void;
  [SERVER_EVENTS.NOTIFICATION]: (payload: NotificationEvent) => void;
  [SERVER_EVENTS.NOTES_UPDATED]: (payload: NotesUpdatedEvent) => void;
  [SERVER_EVENTS.ERROR]: (payload: ChatErrorEvent) => void;
  [SERVER_EVENTS.AI_STATE_CHANGED]: (payload: AiStateChangedEvent) => void;
}

export type ChatSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

let socket: ChatSocket | null = null;

/**
 * Re-arm reconnection when the browser regains connectivity. With bounded
 * `reconnectionAttempts` the manager gives up after a run of consecutive
 * failures and emits `reconnect_failed`; this lets a returning network kick off
 * a fresh attempt so the cap limits the retry storm without killing recovery.
 */
function handleNetworkOnline(): void {
  if (socket && !socket.connected) socket.connect();
}

/** The backend origin that serves Socket.IO, or null if unconfigured. */
function socketOrigin(): string | null {
  return publicEnv.backendUrl ?? null;
}

/**
 * The staff-JWT handshake bridge now lives in `lib/api/socket-token` — the
 * WhatsApp inbox needs the same helper and features may not import from each
 * other. Re-exported here because the fake-socket test suite imports it from
 * this module; production code resolves it only through the socket's `auth`
 * callback.
 */
export { fetchSocketToken };

/**
 * Get (lazily creating) the shared chat socket. Returns null if the backend
 * origin isn't configured, so callers degrade to REST-only instead of throwing.
 */
export function getChatSocket(): ChatSocket | null {
  if (socket) return socket;

  const origin = socketOrigin();
  if (!origin) {
    console.warn(
      "[chat] NEXT_PUBLIC_BACKEND_URL is not set — live chat is disabled.",
    );
    return null;
  }

  // Connect directly to the backend origin (from NEXT_PUBLIC_BACKEND_URL) in every
  // environment. We previously proxied `/socket.io` through a same-origin Next
  // rewrite in dev to dodge CORS, but Next's trailing-slash redirect
  // (308 `/socket.io/` → `/socket.io`) strips the slash Socket.IO's handshake
  // requires, so the proxied poll 404s at the backend. The backend's Socket.IO
  // CORS must instead allowlist the admin origin(s).
  //
  // WebSocket-only, per the backend's CHAT-FRONTEND-WEBSOCKET-FIX guidance and
  // matching the customer widget: on DigitalOcean App Platform the polling-first
  // default gets its held-open long-polls timed out with `504`, so the WS upgrade
  // (`101`) never lands and sent messages are never persisted.
  //
  // ESCAPE HATCH: if WS-only churns with no fallback ("transport close") against
  // a flaky handshake, set `NEXT_PUBLIC_SOCKET_POLLING_FALLBACK=true` (env only,
  // no code change) to restore the polling→websocket upgrade path.
  const url = `${origin}/ws`;
  const transports = publicEnv.socketPollingFallback
    ? ["polling", "websocket"]
    : ["websocket"];

  socket = io(url, {
    withCredentials: true,
    autoConnect: false,
    transports,
    // Bounded reconnection with capped backoff. We previously retried forever
    // (ticket #27), but against a persistent gateway fault (e.g. the proxy
    // 504ing every `/socket.io` poll) that turns into an endless request storm.
    // Cap the run of consecutive failures instead; `handleNetworkOnline` below
    // re-arms when connectivity returns, so a *transient* outage still recovers
    // without leaving the workspace permanently dead. A revoked session can't
    // hammer the token bridge — a failed refresh hard-redirects to /login (see
    // fetchSocketToken).
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    // Socket.IO invokes this before each (re)connect; the backend reads the JWT
    // from `handshake.auth.token`. `withCredentials` is kept for the same-site
    // deployment where the cookie can also flow, but cross-origin relies on this.
    auth: (cb) => {
      void fetchSocketToken().then((token) => cb({ token: token ?? "" }));
    },
  });
  if (typeof window !== "undefined") {
    window.addEventListener("online", handleNetworkOnline);
  }
  return socket;
}

/** Tear down the shared socket (e.g. on logout). */
export function disconnectChatSocket(): void {
  if (typeof window !== "undefined") {
    window.removeEventListener("online", handleNetworkOnline);
  }
  socket?.disconnect();
  socket = null;
}
