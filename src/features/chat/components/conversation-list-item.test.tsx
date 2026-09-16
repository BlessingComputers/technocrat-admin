// @vitest-environment jsdom
/**
 * The AI badge on a conversation row branches on `aiState`, never on whether
 * an escalation reason happens to be set.
 *
 * `CANNOT_ANSWER` and `ERROR` are recorded per message while `aiState` stays
 * `HANDLING` — the AI skipped one message and will be asked again on the
 * customer's next one. The tempting "show the reason whenever there is one"
 * simplification would therefore label a working conversation as needing a
 * human. Nothing in the component's shape prevents that refactor, so this
 * pins it.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { ConversationListItem } from "./conversation-list-item";
import type { ConversationSummary } from "../types/chat";

function conversation(
  overrides: Partial<ConversationSummary>,
): ConversationSummary {
  return {
    id: "c1",
    channel: "LIVE_CHAT",
    status: "ACTIVE",
    name: "Ada Customer",
    aiState: "OFF",
    ...overrides,
  } as ConversationSummary;
}

function renderRow(overrides: Partial<ConversationSummary>) {
  return render(
    <ConversationListItem
      conversation={conversation(overrides)}
      isActive={false}
      isTyping={false}
      unreadCount={0}
      showTake={false}
      onSelect={vi.fn()}
      onTake={vi.fn()}
    />,
  );
}

describe("ConversationListItem AI badge", () => {
  it("reads 'AI handling' when a per-message reason is set but the AI is still HANDLING", () => {
    renderRow({ aiState: "HANDLING", aiEscalationReason: "CANNOT_ANSWER" });

    expect(screen.getByText("AI handling")).toBeTruthy();
    expect(screen.queryByText("AI couldn't answer")).toBeNull();
  });

  it("reads 'AI handling' for a transient ERROR too", () => {
    renderRow({ aiState: "HANDLING", aiEscalationReason: "ERROR" });

    expect(screen.getByText("AI handling")).toBeTruthy();
    expect(screen.queryByText("AI ran into an error")).toBeNull();
  });

  it("shows the reason label only once the AI has actually escalated", () => {
    renderRow({ aiState: "ESCALATED", aiEscalationReason: "CUSTOMER_REQUESTED" });

    expect(screen.getByText("Customer asked for a person")).toBeTruthy();
    expect(screen.queryByText("AI handling")).toBeNull();
  });

  it("falls back to 'Needs a human' on an escalation with no reason", () => {
    renderRow({ aiState: "ESCALATED", aiEscalationReason: null });

    expect(screen.getByText("Needs a human")).toBeTruthy();
  });

  it("shows no badge at all when the AI is OFF", () => {
    renderRow({ aiState: "OFF", aiEscalationReason: null });

    expect(screen.queryByText("AI handling")).toBeNull();
    expect(screen.queryByText("Needs a human")).toBeNull();
  });

  it("still shows 'AI handling' on a claimed conversation — claiming no longer stops the AI", () => {
    renderRow({ aiState: "HANDLING", assignedStaffId: "staff-1" });

    expect(screen.getByText("AI handling")).toBeTruthy();
  });
});
