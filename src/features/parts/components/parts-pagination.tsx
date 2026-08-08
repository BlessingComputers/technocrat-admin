"use client";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { PartsListMeta } from "../types/parts";

interface PartsPaginationProps {
  meta: PartsListMeta;
  onPageChange: (page: number) => void;
}

/** Render a compact, windowed page list so very long lists don't overflow. */
function pageWindow(page: number, totalPages: number): number[] {
  const span = 2;
  const start = Math.max(1, page - span);
  const end = Math.min(totalPages, page + span);
  const pages: number[] = [];
  for (let p = start; p <= end; p++) pages.push(p);
  return pages;
}

export function PartsPagination({ meta, onPageChange }: PartsPaginationProps) {
  const { total, page, totalPages, limit, hasNextPage, hasPrevPage } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);
  const pages = pageWindow(page, totalPages);

  return (
    <div className="flex items-center justify-between border-t border-border bg-muted/20 p-3">
      <div className="text-xs font-medium text-muted-foreground">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={!hasPrevPage}
        >
          <AppIcon icon="solar:alt-arrow-left-linear" className="size-3.5" />
        </Button>
        {pages[0] > 1 && (
          <span className="px-1 text-xs font-medium text-muted-foreground">…</span>
        )}
        {pages.map((p) => (
          <Button
            key={p}
            variant={p === page ? "default" : "outline"}
            size="icon"
            className={cn(
              "h-7 w-7 text-xs font-medium",
              p === page && "bg-primary text-primary-foreground hover:bg-primary/90",
            )}
            onClick={() => onPageChange(p)}
          >
            {p}
          </Button>
        ))}
        {pages[pages.length - 1] < totalPages && (
          <span className="px-1 text-xs font-medium text-muted-foreground">…</span>
        )}
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={!hasNextPage}
        >
          <AppIcon icon="solar:alt-arrow-right-linear" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
