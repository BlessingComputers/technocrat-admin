import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { TableCell, TableRow } from "@/components/ui/table";

interface RecentOrderRowProps {
  id: string;
  orderNumber?: string;
  customer: string;
  email: string;
  product?: string;
  value: string | number;
  date: string;
  status: string;
}

type StatusVariant = "success" | "info" | "warning" | "danger" | "muted";

function statusToVariant(s: string): StatusVariant {
  if (!s) return "muted";
  const statusLower = s.toLowerCase();
  if (
    statusLower.includes("completed") ||
    statusLower.includes("delivered") ||
    statusLower === "payment_confirmed"
  ) {
    return "success";
  }
  if (
    statusLower.includes("shipped") ||
    statusLower.includes("delivery") ||
    statusLower === "assigned" ||
    statusLower.includes("processing") ||
    statusLower === "proof_submitted"
  ) {
    return "info";
  }
  if (statusLower.includes("pending") || statusLower === "awaiting_payment") {
    return "warning";
  }
  if (statusLower.includes("cancel") || statusLower.includes("reject")) {
    return "danger";
  }
  return "muted";
}

export function RecentOrderRow({
  id,
  orderNumber,
  customer,
  email,
  product = "Multiple Items",
  value,
  date,
  status,
}: RecentOrderRowProps) {
  return (
    <TableRow className="hover:bg-muted/30 transition-colors border-b-border/40 group">
      <TableCell className="px-6 font-mono text-xs font-semibold tabular-nums text-foreground">
        {orderNumber || id.slice(0, 8).toUpperCase()}
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-3">
          <Avatar className="size-8 rounded-full border border-border/60">
            <AvatarFallback className="text-xs font-medium bg-muted uppercase">
              {customer.substring(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-medium leading-tight">{customer}</span>
            <span className="text-xs text-muted-foreground">{email}</span>
          </div>
        </div>
      </TableCell>
      <TableCell className="text-sm font-medium">{product}</TableCell>
      <TableCell className="text-sm font-semibold tabular-nums">{value}</TableCell>
      <TableCell className="text-xs text-muted-foreground">{date}</TableCell>
      <TableCell className="text-right px-6">
        <Badge
          variant={statusToVariant(status)}
          className="rounded-lg text-xs px-2 py-1 uppercase tracking-wide"
        >
          {status?.replace(/_/g, " ") || "PENDING"}
        </Badge>
      </TableCell>
    </TableRow>
  );
}
