import { cn } from "@/lib/utils/cn";
import { invoiceStatusMeta } from "../utils/invoice-utils";
import type { InvoiceStatus, InvoiceType } from "../types/invoice";

interface InvoiceStatusBadgeProps {
  status: InvoiceStatus;
  invoiceType?: InvoiceType;
  className?: string;
}

export function InvoiceStatusBadge({
  status,
  invoiceType,
  className,
}: InvoiceStatusBadgeProps) {
  const meta = invoiceStatusMeta(status, invoiceType);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-3 py-1 text-xs font-semibold whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
