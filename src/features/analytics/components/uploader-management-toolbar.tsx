"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils/cn";
import { UploaderDateRange } from "./uploader-date-range";
import type { UploaderSort } from "../utils/filter-sort-uploaders";
import { MetaLabel } from "@/components/shared/meta-label";
import { Card } from "@/components/ui/card";

interface DateRange {
  startDate: string;
  endDate: string;
}

interface UploaderManagementToolbarProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sort: UploaderSort;
  onSortChange: (sort: UploaderSort) => void;
}

const SORTS: { id: UploaderSort; label: string }[] = [
  { id: "today", label: "Today" },
  { id: "total", label: "Period total" },
  { id: "target", label: "Furthest behind" },
  { id: "name", label: "Name" },
];

/** Date range (presets + custom) plus search and sort for the management table. */
export function UploaderManagementToolbar({
  range,
  onRangeChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: UploaderManagementToolbarProps) {
  return (
    <Card className="gap-0 space-y-4 p-4 sm:p-5">
      <UploaderDateRange range={range} onChange={onRangeChange} />
      <div className="flex flex-col gap-3 border-t border-border/60 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative sm:max-w-xs sm:flex-1">
          <AppIcon
            icon="solar:magnifer-linear"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search uploaders…"
            className="pl-9"
          />
        </div>
        <SortPills sort={sort} onSortChange={onSortChange} />
      </div>
    </Card>
  );
}

function SortPills({
  sort,
  onSortChange,
}: {
  sort: UploaderSort;
  onSortChange: (sort: UploaderSort) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      <MetaLabel className="shrink-0">
        Sort
      </MetaLabel>
      <div className="flex flex-wrap gap-1 rounded-xl border border-border/40 bg-muted/20 p-1">
        {SORTS.map((option) => (
          <button
            key={option.id}
            onClick={() => onSortChange(option.id)}
            className={cn(
              "rounded-lg px-2.5 py-1 text-xs font-semibold transition-all",
              sort === option.id
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {option.label}
          </button>
        ))}
      </div>
    </div>
  );
}
