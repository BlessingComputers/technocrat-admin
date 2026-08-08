import { cn } from "@/lib/utils/cn";
import { invoiceTypeMeta } from "../utils/invoice-utils";
import type { InvoiceType } from "../types/invoice";

interface InvoiceTypeBadgeProps {
  type: InvoiceType;
  className?: string;
}

export function InvoiceTypeBadge({ type, className }: InvoiceTypeBadgeProps) {
  const meta = invoiceTypeMeta(type);
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full border px-3 py-1 text-[11px] font-semibold whitespace-nowrap",
        meta.className,
        className,
      )}
    >
      {meta.label}
    </span>
  );
}
