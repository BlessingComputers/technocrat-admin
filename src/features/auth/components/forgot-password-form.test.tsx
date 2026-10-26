// @vitest-environment jsdom
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { ApiError } from "@/lib/api/error";
import { authService } from "../api/auth.service";
import { ForgotPasswordForm } from "./forgot-password-form";

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
});

function renderForm() {
  const client = new QueryClient({ defaultOptions: { mutations: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <ForgotPasswordForm />
    </QueryClientProvider>,
  );
}

function submitEmail(email: string) {
  fireEvent.change(screen.getByLabelText("Email Address"), { target: { value: email } });
  fireEvent.click(screen.getByRole("button", { name: "Send reset link" }));
}

describe("forgot password", () => {
  it("sends the trimmed email and says where the link went", async () => {
    const forgot = vi
      .spyOn(authService, "forgotPassword")
      .mockResolvedValue({ success: true, message: "sent", data: "" });
    renderForm();
    submitEmail("  ada@technocratng.com ");

    const status = await screen.findByRole("status");
    expect(forgot).toHaveBeenCalledWith("ada@technocratng.com");
    expect(status.textContent).toContain("ada@technocratng.com");
    expect(status.textContent).toContain("15 minutes");
  });

  it("shows the rate-limit message from the backend", async () => {
    vi.spyOn(authService, "forgotPassword").mockRejectedValue(
      new ApiError("Too many password reset requests. Try again later.", 429, {
        message: "Too many password reset requests. Try again later.",
      }),
    );
    renderForm();
    submitEmail("ada@technocratng.com");

    const alert = await screen.findByRole("alert");
    expect(alert.textContent).toContain("Too many password reset requests");
    await waitFor(() => expect(screen.queryByRole("status")).toBeNull());
  });
});
