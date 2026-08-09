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
    <FilterBar>
      <Select
        value={status || "ALL"}
        onValueChange={(val) =>
          onStatusChange(val === "ALL" ? "" : (val as InvoiceStatus))
        }
      >
        <SelectTrigger className={filterControlClass}>
          <SelectValue placeholder="All status" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All status</SelectItem>
          {STATUS_OPTIONS.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <FilterSearch
        placeholder="Search invoice"
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
      />
    </FilterBar>
  );
}
