"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { BulkBatchStatus } from "../../types/products";
import { humanizeBulkRowError } from "./bulk-helpers";

interface BulkProgressProps {
  batch?: BulkBatchStatus;
  isLoading: boolean;
  /** Step 1 in flight — images are uploading before the batch is queued. */
  uploadingImages?: boolean;
  /** Per-image upload progress for Step 1 (images upload one at a time). */
  imageProgress?: { completed: number; total: number } | null;
}

const STATUS_VARIANT: Record<string, "success" | "warning" | "danger" | "info"> = {
  completed: "success",
  processing: "info",
  pending: "warning",
  failed: "danger",
};

export function BulkProgress({
  batch,
  isLoading,
  uploadingImages,
  imageProgress,
}: BulkProgressProps) {
  if (!batch && (uploadingImages || isLoading)) {
    const showImageBar = !!imageProgress && imageProgress.total > 0;
    const imgPct = showImageBar
      ? Math.round((imageProgress.completed / imageProgress.total) * 100)
      : 0;
    return (
      <Card className="border-primary/30 bg-primary/2">
        <CardContent className="p-5 space-y-3">
          <div className="flex items-center gap-3">
            <AppIcon
              icon="solar:refresh-linear"
              className="size-5 animate-spin text-primary-ink"
            />
            <div>
              <p className="text-sm font-semibold text-foreground">
                {uploadingImages
                  ? "Uploading product images…"
                  : "Submitting batch…"}
              </p>
              <p className="text-xs text-muted-foreground">
                {uploadingImages
                  ? "Images upload one at a time — keep this page open until it finishes."
                  : "Keep this page open — progress appears here as products are created."}
              </p>
            </div>
          </div>

          {showImageBar && (
            <div className="space-y-1.5">
              <div className="flex justify-between text-xs font-medium text-muted-foreground">
                <span>
                  {imageProgress.completed} / {imageProgress.total} images
                </span>
                <span>{imgPct}%</span>
              </div>
              <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full bg-primary transition-all"
                  style={{ width: `${imgPct}%` }}
                />
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }
  if (!batch) return null;

  const pct =
    batch.totalProducts > 0
      ? Math.round((batch.processedProducts / batch.totalProducts) * 100)
      : 0;
  const results = batch.results ?? [];

  return (
    <Card>
      <CardContent className="p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-foreground">Upload Progress</h3>
          <Badge
            variant={STATUS_VARIANT[batch.status] ?? "muted"}
            className="text-xs font-semibold"
          >
            {batch.status}
          </Badge>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-xs font-medium text-muted-foreground">
            <span>
              {batch.processedProducts} / {batch.totalProducts} processed
            </span>
            <span>{pct}%</span>
          </div>
          <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all",
                batch.status === "failed" ? "bg-destructive" : "bg-primary",
              )}
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        {results.length > 0 && (
          <div className="max-h-60 overflow-y-auto divide-y divide-border/60 rounded-lg border border-border">
            {results.map((r) => (
              <div
                key={r.row}
                className="flex items-center gap-3 px-3 py-2 text-xs"
              >
                <AppIcon
                  icon={
                    r.success
                      ? "solar:check-circle-bold"
                      : "solar:close-circle-linear"
                  }
                  className={cn(
                    "size-4 shrink-0",
                    r.success ? "text-success-ink" : "text-destructive-ink",
                  )}
                />
                <span className="font-semibold text-foreground truncate flex-1">
                  {r.productName || `Row ${r.row}`}
                </span>
                {!r.success && r.error && (
                  <span className="text-destructive-ink truncate max-w-[50%]">
                    {humanizeBulkRowError(r.error)}
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
