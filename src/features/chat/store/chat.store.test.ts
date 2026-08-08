/**
 * Store-level guarantees the reconnect refetch depends on (ticket #27): a
 * REST re-seed must not eat a still-unacked optimistic send, and inbound
 * deltas must dedupe by id/idempotencyKey.
 */

import { beforeEach, describe, expect, it } from "vitest";
import { useChatStore } from "./chat.store";
import type { ChatMessage } from "../types/chat";

function message(overrides: Partial<ChatMessage>): ChatMessage {
  return {
    id: "m1",
    conversationId: "conv-1",
    senderType: "STAFF",
    senderName: "Femi",
    body: "hello",
    createdAt: "2026-07-10T12:00:00.000Z",
    ...overrides,
  };
}

beforeEach(() => {
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

describe("seedMessages", () => {
  it("replaces persisted history but keeps a still-pending optimistic send", () => {
    const store = useChatStore.getState();
    store.appendMessage(
      "conv-1",
      message({ id: "", idempotencyKey: "key-1", body: "unacked send" }),
    );

    store.seedMessages("conv-1", [
      message({ id: "m1", body: "from history" }),
    ]);

    const list = useChatStore.getState().messagesByConversation["conv-1"];
    expect(list.map((m) => m.body)).toEqual(["from history", "unacked send"]);
  });

  it("drops the pending copy when the seed already contains it (by idempotencyKey)", () => {
    const store = useChatStore.getState();
    store.appendMessage(
      "conv-1",
      message({ id: "", idempotencyKey: "key-1", body: "now persisted" }),
    );

    store.seedMessages("conv-1", [
      message({ id: "m9", idempotencyKey: "key-1", body: "now persisted" }),
    ]);

    const list = useChatStore.getState().messagesByConversation["conv-1"];
    expect(list).toHaveLength(1);
    expect(list[0].id).toBe("m9");
  });
});

describe("receiveMessage (#26 — key-based dedup only)", () => {
  it("ignores a duplicate delivery of the same message id", () => {
    const store = useChatStore.getState();
    store.receiveMessage("conv-1", message({ id: "m1" }));
    store.receiveMessage("conv-1", message({ id: "m1" }));

    expect(
      useChatStore.getState().messagesByConversation["conv-1"],
    ).toHaveLength(1);
  });

  it("ignores an echo carrying the pending optimistic's idempotencyKey", () => {
    const store = useChatStore.getState();
    store.appendMessage(
      "conv-1",
      message({ id: "", idempotencyKey: "key-1", body: "mine" }),
    );
    store.receiveMessage(
      "conv-1",
      message({ id: "m5", idempotencyKey: "key-1", body: "mine" }),
    );

    expect(
      useChatStore.getState().messagesByConversation["conv-1"],
    ).toHaveLength(1);
  });

  it("keeps duplicate-text messages with different keys distinct (no text matching)", () => {
    const store = useChatStore.getState();
    store.appendMessage(
      "conv-1",
      message({ id: "", idempotencyKey: "key-1", body: "same text" }),
    );
    store.receiveMessage(
      "conv-1",
      message({ id: "m2", idempotencyKey: "key-2", body: "same text" }),
    );

    expect(
      useChatStore.getState().messagesByConversation["conv-1"],
    ).toHaveLength(2);
  });
});

describe("previewByConversation (left-rail last-message line)", () => {
  it("tracks the latest message for a conversation as messages arrive", () => {
    const store = useChatStore.getState();
    store.receiveMessage("conv-1", message({ id: "m1", body: "first" }));
    store.receiveMessage("conv-1", message({ id: "m2", body: "second" }));

    expect(
      useChatStore.getState().previewByConversation["conv-1"]?.body,
    ).toBe("second");
  });

  it("seeds a preview for an unopened conversation from a preview-only event", () => {
    // `chat:dashboard:new` / `notification:new` carry only a preview string —
    // no full message and no opened thread — yet the row must still show it.
    const store = useChatStore.getState();
    store.setPreview("conv-9", "customer's first message", "2026-07-12T09:00:00.000Z");

    expect(useChatStore.getState().previewByConversation["conv-9"]).toEqual({
      body: "customer's first message",
      at: "2026-07-12T09:00:00.000Z",
    });
    // No full message was added to the thread.
    expect(
      useChatStore.getState().messagesByConversation["conv-9"],
    ).toBeUndefined();
  });

  it("ignores internal notes and system lines so they never become the preview", () => {
    const store = useChatStore.getState();
    store.receiveMessage("conv-1", message({ id: "m1", body: "real reply" }));
    store.appendMessage(
      "conv-1",
      message({ id: "m2", body: "internal note", isInternal: true }),
    );

    expect(
      useChatStore.getState().previewByConversation["conv-1"]?.body,
    ).toBe("real reply");
  });
});

describe("ackMessage (#26 — routed by idempotencyKey, not selection)", () => {
  it("resolves the pending message in its own conversation even when another is selected", () => {
    const store = useChatStore.getState();
    store.appendMessage(
      "conv-1",
      message({ id: "", idempotencyKey: "key-1", body: "mine" }),
    );
    store.appendMessage("conv-2", message({ id: "m-other", body: "other" }));
    store.select("conv-2");

    store.ackMessage({
      idempotencyKey: "key-1",
      tempId: "t1",
      createdAt: "2026-07-10T12:01:00.000Z",
    });

    const state = useChatStore.getState();
    expect(state.messagesByConversation["conv-1"][0].id).toBe("t1");
    expect(state.messagesByConversation["conv-2"][0].id).toBe("m-other");
  });

  it("is a no-op for an unknown idempotencyKey", () => {
    const store = useChatStore.getState();
    store.appendMessage("conv-1", message({ id: "m1" }));

    store.ackMessage({
      idempotencyKey: "nope",
      tempId: "t9",
      createdAt: "2026-07-10T12:01:00.000Z",
    });

    expect(
      useChatStore.getState().messagesByConversation["conv-1"][0].id,
    ).toBe("m1");
  });
});

describe("aiStateByConversation (ticket A4)", () => {
  it("applying a chat:ai:state transition updates that conversation and leaves others untouched", () => {
    const store = useChatStore.getState();
    store.setAiState("conv-1", "HANDLING");
    store.setAiState("conv-2", "HANDLING");

    store.setAiState("conv-1", "ESCALATED", "CANNOT_ANSWER");

    const state = useChatStore.getState();
    expect(state.aiStateByConversation["conv-1"]).toEqual({
      aiState: "ESCALATED",
      reason: "CANNOT_ANSWER",
    });
    expect(state.aiStateByConversation["conv-2"]).toEqual({
      aiState: "HANDLING",
      reason: null,
    });
  });

  it("a chat:dashboard:new payload seeds aiState with no escalation reason", () => {
    const store = useChatStore.getState();
    store.setAiState("conv-9", "HANDLING", null);

    expect(useChatStore.getState().aiStateByConversation["conv-9"]).toEqual({
      aiState: "HANDLING",
      reason: null,
    });
  });

  it("defaults the reason to null when omitted", () => {
    const store = useChatStore.getState();
    store.setAiState("conv-1", "OFF");

    expect(useChatStore.getState().aiStateByConversation["conv-1"].reason).toBeNull();
  });
});
