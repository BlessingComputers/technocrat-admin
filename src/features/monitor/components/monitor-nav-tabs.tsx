"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/security", label: "Requests", icon: "solar:list-linear" },
  { href: "/security/errors", label: "Errors", icon: "solar:danger-circle-linear" },
  { href: "/security/slow", label: "Slow", icon: "solar:clock-circle-linear" },
  { href: "/security/anomalies", label: "Anomalies", icon: "solar:danger-triangle-linear" },
  { href: "/security/stats", label: "Stats", icon: "solar:chart-2-linear" },
];

/**
 * Real-route sub-nav for the request-monitor views living inside the Security
 * section (`/security`, `/security/errors`, `/security/slow`,
 * `/security/anomalies`, `/security/stats`) — mirrors `PaymentsNavTabs`:
 * distinct paths, not query-param tabs. Nested under Security rather than its
 * own top-level nav item since this *is* the Security section's content (the
 * placeholder it replaces), not a sibling feature.
 */
export function MonitorNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-border overflow-x-auto">
      {TABS.map((tab) => {
        // `/security` is active for both the list and a `/security/{requestId}`
        // detail route, but not for the 4 sibling paths.
        const active =
          tab.href === "/security"
            ? pathname === "/security" ||
              (pathname.startsWith("/security/") &&
                !pathname.startsWith("/security/errors") &&
                !pathname.startsWith("/security/slow") &&
                !pathname.startsWith("/security/anomalies") &&
                !pathname.startsWith("/security/stats"))
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px whitespace-nowrap transition-colors",
              active
                ? "border-primary text-primary-ink"
                : "border-transparent text-muted-foreground hover:text-foreground",
            )}
          >
            <AppIcon icon={tab.icon} className="w-4 h-4" />
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
