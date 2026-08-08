import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils/cn";

/** Bar-shaped skeleton placeholder while a chart's data loads. */
export function ChartLoading({ className }: { className?: string }) {
  return (
    <div className={cn("flex h-full items-end gap-2 pt-4", className)}>
      {[60, 40, 75, 55, 85, 45, 70, 50].map((h, i) => (
        <Skeleton
          key={i}
          className="flex-1 rounded-md"
          style={{ height: `${h}%` }}
        />
      ))}
    </div>
  );
}

/** Neutral empty state when a chart has no data for the selected window. */
export function ChartEmpty({
  message = "No data for this period",
  icon = "solar:chart-2-linear",
  className,
}: {
  message?: string;
  icon?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col items-center justify-center gap-2 text-center text-muted-foreground",
        className,
      )}
    >
      <AppIcon icon={icon} className="size-8 opacity-40" />
      <p className="text-xs font-medium">{message}</p>
    </div>
  );
}
