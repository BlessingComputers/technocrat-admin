import { cn } from "@/lib/utils/cn";
import { customerStatusClasses } from "../utils/customer-utils";

interface CustomerStatusBadgeProps {
  status?: string;
  className?: string;
}

export function CustomerStatusBadge({
  status,
  className,
}: CustomerStatusBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
        customerStatusClasses(status),
        className,
      )}
    >
      {status?.replace(/_/g, " ") || "UNKNOWN"}
    </div>
  );
}
