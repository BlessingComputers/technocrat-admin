"use client";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { PaginationMeta } from "../types/products";

interface ProductsPaginationProps {
  meta: Pick<PaginationMeta, "total" | "page" | "totalPages" | "limit">;
  onPageChange: (page: number) => void;
}

export function ProductsPagination({ meta, onPageChange }: ProductsPaginationProps) {
  const { total, page, totalPages, limit } = meta;
  const from = total === 0 ? 0 : (page - 1) * limit + 1;
  const to = Math.min(page * limit, total);

  return (
    <div className="flex items-center justify-between border-t border-border p-3 bg-muted/20">
      <div className="text-xs font-medium text-muted-foreground">
        {total === 0 ? "No results" : `Showing ${from}–${to} of ${total}`}
      </div>
      <div className="flex items-center gap-1">
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page <= 1}
        >
          <AppIcon icon="solar:alt-arrow-left-linear" className="size-3.5" />
        </Button>
        {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
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
        <Button
          variant="outline"
          size="icon"
          className="h-7 w-7"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page >= totalPages}
        >
          <AppIcon icon="solar:alt-arrow-right-linear" className="size-3.5" />
        </Button>
      </div>
    </div>
  );
}
