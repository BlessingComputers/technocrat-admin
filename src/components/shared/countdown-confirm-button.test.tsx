// @vitest-environment jsdom
import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CountdownConfirmButton } from "./countdown-confirm-button";

beforeEach(() => vi.useFakeTimers());
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

function setup(props: { disabled?: boolean } = {}) {
  const onConfirm = vi.fn();
  const view = render(
    <CountdownConfirmButton onConfirm={onConfirm} {...props}>
      Turn off 2 and save
    </CountdownConfirmButton>,
  );
  return { onConfirm, button: screen.getByRole("button"), ...view };
}

const advance = (ms: number) => act(() => vi.advanceTimersByTime(ms));

describe("CountdownConfirmButton", () => {
  it("fires once, five seconds after one click, counting down the label", () => {
    const { onConfirm, button } = setup();
    fireEvent.click(button);
    expect(button.textContent).toBe("Saving in 5s · click to cancel");

    advance(1000);
    expect(button.textContent).toBe("Saving in 4s · click to cancel");
    advance(3000);
    expect(button.textContent).toBe("Saving in 1s · click to cancel");
    expect(onConfirm).not.toHaveBeenCalled();

    advance(1000);
    expect(onConfirm).toHaveBeenCalledTimes(1);
    expect(button.textContent).toBe("Turn off 2 and save");

    advance(10_000);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("cancels on a second click and can start again", () => {
    const { onConfirm, button } = setup();
    fireEvent.click(button);
    advance(3000);
    fireEvent.click(button);
    expect(button.textContent).toBe("Turn off 2 and save");

    advance(10_000);
    expect(onConfirm).not.toHaveBeenCalled();

    fireEvent.click(button);
    advance(5000);
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it("never fires after it unmounts (Back, or the dialog closing)", () => {
    const { onConfirm, button, unmount } = setup();
    fireEvent.click(button);
    advance(2000);
    unmount();
    advance(10_000);
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it("does nothing while disabled", () => {
    const { onConfirm, button } = setup({ disabled: true });
    fireEvent.click(button);
    advance(10_000);
    expect(onConfirm).not.toHaveBeenCalled();
    expect(button.textContent).toBe("Turn off 2 and save");
  });
});
