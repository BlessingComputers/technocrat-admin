"use client";

import Link from "next/link";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { BulkBatchStatus, BulkBatchStatusRow } from "../../types/products";
import { humanizeBulkRowError } from "./bulk-helpers";

interface BulkResultModalProps {
  open: boolean;
  batch: BulkBatchStatus | undefined;
  /** Dismiss and clear the finished batch to start a fresh upload. */
  onUploadMore: () => void;
  /** Dismiss only — the progress card (with per-row results) stays visible. */
  onClose: () => void;
}

/** Terminal-state outcome dialog for a bulk import (success / partial / failed). */
export function BulkResultModal({
  open,
  batch,
  onUploadMore,
  onClose,
}: BulkResultModalProps) {
  if (!batch) return null;

  const results = batch.results ?? [];
  const failedRows = results.filter((r) => !r.success);
  const succeeded = results.length - failedRows.length;

  const outcome: "success" | "partial" | "failed" =
    batch.status === "failed"
      ? "failed"
      : failedRows.length === 0
        ? "success"
        : "partial";

  const ICON: Record<typeof outcome, { icon: string; className: string }> = {
    success: { icon: "solar:check-circle-bold", className: "bg-success/10 text-success-ink" },
    partial: { icon: "solar:danger-circle-bold", className: "bg-warning/10 text-warning-ink" },
    failed: { icon: "solar:close-circle-bold", className: "bg-destructive/10 text-destructive-ink" },
  };

  const TITLE: Record<typeof outcome, string> = {
    success: "Upload complete",
    partial: "Upload finished with errors",
    failed: "Upload failed",
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div
            className={cn(
              "mb-2 flex size-11 items-center justify-center rounded-2xl",
              ICON[outcome].className,
            )}
          >
            <AppIcon icon={ICON[outcome].icon} className="size-5" />
          </div>
          <DialogTitle>{TITLE[outcome]}</DialogTitle>
          <DialogDescription>
            {outcome === "success" && (
              <>
                All{" "}
                <strong className="text-foreground">
                  {succeeded} product{succeeded === 1 ? "" : "s"}
                </strong>{" "}
                were created successfully.
              </>
            )}
            {outcome === "partial" && (
              <>
                <strong className="text-foreground">{succeeded}</strong> of{" "}
                <strong className="text-foreground">{results.length}</strong>{" "}
                products were created. The {failedRows.length} failed row
                {failedRows.length === 1 ? " is" : "s are"} still in the editor
                — fix the issues below and upload again.
              </>
            )}
            {outcome === "failed" &&
              "The batch could not be processed. Your rows are still in the editor — review them and try again."}
          </DialogDescription>
        </DialogHeader>

        {failedRows.length > 0 && <FailedRowsList rows={failedRows} />}

        <DialogFooter className="gap-2 sm:gap-2">
          {outcome === "success" ? (
            <Button variant="outline" onClick={onUploadMore}>
              <AppIcon icon="solar:add-circle-linear" className="size-4 mr-1.5" />
              Upload more
            </Button>
          ) : (
            <Button variant="outline" onClick={onClose}>
              <AppIcon icon="solar:pen-2-linear" className="size-4 mr-1.5" />
              Review rows
            </Button>
          )}
          <Button asChild>
            <Link href="/catalogues">
              <AppIcon icon="solar:box-linear" className="size-4 mr-1.5" />
              View product list
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function FailedRowsList({ rows }: { rows: BulkBatchStatusRow[] }) {
  return (
    <div className="max-h-48 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border">
      {rows.map((r) => (
        <div key={r.row} className="px-3 py-2 text-xs">
          <p className="font-semibold text-foreground truncate">
            {r.productName || `Row ${r.row}`}
          </p>
          <p className="text-destructive-ink">{humanizeBulkRowError(r.error)}</p>
        </div>
      ))}
    </div>
  );
}
