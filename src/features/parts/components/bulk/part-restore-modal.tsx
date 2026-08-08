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

interface PartRestoreModalProps {
  open: boolean;
  /** How many parts are in the draft (1 for the single-part form). */
  partCount: number;
  savedAt: number;
  onContinue: () => void;
  onDiscard: () => void;
}

function timeAgo(ts: number): string {
  const mins = Math.round((Date.now() - ts) / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} minute${mins === 1 ? "" : "s"} ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? "" : "s"} ago`;
  const days = Math.round(hrs / 24);
  return `${days} day${days === 1 ? "" : "s"} ago`;
}

/**
 * "Resume your draft?" prompt for parts uploads — the same UI the product bulk
 * upload uses (mirrors `BulkRestoreModal`), shared by the single-part form and
 * the bulk-parts view for consistency.
 */
export function PartRestoreModal({
  open,
  partCount,
  savedAt,
  onContinue,
  onDiscard,
}: PartRestoreModalProps) {
  return (
    // Dismissing (Esc / overlay) defaults to Continue — never lose work silently.
    <Dialog open={open} onOpenChange={(o) => !o && onContinue()}>
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <AppIcon icon="solar:clock-circle-linear" className="size-5" />
          </div>
          <DialogTitle>Resume your draft?</DialogTitle>
          <DialogDescription>
            You have an unfinished part upload —{" "}
            <strong className="text-foreground">
              {partCount} part{partCount === 1 ? "" : "s"}
            </strong>
            , saved {timeAgo(savedAt)}. Pick up where you left off, or start fresh.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onDiscard}>
            Start over
          </Button>
          <Button onClick={onContinue}>
            <AppIcon icon="solar:refresh-linear" className="mr-1.5 size-4" />
            Continue editing
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
