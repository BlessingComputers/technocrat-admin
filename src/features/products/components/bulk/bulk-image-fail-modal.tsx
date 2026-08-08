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

interface BulkImageFailModalProps {
  open: boolean;
  /** Images that uploaded before the failure (kept, never re-sent). */
  uploadedCount: number;
  /** Images still without CDN metadata after the failure. */
  failedCount: number;
  /** Specific reason from the server/network (surfaced verbatim to the user). */
  reason?: string;
  /** Queue the bulk create now; the failed images are simply left off. */
  onContinueWithout: () => void;
  /** Re-attempt the remaining image uploads, then continue the import. */
  onRetry: () => void;
}

/**
 * Mid-upload halt: an image upload failed for a non-rate-limit reason (network,
 * timeout, 5xx). Already-uploaded images are kept on the rows, so a retry only
 * sends the remainder. The user can also create the products now without the
 * failed images and add them from each product's page later.
 */
export function BulkImageFailModal({
  open,
  uploadedCount,
  failedCount,
  reason,
  onContinueWithout,
  onRetry,
}: BulkImageFailModalProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onContinueWithout()}>
      <DialogContent className="sm:max-w-[480px]">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
            <AppIcon icon="solar:danger-triangle-linear" className="size-5" />
          </div>
          <DialogTitle>Image upload failed</DialogTitle>
          <DialogDescription>
            {uploadedCount > 0 ? (
              <>
                <strong className="text-foreground">{uploadedCount}</strong>{" "}
                image{uploadedCount === 1 ? " was" : "s were"} uploaded and
                saved — they won&apos;t upload twice.{" "}
              </>
            ) : null}
            <strong className="text-foreground">{failedCount}</strong> image
            {failedCount === 1 ? "" : "s"} couldn&apos;t be uploaded. Retry the
            remaining uploads, or create the products now without them and add
            the images from each product&apos;s page afterwards.
          </DialogDescription>
          {reason ? (
            <p className="mt-1 rounded-lg bg-destructive/5 px-3 py-2 text-xs font-medium text-destructive">
              {reason}
            </p>
          ) : null}
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onContinueWithout}>
            <AppIcon icon="solar:cloud-upload-linear" className="size-4 mr-1.5" />
            Continue without images
          </Button>
          <Button onClick={onRetry}>
            <AppIcon icon="solar:refresh-linear" className="size-4 mr-1.5" />
            Retry image uploads
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
