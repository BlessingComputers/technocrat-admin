/**
 * Chat normalizers. The shared client unwraps the backend's
 * `{ status, message, data }` envelope (see `lib/api/client-envelope.test.ts`),
 * so these mocks return the inner payload. Regression for the empty-thread bug:
 * the detail parser once read one level too high and dropped `history.messages`.
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

/** The real, observed payload from GET /api/v1/chat/conversations/:id. */
const payload = {
  conversation: {
    id: "d4893014-cee8-4b6f-bf31-3ba31fb13804",
    conversationId: "CONV-MVWGLD4ITH",
    channel: "LIVE_CHAT",
    status: "ACTIVE",
    customers: { firstName: "Elijah", lastName: "Ogungbe", email: "e@x.com" },
  },
  history: {
    messages: [
      {
        id: "m1",
        senderType: "CUSTOMER",
        senderName: "Elijah",
        body: "hello",
        isInternal: false,
        createdAt: "2026-07-12T17:58:03.628Z",
      },
      {
        id: "m2",
        senderType: "STAFF",
        senderName: "Super Admin",
        body: "hi",
        isInternal: false,
        createdAt: "2026-07-12T18:25:15.011Z",
      },
    ],
    nextCursor: null,
  },
  notes: null,
};

describe("chatService.getConversation", () => {
  it("parses history.messages out of the detail payload", async () => {
    get.mockResolvedValue(payload);

    const detail = await chatService.getConversation(
      "d4893014-cee8-4b6f-bf31-3ba31fb13804",
    );

    expect(detail.messages).toHaveLength(2);
    expect(detail.messages.map((m) => m.body)).toEqual(["hello", "hi"]);
    expect(detail.messages[0].senderType).toBe("CUSTOMER");
    expect(detail.name).toBe("Elijah Ogungbe");
  });
});

describe("chatService.listConversations — assigned-admin identity", () => {
  it("maps a nested assignedStaff relation into name/avatar/id", async () => {
    get.mockResolvedValue([
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
    ]);

    const [row] = await chatService.listConversations();

    expect(row.assignedStaffId).toBe("s1");
    expect(row.assignedStaffName).toBe("Grace Bello");
    expect(row.assignedStaffAvatar).toBe("https://x/y.png");
  });

  it("leaves identity null for an unassigned row", async () => {
    get.mockResolvedValue([
      { id: "c2", status: "WAITING", customers: { firstName: "Ada" } },
    ]);

    const [row] = await chatService.listConversations();

    expect(row.assignedStaffId).toBeNull();
    expect(row.assignedStaffName).toBeNull();
    expect(row.assignedStaffAvatar).toBeNull();
  });
});

describe("chatService.listConversations malformed rows", () => {
  it("drops malformed rows instead of trusting every array element", async () => {
    get.mockResolvedValue([
      null,
      "invalid",
      { id: 42 },
      { id: "valid", name: "Ada" },
    ]);

    await expect(chatService.listConversations()).resolves.toMatchObject([
      { id: "valid", name: "Ada" },
    ]);
  });
});

describe("chatService.setAiState — AI stop/resume (A5)", () => {
  it("PATCHes the conversation's /ai route with the requested state", async () => {
    patch.mockResolvedValue({ aiState: "OFF" });

    await chatService.setAiState("conv-1", "OFF");

    expect(patch).toHaveBeenCalledTimes(1);
    const [url, body] = patch.mock.calls[0];
    expect(url).toContain("/v1/chat/conversations/conv-1/ai");
    expect(body).toEqual({ aiState: "OFF" });
  });

  it("sends HANDLING for resume", async () => {
    patch.mockResolvedValue({ aiState: "HANDLING" });

    await chatService.setAiState("conv-1", "HANDLING");

    expect(patch.mock.calls[0][1]).toEqual({ aiState: "HANDLING" });
  });

  it("propagates a 409 (resolved conversation, or resume when not OFF) to the caller", async () => {
    const conflict = Object.assign(new Error("Conflict"), { status: 409 });
    patch.mockRejectedValue(conflict);

    await expect(chatService.setAiState("conv-1", "OFF")).rejects.toBe(
      conflict,
    );
  });
});

describe("chatService.getNotes / getStaffRoomHistory", () => {
  it("returns the notes payload", async () => {
    get.mockResolvedValue({ leadName: "Elijah" });
    const notes = await chatService.getNotes("conv-1");
    expect(notes).toEqual({ leadName: "Elijah" });
  });

  it("returns the inner staff-room history payload", async () => {
    get.mockResolvedValue({
      messages: [{ id: "s1", body: "note" }],
      nextCursor: null,
    });
    const history = await chatService.getStaffRoomHistory();
    expect(history.messages).toHaveLength(1);
  });
});
