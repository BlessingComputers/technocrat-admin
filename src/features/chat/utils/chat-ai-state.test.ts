import { describe, expect, it } from "vitest";
import {
  applyAiStateOverlay,
  needsHuman,
  splitQueueByAiState,
} from "./chat-ai-state";
import type { ConversationSummary } from "../types/chat";

function conversation(overrides: Partial<ConversationSummary>): ConversationSummary {
  return {
    id: "conv-1",
    channel: "LIVE_CHAT",
    status: "WAITING",
    name: "Customer",
    aiState: "OFF",
    ...overrides,
  };
}

describe("needsHuman", () => {
  it("is true for ESCALATED and OFF, false for HANDLING", () => {
    expect(needsHuman("ESCALATED")).toBe(true);
    expect(needsHuman("OFF")).toBe(true);
    expect(needsHuman("HANDLING")).toBe(false);
  });
});

describe("splitQueueByAiState", () => {
  it("partitions conversations into needsHuman and aiHandling groups", () => {
    const conversations = [
      conversation({ id: "a", aiState: "HANDLING" }),
      conversation({ id: "b", aiState: "ESCALATED" }),
      conversation({ id: "c", aiState: "OFF" }),
      conversation({ id: "d", aiState: "HANDLING" }),
    ];

    const { needsHuman: humanGroup, aiHandling } =
      splitQueueByAiState(conversations);

    expect(humanGroup.map((c) => c.id)).toEqual(["b", "c"]);
    expect(aiHandling.map((c) => c.id)).toEqual(["a", "d"]);
  });
});

describe("applyAiStateOverlay", () => {
  it("updates the matching conversation's aiState and reason", () => {
    const conversations = [conversation({ id: "conv-1", aiState: "HANDLING" })];

    const result = applyAiStateOverlay(conversations, {
      "conv-1": { aiState: "ESCALATED", reason: "FRUSTRATION" },
    });

    expect(result[0].aiState).toBe("ESCALATED");
    expect(result[0].aiEscalationReason).toBe("FRUSTRATION");
  });

  it("leaves a conversation with no overlay entry unchanged", () => {
    const conversations = [conversation({ id: "conv-1", aiState: "HANDLING" })];

    const result = applyAiStateOverlay(conversations, {
      "conv-2": { aiState: "ESCALATED", reason: "ERROR" },
    });

    expect(result[0].aiState).toBe("HANDLING");
  });

  it("is a no-op for an overlay entry whose conversationId isn't in the list — no phantom row", () => {
    const conversations = [conversation({ id: "conv-1", aiState: "HANDLING" })];

    const result = applyAiStateOverlay(conversations, {
      "conv-unknown": { aiState: "ESCALATED", reason: "BLOCKED_TOPIC" },
    });

    expect(result).toHaveLength(1);
    expect(result.map((c) => c.id)).toEqual(["conv-1"]);
  });
});
