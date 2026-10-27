"use client";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

interface RefreshButtonProps {
  onRefresh: () => void;
  isRefreshing: boolean;
  className?: string;
  label?: string;
  refreshingLabel?: string;
}

/**
 * Shared "refresh data" button with a spinning icon while in flight. Used by
 * feature views that poll/refetch (dashboard, orders, …).
 */
export function RefreshButton({
  onRefresh,
  isRefreshing,
  className,
  label = "Refresh Data",
  refreshingLabel = "Refreshing...",
}: RefreshButtonProps) {
  return (
    <Button
      onClick={onRefresh}
      variant="outline"
      className={cn(
        "h-10 px-4 rounded-md bg-card border border-border hover:bg-accent flex items-center gap-2 text-xs font-medium text-muted-foreground transition-all",
        className,
      )}
      disabled={isRefreshing}
    >
      <AppIcon
        icon="solar:refresh-linear"
        className={cn(
          "w-3.5 h-3.5 text-muted-foreground transition-transform",
          isRefreshing && "animate-spin",
        )}
      />
      {isRefreshing ? refreshingLabel : label}
    </Button>
  );
}
