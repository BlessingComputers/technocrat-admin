import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { loyaltyTierClasses } from "../utils/customer-utils";

interface LoyaltyTierBadgeProps {
  tier?: string;
  className?: string;
}

export function LoyaltyTierBadge({ tier, className }: LoyaltyTierBadgeProps) {
  if (!tier) {
    return (
      <span className="text-[10px] font-bold text-muted-foreground">—</span>
    );
  }

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-[9px] font-black uppercase tracking-widest",
        loyaltyTierClasses(tier),
        className,
      )}
    >
      <AppIcon icon="solar:cup-star-linear" className="w-3 h-3" />
      {tier}
    </div>
  );
}
