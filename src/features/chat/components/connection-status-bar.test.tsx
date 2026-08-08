// @vitest-environment jsdom
/** The workspace must visibly reflect a dropped connection (ticket #27). */

import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ConnectionStatusBar } from "./connection-status-bar";

describe("ConnectionStatusBar", () => {
  it("shows the offline banner while reconnecting", () => {
    render(<ConnectionStatusBar status="reconnecting" />);
    expect(screen.getByRole("status").textContent).toContain(
      "Connection lost — reconnecting",
    );
  });

  it("renders nothing when connected", () => {
    const { container } = render(<ConnectionStatusBar status="connected" />);
    expect(container.innerHTML).toBe("");
  });

  it("renders nothing during the initial connect", () => {
    const { container } = render(<ConnectionStatusBar status="connecting" />);
    expect(container.innerHTML).toBe("");
  });
});
