"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";

import { HUNT_PILL } from "../constants/claim-tone";
import type { HuntDeal } from "../types/hunts";
import { paymentLabel, paymentTone } from "../utils/hunt-rows";

/**
 * The holder's order and where its payment stands. The link goes to the
 * gateway order page, which resolves by DB id, so it uses `heldByOrderId`
 * and shows `orderNumber`.
 */
export function HuntOrderRef({ deal }: { deal: HuntDeal }) {
  if (!deal.heldByOrderId) return null;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Link
        href={`/orders/gateway/${deal.heldByOrderId}`}
        className="font-mono text-xs font-semibold text-primary-ink hover:underline"
      >
        {deal.orderNumber ?? "View order"}
      </Link>
      <Badge variant={paymentTone(deal.orderPaymentStatus)} className={HUNT_PILL}>
        {paymentLabel(deal.orderPaymentStatus)}
      </Badge>
    </div>
  );
}
