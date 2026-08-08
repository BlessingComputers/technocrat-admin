"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

interface InvoicePaginationProps {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  /** Noun for the count label, e.g. "invoices". */
  noun?: string;
}

/** Build a compact page list with ellipses, e.g. [1, 2, 3, "…", 5]. */
function pageList(page: number, totalPages: number): (number | "…")[] {
  if (totalPages <= 6) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages: (number | "…")[] = [];
  const left = Math.max(2, page - 1);
  const right = Math.min(totalPages - 1, page + 1);
  pages.push(1);
  if (left > 2) pages.push("…");
  for (let p = left; p <= right; p++) pages.push(p);
  if (right < totalPages - 1) pages.push("…");
  pages.push(totalPages);
  return pages;
}

export function InvoicePagination({
  page,
  limit,
  total,
  totalPages,
  onPageChange,
  noun = "invoices",
}: InvoicePaginationProps) {
  if (total === 0) return null;

  const start = (page - 1) * limit + 1;
  const end = Math.min(page * limit, total);
  const pages = pageList(page, Math.max(totalPages, 1));

  return (
    <div className="flex flex-col items-start gap-4 px-6 py-5 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Showing {start}-{end} of {total} {noun}
      </p>

      <div className="flex items-center gap-1.5">
        {pages.map((p, idx) =>
          p === "…" ? (
            <span
              key={`ellipsis-${idx}`}
              className="px-1.5 text-sm text-muted-foreground"
            >
              …
            </span>
          ) : (
            <button
              key={p}
              type="button"
              onClick={() => onPageChange(p)}
              aria-current={p === page ? "page" : undefined}
              className={cn(
                "flex h-8 min-w-8 items-center justify-center rounded-md px-2 text-sm font-medium transition-colors",
                p === page
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted",
              )}
            >
              {p}
            </button>
          ),
        )}

        <button
          type="button"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="ml-1 flex h-8 items-center gap-1 rounded-md px-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
        >
          Next
          <AppIcon icon="solar:alt-arrow-right-linear" className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
