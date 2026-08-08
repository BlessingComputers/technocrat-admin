/**
 * Guards the response-envelope handling: the backend wraps chat responses in a
 * `{ status, message, data }` envelope the shared client does NOT auto-unwrap
 * (it only unwraps a boolean `success`). Regression for the empty-thread bug —
 * the detail parser read one level too high and dropped `history.messages`.
 */

import { beforeEach, describe, expect, it, vi } from "vitest";

const get = vi.fn();
const patch = vi.fn();
vi.mock("@/lib/api/client", () => ({
  api: {
    get: (...a: unknown[]) => get(...a),
    patch: (...a: unknown[]) => patch(...a),
  },
}));

import { chatService } from "./chat.service";

beforeEach(() => {
  get.mockReset();
  patch.mockReset();
});

/** The real, observed envelope from GET /api/v1/chat/conversations/:id. */
const envelope = {
  status: "success",
  message: "Success",
  data: {
    conversation: {
      id: "d4893014-cee8-4b6f-bf31-3ba31fb13804",
      conversationId: "CONV-MVWGLD4ITH",
      channel: "LIVE_CHAT",
      status: "ACTIVE",
      customers: { firstName: "Elijah", lastName: "Ogungbe", email: "e@x.com" },
    },
    history: {
      messages: [
        { id: "m1", senderType: "CUSTOMER", senderName: "Elijah", body: "hello", isInternal: false, createdAt: "2026-07-12T17:58:03.628Z" },
        { id: "m2", senderType: "STAFF", senderName: "Super Admin", body: "hi", isInternal: false, createdAt: "2026-07-12T18:25:15.011Z" },
      ],
      nextCursor: null,
    },
    notes: null,
  },
};

describe("chatService.getConversation — envelope unwrapping", () => {
  it("parses history.messages out of the { status, data } envelope", async () => {
    get.mockResolvedValue(envelope);

    const detail = await chatService.getConversation(
      "d4893014-cee8-4b6f-bf31-3ba31fb13804",
    );

    expect(detail.messages).toHaveLength(2);
    expect(detail.messages.map((m) => m.body)).toEqual(["hello", "hi"]);
    expect(detail.messages[0].senderType).toBe("CUSTOMER");
    expect(detail.name).toBe("Elijah Ogungbe");
  });

  it("still works if a caller/client hands back an already-unwrapped payload", async () => {
    get.mockResolvedValue(envelope.data);

    const detail = await chatService.getConversation("d4893014-cee8-4b6f-bf31-3ba31fb13804");

    expect(detail.messages).toHaveLength(2);
  });
});

describe("chatService.listConversations — assigned-admin identity", () => {
  it("maps a nested assignedStaff relation into name/avatar/id", async () => {
    get.mockResolvedValue({
      status: "success",
      data: [
        {
          id: "c1",
          conversationId: "CONV-1",
          status: "ACTIVE",
          assignedStaffId: "s1",
          assignedStaff: {
            id: "s1",
            firstName: "Grace",
            lastName: "Bello",
            avatarUrl: "https://x/y.png",
          },
          customers: { firstName: "Ada", lastName: "Obi" },
        },
      ],
    });

    const [row] = await chatService.listConversations();

    expect(row.assignedStaffId).toBe("s1");
    expect(row.assignedStaffName).toBe("Grace Bello");
    expect(row.assignedStaffAvatar).toBe("https://x/y.png");
  });

  it("leaves identity null for an unassigned row", async () => {
    get.mockResolvedValue({
      status: "success",
      data: [{ id: "c2", status: "WAITING", customers: { firstName: "Ada" } }],
    });

    const [row] = await chatService.listConversations();

    expect(row.assignedStaffId).toBeNull();
    expect(row.assignedStaffName).toBeNull();
    expect(row.assignedStaffAvatar).toBeNull();
  });
});

describe("chatService.setAiState — AI stop/resume (A5)", () => {
  it("PATCHes the conversation's /ai route with the requested state", async () => {
    patch.mockResolvedValue({ status: "success", data: { aiState: "OFF" } });

    await chatService.setAiState("conv-1", "OFF");

    expect(patch).toHaveBeenCalledTimes(1);
    const [url, body] = patch.mock.calls[0];
    expect(url).toContain("/v1/chat/conversations/conv-1/ai");
    expect(body).toEqual({ aiState: "OFF" });
  });

  it("sends HANDLING for resume", async () => {
    patch.mockResolvedValue({ status: "success", data: { aiState: "HANDLING" } });

    await chatService.setAiState("conv-1", "HANDLING");

    expect(patch.mock.calls[0][1]).toEqual({ aiState: "HANDLING" });
  });

  it("propagates a 409 (resolved conversation, or resume when not OFF) to the caller", async () => {
    const conflict = Object.assign(new Error("Conflict"), { status: 409 });
    patch.mockRejectedValue(conflict);

    await expect(chatService.setAiState("conv-1", "OFF")).rejects.toBe(conflict);
  });
});

describe("chatService.getNotes / getStaffRoomHistory — envelope unwrapping", () => {
  it("returns the inner notes payload, not the envelope", async () => {
    get.mockResolvedValue({ status: "success", data: { leadName: "Elijah" } });
    const notes = await chatService.getNotes("conv-1");
    expect(notes).toEqual({ leadName: "Elijah" });
  });

  it("returns the inner staff-room history payload", async () => {
    get.mockResolvedValue({
      status: "success",
      data: { messages: [{ id: "s1", body: "note" }], nextCursor: null },
    });
    const history = await chatService.getStaffRoomHistory();
    expect(history.messages).toHaveLength(1);
  });
});
