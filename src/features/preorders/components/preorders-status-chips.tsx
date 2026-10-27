"use client";

import { cn } from "@/lib/utils/cn";
import { Skeleton } from "@/components/ui/skeleton";
import {
  PREORDER_STATUSES,
  type PreorderStatus,
} from "../types/preorders";
import {
  preorderStatusClasses,
  preorderStatusLabel,
} from "../utils/preorder-utils";

interface PreordersStatusChipsProps {
  active?: PreorderStatus;
  counts: Record<PreorderStatus, number | undefined>;
  total?: number;
  isLoading: boolean;
  onSelect: (status: PreorderStatus | undefined) => void;
}

/**
 * The status filter and the backlog readout, as one row.
 *
 * These were nearly built as two things — a stats bar above, a status `<Select>`
 * in the filter bar below — which is how the customers page does it. That
 * split is wrong here. On a queue, "how many are pending" and "show me the
 * pending ones" are the same thought, and separating them means reading a
 * number in one place and then hunting for the control that acts on it. A
 * count you can click is strictly better than a count you can only look at.
 *
 * Counts come from `usePreorderCounts` and describe the WHOLE queue, never the
 * current search — see the note there on why.
 */
export function PreordersStatusChips({
  active,
  counts,
  total,
  isLoading,
  onSelect,
}: PreordersStatusChipsProps) {
  if (isLoading) {
    return (
      <div className="flex flex-wrap gap-2">
        {Array.from({ length: PREORDER_STATUSES.length + 1 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-full" />
        ))}
      </div>
    );
  }

  return (
    <div
      className="flex flex-wrap gap-2"
      role="group"
      aria-label="Filter pre-orders by status"
    >
      <Chip
        label="All"
        count={total}
        isActive={!active}
        onClick={() => onSelect(undefined)}
      />
      {PREORDER_STATUSES.map((status) => (
        <Chip
          key={status}
          label={preorderStatusLabel(status)}
          count={counts[status]}
          isActive={active === status}
          toneClass={preorderStatusClasses(status)}
          onClick={() => onSelect(status)}
        />
      ))}
    </div>
  );
}

interface ChipProps {
  label: string;
  count?: number;
  isActive: boolean;
  /** Status tone, applied only while inactive — see below. */
  toneClass?: string;
  onClick: () => void;
}

function Chip({ label, count, isActive, toneClass, onClick }: ChipProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={isActive}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-3.5 py-2",
        "text-xs font-medium transition-colors",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        // Selection is carried by ONE treatment — the filled primary chip —
        // rather than by tinting the status tone darker. Two chips shouting in
        // two different colour languages is how a filter row stops reading as
        // a set of mutually exclusive options.
        isActive
          ? "border-primary bg-primary text-primary-foreground"
          : (toneClass ?? "bg-muted text-muted-foreground border-border"),
        !isActive && "hover:brightness-95 dark:hover:brightness-110",
      )}
    >
      <span>{label}</span>
      {typeof count === "number" && (
        <span
          className={cn(
            "tabular-nums rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
            isActive ? "bg-primary-foreground/20" : "bg-foreground/10",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
