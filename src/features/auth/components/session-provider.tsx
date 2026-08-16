"use client";

import { ReactNode } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import type { StaffSession } from "@/lib/auth/permissions";
import { SessionContext } from "@/lib/auth/session-context";
import { useStaffProfileQuery } from "../api/auth.queries";

/**
 * Supplies the staff session value to the `lib/auth` SessionContext.
 *
 * Session lifecycle:
 * - When the server resolved a session, it's seeded as `initialData` so there's
 *   no loading flash.
 * - When the server did NOT (expired access token → `proxy.ts` lets the page
 *   through expecting a client refresh), we deliberately DON'T seed, so the query
 *   actually fetches on mount. That fetch drives the fetch-client's
 *   401 → silent-refresh cycle (silent refresh on success; on failure the fetch
 *   client clears the cookies and hard-redirects to /login — the single redirect
 *   authority, which keeps the bounce loop-safe). Seeding `null` here was the
 *   bug: React Query treated it as fresh, never fetched, so the refresh/redirect
 *   never fired and the shell rendered permission-less ("routes disappear").
 * - We never render the shell without a session — a loader shows until the
 *   session resolves or the fetch client navigates to /login.
 */

function FullPageLoader() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background">
      <AppIcon
        icon="solar:refresh-linear"
        className="w-10 h-10 text-primary-ink animate-spin mb-4"
      />
      <p className="text-muted-foreground font-medium animate-pulse">
        Loading Staff Profile...
      </p>
    </div>
  );
}

export function SessionProvider({
  children,
  initialSession,
}: {
  children: ReactNode;
  initialSession?: StaffSession | null;
}) {
  const hasInitialSession = !!initialSession;

  // Seed ONLY when the server actually resolved a session. Seeding `null` would
  // make React Query treat it as fresh data and skip the fetch — the exact bug
  // that left an expired session with no refresh and no redirect.
  const {
    data: staffSession,
    isLoading,
    isError,
  } = useStaffProfileQuery(
    hasInitialSession ? { initialData: initialSession } : undefined,
  );

  // Never render the permission-gated shell without a session. While the client
  // re-fetches an expired session, a failed refresh has the fetch client
  // redirect to /login; this loader covers that window instead of flashing an
  // empty shell ("routes disappear").
  if (!staffSession) {
    return <FullPageLoader />;
  }

  return (
    <SessionContext.Provider value={{ staffSession, isLoading, isError }}>
      {children}
    </SessionContext.Provider>
  );
}
