// @vitest-environment jsdom
import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LoginForm } from "./login-form";

const { nav } = vi.hoisted(() => ({ nav: { search: "" } }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(nav.search),
}));
vi.mock("../api/login-action", () => ({ loginAction: vi.fn() }));
// next/image's static PNG import has no width under Vitest; the logo is not under test.
vi.mock("@/components/shared/logo", () => ({ Logo: () => null }));
vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>{children}</a>
  ),
}));

afterEach(() => {
  cleanup();
  nav.search = "";
});

describe("login page recovery", () => {
  it("links to forgot password", () => {
    render(<LoginForm />);
    expect(
      screen.getByRole("link", { name: "Forgot password?" }).getAttribute("href"),
    ).toBe("/forgot-password");
  });

  it("confirms a password change", () => {
    nav.search = "notice=password-changed";
    render(<LoginForm />);
    expect(screen.getByRole("status").textContent).toContain(
      "Password changed. Sign in with your new password.",
    );
  });

  it("ignores unknown notices", () => {
    nav.search = "notice=whatever";
    render(<LoginForm />);
    expect(screen.queryByRole("status")).toBeNull();
  });
});
