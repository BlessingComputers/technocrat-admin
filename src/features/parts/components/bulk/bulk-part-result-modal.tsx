"use client";

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
import type { PartBulkBatchStatus } from "../../types/parts";

interface BulkPartResultModalProps {
  open: boolean;
  batch?: PartBulkBatchStatus;
  onUploadMore: () => void;
  onClose: () => void;
}

export function BulkPartResultModal({
  open,
  batch,
  onUploadMore,
  onClose,
}: BulkPartResultModalProps) {
  const results = batch?.results ?? [];
  const succeeded = results.filter((r) => r.success).length;
  const failed = results.filter((r) => !r.success);

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {batch?.status === "failed" ? "Batch failed" : "Upload complete"}
          </DialogTitle>
          <DialogDescription>
            {succeeded} part{succeeded === 1 ? "" : "s"} created
            {failed.length > 0 ? ` · ${failed.length} failed` : ""}.
          </DialogDescription>
        </DialogHeader>

        {failed.length > 0 && (
          <div className="max-h-48 space-y-1.5 overflow-y-auto rounded-lg border border-border bg-muted/20 p-3">
            {failed.map((r) => (
              <div key={r.row} className="flex items-start gap-2 text-xs">
                <AppIcon
                  icon="solar:close-circle-bold"
                  className="mt-0.5 size-3.5 shrink-0 text-destructive"
                />
                <span>
                  <span className="font-bold">{r.partName ?? `Row ${r.row}`}</span>
                  {r.error ? ` — ${r.error}` : ""}
                </span>
              </div>
            ))}
          </div>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button onClick={onUploadMore} className="font-semibold">
            Upload more
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
