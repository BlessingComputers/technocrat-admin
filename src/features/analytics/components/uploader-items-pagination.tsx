import { Button } from "@/components/ui/button";
import type { ItemsMeta } from "../types/upload-analytics";

/** Prev/next pager for the drill-down item lists. */
export function UploaderItemsPagination({
  meta,
  page,
  onPageChange,
}: {
  meta: ItemsMeta;
  page: number;
  onPageChange: (page: number) => void;
}) {
  if (meta.totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between border-t border-border px-4 py-3">
      <p className="text-xs font-medium text-muted-foreground">
        Page {meta.page} of {meta.totalPages} · {meta.total} items
      </p>
      <div className="flex gap-2">
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasPrevPage}
          onClick={() => onPageChange(page - 1)}
        >
          Prev
        </Button>
        <Button
          variant="outline"
          size="sm"
          disabled={!meta.hasNextPage}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
