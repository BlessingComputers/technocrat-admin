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

interface BulkRateLimitModalProps {
  open: boolean;
  uploadedCount: number;
  remainingCount: number;
  /** Seconds until the hourly limit resets, when the backend provides it. */
  retryAfterSec: number | null;
  /** Stop here — rows (with uploaded metadata) stay in the editor/draft. */
  onWait: () => void;
  /** Queue the bulk create now; un-uploaded images are simply left off. */
  onImportAnyway: () => void;
}

/**
 * Mid-upload halt: the hourly image-upload rate limit (429) was hit.
 * Uploads that already finished are kept on the rows, so retrying after the
 * window resets only sends the remainder.
 */
export function BulkRateLimitModal({
  open,
  uploadedCount,
  remainingCount,
  retryAfterSec,
  onWait,
  onImportAnyway,
}: BulkRateLimitModalProps) {
  const resetMins =
    retryAfterSec !== null ? Math.max(1, Math.ceil(retryAfterSec / 60)) : null;
  const resetText =
    resetMins !== null
      ? `in about ${resetMins} minute${resetMins === 1 ? "" : "s"}`
      : "within the hour";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onWait()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <AppIcon icon="solar:clock-circle-linear" className="size-5" />
          </div>
          <DialogTitle>Image upload limit reached</DialogTitle>
          <DialogDescription>
            {uploadedCount > 0 ? (
              <>
                <strong className="text-foreground">{uploadedCount}</strong>{" "}
                image{uploadedCount === 1 ? " was" : "s were"} uploaded and
                saved — they won&apos;t upload twice.{" "}
              </>
            ) : (
              <>No images could be uploaded yet. </>
            )}
            <strong className="text-foreground">{remainingCount}</strong>{" "}
            remain{remainingCount === 1 ? "s" : ""}, and the hourly limit
            resets {resetText}. Wait and upload again later (your work is kept
            as a draft), or upload the products now without the remaining
            images and add them from each product&apos;s page afterwards.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onWait}>
            <AppIcon icon="solar:clock-circle-linear" className="size-4 mr-1.5" />
            Wait & retry later
          </Button>
          <Button onClick={onImportAnyway}>
            <AppIcon icon="solar:cloud-upload-linear" className="size-4 mr-1.5" />
            Upload without remaining images
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
