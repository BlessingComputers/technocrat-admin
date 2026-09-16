// @vitest-environment jsdom
/**
 * The recipient dialog's job beyond collecting three fields: keep a duplicate
 * address (the backend's 409) attached to the field that caused it, and stop
 * claiming it the moment the address changes — a conflict shown under a
 * corrected address is worse than no message at all.
 */

import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { RecipientFormDialog } from "./recipient-form-dialog";
import type { SalesNotificationEmail } from "../types/sales-notifications";

const EXISTING: SalesNotificationEmail = {
  id: "row-1",
  email: "accounts@technocratng.com",
  label: "Accounts",
  isActive: true,
  createdByStaffId: "staff-1",
  createdBy: { id: "staff-1", firstName: "Ada", lastName: "Obi" },
  createdAt: "2026-08-20T09:00:00.000Z",
  updatedAt: "2026-08-20T09:00:00.000Z",
};

function renderDialog(
  props: Partial<Parameters<typeof RecipientFormDialog>[0]> = {},
) {
  const onSubmit = vi.fn();
  const result = render(
    <RecipientFormDialog
      isOpen
      onOpenChange={vi.fn()}
      initial={null}
      onSubmit={onSubmit}
      isSubmitting={false}
      {...props}
    />,
  );
  return { ...result, onSubmit };
}

const emailInput = () =>
  screen.getByLabelText("Email address") as HTMLInputElement;

const submit = () =>
  fireEvent.submit(screen.getByRole("button", { name: /Add Recipient|Update Recipient/ }).closest("form")!);

describe("RecipientFormDialog", () => {
  it("submits a trimmed email with the label omitted when left blank", () => {
    const { onSubmit } = renderDialog();

    fireEvent.change(emailInput(), {
      target: { value: "  sales@technocratng.com  " },
    });
    submit();

    expect(onSubmit).toHaveBeenCalledWith({
      email: "sales@technocratng.com",
      label: undefined,
      isActive: true,
    });
  });

  it("rejects a malformed address before it reaches the API", () => {
    const { onSubmit } = renderDialog();

    fireEvent.change(emailInput(), { target: { value: "not-an-email" } });
    submit();

    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).toMatch(/valid email/i);
  });

  it("shows the duplicate as an inline field error, not a bare toast", () => {
    renderDialog({
      initial: EXISTING,
      duplicateEmail: EXISTING.email,
    });

    const error = screen.getByRole("alert");
    expect(error.textContent).toContain(EXISTING.email);
    expect(error.textContent).toMatch(/already on the list/i);
    expect(emailInput().getAttribute("aria-invalid")).toBe("true");
  });

  it("drops the duplicate error once the address is edited to something else", () => {
    renderDialog({ initial: EXISTING, duplicateEmail: EXISTING.email });

    expect(screen.queryByRole("alert")).not.toBeNull();

    fireEvent.change(emailInput(), {
      target: { value: "warehouse@technocratng.com" },
    });

    expect(screen.queryByRole("alert")).toBeNull();
    expect(emailInput().getAttribute("aria-invalid")).toBe("false");
  });

  it("still flags the duplicate when only the casing differs — the column is unique either way", () => {
    renderDialog({ initial: EXISTING, duplicateEmail: EXISTING.email });

    fireEvent.change(emailInput(), {
      target: { value: "ACCOUNTS@technocratng.com" },
    });

    expect(screen.queryByRole("alert")).not.toBeNull();
  });

  it("prefills from the recipient being edited", () => {
    renderDialog({ initial: EXISTING });

    expect(emailInput().value).toBe(EXISTING.email);
    expect((screen.getByLabelText(/^Label/) as HTMLInputElement).value).toBe(
      "Accounts",
    );
    expect(
      screen.getByRole("button", { name: "Update Recipient" }),
    ).toBeTruthy();
  });

  it("emits isActive: false when the recipient is paused in the form", () => {
    const { onSubmit } = renderDialog({ initial: EXISTING });

    fireEvent.click(screen.getByRole("switch"));
    submit();

    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ isActive: false }),
    );
  });
});
