"use server";

import { updateTag } from "next/cache";
import { getStaffSessionServer } from "@/lib/auth/get-server-session";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";

/**
 * Drops the five-minute traffic cache so the page re-renders with a fresh
 * PostHog report. `updateTag` expires it now, and the Server Action's
 * response carries the re-rendered page.
 *
 * A Server Action is a public endpoint, so it checks `analytics:read` itself,
 * like `TrafficPage`. Every refresh costs 17 queries against PostHog's 2,400
 * an hour per key, which is why staff without the permission can't trigger it.
 */
export async function refreshTrafficAction(): Promise<void> {
  const session = await getStaffSessionServer();
  if (!isSuperAdmin(session) && !hasPermission(session?.permissions ?? [], "analytics:read")) return;
  updateTag("posthog-traffic");
}
