"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { AppIcon } from "@/components/shared/app-icon";
import {
  FilterBar,
  FilterSearch,
  filterControlClass,
} from "@/components/shared/filter-bar";
import { cn } from "@/lib/utils/cn";
import type { AdminOrderListParams } from "../types/orders";

interface OrdersFilterBarProps {
  params: AdminOrderListParams;
  onParamsChange: (params: AdminOrderListParams) => void;
}

const RESET_PARAMS: AdminOrderListParams = {
  page: 1,
  limit: 20,
  search: "",
  orderStatus: "",
  paymentStatus: "",
  sortBy: "newest",
  source: "all",
};

export function OrdersFilterBar({
  params,
  onParamsChange,
}: OrdersFilterBarProps) {
  const hasActiveFilters = !!(
    params.paymentStatus ||
    params.orderStatus ||
    params.search ||
    (params.source && params.source !== "all") ||
    (params.sortBy && params.sortBy !== "newest")
  );

  return (
    <FilterBar>
      <FilterSearch
        placeholder="Search Order No., Email, or Customer Name..."
        value={params.search || ""}
        onChange={(e) => onParamsChange({ ...params, search: e.target.value })}
      />

      <Select
        value={params.source || "all"}
        onValueChange={(val) =>
          onParamsChange({
            ...params,
            source: val as AdminOrderListParams["source"],
          })
        }
      >
        <SelectTrigger className={filterControlClass}>
          <SelectValue placeholder="All Sources" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Sources</SelectItem>
          <SelectItem value="gateway">Gateway</SelectItem>
          <SelectItem value="manual">Bank Transfer</SelectItem>
        </SelectContent>
      </Select>

      <Select
        value={params.orderStatus || "ALL"}
        onValueChange={(val) =>
          onParamsChange({ ...params, orderStatus: val === "ALL" ? "" : val })
        }
      >
        <SelectTrigger className={filterControlClass}>
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="PROOF_SUBMITTED">Pending Review</SelectItem>
          <SelectItem value="AWAITING_PAYMENT">Awaiting Payment</SelectItem>
          <SelectItem value="PAYMENT_CONFIRMED">Confirmed</SelectItem>
          <SelectItem value="PROCESSING">Processing</SelectItem>
          <SelectItem value="CANCELLED">Cancelled</SelectItem>
        </SelectContent>
      </Select>

      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "gap-2",
              (params.paymentStatus || (params.sortBy && params.sortBy !== "newest")) &&
                "border-primary text-primary-ink bg-primary/5 hover:bg-primary/10",
            )}
          >
            <AppIcon icon="solar:filter-linear" className="w-4 h-4 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
              Advanced Filters
            </span>
            {(params.paymentStatus || (params.sortBy && params.sortBy !== "newest")) && (
              <span className="w-2 h-2 rounded-full bg-primary" />
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent
          align="end"
          className="w-80 space-y-6 p-6 shadow-soft-lg"
        >
          <div className="space-y-1">
            <h4 className="text-sm font-semibold text-foreground">
              Advanced Filters
            </h4>
            <p className="text-xs text-muted-foreground">
              Refine the combined orders list
            </p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Payment Status
              </label>
              <Select
                value={params.paymentStatus || "ALL"}
                onValueChange={(val) =>
                  onParamsChange({
                    ...params,
                    paymentStatus: val === "ALL" ? "" : val,
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All Payments" />
                </SelectTrigger>
                <SelectContent>
                  {/* Normalized across both order sources by /all-orders. */}
                  <SelectItem value="ALL">All Payments</SelectItem>
                  <SelectItem value="PENDING">Pending</SelectItem>
                  <SelectItem value="PAID">Paid</SelectItem>
                  <SelectItem value="FAILED">Failed</SelectItem>
                  <SelectItem value="REFUNDED">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground">
                Sort By
              </label>
              <Select
                value={params.sortBy || "newest"}
                onValueChange={(val) =>
                  onParamsChange({
                    ...params,
                    sortBy: val as AdminOrderListParams["sortBy"],
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Newest First" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount_desc">Highest Amount</SelectItem>
                  <SelectItem value="amount_asc">Lowest Amount</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {hasActiveFilters && (
            <Button
              onClick={() => onParamsChange({ ...RESET_PARAMS })}
              className="w-full h-10 bg-foreground hover:bg-foreground/90 text-background text-xs font-semibold rounded-md"
            >
              Reset Filters
            </Button>
          )}
        </PopoverContent>
      </Popover>
    </FilterBar>
  );
}
