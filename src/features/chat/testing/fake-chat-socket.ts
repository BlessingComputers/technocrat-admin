/**
 * Test-only fake for the shared chat socket (ticket #29).
 *
 * Injected at the `api/chat-socket` module boundary via `vi.mock`, so
 * `use-chat-socket` / `chat.store` run against an in-memory socket instead of
 * socket.io-client. The other admin chat tickets' acceptance tests run through
 * this seam.
 *
 * Never imported by production code.
 */

import type { ChatSocket } from "../api/chat-socket";

type Handler = (...args: unknown[]) => void;

export interface EmittedEvent {
  event: string;
  payload: unknown;
}

export interface FakeChatSocket {
  /** Cast to the real socket type for `vi.mock` factories. */
  socket: ChatSocket;
  /** Every client→server emit, in order. */
  emitted: EmittedEvent[];
  /** Fire a server→client event into whatever handlers the hook registered. */
  serverEmit: (event: string, payload?: unknown) => void;
  /** Simulate the transport coming up (fires `connect`). */
  simulateConnect: () => void;
  /** Simulate a drop (fires `disconnect` with the given reason). */
  simulateDisconnect: (reason?: string) => void;
  /** Simulate a failed (re)connection attempt (fires `connect_error`). */
  simulateConnectError: (error?: Error) => void;
  /** Client-side `connect()` calls (the hook's lifecycle effect). */
  connectCalls: () => number;
  /** Client-side `disconnect()` calls (teardown). */
  disconnectCalls: () => number;
}

export function createFakeChatSocket(): FakeChatSocket {
  const handlers = new Map<string, Set<Handler>>();
  const emitted: EmittedEvent[] = [];
  let connected = false;
  let connectCount = 0;
  let disconnectCount = 0;

  function serverEmit(event: string, payload?: unknown): void {
    handlers.get(event)?.forEach((handler) => handler(payload));
  }

  const socket = {
    id: "fake-socket-id",
    get connected() {
      return connected;
    },
    on(event: string, handler: Handler) {
      const set = handlers.get(event) ?? new Set<Handler>();
      set.add(handler);
      handlers.set(event, set);
      return socket;
    },
    off(event: string, handler?: Handler) {
      if (handler) handlers.get(event)?.delete(handler);
      else handlers.delete(event);
      return socket;
    },
    emit(event: string, payload?: unknown) {
      emitted.push({ event, payload });
      return socket;
    },
    connect() {
      connectCount += 1;
      return socket;
    },
    disconnect() {
      disconnectCount += 1;
      connected = false;
      return socket;
    },
  };

  return {
    socket: socket as unknown as ChatSocket,
    emitted,
    serverEmit,
    simulateConnect() {
      connected = true;
      serverEmit("connect");
    },
    simulateDisconnect(reason = "transport close") {
      connected = false;
      serverEmit("disconnect", reason);
    },
    simulateConnectError(error = new Error("connect failed")) {
      serverEmit("connect_error", error);
    },
    connectCalls: () => connectCount,
    disconnectCalls: () => disconnectCount,
  };
}
