"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UploaderDateRange } from "./uploader-date-range";
import {
  UPLOADER_SORTS,
  parseUploaderSort,
  type UploaderSort,
} from "../utils/filter-sort-uploaders";
import type { DateRange } from "../model/upload-period";

interface UploaderManagementToolbarProps {
  range: DateRange;
  onRangeChange: (range: DateRange) => void;
  search: string;
  onSearchChange: (value: string) => void;
  sort: UploaderSort;
  onSortChange: (sort: UploaderSort) => void;
}

/** One filter row: period on the left; search and sort on the right. */
export function UploaderManagementToolbar({
  range,
  onRangeChange,
  search,
  onSearchChange,
  sort,
  onSortChange,
}: UploaderManagementToolbarProps) {
  return (
    <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
      <UploaderDateRange range={range} onChange={onRangeChange} />
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative sm:w-60">
          <AppIcon
            icon="solar:magnifer-linear"
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
          />
          <Input
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search name or staff ID…"
            aria-label="Search uploaders"
            className="pl-9"
          />
        </div>
        <Select
          value={sort}
          onValueChange={(value) => onSortChange(parseUploaderSort(value))}
        >
          <SelectTrigger aria-label="Sort by" className="sm:w-68">
            <span className="flex min-w-0 items-center gap-1.5">
              <span className="text-muted-foreground">Sort by</span>
              <span className="truncate font-medium">
                <SelectValue />
              </span>
            </span>
          </SelectTrigger>
          <SelectContent position="popper" align="end">
            {UPLOADER_SORTS.map((option) => (
              <SelectItem key={option.id} value={option.id}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
