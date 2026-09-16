"use client";

import { Button } from "@/components/ui/button";

interface PreordersPaginationProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function PreordersPagination({
  page,
  totalPages,
  onPageChange,
}: PreordersPaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center gap-2 pt-8">
      <Button
        disabled={page <= 1}
        onClick={() => onPageChange(page - 1)}
        variant="outline"
        className="rounded-md font-medium text-xs"
      >
        Previous
      </Button>
      <div className="flex items-center px-4 font-semibold text-muted-foreground text-sm">
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
