"use client";

import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils/cn";

import { HUNT_PILL } from "../constants/claim-tone";
import type { HuntDeal, HuntProductPricing } from "../types/hunts";
import { resolvePercentage } from "../utils/hunt-price";
import {
  claimLine,
  discountNeverApplied,
  isUnpaidClaim,
  paymentLabel,
  paymentTone,
  releaseNote,
  sortForWinners,
} from "../utils/hunt-rows";
import { formatHuntSlot, formatHuntTime } from "../utils/hunt-time";
import { HuntPriceFigure } from "./hunt-price-figure";
import { UnappliedDiscountLine } from "./unapplied-discount-line";

const HEAD = "font-semibold text-xs text-muted-foreground";

interface HuntWinnersTableProps {
  deals: HuntDeal[];
  pricing: Map<string, HuntProductPricing>;
  storedPercentages: Map<string, number>;
  pricesLoading: boolean;
  now: number;
  withDate: boolean;
}

/**
 * Who won each drop and whether they paid, for a campaign that has ended.
 *
 * Unpaid claims sort to the top and are tinted: those are the rows staff act
 * on. A drop nobody won stays in the table, at the bottom, so the list always
 * accounts for every item that was announced.
 */
export function HuntWinnersTable({
  deals,
  pricing,
  storedPercentages,
  pricesLoading,
  now,
  withDate,
}: HuntWinnersTableProps) {
  const rows = sortForWinners(deals);
  const unpaid = deals.filter(isUnpaidClaim).length;
  const anyClaim = deals.some((d) => d.claimStatus !== "OPEN");

  return (
    <Card className="gap-0 overflow-hidden p-0">
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border bg-primary/[0.04] px-5 py-3">
        <h2 className="text-sm font-semibold tracking-tight text-foreground">Winners</h2>
        <span
          className={cn(
            "text-xs",
            unpaid > 0
              ? "font-semibold text-warning-ink"
              : "font-medium text-muted-foreground",
          )}
        >
          {unpaid > 0
            ? `${unpaid} unpaid, listed first`
            : anyClaim
              ? "Every claim is paid"
              : "Nobody claimed a drop"}
        </span>
      </div>

      <div className="w-full overflow-x-auto">
        <Table className="min-w-[760px] table-fixed">
          <TableHeader>
            <TableRow className="border-b-border/60">
              <TableHead className={`${HEAD} w-[34%]`}>Item</TableHead>
              <TableHead className={`${HEAD} w-[30%]`}>Winner</TableHead>
              <TableHead className={`${HEAD} w-[18%]`}>Order</TableHead>
              <TableHead className={`${HEAD} w-[18%]`}>Payment</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((deal) => (
              <WinnerRow
                key={deal.id}
                deal={deal}
                pricing={deal.productId ? pricing.get(deal.productId) : undefined}
                percentage={resolvePercentage(
                  deal.markupPercentage,
                  storedPercentages.get(deal.dealId),
                )}
                pricesLoading={pricesLoading}
                now={now}
                withDate={withDate}
              />
            ))}
          </TableBody>
        </Table>
      </div>
    </Card>
  );
}

function WinnerRow({
  deal,
  pricing,
  percentage,
  pricesLoading,
  now,
  withDate,
}: {
  deal: HuntDeal;
  pricing?: HuntProductPricing;
  percentage: number | null;
  pricesLoading: boolean;
  now: number;
  withDate: boolean;
}) {
  const claimed = deal.claimStatus !== "OPEN";
  const unpaid = isUnpaidClaim(deal);
  const release = releaseNote(deal);

  return (
    <TableRow
      className={cn(
        "border-b-border/40 align-top hover:bg-muted/30",
        unpaid && "bg-warning/[0.06]",
      )}
    >
      <TableCell className="whitespace-normal">
        <p
          className="truncate text-sm font-semibold text-foreground"
          title={deal.productName ?? undefined}
        >
          {deal.productName ?? "Product no longer exists"}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatHuntSlot(deal.slotStart, deal.slotEnd, withDate)}
        </p>
        <HuntPriceFigure
          className="mt-1.5"
          pricing={pricing}
          percentage={percentage}
          isLoading={pricesLoading}
        />
        {discountNeverApplied(deal, now) && <UnappliedDiscountLine />}
      </TableCell>

      <TableCell className="whitespace-normal">
        {claimed ? (
          <>
            <p className="text-sm font-semibold text-foreground">
              {deal.heldByCustomerName ?? "Unknown customer"}
            </p>
            {deal.claimStatus === "HELD" && (
              <p className="text-xs font-semibold text-warning-ink">
                {claimLine(deal, now).text}
              </p>
            )}
          </>
        ) : (
          <p className="text-sm font-medium text-muted-foreground">No winner</p>
        )}
        {release && (
          <p className="mt-1 text-xs text-muted-foreground">
            {release.text}, {formatHuntTime(release.at)}
          </p>
        )}
      </TableCell>

      <TableCell>
        {deal.heldByOrderId ? (
          <Link
            href={`/orders/gateway/${deal.heldByOrderId}`}
            className="font-mono text-sm font-semibold text-primary-ink hover:underline"
          >
            {deal.orderNumber ?? "View order"}
          </Link>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </TableCell>

      <TableCell>
        {claimed ? (
          <Badge variant={paymentTone(deal.orderPaymentStatus)} className={HUNT_PILL}>
            {paymentLabel(deal.orderPaymentStatus)}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">None</span>
        )}
      </TableCell>
    </TableRow>
  );
}
