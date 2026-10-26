// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import { authService } from "../api/auth.service";
import { ResetPasswordForm } from "./reset-password-form";

const { nav, logoutAction, hardNavigate } = vi.hoisted(() => ({
  nav: { search: "" },
  logoutAction: vi.fn().mockResolvedValue(null),
  hardNavigate: vi.fn(),
}));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock("@/lib/auth/logout-action", () => ({ logoutAction }));
vi.mock("@/lib/auth/hard-navigate", () => ({ hardNavigate }));
// next/image's static PNG import has no width under Vitest; the logo is not under test.
vi.mock("@/components/shared/logo", () => ({ Logo: () => null }));
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
  nav.search = "";
});

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ResetPasswordForm />
    </QueryClientProvider>,
  );
}

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

function setNewPassword() {
  fill("New Password", "Blessing#2026");
  fill("Confirm New Password", "Blessing#2026");
  fireEvent.click(screen.getByRole("button", { name: "Set new password" }));
}

describe("reset password", () => {
  it("uses the token from the link, signs out locally, then goes to /login", async () => {
    nav.search = "token=abc123";
    const reset = vi
      .spyOn(authService, "resetPassword")
      .mockResolvedValue({ success: true, message: "ok", data: "" });
    renderForm();

    expect(screen.queryByLabelText("Reset code or link")).toBeNull();
    setNewPassword();

    await waitFor(() =>
      expect(hardNavigate).toHaveBeenCalledWith("/login?notice=password-reset"),
    );
    expect(reset).toHaveBeenCalledWith({ token: "abc123", newPassword: "Blessing#2026" });
    expect(logoutAction).toHaveBeenCalledOnce();
  });

  it("pulls the token out of a pasted email link", async () => {
    const reset = vi
      .spyOn(authService, "resetPassword")
      .mockResolvedValue({ success: true, message: "ok", data: "" });
    renderForm();

    fill(
      "Reset code or link",
      " https://admin.technocratng.com/reset-password?token=deadbeef ",
    );
    setNewPassword();

    await waitFor(() =>
      expect(reset).toHaveBeenCalledWith({ token: "deadbeef", newPassword: "Blessing#2026" }),
    );
  });

  it("offers a new link when the token is expired or used", async () => {
    nav.search = "token=stale";
    vi.spyOn(authService, "resetPassword").mockRejectedValue(
      new ApiError("Invalid or expired reset link", 400, {
        code: "INVALID_RESET_TOKEN",
        message: "Invalid or expired reset link",
      }),
    );
    renderForm();
    setNewPassword();

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Invalid or expired reset link");
    expect(
      screen.getByRole("link", { name: "Request a new link" }).getAttribute("href"),
    ).toBe("/forgot-password");
    expect(logoutAction).not.toHaveBeenCalled();
  });
});
