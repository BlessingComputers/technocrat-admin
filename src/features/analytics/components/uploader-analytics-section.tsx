"use client";

import { useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { useUploaderAnalytics } from "../api/analytics.queries";
import { periodToDateRange } from "../utils/period-to-range";
import { UploadersTable } from "./uploaders-table";
import { UploadPerformanceChart } from "./upload-performance-chart";
import { UploaderAnalyticsSkeleton } from "./uploader-analytics-skeleton";
import { UploaderAnalyticsEmpty } from "./uploader-analytics-empty";
import { SetTargetDialog } from "./set-target-dialog";
import type { AppliedDateRange } from "../types/analytics";
import type { UploaderSummary } from "../types/upload-analytics";

interface UploaderAnalyticsSectionProps {
  period: string;
  appliedCustomDates: AppliedDateRange | null;
}

/**
 * Super-admin dashboard section: per-uploader product/part counts vs each
 * staff member's daily target. Reacts to the dashboard's existing period
 * filter rather than owning its own date control.
 */
export function UploaderAnalyticsSection({
  period,
  appliedCustomDates,
}: UploaderAnalyticsSectionProps) {
  const range = useMemo(
    () => periodToDateRange(period, appliedCustomDates),
    [period, appliedCustomDates],
  );
  const { data, isLoading, isError } = useUploaderAnalytics(range);
  const [editing, setEditing] = useState<UploaderSummary | null>(null);

  return (
    <Card className="overflow-hidden rounded-xl border border-border bg-card">
      <div className="flex items-start justify-between gap-3 border-b border-border bg-muted/5 px-6 py-4">
        <div className="space-y-0.5">
          <h2 className="flex items-center gap-2 text-base font-semibold tracking-tight">
            <AppIcon
              icon="solar:cloud-upload-bold"
              className="size-4.5 text-primary"
            />
            Upload Performance
          </h2>
          <p className="text-xs font-medium text-muted-foreground">
            Products &amp; parts uploaded per staff member vs their daily target.
          </p>
        </div>
        {data && (
          <span className="shrink-0 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            {data.period.start} — {data.period.end}
          </span>
        )}
      </div>
      {data && data.uploaders.length > 0 && (
        <UploadPerformanceChart
          uploaders={data.uploaders}
          period={data.period}
        />
      )}
      <CardContent className="p-0">
        {isLoading ? (
          <UploaderAnalyticsSkeleton />
        ) : isError ? (
          <UploaderAnalyticsEmpty message="Couldn't load upload analytics." />
        ) : !data || data.uploaders.length === 0 ? (
          <UploaderAnalyticsEmpty message="No uploads recorded for this period." />
        ) : (
          <UploadersTable uploaders={data.uploaders} onEdit={setEditing} />
        )}
      </CardContent>
      <SetTargetDialog uploader={editing} onClose={() => setEditing(null)} />
    </Card>
  );
}
