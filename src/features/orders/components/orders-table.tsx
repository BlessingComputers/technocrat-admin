"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { OrderTableRow } from "./order-table-row";
import { OrdersTableSkeleton } from "./orders-skeletons";
import type { AdminOrderRow, AdminOrderListParams } from "../types/orders";
import { Card } from "@/components/ui/card";
import { metaLabelVariants } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";

type SortValue = NonNullable<AdminOrderListParams["sortBy"]>;

interface OrdersTableProps {
  orders: AdminOrderRow[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  sortBy: SortValue;
  onSortChange: (value: SortValue) => void;
}

interface HeaderCol {
  label: string;
  align?: "right";
  /** When present, the column is sortable; `desc` is its default direction. */
  sort?: { desc: SortValue; asc: SortValue };
}

const HEADERS: HeaderCol[] = [
  { label: "Order ID & Date", sort: { desc: "newest", asc: "oldest" } },
  { label: "Source" },
  { label: "Customer Details" },
  { label: "Products Ordered" },
  { label: "Order Status" },
  { label: "Payment Status" },
  { label: "Total Amount", sort: { desc: "amount_desc", asc: "amount_asc" } },
  { label: "Method" },
  { label: "Actions", align: "right" },
];

export function OrdersTable({
  orders,
  isLoading,
  isError,
  onRetry,
  sortBy,
  onSortChange,
}: OrdersTableProps) {
  if (isLoading) {
    return <OrdersTableSkeleton />;
  }

  if (isError) {
    return (
      <Card className="gap-0 py-20 text-center">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
          <AppIcon icon="solar:danger-circle-linear" className="size-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Orders service unavailable
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We hit an error loading orders. Please try again shortly.
        </p>
        <Button variant="outline" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      </Card>
    );
  }

  if (orders.length === 0) {
    return (
      <Card className="gap-0 py-20 text-center">
        <AppIcon
          icon="solar:box-linear"
          className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
        />
        <h3 className="text-lg font-semibold text-foreground">No orders found</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Try adjusting your search or filters
        </p>
      </Card>
    );
  }

  return (
    <Card className="gap-0 overflow-x-auto w-full py-0">
      <table className="w-full text-left min-w-[1000px]">
        <thead>
          <tr className="border-b border-border bg-primary/[0.04]">
            {HEADERS.map((col) => {
              const base = cn(
                metaLabelVariants(),
                "px-8 py-4",
                col.align === "right" && "text-right",
              );

              if (!col.sort) {
                return (
                  <th key={col.label} className={base}>
                    {col.label}
                  </th>
                );
              }

              const active = sortBy === col.sort.desc || sortBy === col.sort.asc;
              const isDesc = sortBy === col.sort.desc;
              const ariaSort: "ascending" | "descending" | "none" = active
                ? isDesc
                  ? "descending"
                  : "ascending"
                : "none";
              // Toggle direction when already active; otherwise start descending.
              const next = active && isDesc ? col.sort.asc : col.sort.desc;

              return (
                <th key={col.label} className={base} aria-sort={ariaSort}>
                  <button
                    type="button"
                    onClick={() => onSortChange(next)}
                    className={`group/sort inline-flex items-center gap-1 rounded-sm outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 ${
                      active ? "text-primary-ink" : "hover:text-foreground"
                    }`}
                  >
                    {col.label}
                    <AppIcon
                      icon={
                        active && !isDesc
                          ? "solar:alt-arrow-up-bold"
                          : "solar:alt-arrow-down-bold"
                      }
                      aria-hidden
                      className={`w-3 h-3 transition-opacity ${
                        active
                          ? "opacity-100"
                          : "opacity-0 group-hover/sort:opacity-40"
                      }`}
                    />
                  </button>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {orders.map((order) => (
            <OrderTableRow key={order.key} order={order} />
          ))}
        </tbody>
      </table>
    </Card>
  );
}
