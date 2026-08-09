"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";
import {
  useSetUploadTarget,
  useDeleteUploadTarget,
} from "../api/analytics.queries";
import { uploadTargetSchema } from "../schemas/upload-target.schema";
import type { UploaderSummary } from "../types/upload-analytics";

interface SetTargetDialogProps {
  /** The uploader being edited; `null` closes the dialog. */
  uploader: UploaderSummary | null;
  onClose: () => void;
}

/** Set, update, or clear one staff member's daily upload target. */
export function SetTargetDialog({ uploader, onClose }: SetTargetDialogProps) {
  return (
    <Dialog open={!!uploader} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Set daily target</DialogTitle>
          <DialogDescription>
            {uploader
              ? `How many products & parts ${uploader.staff.name} should upload per day.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        {/* Keyed so the form re-initialises from props each time a row opens. */}
        {uploader && (
          <TargetForm
            key={uploader.staff.id}
            uploader={uploader}
            onClose={onClose}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function TargetForm({
  uploader,
  onClose,
}: {
  uploader: UploaderSummary;
  onClose: () => void;
}) {
  const setTarget = useSetUploadTarget();
  const deleteTarget = useDeleteUploadTarget();

  const [target, setTargetValue] = useState(String(uploader.dailyTarget));
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);

  const busy = setTarget.isPending || deleteTarget.isPending;

  const handleSave = () => {
    const parsed = uploadTargetSchema.safeParse({
      dailyTarget: Number(target),
      note: note.trim() || undefined,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid input");
      return;
    }
    setTarget.mutate(
      { staffId: uploader.staff.id, ...parsed.data },
      { onSuccess: onClose },
    );
  };

  const handleReset = () => {
    deleteTarget.mutate(uploader.staff.id, { onSuccess: onClose });
  };

  return (
    <>
      <div className="space-y-4 py-2">
        <div className="space-y-1.5">
          <Label htmlFor="daily-target">Daily target</Label>
          <Input
            id="daily-target"
            type="number"
            min={1}
            value={target}
            onChange={(e) => setTargetValue(e.target.value)}
            autoFocus
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="target-note">
            Note{" "}
            <span className="font-normal text-muted-foreground">
              (optional)
            </span>
          </Label>
          <Textarea
            id="target-note"
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Shown to the staff member in their notification."
            rows={2}
          />
        </div>
        {error && (
          <p className="text-xs font-medium text-destructive-ink">{error}</p>
        )}
      </div>

      <DialogFooter className="gap-2 sm:justify-between">
        <Button
          variant="ghost"
          onClick={handleReset}
          disabled={busy || !uploader.targetIsCustom}
          className="text-muted-foreground"
        >
          {deleteTarget.isPending && (
            <AppIcon
              icon="solar:refresh-linear"
              className="mr-2 size-4 animate-spin"
            />
          )}
          Reset to default
        </Button>
        <div className="flex gap-2">
          <Button variant="ghost" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={busy} className="font-semibold">
            {setTarget.isPending && (
              <AppIcon
                icon="solar:refresh-linear"
                className="mr-2 size-4 animate-spin"
              />
            )}
            Save target
          </Button>
        </div>
      </DialogFooter>
    </>
  );
}
