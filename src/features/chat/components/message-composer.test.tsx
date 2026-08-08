// @vitest-environment jsdom
/**
 * The reply area is the enforcement point for the manual-take model: an onlooker
 * admin (chat owned by someone else) must see a read-only "taken by X" notice and
 * NO way to send; an unassigned chat offers "Take"; the owner/super admin gets a
 * composer.
 */

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { MessageComposer } from "./message-composer";

const noop = () => {};

describe("MessageComposer — assignment states", () => {
  it("owned by another admin: shows 'taken by X', no composer, no Take", () => {
    render(
      <MessageComposer
        onSend={vi.fn()}
        onTypingStart={noop}
        onTypingStop={noop}
        canReply={false}
        assignmentState="other"
        assignedStaffName="Grace Bello"
      />,
    );

    expect(screen.getByText(/taken by/i)).toBeTruthy();
    expect(screen.getByText("Grace Bello")).toBeTruthy();
    expect(screen.queryByText(/take chat/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/type your message/i)).toBeNull();
  });

  it("unassigned: offers Take instead of a composer", () => {
    render(
      <MessageComposer
        onSend={vi.fn()}
        onTypingStart={noop}
        onTypingStop={noop}
        canReply={false}
        assignmentState="unassigned"
        onTake={vi.fn()}
      />,
    );

    expect(screen.getByText(/take chat/i)).toBeTruthy();
    expect(screen.queryByPlaceholderText(/type your message/i)).toBeNull();
  });

  it("owner / super admin: renders the composer input", () => {
    render(
      <MessageComposer
        onSend={vi.fn()}
        onTypingStart={noop}
        onTypingStop={noop}
        canReply
        assignmentState="mine"
      />,
    );

    expect(screen.getByPlaceholderText(/type your message/i)).toBeTruthy();
  });
});
