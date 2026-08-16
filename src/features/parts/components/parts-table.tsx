"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { PartTableRow } from "./part-table-row";
import { PartsTableSkeleton } from "./parts-skeletons";
import type { Part } from "../types/parts";

interface PartsTableProps {
  parts: Part[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
  onView: (part: Part) => void;
  onEdit: (part: Part) => void;
  onToggleStatus: (part: Part) => void;
  onDelete: (part: Part) => void;
  /** DB UUIDs of the currently selected rows. */
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  onToggleAll: (checked: boolean) => void;
}

const HEAD =
  "font-semibold text-xs text-muted-foreground";

const COL_SPAN = 7;

export function PartsTable({
  parts,
  isLoading,
  isError,
  onRetry,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: PartsTableProps) {
  if (isLoading) return <PartsTableSkeleton />;

  const allSelected =
    parts.length > 0 && parts.every((p) => selectedIds.has(p.id));
  const someSelected = parts.some((p) => selectedIds.has(p.id));

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[820px]">
        <TableHeader className="bg-primary/[0.04]">
          <TableRow className="border-b-border/60">
            <TableHead className="w-10 pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(c) => onToggleAll(c === true)}
                aria-label="Select all parts on this page"
              />
            </TableHead>
            <TableHead className={HEAD}>Part Details</TableHead>
            <TableHead className={HEAD}>Type</TableHead>
            <TableHead className={HEAD}>Pricing</TableHead>
            <TableHead className={HEAD}>Stock</TableHead>
            <TableHead className={HEAD}>Status</TableHead>
            <TableHead className={cn(HEAD, "pr-6 text-right")}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="h-[360px]">
                <div className="mx-auto flex max-w-md flex-col items-center justify-center gap-4 text-center">
                  <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive-ink">
                    <AppIcon icon="solar:danger-circle-linear" className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      Parts service unavailable
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      We hit an error fetching parts. Please try again shortly.
                    </p>
                  </div>
                  <Button variant="outline" onClick={onRetry} className="mt-1">
                    Retry
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : parts.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={COL_SPAN}
                className="h-40 text-center text-muted-foreground"
              >
                <AppIcon
                  icon="solar:cpu-bolt-linear"
                  className="mx-auto mb-2 size-8 opacity-30"
                />
                <span className="text-xs font-medium">
                  No parts match your filters
                </span>
              </TableCell>
            </TableRow>
          ) : (
            parts.map((p) => (
              <PartTableRow
                key={p.id}
                part={p}
                selected={selectedIds.has(p.id)}
                onToggleSelected={() => onToggleRow(p.id)}
                onView={onView}
                onEdit={onEdit}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
