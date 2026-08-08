// @vitest-environment jsdom
/**
 * Visibility logic for the AI stop/resume control (ticket A5): Resume shows
 * only when `aiState === 'OFF'`, and nothing shows on a resolved conversation
 * — an escalated conversation gets no Resume, never a disabled one.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { AiStopControl } from "./ai-stop-control";

describe("AiStopControl", () => {
  it("shows Stop when the AI is handling", () => {
    render(
      <AiStopControl
        aiState="HANDLING"
        isResolved={false}
        isPending={false}
        onStop={vi.fn()}
        onResume={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Stop AI on this conversation" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /resume/i })).toBeNull();
  });

  it("shows Stop, not a disabled Resume, on an escalated conversation", () => {
    render(
      <AiStopControl
        aiState="ESCALATED"
        isResolved={false}
        isPending={false}
        onStop={vi.fn()}
        onResume={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Stop AI on this conversation" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /resume/i })).toBeNull();
  });

  it("shows Resume only when the AI is OFF", () => {
    render(
      <AiStopControl
        aiState="OFF"
        isResolved={false}
        isPending={false}
        onStop={vi.fn()}
        onResume={vi.fn()}
      />,
    );
    expect(
      screen.getByRole("button", { name: "Resume AI on this conversation" }),
    ).toBeTruthy();
    expect(screen.queryByRole("button", { name: /stop/i })).toBeNull();
  });

  it("renders nothing on a resolved conversation, regardless of aiState", () => {
    const { container } = render(
      <AiStopControl
        aiState="OFF"
        isResolved
        isPending={false}
        onStop={vi.fn()}
        onResume={vi.fn()}
      />,
    );
    expect(container.innerHTML).toBe("");
  });
});
