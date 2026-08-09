"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import {
  hasAnyPermissionInGroup,
  type StaffSession,
} from "@/lib/auth/permissions";

interface QuickLink {
  title: string;
  description: string;
  href: string;
  icon: string;
  iconClass: string;
  /** Permission group required; omit for links every staff member can see. */
  group?: string;
}

/**
 * Dashboard shortcuts to the areas a staff member can actually reach. Presented
 * as large tappable cards (a friendlier complement to the sidebar). Each is
 * gated by the same permission group the sidebar uses, so the grid only ever
 * shows destinations the user is allowed into.
 */
const QUICK_LINKS: QuickLink[] = [
  {
    title: "Products",
    description: "Catalog & pricing",
    href: "/catalogues?page=1",
    icon: "solar:box-bold-duotone",
    iconClass: "bg-primary/10 text-primary-ink",
    group: "products",
  },
  {
    title: "Orders",
    description: "Process & track",
    href: "/orders",
    icon: "solar:cart-large-2-bold-duotone",
    iconClass: "bg-jewel/15 text-jewel-ink",
    group: "orders",
  },
  {
    title: "Customers",
    description: "Accounts & history",
    href: "/customers",
    icon: "solar:users-group-rounded-bold-duotone",
    iconClass: "bg-info/10 text-info-ink",
    group: "customers",
  },
  {
    title: "Invoices",
    description: "Issue & review",
    href: "/invoices",
    icon: "solar:bill-list-bold-duotone",
    iconClass: "bg-success/15 text-success-ink",
    group: "invoices",
  },
  {
    title: "Inventory",
    description: "Stock & restocking",
    href: "/inventories",
    icon: "solar:box-minimalistic-bold-duotone",
    iconClass: "bg-primary/10 text-primary-ink",
    group: "inventory",
  },
  {
    title: "Uploads",
    description: "Bulk product uploads",
    href: "/users/uploads",
    icon: "solar:cloud-upload-bold-duotone",
    iconClass: "bg-info/10 text-info-ink",
    group: "products",
  },
  {
    title: "Chat",
    description: "Customer conversations",
    href: "/chat",
    icon: "solar:chat-round-bold-duotone",
    iconClass: "bg-jewel/15 text-jewel-ink",
  },
  {
    title: "Users",
    description: "Staff & roles",
    href: "/users",
    icon: "solar:shield-user-bold-duotone",
    iconClass: "bg-success/15 text-success-ink",
    group: "users",
  },
];

export function QuickLinksGrid({
  staffSession,
}: {
  staffSession?: StaffSession | null;
}) {
  const permissions = staffSession?.permissions ?? [];

  const links = QUICK_LINKS.filter(
    (link) =>
      !link.group || hasAnyPermissionInGroup(permissions, [link.group]),
  );

  if (links.length === 0) return null;

  return (
    <section className="space-y-4 border-t border-border/70 pt-6">
      <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
        <span className="h-2 w-2 rounded-full bg-primary" />
        Quick Access
      </h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {links.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="group flex items-center gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/25 hover:bg-muted/40"
          >
            <span
              className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${link.iconClass}`}
            >
              <AppIcon icon={link.icon} className="size-6" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">
                {link.title}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {link.description}
              </p>
            </div>
            <AppIcon
              icon="solar:alt-arrow-right-linear"
              className="size-4 shrink-0 text-muted-foreground/50 transition-all group-hover:translate-x-0.5 group-hover:text-primary-ink"
            />
          </Link>
        ))}
      </div>
    </section>
  );
}
