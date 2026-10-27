"use client";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils/cn";

/**
 * The table-footer pager, as one primitive.
 *
 * It exists because the products footer rendered `Array.from({ length:
 * totalPages })` — one button per page. At 20 rows a page a real catalog turns
 * that into a couple of hundred buttons that wrap over several lines and push
 * the table off screen. The page list here is bounded: first and last are
 * always reachable, the current page keeps a neighbour either side, and
 * everything between collapses to an ellipsis. Seven number buttons, worst
 * case, whatever the total.
 *
 * Deep paging is a poor way to reach a row anyway, so the footer also carries
 * the rows-per-page control: raising the page size is what actually shortens
 * the walk, and it belongs next to the thing it shortens.
 */

/** Ellipsis marker. A distinct type so a page number 0 can never collide. */
const GAP = "gap" as const;
type PageEntry = number | typeof GAP;

/**
 * Bounded page list: `1 … 6 [7] 8 … 42`. Below the point where the full list
 * fits in the same width, every page is listed instead — an ellipsis that hides
 * a single page is noise.
 */
export function pageEntries(page: number, totalPages: number): PageEntry[] {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const entries: PageEntry[] = [1];
  const left = Math.max(2, Math.min(page - 1, totalPages - 4));
  const right = Math.min(totalPages - 1, Math.max(page + 1, 5));

  if (left > 2) entries.push(GAP);
  for (let p = left; p <= right; p++) entries.push(p);
  if (right < totalPages - 1) entries.push(GAP);
  entries.push(totalPages);

  return entries;
}

/** Rows-per-page choices. 20 is the default across the list views. */
export const PAGE_SIZES = [20, 50, 100] as const;

interface DataPaginationProps {
  page: number;
  totalPages: number;
  /** Total matching records, for the "Showing 1–20 of 340" summary. */
  total: number;
  /** Rows per page — drives the summary range and the size control. */
  limit: number;
  onPageChange: (page: number) => void;
  /** Omit to hide the rows-per-page control. */
  onLimitChange?: (limit: number) => void;
  /** Plural noun for the summary, e.g. "products". */
  noun?: string;
  className?: string;
}

export function DataPagination({
  page,
  totalPages,
  total,
  limit,
  onPageChange,
  onLimitChange,
  noun = "results",
  className,
}: DataPaginationProps) {
  const pages = Math.max(totalPages, 1);
  const current = Math.min(Math.max(page, 1), pages);
  const from = total === 0 ? 0 : (current - 1) * limit + 1;
  const to = Math.min(current * limit, total);

  return (
    <div
      className={cn(
        "flex flex-col gap-3 border-t border-border bg-muted/20 p-3 sm:flex-row sm:items-center sm:justify-between",
        className,
      )}
    >
      <div className="flex items-center gap-4">
        <MetaLabel>
          {total === 0
            ? `No ${noun}`
            : `Showing ${from}–${to} of ${total} ${noun}`}
        </MetaLabel>

        {/* The size control is not wrapped in a <label>: the trigger is a
            button, so it carries its own accessible name via aria-label and the
            text beside it is a visible caption only. */}
        {onLimitChange && total > PAGE_SIZES[0] && (
          <div className="flex items-center gap-2">
            <MetaLabel aria-hidden>Rows</MetaLabel>
            <Select
              value={String(limit)}
              onValueChange={(value) => onLimitChange(Number(value))}
            >
              <SelectTrigger
                size="sm"
                className="h-7! w-[4.5rem]"
                aria-label="Rows per page"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZES.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>

      {pages > 1 && (
        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(current - 1)}
            disabled={current <= 1}
            aria-label="Previous page"
          >
            <AppIcon icon="solar:alt-arrow-left-linear" className="size-3.5" />
          </Button>

          {pageEntries(current, pages).map((entry, i) =>
            entry === GAP ? (
              <span
                key={`gap-${i}`}
                aria-hidden
                className="px-1 text-xs font-medium text-muted-foreground"
              >
                …
              </span>
            ) : (
              <Button
                key={entry}
                variant={entry === current ? "default" : "outline"}
                size="icon"
                className="h-7 w-7 text-xs font-medium tabular-nums"
                onClick={() => onPageChange(entry)}
                aria-label={`Page ${entry}`}
                aria-current={entry === current ? "page" : undefined}
              >
                {entry}
              </Button>
            ),
          )}

          <Button
            variant="outline"
            size="icon"
            className="h-7 w-7"
            onClick={() => onPageChange(current + 1)}
            disabled={current >= pages}
            aria-label="Next page"
          >
            <AppIcon icon="solar:alt-arrow-right-linear" className="size-3.5" />
          </Button>
        </nav>
      )}
    </div>
  );
}
