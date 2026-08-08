"use client";

import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { cn } from "@/lib/utils/cn";

import { OrderSourceBadge } from "../order-source-badge";
import { getStatusColor } from "../../utils/order-utils";
import type { OrderSource } from "../../types/orders";

interface OrderDetailHeaderProps {
  /** Human reference shown as the page title (order number / manual id). */
  reference: string;
  description: string;
  source: OrderSource;
  status: string;
  /** Pre-formatted status label; falls back to the humanized raw status. */
  statusLabel?: string;
  /** Action slot rendered to the left of the status pill (e.g. cancel). */
  actions?: React.ReactNode;
}

/**
 * Shared header for both order-detail flows: back-link, reference title,
 * source badge, an optional action slot, and the status pill. Keeping it in one
 * place is what makes the manual and gateway pages read as one product.
 */
export function OrderDetailHeader({
  reference,
  description,
  source,
  status,
  statusLabel,
  actions,
}: OrderDetailHeaderProps) {
  return (
    <PageHeader title={reference} description={description}>
      <Link
        href="/orders"
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors pr-6 border-r border-border"
      >
        <AppIcon icon="solar:arrow-left-linear" className="w-3 h-3" />
        Back to Queue
      </Link>
      <div className="flex items-center gap-3">
        <OrderSourceBadge source={source} />
        {actions}
        <div
          className={cn(
            "px-6 py-2 rounded-lg border font-black text-[10px] uppercase tracking-widest flex items-center justify-center min-w-[140px]",
            getStatusColor(status),
          )}
        >
          {statusLabel || status?.replace(/_/g, " ")}
        </div>
      </div>
    </PageHeader>
  );
}
