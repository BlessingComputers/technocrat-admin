"use client";

import { Button } from "@/components/ui/button";

interface MonitorPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

/** Mirrors `payments/components/payments-pagination.tsx` — features can't
 * import each other, so this is a small local duplicate, not a shared import. */
export function MonitorPagination({
  page,
  totalPages,
  onPageChange,
}: MonitorPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 pt-8">
      <Button
        disabled={page === 1}
        onClick={() => onPageChange(page - 1)}
        variant="outline"
        className="rounded-md font-medium text-xs"
      >
        Previous
      </Button>
      <div className="flex items-center px-4 font-medium text-muted-foreground text-sm tabular-nums">
        Page {page} of {totalPages}
      </div>
      <Button
        disabled={page >= totalPages}
        onClick={() => onPageChange(page + 1)}
        variant="outline"
        className="rounded-md font-medium text-xs"
      >
        Next
      </Button>
    </div>
  );
}
