"use client";

import { Button } from "@/components/ui/button";

interface CouponsPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function CouponsPagination({
  page,
  totalPages,
  onPageChange,
}: CouponsPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 pt-8">
      <Button
        disabled={page <= 1}
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
