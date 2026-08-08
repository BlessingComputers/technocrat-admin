// @vitest-environment jsdom
/**
 * A shadow-mode reply (`isInternal: true`) never reached the customer over
 * WhatsApp — staff must see an explicit marker and must never see a delivery
 * tick for it (ticket A3). Covers both the AI bubble (the common shadow case)
 * and the plain STAFF branch (defensive: `isInternal` gates the tick
 * independently of `senderType`, per the decision document).
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { AI_SENDER_ID } from "@/lib/constants/ai-sender";
import { MessageBubble } from "./message-bubble";
import type { WhatsAppMessage } from "../types/whatsapp";

const base: WhatsAppMessage = {
  id: "msg-1",
  messageId: "wamid.1",
  conversationId: "conv-1",
  waMessageId: null,
  senderType: "SYSTEM",
  senderId: AI_SENDER_ID,
  senderName: "Blessing Assistant",
  body: "Your order ships tomorrow.",
  mediaUrl: null,
  status: "SHADOW",
  createdAt: "2026-07-31T10:00:00.000Z",
  updatedAt: "2026-07-31T10:00:00.000Z",
};

describe("MessageBubble — shadow mode", () => {
  it("an internal AI reply shows the not-sent marker and no delivery tick", () => {
    render(<MessageBubble message={{ ...base, isInternal: true }} />);

    expect(
      screen.getByText("Shadow mode — not visible to customer"),
    ).toBeTruthy();
    expect(screen.queryByTitle(/sent|delivered|read/i)).toBeNull();
  });

  it("a delivered (non-internal) AI reply shows no shadow marker", () => {
    render(
      <MessageBubble message={{ ...base, status: "SENT", isInternal: false }} />,
    );

    expect(
      screen.queryByText("Shadow mode — not visible to customer"),
    ).toBeNull();
  });

  it("an internal STAFF message shows no delivery tick, even with a sent-looking status", () => {
    render(
      <MessageBubble
        message={{
          ...base,
          senderType: "STAFF",
          senderId: "staff-1",
          status: "SENT",
          isInternal: true,
        }}
      />,
    );

    expect(screen.queryByTitle(/sent|delivered|read/i)).toBeNull();
  });

  it("a normal STAFF message keeps its delivery tick unchanged", () => {
    render(
      <MessageBubble
        message={{
          ...base,
          senderType: "STAFF",
          senderId: "staff-1",
          status: "SENT",
          isInternal: false,
        }}
      />,
    );

    expect(screen.getByTitle("Sent")).toBeTruthy();
  });
});
