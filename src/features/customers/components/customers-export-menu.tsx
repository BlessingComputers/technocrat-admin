"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  EXPORT_FORMATS,
  exportRows,
  type ExportColumn,
  type ExportFormat,
} from "@/lib/utils/export-rows";
import { customerService } from "../api/customer.service";
import type { Customer, CustomersListParams } from "../types/customers";

const date = (iso?: string | null) => (iso ? new Date(iso) : null);

const COLUMNS: ExportColumn<Customer>[] = [
  { header: "Customer ID", value: (c) => c.customerId, width: 14, pdf: false },
  { header: "First name", value: (c) => c.firstName, width: 16 },
  { header: "Last name", value: (c) => c.lastName, width: 16 },
  { header: "Email", value: (c) => c.email, width: 30 },
  { header: "Phone", value: (c) => c.phone, width: 16 },
  { header: "Status", value: (c) => c.status, width: 12 },
  { header: "Loyalty tier", value: (c) => c.loyaltyTier, width: 12 },
  { header: "Loyalty points", value: (c) => c.loyaltyPoints, width: 12, pdf: false },
  { header: "Email verified", value: (c) => c.isEmailVerified, width: 12, pdf: false },
  { header: "Orders", value: (c) => c.totalOrders, width: 10 },
  {
    header: "Total spent (NGN)",
    value: (c) => (c.totalSpent == null ? null : Number(c.totalSpent)),
    width: 16,
  },
  { header: "Last order", value: (c) => date(c.lastOrderAt), width: 12, pdf: false },
  { header: "Last login", value: (c) => date(c.lastLoginAt), width: 12, pdf: false },
  { header: "Joined", value: (c) => date(c.createdAt), width: 12 },
];

/**
 * Exports every customer matching the list's current search and filters, not
 * just the page on screen.
 */
export function CustomersExportMenu({ params }: { params: CustomersListParams }) {
  const [busy, setBusy] = useState(false);

  async function run(format: ExportFormat) {
    setBusy(true);
    const id = toast.loading("Fetching customers…");
    try {
      const rows = await customerService.getAllMatchingCustomers(
        params,
        (loaded, total) =>
          toast.loading(`Fetching customers… ${loaded} of ${total}`, { id }),
      );
      if (rows.length === 0) {
        toast.error("No customers match these filters.", { id });
        return;
      }
      await exportRows(format, rows, COLUMNS, {
        fileName: `customers-${new Date().toISOString().slice(0, 10)}`,
        title: "Customers",
      });
      toast.success(`Exported ${rows.length} customers.`, { id });
    } catch (error) {
      toast.error(`Export failed: ${getErrorMessage(error)}`, { id });
    } finally {
      setBusy(false);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" disabled={busy}>
          <AppIcon icon="solar:file-linear" className="size-4" />
          {busy ? "Exporting…" : "Export"}
          <AppIcon icon="solar:alt-arrow-down-linear" className="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52">
        <DropdownMenuLabel className="text-xs font-normal text-muted-foreground">
          All customers matching the current filters
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {EXPORT_FORMATS.map(({ format, label }) => (
          <DropdownMenuItem key={format} onSelect={() => run(format)}>
            {label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
