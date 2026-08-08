"use client";

import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AppIcon } from "@/components/shared/app-icon";
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
    <div className="flex flex-col md:flex-row gap-4">
      <div className="relative flex-1 group">
        <AppIcon
          icon="solar:magnifer-linear"
          className="absolute left-4 top-3.5 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors"
        />
        <Input
          placeholder="Search by reference or order number..."
          className="pl-12 h-12 rounded-md border border-border bg-card focus:ring-primary/20 font-medium"
          value={params.search || ""}
          onChange={(e) => onParamsChange({ ...params, search: e.target.value })}
        />
      </div>

      <Select
        value={params.status || "ALL"}
        onValueChange={(val) =>
          onParamsChange({
            ...params,
            status: val === "ALL" ? "" : (val as AdminTransactionListParams["status"]),
          })
        }
      >
        <SelectTrigger className="h-12! data-[size=default]:h-12 px-6 rounded-md border border-border bg-card text-xs font-medium text-muted-foreground outline-hidden focus:ring-2 focus:ring-primary/20 min-w-[180px]">
          <SelectValue placeholder="All Statuses" />
        </SelectTrigger>
        <SelectContent className="bg-card border border-border text-xs font-medium text-foreground">
          <SelectItem value="ALL">All Statuses</SelectItem>
          <SelectItem value="PENDING">Pending</SelectItem>
          <SelectItem value="PAID">Paid</SelectItem>
          <SelectItem value="FAILED">Failed</SelectItem>
          <SelectItem value="REFUNDED">Refunded</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
