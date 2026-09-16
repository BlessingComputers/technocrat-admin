"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";
import { PreorderStatusBadge } from "./preorder-status-badge";
import { PreorderStatusActions } from "./preorder-status-actions";
import {
  formatAge,
  formatDate,
  isStale,
  preorderCustomerName,
  preorderInitials,
} from "../utils/preorder-utils";
import type { Preorder } from "../types/preorders";

interface PreorderTableRowProps {
  preorder: Preorder;
}

export function PreorderTableRow({ preorder }: PreorderTableRowProps) {
  const stale = isStale(preorder);
  const href = `/preorders/${preorder.id}`;

  return (
    <tr className="group hover:bg-muted/30 transition-colors">
      {/* Customer */}
      <td className="px-8 py-5">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 text-primary-ink flex items-center justify-center text-xs font-semibold shrink-0">
            {preorderInitials(preorder)}
          </div>
          <Link href={href} className="flex flex-col min-w-0 transition-colors">
            <p className="font-semibold text-foreground hover:text-primary-ink text-sm tracking-tight truncate">
              {preorderCustomerName(preorder)}
            </p>
            <p className="text-xs text-muted-foreground font-medium truncate">
              {preorder.email}
            </p>
          </Link>
        </div>
      </td>

      {/* What they want. The quantity rides under the product name rather than
          in its own column: it is 1 on almost every row, and a column that is
          the same value all the way down is a column that costs width to say
          nothing. */}
      <td className="px-8 py-5">
        <Link href={href} className="block min-w-0">
          <p className="font-semibold text-foreground text-sm tracking-tight truncate">
            {preorder.productName}
          </p>
          <p className="text-xs text-muted-foreground font-medium truncate">
            {preorder.brand}
            {preorder.quantity > 1 && ` · ×${preorder.quantity}`}
          </p>
        </Link>
      </td>

      {/* Reference */}
      <td className="px-8 py-5">
        <p className="font-mono text-xs text-muted-foreground tracking-tight">
          {preorder.preorderId}
        </p>
      </td>

      {/* Status */}
      <td className="px-8 py-5">
        <PreorderStatusBadge status={preorder.status} />
      </td>

      {/* Age. The whole reason this column exists is the stale case — an
          untouched pre-order that has been sitting for days is the one thing
          this table should be able to shout about. */}
      <td className="px-8 py-5">
        <p
          className={cn(
            "text-xs font-semibold flex items-center gap-1.5",
            stale ? "text-warning" : "text-muted-foreground",
          )}
        >
          <AppIcon
            icon={stale ? "solar:clock-circle-bold" : "solar:calendar-linear"}
            className={cn(
              "w-3.5 h-3.5",
              stale ? "text-warning" : "text-muted-foreground/60",
            )}
          />
          {formatAge(preorder.createdAt)}
        </p>
        <MetaLabel className="block mt-0.5">
          {formatDate(preorder.createdAt)}
        </MetaLabel>
      </td>

      {/* Actions — status moves happen from the row, not only the detail page.
          Working a queue means clearing several in a sitting, and making that
          a round trip through a detail page per item is the difference between
          a tool and a form. */}
      <td className="px-8 py-5">
        <div className="flex items-center justify-end gap-2">
          <PreorderStatusActions preorder={preorder} />
          <Link
            href={href}
            aria-label={`Open ${preorder.preorderId}`}
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-primary/5 hover:text-primary-ink"
          >
            <AppIcon icon="solar:eye-linear" className="w-4 h-4" />
          </Link>
        </div>
      </td>
    </tr>
  );
}
