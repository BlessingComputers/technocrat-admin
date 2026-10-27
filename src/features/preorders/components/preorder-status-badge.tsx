import { cn } from "@/lib/utils/cn";
import {
  preorderStatusClasses,
  preorderStatusLabel,
} from "../utils/preorder-utils";

interface PreorderStatusBadgeProps {
  status?: string;
  className?: string;
}

export function PreorderStatusBadge({
  status,
  className,
}: PreorderStatusBadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex px-2.5 py-1 rounded-full border text-xs font-medium",
        preorderStatusClasses(status),
        className,
      )}
    >
      {preorderStatusLabel(status)}
    </span>
  );
}
