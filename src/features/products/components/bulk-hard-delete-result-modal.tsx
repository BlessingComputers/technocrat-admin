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
import type { BulkHardDeleteProductsResult } from "../types/products";
import { deactivatableIds } from "../utils/bulk-hard-delete";

/**
 * After a multi-select permanent delete: the products the backend kept, each
 * with its reason. Most have order history, so the useful next step is to
 * deactivate them, which is one click here.
 */
export function BulkHardDeleteResultModal({
  result,
  onDeactivate,
  onClose,
}: {
  result: BulkHardDeleteProductsResult | null;
  onDeactivate: () => void;
  onClose: () => void;
}) {
  const skipped = result?.skipped ?? [];
  const deactivatable = deactivatableIds(skipped).length;

  return (
    <Dialog open={skipped.length > 0} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <div className="mb-2 flex size-11 items-center justify-center rounded-2xl bg-destructive/10 text-destructive-ink">
            <AppIcon icon="solar:danger-triangle-linear" className="size-5" />
          </div>
          <DialogTitle>
            {skipped.length} product{skipped.length === 1 ? " wasn't" : "s weren't"} deleted
          </DialogTitle>
          <DialogDescription>
            {result?.deleted ?? 0} deleted permanently. These were kept, for the reason shown.
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-72 divide-y divide-border overflow-y-auto rounded-lg border">
          {skipped.map((s) => (
            <li key={s.productId} className="px-3 py-2">
              <p className="text-sm font-medium text-foreground">{s.name ?? "Unknown product"}</p>
              <p className="text-xs text-muted-foreground">{s.message}</p>
            </li>
          ))}
        </ul>
        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {deactivatable > 0 ? (
            <Button onClick={onDeactivate}>
              <AppIcon icon="solar:eye-closed-linear" className="mr-1.5 size-4" />
              Deactivate {deactivatable} instead
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
