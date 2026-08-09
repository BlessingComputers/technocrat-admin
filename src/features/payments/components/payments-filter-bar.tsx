"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FilterBar,
  FilterSearch,
  filterControlClass,
} from "@/components/shared/filter-bar";
import type { AdminTransactionListParams } from "../types/payments";

interface PaymentsFilterBarProps {
  params: AdminTransactionListParams;
  onParamsChange: (params: AdminTransactionListParams) => void;
}

export function PaymentsFilterBar({
  params,
  onParamsChange,
}: PaymentsFilterBarProps) {
  return (
    <FilterBar>
      <FilterSearch
        placeholder="Search by reference or order number..."
        value={params.search || ""}
        onChange={(e) => onParamsChange({ ...params, search: e.target.value })}
      />

      <Select
        value={params.status || "ALL"}
        onValueChange={(val) =>
          onParamsChange({
            ...params,
            status: val === "ALL" ? "" : (val as AdminTransactionListParams["status"]),
          })
        }
      >
        <SelectTrigger className={filterControlClass}>
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
          <SelectItem value="REFUNDED">Refunded</SelectItem>
        </SelectContent>
      </Select>
    </FilterBar>
  );
}
