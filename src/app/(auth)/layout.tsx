import type { ReactNode } from "react";
import { ThemeToggle } from "@/components/shared/theme-toggle";

/**
 * Minimal layout for the public auth routes (login, forgot/reset password).
 * Centers the content on the canvas with a faint maroon glow, and offers a
 * theme toggle so the screen is usable/testable in both themes (ADR-0009).
 * The protected chrome (Sidebar/Topbar) lives in the (staff) layout, not here.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <main className="relative flex min-h-screen items-center justify-center bg-background p-4">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-to-b from-primary/5 to-transparent"
      />
      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>
      <div className="relative w-full max-w-md">{children}</div>
    </main>
  );
}
