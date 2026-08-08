/**
 * Socket.IO connection for the WhatsApp inbox.
 *
 * Rides the backend's `/ws` namespace, same as live chat, but on entirely
 * separate rooms and event names (`wa:*` / `whatsapp:*`) — the backend keeps the
 * two modules apart on purpose so a staff member's WhatsApp capacity never
 * competes with their chat capacity.
 *
 * This opens a SECOND connection rather than sharing chat's: features may not
 * import from one another, and hoisting the whole socket manager into `lib/`
 * would mean refactoring the chat slice. The cost is one extra WebSocket per
 * admin tab; the benefit is that either surface can be changed or rolled back
 * without touching the other. Only this module registers `whatsapp:*` listeners,
 * so the server broadcasting to every socket in `user:{id}` causes no double
 * handling.
 *
 * A single shared connection is reused across the workspace; the React layer
 * (`use-whatsapp-socket`) owns its lifecycle.
 */

"use client";

import { io, type Socket } from "socket.io-client";
import { publicEnv } from "@/config/env";
import { fetchSocketToken } from "@/lib/api/socket-token";
import {
  WA_CLIENT_EVENTS,
  WA_SERVER_EVENTS,
  type WaConversationAssignedEvent,
  type WaConversationNewEvent,
  type WaConversationResolvedEvent,
  type WaMessageNewEvent,
  type WaMessageStatusEvent,
} from "../types/whatsapp";

interface ClientToServerEvents {
  [WA_CLIENT_EVENTS.JOIN_CONVERSATION]: (payload: {
    conversationId: string;
  }) => void;
  [WA_CLIENT_EVENTS.HEARTBEAT]: () => void;
}

interface ServerToClientEvents {
  [WA_SERVER_EVENTS.CONVERSATION_NEW]: (
    payload: WaConversationNewEvent,
  ) => void;
  [WA_SERVER_EVENTS.CONVERSATION_ASSIGNED]: (
    payload: WaConversationAssignedEvent,
  ) => void;
  [WA_SERVER_EVENTS.CONVERSATION_RESOLVED]: (
    payload: WaConversationResolvedEvent,
  ) => void;
  [WA_SERVER_EVENTS.MESSAGE_NEW]: (payload: WaMessageNewEvent) => void;
  [WA_SERVER_EVENTS.MESSAGE_STATUS]: (payload: WaMessageStatusEvent) => void;
}

export type WhatsAppSocket = Socket<
  ServerToClientEvents,
  ClientToServerEvents
>;

let socket: WhatsAppSocket | null = null;

/**
 * Whether a socket can be opened at all — pure, so React may call it during
 * render to seed connection state without `getWhatsAppSocket`'s side effects.
 */
export function isWhatsAppSocketConfigured(): boolean {
  return Boolean(publicEnv.backendUrl);
}

/**
 * Re-arm reconnection when the browser regains connectivity. With bounded
 * `reconnectionAttempts` the manager gives up after a run of consecutive
 * failures and emits `reconnect_failed`; this lets a returning network kick off
 * a fresh attempt so the cap limits the retry storm without killing recovery.
 */
function handleNetworkOnline(): void {
  if (socket && !socket.connected) socket.connect();
}

/** Get (lazily creating) the shared WhatsApp socket, or null if unconfigured. */
export function getWhatsAppSocket(): WhatsAppSocket | null {
  if (socket) return socket;

  const origin = publicEnv.backendUrl ?? null;
  if (!origin) {
    console.warn(
      "[whatsapp] NEXT_PUBLIC_BACKEND_URL is not set — the WhatsApp inbox is read-only.",
    );
    return null;
  }

  // WebSocket-only, matching live chat: on DigitalOcean App Platform the
  // polling-first default gets its held-open long-polls timed out with `504`, so
  // the WS upgrade (`101`) never lands. Same env escape hatch
  // (`NEXT_PUBLIC_SOCKET_POLLING_FALLBACK=true`) restores the upgrade path.
  const transports = publicEnv.socketPollingFallback
    ? ["polling", "websocket"]
    : ["websocket"];

  socket = io(`${origin}/ws`, {
    withCredentials: true,
    autoConnect: false,
    transports,
    reconnectionAttempts: 10,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 15000,
    auth: (cb) => {
      void fetchSocketToken().then((token) => cb({ token: token ?? "" }));
    },
  });

  if (typeof window !== "undefined") {
    window.addEventListener("online", handleNetworkOnline);
  }
  return socket;
}

/** Tear down the shared socket (e.g. on logout or leaving the workspace). */
export function disconnectWhatsAppSocket(): void {
  if (typeof window !== "undefined") {
    window.removeEventListener("online", handleNetworkOnline);
  }
  socket?.disconnect();
  socket = null;
}
