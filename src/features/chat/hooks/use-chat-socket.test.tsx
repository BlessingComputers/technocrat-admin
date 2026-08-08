// @vitest-environment jsdom
/**
 * Fake-socket tests for the workspace socket hook (tickets #29 + #27).
 *
 * The real socket.io-client is replaced at the `api/chat-socket` module
 * boundary with the in-memory fake. TanStack Query and the zustand store are
 * real.
 */

import { act, renderHook } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useChatSocket } from "./use-chat-socket";
import { chatKeys } from "../api/chat.queries";
import { useChatStore } from "../store/chat.store";
import {
  createFakeChatSocket,
  type FakeChatSocket,
} from "../testing/fake-chat-socket";

let fake: FakeChatSocket;

vi.mock("../api/chat-socket", () => ({
  getChatSocket: () => fake.socket,
  disconnectChatSocket: vi.fn(),
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn() }),
}));

function renderSocketHook() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  const invalidateSpy = vi.spyOn(queryClient, "invalidateQueries");
  const rendered = renderHook(() => useChatSocket(), {
    wrapper: ({ children }) => (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    ),
  });
  return { ...rendered, invalidateSpy, queryClient };
}

beforeEach(() => {
  fake = createFakeChatSocket();
  useChatStore.setState({
    selectedId: null,
    messagesByConversation: {},
    typingByConversation: {},
    unreadByConversation: {},
    previewByConversation: {},
    aiStateByConversation: {},
    presence: {},
  });
});

describe("reconnect recovery (#27)", () => {
  it("refetches the REST seeds and re-joins the open conversation on reconnect", () => {
    useChatStore.setState({ selectedId: "conv-1" });
    const { result, invalidateSpy } = renderSocketHook();

    expect(result.current.connectionStatus).toBe("connecting");

    act(() => fake.simulateConnect());
    expect(result.current.connectionStatus).toBe("connected");
    // The initial connect seeds via the normal queries — no invalidation.
    expect(invalidateSpy).not.toHaveBeenCalled();

    act(() => fake.simulateDisconnect());
    expect(result.current.connectionStatus).toBe("reconnecting");

    act(() => fake.simulateConnect());
    expect(result.current.connectionStatus).toBe("connected");
    // Messages broadcast during the gap are lost — the seeds must refetch.
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: chatKeys.all });

    // Both connects re-join + mark the open conversation read.
    const joins = fake.emitted.filter((e) => e.event === "chat:join");
    expect(joins).toHaveLength(2);
    expect(joins[1].payload).toEqual({ conversationId: "conv-1" });
    expect(
      fake.emitted.filter((e) => e.event === "chat:read"),
    ).toHaveLength(2);
  });

  it("stays in 'connecting' while the first connection has not succeeded", () => {
    const { result } = renderSocketHook();

    act(() => fake.simulateConnectError());
    expect(result.current.connectionStatus).toBe("connecting");
    expect(fake.connectCalls()).toBe(1);
  });

  it("sends the presence heartbeat immediately on every connect", () => {
    const { result } = renderSocketHook();
    act(() => fake.simulateConnect());
    act(() => fake.simulateDisconnect());
    act(() => fake.simulateConnect());

    expect(result.current.connected).toBe(true);
    expect(
      fake.emitted.filter((e) => e.event === "presence:heartbeat"),
    ).toHaveLength(2);
  });
});

describe("ack routing (#26)", () => {
  it("resolves the ack against the message's own conversation, not the selection", () => {
    renderSocketHook();
    act(() => fake.simulateConnect());

    useChatStore.getState().appendMessage("conv-1", {
      id: "",
      conversationId: "conv-1",
      senderType: "STAFF",
      senderName: "Femi",
      body: "on its way",
      createdAt: new Date().toISOString(),
      idempotencyKey: "key-1",
    });
    // The agent switches threads before the ack lands.
    useChatStore.getState().select("conv-2");

    act(() =>
      fake.serverEmit("chat:message:saved", {
        idempotencyKey: "key-1",
        tempId: "t1",
        createdAt: new Date().toISOString(),
      }),
    );

    expect(
      useChatStore.getState().messagesByConversation["conv-1"][0].id,
    ).toBe("t1");
  });
});

describe("typing TTL (#28)", () => {
  it("self-clears a typing indicator not refreshed within 5s", () => {
    vi.useFakeTimers();
    try {
      renderSocketHook();
      act(() => fake.simulateConnect());

      act(() =>
        fake.serverEmit("chat:typing:start", {
          conversationId: "conv-1",
          userId: "staff-9",
          audience: "customer",
        }),
      );
      expect(
        useChatStore.getState().typingByConversation["conv-1"],
      ).toContain("staff-9");

      // A refresh before the TTL keeps it alive…
      act(() => vi.advanceTimersByTime(3000));
      act(() =>
        fake.serverEmit("chat:typing:start", {
          conversationId: "conv-1",
          userId: "staff-9",
          audience: "customer",
        }),
      );
      act(() => vi.advanceTimersByTime(3000));
      expect(
        useChatStore.getState().typingByConversation["conv-1"],
      ).toContain("staff-9");

      // …but with no refresh it dies at the TTL (missed typing:stop).
      act(() => vi.advanceTimersByTime(2100));
      expect(
        useChatStore.getState().typingByConversation["conv-1"],
      ).not.toContain("staff-9");
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("socket → store funnel (#29 seam)", () => {
  it("routes an inbound message into the store and counts unread for unselected conversations", () => {
    useChatStore.setState({ selectedId: "conv-open" });
    renderSocketHook();
    act(() => fake.simulateConnect());

    act(() =>
      fake.serverEmit("chat:message:received", {
        id: "m1",
        conversationId: "conv-other",
        senderType: "CUSTOMER",
        senderName: "Ada",
        body: "hello?",
        isInternal: false,
        createdAt: new Date().toISOString(),
      }),
    );

    const state = useChatStore.getState();
    expect(state.messagesByConversation["conv-other"]).toHaveLength(1);
    expect(state.messagesByConversation["conv-other"][0].body).toBe("hello?");
    expect(state.unreadByConversation["conv-other"]).toBe(1);
  });
});

describe("aiState adoption (ticket A4)", () => {
  it("chat:ai:state moves the row in the store without invalidating any query", () => {
    const { invalidateSpy } = renderSocketHook();
    act(() => fake.simulateConnect());
    invalidateSpy.mockClear();

    act(() =>
      fake.serverEmit("chat:ai:state", {
        conversationId: "conv-1",
        aiState: "ESCALATED",
        reason: "CANNOT_ANSWER",
      }),
    );

    expect(useChatStore.getState().aiStateByConversation["conv-1"]).toEqual({
      aiState: "ESCALATED",
      reason: "CANNOT_ANSWER",
    });
    // The whole point of this ticket: no refetch to move a row.
    expect(invalidateSpy).not.toHaveBeenCalled();
  });

  it("chat:dashboard:new places the new row directly on the correct side, with no invalidation", () => {
    const { queryClient, invalidateSpy } = renderSocketHook();
    queryClient.setQueryData(chatKeys.conversations(false), []);
    act(() => fake.simulateConnect());
    invalidateSpy.mockClear();

    act(() =>
      fake.serverEmit("chat:dashboard:new", {
        conversationId: "conv-new",
        publicId: "CONV-NEW",
        customerId: "cust-1",
        subject: null,
        preview: "Hi, is this in stock?",
        createdAt: "2026-07-31T10:00:00.000Z",
        aiState: "HANDLING",
      }),
    );

    const cached = queryClient.getQueryData<{ id: string; aiState: string }[]>(
      chatKeys.conversations(false),
    );
    expect(cached).toHaveLength(1);
    expect(cached?.[0]).toMatchObject({ id: "conv-new", aiState: "HANDLING" });
    expect(
      useChatStore.getState().aiStateByConversation["conv-new"],
    ).toEqual({ aiState: "HANDLING", reason: null });
    // The whole point of this ticket: no refetch of the chat list to move a
    // row. It DOES refresh the staff-notification bell (ticket A6) — a
    // different, deliberate query — so assert precisely rather than blanket.
    expect(invalidateSpy).not.toHaveBeenCalledWith({ queryKey: chatKeys.all });
  });

  it("chat:dashboard:new is a no-op on the cache when the list hasn't loaded yet", () => {
    const { queryClient } = renderSocketHook();
    act(() => fake.simulateConnect());

    act(() =>
      fake.serverEmit("chat:dashboard:new", {
        conversationId: "conv-new",
        publicId: "CONV-NEW",
        customerId: "cust-1",
        subject: null,
        preview: "Hi",
        createdAt: "2026-07-31T10:00:00.000Z",
        aiState: "OFF",
      }),
    );

    expect(
      queryClient.getQueryData(chatKeys.conversations(false)),
    ).toBeUndefined();
  });
});
