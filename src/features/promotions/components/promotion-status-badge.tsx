import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import type { PromotionStatus } from "../types/promotions";

const STATUS_CONFIG: Record<
  PromotionStatus,
  { label: string; variant: "success" | "muted" | "outline"; icon: string }
> = {
  DRAFT: { label: "Draft", variant: "muted", icon: "solar:file-linear" },
  PUBLISHED: {
    label: "Published",
    variant: "success",
    icon: "solar:check-circle-bold",
  },
  ARCHIVED: {
    label: "Archived",
    variant: "outline",
    icon: "solar:archive-linear",
  },
};

export function PromotionStatusBadge({ status }: { status: PromotionStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <Badge
      variant={config.variant}
      className="gap-1 text-[10px] font-black uppercase tracking-widest px-2.5 py-1"
    >
      <AppIcon icon={config.icon} className="size-3" />
      {config.label}
    </Badge>
  );
}
