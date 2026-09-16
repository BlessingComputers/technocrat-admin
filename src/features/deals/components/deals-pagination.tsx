"use client";

import { Button } from "@/components/ui/button";

interface DealsPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/**
 * Prev / Next pager for the deals list.
 *
 * Feature-local and deliberately plain, matching the pagers the other list
 * views in this admin carry (customers, orders, invoices). The page count is
 * the server's: `GET /deals` pages, and the list view passes its `meta` through.
 */
export function DealsPagination({
  page,
  totalPages,
  onPageChange,
}: DealsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 border-t border-border bg-muted/20 p-3">
      <Button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        variant="outline"
        className="rounded-md text-xs font-medium"
      >
        Previous
      </Button>
      <div className="flex items-center px-4 text-sm font-semibold text-muted-foreground">
        Page {page} of {totalPages}
      </div>
      <Button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        variant="outline"
        className="rounded-md text-xs font-medium"
      >
        Next
      </Button>
    </div>
  );
}
