import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CouponTableRow } from "./coupon-table-row";
import { CouponsTableSkeleton } from "./coupons-skeletons";
import type { Coupon } from "../types/coupons";

interface CouponsTableProps {
  coupons: Coupon[];
  isLoading: boolean;
  /** Drives the empty state's wording — an unfiltered empty list is day one. */
  isFiltered: boolean;
}

const TABLE_HEADERS = [
  "Code",
  "Offer",
  "Redeemed",
  "State",
  "Expires",
  "Actions",
];

export function CouponsTable({
  coupons,
  isLoading,
  isFiltered,
}: CouponsTableProps) {
  if (isLoading) {
    return <CouponsTableSkeleton />;
  }

  if (coupons.length === 0) {
    return (
      <Card className="gap-0 py-20 text-center">
        <AppIcon
          icon={isFiltered ? "solar:magnifer-linear" : "solar:ticket-linear"}
          className="mx-auto mb-4 h-16 w-16 text-muted-foreground/30"
        />
        <h3 className="text-xl font-semibold text-foreground">
          {isFiltered ? "No coupons match" : "No discount codes yet"}
        </h3>
        <p className="font-medium text-muted-foreground">
          {isFiltered
            ? "Try a different status or search term."
            : "Mint one when a promotion needs a code customers can type at checkout."}
        </p>
        {!isFiltered && (
          <div className="mt-6">
            <Button asChild>
              <Link href="/coupons/new" className="gap-2">
                <AppIcon icon="solar:add-circle-linear" className="size-4" />
                New coupon
              </Link>
            </Button>
          </div>
        )}
      </Card>
    );
  }

  return (
    <Card className="w-full gap-0 overflow-x-auto py-0">
      <table className="w-full min-w-[1000px] text-left">
        <thead>
          <tr className="border-b border-border bg-primary/[0.04]">
            {TABLE_HEADERS.map((header) => (
              <th
                key={header}
                className={`px-8 py-5 text-xs font-medium text-muted-foreground${header === "Actions" ? " text-right" : ""}`}
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {coupons.map((coupon) => (
            <CouponTableRow key={coupon.id} coupon={coupon} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
