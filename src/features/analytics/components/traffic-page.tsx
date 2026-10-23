import { serverEnv } from "@/config/env";
import { getStaffSessionServer } from "@/lib/auth/get-server-session";
import { hasAnyPermissionInGroup, hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { getTrafficReport, postHogLinks } from "../api/traffic.server";
import type { AnalyticsPeriod } from "../types/chart-analytics";
import { TrafficNotice, TrafficView } from "./traffic-view";

const PERIODS: AnalyticsPeriod[] = ["7d", "30d", "90d", "12m"];

/**
 * Storefront traffic from PostHog, for staff with `analytics:read`.
 *
 * The permission is checked here on the server, not only in the UI. ADR-0001
 * leaves enforcement to the backend's 403, but this data never passes through
 * the backend: the admin reads PostHog with its own key, so this check is the
 * only one there is.
 *
 * Visitor names count as customer data, so they show only to staff who can
 * read customers.
 */
export async function TrafficPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const session = await getStaffSessionServer();
  const permissions = session?.permissions ?? [];
  const superAdmin = isSuperAdmin(session);

  if (!superAdmin && !hasPermission(permissions, "analytics:read")) {
    return (
      <TrafficNotice icon="solar:lock-keyhole-linear" title="You can't view analytics">
        This page needs the analytics:read permission. Ask an admin to add it to your role.
      </TrafficNotice>
    );
  }

  if (!serverEnv().posthog.apiKey) {
    return (
      <TrafficNotice icon="solar:plug-circle-linear" title="Analytics isn't connected yet">
        Set POSTHOG_PERSONAL_API_KEY to a PostHog personal API key with query:read on the storefront project, then
        redeploy.
      </TrafficNotice>
    );
  }

  const { period: requested } = await searchParams;
  const period = PERIODS.find((p) => p === requested) ?? "30d";

  let report;
  try {
    report = await getTrafficReport(period);
  } catch (error) {
    console.error("[analytics] traffic report failed:", error);
    return (
      <TrafficNotice icon="solar:cloud-cross-linear" title="Couldn't load analytics">
        PostHog didn&apos;t answer. Reload the page in a minute.
      </TrafficNotice>
    );
  }

  if (!superAdmin && !hasAnyPermissionInGroup(permissions, ["customers"])) {
    report = { ...report, sessions: report.sessions.map((s) => ({ ...s, name: null })) };
  }

  return <TrafficView report={report} links={postHogLinks()} />;
}
