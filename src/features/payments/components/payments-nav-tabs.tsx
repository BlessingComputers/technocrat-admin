"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

const TABS = [
  { href: "/payments", label: "Transactions", icon: "solar:wallet-money-linear" },
  { href: "/payments/dlq", label: "Dead Letter Queue", icon: "solar:inbox-archive-linear" },
  { href: "/payments/settings", label: "Settings", icon: "solar:settings-linear" },
];

/**
 * Real-route sub-nav for the Payments section (`/payments`, `/payments/dlq`,
 * `/payments/settings`) — unlike Pricing's Products/Parts/Tax tabs (`?tab=`
 * query param on one route), these must be distinct paths: the notification
 * resolver (`resolve-notification-route.ts`) links `entityType: 'PAYMENT'` /
 * `'PAYMENT_DLQ'` straight to `/payments/{id}` and `/payments/dlq`.
 */
export function PaymentsNavTabs() {
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 border-b border-border">
      {TABS.map((tab) => {
        // `/payments` is active for both the list and a `/payments/{id}` detail
        // route, but not for the `/dlq` or `/settings` siblings.
        const active =
          tab.href === "/payments"
            ? pathname === "/payments" ||
              (pathname.startsWith("/payments/") &&
                !pathname.startsWith("/payments/dlq") &&
                !pathname.startsWith("/payments/settings"))
            : pathname.startsWith(tab.href);

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors",
              active
                ? "border-primary text-primary"
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
