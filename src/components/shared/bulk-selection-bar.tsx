"use client";

import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";

/**
 * A compact action bar shown above a table when one or more rows are selected.
 * Presentational only — the parent owns the selection set and the handlers.
 * Shared across the products and parts lists (same bulk edit/delete shape).
 */
interface BulkSelectionBarProps {
  count: number;
  /** Noun for the selected items, e.g. "product" (pluralized with +s). */
  noun: string;
  onEdit: () => void;
  onDelete: () => void;
  onClear: () => void;
  disabled?: boolean;
}

export function BulkSelectionBar({
  count,
  noun,
  onEdit,
  onDelete,
  onClear,
  disabled = false,
}: BulkSelectionBarProps) {
  if (count === 0) return null;

  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-primary/25 bg-primary/[0.06] px-4 py-2.5">
      <div className="flex items-center gap-3">
        <span className="flex size-6 items-center justify-center rounded-full bg-primary text-xs font-semibold tabular-nums text-primary-foreground">
          {count}
        </span>
        <span className="text-sm font-medium text-foreground">
          {noun}
          {count === 1 ? "" : "s"} selected
        </span>
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Clear
        </button>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onEdit}
          disabled={disabled}
          className="h-9 rounded-md font-medium"
        >
          <AppIcon icon="solar:pen-2-linear" className="mr-1.5 size-4" />
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onDelete}
          disabled={disabled}
          className="h-9 rounded-md border-destructive/30 font-medium text-destructive-ink hover:bg-destructive/10 hover:text-destructive-ink"
        >
          <AppIcon icon="solar:trash-bin-trash-linear" className="mr-1.5 size-4" />
          Delete
        </Button>
      </div>
    </div>
  );
}
