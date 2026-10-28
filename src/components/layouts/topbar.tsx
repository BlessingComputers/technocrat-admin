"use client";

import { SidebarTrigger } from "@/components/ui/sidebar";
import { Logo } from "@/components/shared/logo";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  type StaffSession,
  filterHelpDocsByPermissions,
} from "@/lib/auth/permissions";
import { usePermissions } from "@/lib/auth/use-permissions";
import type { HelpDoc } from "@/types/help";
import { NotificationBell } from "@/features/notifications";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { useRouter } from "next/navigation";
import { useMemo } from "react";

interface TopbarProps {
  staffSession?: StaffSession | null;
  /** Help docs for the header dropdown — injected from the layout (app layer). */
  helpDocs?: HelpDoc[];
}

export function Topbar({ helpDocs = [] }: TopbarProps) {
  const router = useRouter();
  const { session } = usePermissions();

  // Permission-aware relevance (ADR-0011): only surface guides the viewer is
  // shown elsewhere in the app. Presentation only — routes stay reachable.
  const visibleHelpDocs = useMemo(
    () => filterHelpDocsByPermissions(helpDocs, session),
    [helpDocs, session],
  );

  return (
    // Figma `301:920` draws no top bar at all — content starts at the page
    // title. ADR-0016 keeps one anyway, because the bell, theme toggle and help
    // menu have nowhere else to live, but slims it to 56px and drops the fill so
    // it reads as a control strip rather than a second band of chrome competing
    // with the page header directly beneath it.
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between gap-4 border-b border-sidebar-border bg-background px-4 md:px-6 w-full">
      <div className="flex items-center gap-3 flex-1">
        {/* Below `lg` the sidebar is an overlay drawer, so the topbar carries the
            trigger + brand. At `lg`+ the docked rail owns both, so they hide. */}
        <SidebarTrigger className="-ml-1 h-9 w-9 lg:hidden" />

        <Logo
          href="/"
          variant="full"
          className="shrink-0 lg:hidden"
          imageClassName="h-8 w-auto"
        />

        {/* Global search / ⌘K command palette — needs a backend search endpoint.
            Commented out until that lands (re-add the `Input` import when restoring).
        <div className="relative max-w-md w-full hidden lg:block">
          <AppIcon
            icon="solar:magnifer-linear"
            className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground"
          />
          <Input
            placeholder="Search for something..."
            className="pl-10 pr-12 h-10 bg-muted/40 border-border/40 focus:bg-background transition-all rounded-md"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 text-xs font-semibold text-muted-foreground/60 border rounded px-1.5 py-0.5 bg-muted">
            <span className="leading-none">⌘</span>
            <span>K</span>
          </div>
        </div>
        */}
      </div>

      <div className="flex items-center gap-3">
        <NotificationBell />

        <ThemeToggle />

        {visibleHelpDocs.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-9 w-9 rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                aria-label="Help & guides"
              >
                <AppIcon icon="solar:question-circle-linear" className="size-[18px]" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 rounded-xl border-border/60">
              {/* Not a tracked-caps eyebrow: DESIGN.md sanctions that treatment
                  for the sidebar's MAIN/ADMIN headers and nowhere else. */}
              <DropdownMenuLabel className="text-xs font-semibold text-muted-foreground">
                Help &amp; guides
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {visibleHelpDocs.map((doc) => (
                <DropdownMenuItem
                  key={doc.slug}
                  className="cursor-pointer gap-3 py-2.5"
                  onClick={() => router.push(`/help/${doc.slug}`)}
                >
                  <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary-ink">
                    <AppIcon icon={doc.icon} className="size-4" />
                  </div>
                  <span className="min-w-0 flex-1 truncate text-sm font-semibold leading-tight">
                    {doc.title}
                  </span>
                </DropdownMenuItem>
              ))}
              <DropdownMenuSeparator />
              <DropdownMenuItem
                className="cursor-pointer gap-2 py-2.5"
                onClick={() => router.push("/help")}
              >
                <AppIcon icon="solar:book-linear" className="size-4 text-muted-foreground" />
                Browse all guides
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}

      </div>
    </header>
  );
}
