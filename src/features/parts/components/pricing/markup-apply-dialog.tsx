"use client";

import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
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
import { formatPrice } from "@/lib/utils/format";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  usePreviewPartMarkup,
  useApplyPartMarkup,
} from "../../api/pricing.queries";
import type {
  PartMarkupPreviewResult,
  PartMarkupRule,
} from "../../types/pricing";
import { ruleScopeLabel } from "./markup-rule-utils";

interface MarkupApplyDialogProps {
  rule: PartMarkupRule | null;
  onClose: () => void;
}

export function MarkupApplyDialog({ rule, onClose }: MarkupApplyDialogProps) {
  const preview = usePreviewPartMarkup();
  const apply = useApplyPartMarkup();
  // Keyed by ruleId so a stale preview from a previous rule is never shown.
  const [state, setState] = useState<{
    ruleId: string;
    result: PartMarkupPreviewResult | null;
  } | null>(null);

  useEffect(() => {
    if (!rule) return;
    preview.mutate(
      { ruleId: rule.id },
      {
        onSuccess: (r) => setState({ ruleId: rule.id, result: r }),
        onError: () => setState({ ruleId: rule.id, result: null }),
      },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rule]);

  const ready = !!rule && state?.ruleId === rule.id;
  const result = ready ? state!.result : null;
  const loading = preview.isPending || (!!rule && !ready);

  const handleApply = () => {
    if (!rule) return;
    const promise = apply.mutateAsync({ ruleId: rule.id });
    toast.promise(promise, {
      loading: "Applying markup…",
      success: (r) => `Markup applied to ${r.updated} part(s).`,
      error: (err) => getErrorMessage(err, "Failed to apply markup."),
    });
    promise.then(() => onClose()).catch(() => {});
  };

  const rows = result?.parts ?? [];

  return (
    <Dialog open={!!rule} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Preview &amp; apply</DialogTitle>
          <DialogDescription>
            {rule ? ruleScopeLabel(rule) : ""} —{" "}
            {rule && rule.markupPercentage < 0
              ? `${Math.abs(rule.markupPercentage)}% discount`
              : `${rule?.markupPercentage ?? 0}% markup`}
            . This rewrites prices for matching parts.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10 text-muted-foreground">
            <AppIcon icon="solar:refresh-linear" className="size-6 animate-spin" />
          </div>
        ) : result ? (
          <>
            <p className="text-sm text-muted-foreground">
              <span className="font-bold text-foreground">
                {result.totalParts}
              </span>{" "}
              part{result.totalParts === 1 ? "" : "s"} will be repriced.
            </p>
            {rows.length > 0 && (
              <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border border-border bg-muted/20 p-2">
                {rows.slice(0, 50).map((r) => (
                  <div
                    key={r.partId}
                    className="flex items-center justify-between gap-3 px-2 py-1.5 text-xs"
                  >
                    <span className="truncate font-bold text-foreground">
                      {r.name}
                    </span>
                    <span className="flex shrink-0 items-center gap-1.5 font-mono tabular-nums">
                      <span className="text-muted-foreground line-through">
                        {r.currentPrice == null ? "—" : formatPrice(r.currentPrice)}
                      </span>
                      <AppIcon icon="solar:arrow-right-linear" className="size-3 text-muted-foreground" />
                      <span className="font-bold text-success">
                        {r.projectedPrice == null
                          ? "—"
                          : formatPrice(r.projectedPrice)}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="py-8 text-center text-sm text-muted-foreground">
            Couldn&apos;t load a preview.
          </p>
        )}

        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={handleApply}
            disabled={apply.isPending || !result || result.totalParts === 0}
            className="font-semibold"
          >
            {apply.isPending && (
              <AppIcon icon="solar:refresh-linear" className="mr-2 size-4 animate-spin" />
            )}
            Apply markup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
