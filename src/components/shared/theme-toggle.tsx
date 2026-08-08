"use client";

import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";

/**
 * Binary light/dark toggle (ADR-0009) — not a 3-way select. The OS preference is
 * the initial default (`ThemeProvider` is `defaultTheme="system"`); clicking sets
 * an explicit, persisted choice. Which glyph shows is driven by the `.dark` class
 * via CSS (`dark:` variants), so there's no hydration mismatch or icon flash.
 */
export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors rounded-md"
    >
      <AppIcon icon="solar:sun-2-bold" className="size-[18px] hidden dark:block" />
      <AppIcon icon="solar:moon-bold" className="size-[18px] dark:hidden" />
      <span className="sr-only">Toggle theme</span>
    </Button>
  );
}
