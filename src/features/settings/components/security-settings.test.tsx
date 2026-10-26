// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import { settingsService } from "../api/settings.service";
import { SecuritySettings } from "./security-settings";

const { logoutAction, hardNavigate } = vi.hoisted(() => ({
  logoutAction: vi.fn().mockResolvedValue(null),
  hardNavigate: vi.fn(),
}));
vi.mock("@/lib/auth/logout-action", () => ({ logoutAction }));
vi.mock("@/lib/auth/hard-navigate", () => ({ hardNavigate }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  logoutAction.mockClear();
  hardNavigate.mockClear();
});

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <SecuritySettings />
    </QueryClientProvider>,
  );
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("changing the password", () => {
  it("keeps submit disabled until the new password passes every rule and matches", () => {
    renderForm();
    const submit = screen.getByRole("button", { name: "Update Password" });
    fill("Current Password", "Old#Pass1");
    fill("New Password", "weakpass");
    fill("Confirm New Password", "weakpass");
    expect(submit.hasAttribute("disabled")).toBe(true);
    fill("New Password", "Blessing#2026");
    expect(submit.hasAttribute("disabled")).toBe(true);
    fill("Confirm New Password", "Blessing#2026");
    expect(submit.hasAttribute("disabled")).toBe(false);
  });

  it("sends both passwords, clears local cookies, then goes to /login", async () => {
    const change = vi
      .spyOn(settingsService, "changePassword")
      .mockResolvedValue({ success: true, message: "Password changed, please log in again" });
    renderForm();
    fill("Current Password", "Old#Pass1");
    fill("New Password", "Blessing#2026");
    fill("Confirm New Password", "Blessing#2026");
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    await waitFor(() =>
      expect(hardNavigate).toHaveBeenCalledWith("/login?notice=password-changed"),
    );
    expect(change).toHaveBeenCalledWith({
      currentPassword: "Old#Pass1",
      newPassword: "Blessing#2026",
    });
    expect(logoutAction).toHaveBeenCalledOnce();
  });

  it("shows the error and stays put when the current password is wrong", async () => {
    vi.spyOn(settingsService, "changePassword").mockRejectedValue(
      new ApiError("Current password is incorrect", 401, {
        code: "WRONG_PASSWORD",
        message: "Current password is incorrect",
      }),
    );
    renderForm();
    fill("Current Password", "Wrong#123");
    fill("New Password", "Blessing#2026");
    fill("Confirm New Password", "Blessing#2026");
    fireEvent.click(screen.getByRole("button", { name: "Update Password" }));

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Current password is incorrect");
    expect(hardNavigate).not.toHaveBeenCalled();
    expect(logoutAction).not.toHaveBeenCalled();
  });

  it("links to the email reset for staff who forgot the current password", () => {
    renderForm();
    expect(
      screen.getByRole("link", { name: "Forgot your current password?" }).getAttribute("href"),
    ).toBe("/forgot-password");
  });
});
