"use client";

import { useMemo, useState } from "react";
import PageContainer from "@/components/layouts/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";
import { useStaffSession } from "@/lib/auth/session-context";
import { isSuperAdmin } from "@/lib/auth/permissions";
import { useUploaderAnalytics } from "../api/analytics.queries";
import { useUploaderFilters } from "../hooks/use-uploader-filters";
import { filterSortUploaders } from "../utils/filter-sort-uploaders";
import { UploaderManagementToolbar } from "./uploader-management-toolbar";
import { UploaderSummaryStrip } from "./uploader-summary-strip";
import { UploadersTable } from "./uploaders-table";
import { UploaderAnalyticsSkeleton } from "./uploader-analytics-skeleton";
import { UploaderAnalyticsEmpty } from "./uploader-analytics-empty";
import { SetTargetDialog } from "./set-target-dialog";
import type { UploaderSummary } from "../types/upload-analytics";

/**
 * Full-page upload management (route `/users/uploads`). The dashboard section is
 * an at-a-glance view; this is the managed surface — proper date range, search,
 * sort, and (super admins only) per-uploader target management.
 */
export function UploaderManagementView() {
  const { staffSession } = useStaffSession();
  const canManageTargets = isSuperAdmin(staffSession);

  const { params, searchInput, setRange, setSort, setSearch } =
    useUploaderFilters();
  const [editing, setEditing] = useState<UploaderSummary | null>(null);

  const { data, isLoading, isError, isFetching } = useUploaderAnalytics({
    startDate: params.range.startDate,
    endDate: params.range.endDate,
  });

  const uploaders = useMemo(
    () => filterSortUploaders(data?.uploaders ?? [], params.search ?? "", params.sort),
    [data, params.search, params.sort],
  );

  return (
    <PageContainer>
      <PageHeader
        title="Upload Management"
        description="Track each staff member's uploads against their daily target and manage targets."
      />
      <div className="space-y-6">
        <UploaderManagementToolbar
          range={params.range}
          onRangeChange={setRange}
          search={searchInput}
          onSearchChange={setSearch}
          sort={params.sort}
          onSortChange={setSort}
        />
        {data && <UploaderSummaryStrip uploaders={data.uploaders} />}
        <Card className="overflow-hidden">
          <CardContent
            className={cn(
              "p-0 transition-opacity duration-200",
              isFetching && "pointer-events-none opacity-60",
            )}
          >
            {isLoading ? (
              <UploaderAnalyticsSkeleton />
            ) : isError ? (
              <UploaderAnalyticsEmpty message="Couldn't load upload analytics." />
            ) : uploaders.length === 0 ? (
              <UploaderAnalyticsEmpty message="No uploaders match your filters." />
            ) : (
              <UploadersTable
                uploaders={uploaders}
                onEdit={canManageTargets ? setEditing : undefined}
              />
            )}
          </CardContent>
        </Card>
      </div>
      <SetTargetDialog uploader={editing} onClose={() => setEditing(null)} />
    </PageContainer>
  );
}
