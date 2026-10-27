// @vitest-environment jsdom
/**
 * The "AI is still answering" strip exists because claiming a conversation
 * stopped silencing the AI. It must appear exactly when an agent owns a chat
 * the AI is still working, and nowhere else.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiActiveNotice } from "./ai-active-notice";

function renderNotice(props: Partial<Parameters<typeof AiActiveNotice>[0]>) {
  return render(
    <AiActiveNotice
      aiState="HANDLING"
      assignmentState="mine"
      isResolved={false}
      isPending={false}
      onStop={vi.fn()}
      {...props}
    />,
  );
}

describe("AiActiveNotice", () => {
  it("warns the owning agent that the AI is still replying, and offers the stop", () => {
    renderNotice({});

    expect(screen.getByText(/still answering the customer/i)).toBeTruthy();
    expect(screen.getByRole("button", { name: "Stop AI" })).toBeTruthy();
  });

  it("stops the AI when the strip's button is used", () => {
    const onStop = vi.fn();
    renderNotice({ onStop });

    screen.getByRole("button", { name: "Stop AI" }).click();
    expect(onStop).toHaveBeenCalledTimes(1);
  });

  it("stays quiet on an unclaimed conversation — the AI answering is the norm there", () => {
    const { container } = renderNotice({ assignmentState: "unassigned" });
    expect(container.innerHTML).toBe("");
  });

  it("stays quiet for an onlooker who does not own the chat", () => {
    const { container } = renderNotice({ assignmentState: "other" });
    expect(container.innerHTML).toBe("");
  });

  it("stays quiet once the AI is stopped or escalated", () => {
    expect(renderNotice({ aiState: "OFF" }).container.innerHTML).toBe("");
    expect(renderNotice({ aiState: "ESCALATED" }).container.innerHTML).toBe("");
  });

  it("stays quiet on a resolved conversation", () => {
    const { container } = renderNotice({ isResolved: true });
    expect(container.innerHTML).toBe("");
  });

  it("disables the stop while a state change is in flight", () => {
    renderNotice({ isPending: true });
    const button = screen.getByRole("button", { name: "Stop AI" });
    expect((button as HTMLButtonElement).disabled).toBe(true);
  });
});
