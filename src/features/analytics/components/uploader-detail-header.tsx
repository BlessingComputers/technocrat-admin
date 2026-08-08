import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { UploadTargetProgress } from "./upload-target-progress";
import type { UploaderSummary } from "../types/upload-analytics";

function initials(name: string): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

/** Identity + period totals + today-vs-target for a single uploader. */
export function UploaderDetailHeader({
  uploader,
  isLoading,
}: {
  uploader?: UploaderSummary;
  isLoading: boolean;
}) {
  if (isLoading && !uploader) {
    return <Skeleton className="h-28 w-full rounded-xl" />;
  }
  if (!uploader) return null;

  const {
    staff,
    totals,
    todayStat,
    dailyTarget,
    targetIsCustom,
    percentOfDailyTarget,
    dailyAverage,
  } = uploader;

  return (
    <Card>
      <CardContent className="flex flex-col gap-6 p-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-4">
          <Avatar size="lg">
            {staff.avatarUrl && (
              <AvatarImage src={staff.avatarUrl} alt={staff.name} />
            )}
            <AvatarFallback>{initials(staff.name)}</AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold leading-tight">{staff.name}</p>
            <p className="text-xs font-medium text-muted-foreground">
              {staff.staffId}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-x-8 gap-y-4">
          <Stat label="Products" value={totals.products} />
          <Stat label="Parts" value={totals.parts} />
          <Stat label="Total" value={totals.total} />
          <Stat label="Daily avg" value={dailyAverage.toFixed(1)} />
          <div className="min-w-40">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Today vs target
            </p>
            <UploadTargetProgress
              today={todayStat.total}
              target={dailyTarget}
              percent={percentOfDailyTarget}
              isCustom={targetIsCustom}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div>
      <p className="text-xl font-bold leading-none tabular-nums">{value}</p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </p>
    </div>
  );
}
