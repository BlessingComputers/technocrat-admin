import { Suspense, type ReactNode } from "react";
import { cookies } from "next/headers";
import { AppIcon } from "@/components/shared/app-icon";
import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { SIDEBAR_RAIL_COOKIE } from "@/lib/hooks/sidebar-store";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SessionProvider } from "@/features/auth";
import { ChatRealtimeProvider } from "@/features/chat";
import { AppSidebar } from "@/components/layouts/sidebar";
import { Topbar } from "@/components/layouts/topbar";
import { getStaffSessionServer } from "@/lib/auth/get-server-session";
import { navGroups } from "@/config/nav";
import { helpDocs } from "@/config/help-docs";

/**
 * Protected staff shell: Sidebar + Topbar + SessionProvider. Fetches the staff
 * session on the server (no loading flash) and seeds the client provider.
 * Cookie-presence gating is in middleware (`proxy.ts`); transparent refresh on
 * an expired access token is the client's job (ADR-0004). A null server session
 * is therefore expected (access token expired, refresh still possible) — the
 * `SessionProvider` re-fetches to drive the refresh and redirects to /login if
 * the session can't be re-established.
 *
 * The nav config is injected here (the app layer may import `config`; the
 * sidebar, a `component`, may not) and rendered by `AppSidebar`.
 */
export default function StaffLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<StaffShellFallback />}>
      <AuthenticatedStaffShell>{children}</AuthenticatedStaffShell>
    </Suspense>
  );
}

function StaffShellFallback() {
  return (
    <div className="flex h-screen w-full items-center justify-center">
      <AppIcon icon="solar:refresh-linear" className="size-8 animate-spin text-primary/60" />
      <span className="sr-only">Loading workspace…</span>
    </div>
  );
}

async function AuthenticatedStaffShell({ children }: { children: ReactNode }) {
  const [staffSession, cookieStore] = await Promise.all([
    getStaffSessionServer(),
    cookies(),
  ]);

  // Read the docked rail's persisted width here rather than from localStorage on
  // the client, so the very first paint is already the right width (ADR-0016).
  const railCollapsed =
    cookieStore.get(SIDEBAR_RAIL_COOKIE)?.value === "collapsed";

  return (
    <TooltipProvider>
      <SessionProvider initialSession={staffSession}>
        <ChatRealtimeProvider>
          <SidebarProvider defaultRailCollapsed={railCollapsed}>
            <AppSidebar navGroups={navGroups} staffSession={staffSession} />
            <SidebarInset className="flex flex-col h-screen overflow-hidden">
              <Topbar staffSession={staffSession} helpDocs={helpDocs} />
              {/* `scrollbar-gutter: stable` reserves the vertical scrollbar's
                  gutter at all times, so pages whose content height crosses the
                  viewport (or tabs that swap tall/short content) don't shift the
                  centered column horizontally when the scrollbar appears. */}
              <main className="flex-1 overflow-y-auto [scrollbar-gutter:stable] p-4 md:p-8 min-w-0 bg-muted/5">
                <div className="page-animate max-w-[1600px] mx-auto w-full">
                  {children}
                </div>
              </main>
            </SidebarInset>
          </SidebarProvider>
        </ChatRealtimeProvider>
      </SessionProvider>
    </TooltipProvider>
  );
}
