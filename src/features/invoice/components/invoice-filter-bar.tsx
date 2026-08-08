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
import type { InvoiceStatus } from "../types/invoice";

interface InvoiceFilterBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: InvoiceStatus | "";
  onStatusChange: (value: InvoiceStatus | "") => void;
}

const STATUS_OPTIONS: { value: InvoiceStatus; label: string }[] = [
  { value: "ISSUED", label: "Issued" },
  { value: "PAID", label: "Paid" },
  { value: "APPROVED", label: "Approved" },
  { value: "PARTIALLY_APPROVED", label: "Partially approved" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export function InvoiceFilterBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: InvoiceFilterBarProps) {
  return (
    <div className="flex items-center gap-3">
      <Select
        value={status || "ALL"}
        onValueChange={(val) =>
          onStatusChange(val === "ALL" ? "" : (val as InvoiceStatus))
        }
      >
        <SelectTrigger className="h-10 min-w-[130px] rounded-lg border-border/60 bg-muted/40 text-sm font-medium text-muted-foreground data-[size=default]:h-10">
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent className="text-sm font-medium">
          <SelectItem value="ALL">All status</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <div className="relative flex-1">
        <AppIcon
          icon="solar:magnifer-linear"
          className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          placeholder="Search invoice"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          className="h-10 rounded-lg border-border/60 bg-muted/40 pl-10 text-sm font-medium"
        />
      </div>
    </div>
  );
}
