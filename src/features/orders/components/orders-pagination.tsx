"use client";

import { Button } from "@/components/ui/button";

interface OrdersPaginationProps {
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}

export function OrdersPagination({
  page,
  totalPages,
  hasNextPage,
  onPageChange,
}: OrdersPaginationProps) {
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
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        variant="outline"
        className="rounded-md font-medium text-xs"
      >
        Next
      </Button>
    </div>
  );
}
