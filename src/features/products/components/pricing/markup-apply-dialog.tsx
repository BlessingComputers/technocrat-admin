"use client";

import { useEffect } from "react";
import { toast } from "react-hot-toast";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { ApiError } from "@/lib/api/client";
import { getErrorMessage } from "@/lib/api/error-message";
import { formatPrice } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { metaLabelVariants } from "@/components/shared/meta-label";
import {
  useApplyMarkupRule,
  usePreviewMarkupRule,
} from "../../api/pricing.queries";
import type { MarkupRule } from "../../types/pricing";
import { ruleScopeLabel } from "./markup-rule-utils";
import { MetaLabel } from "@/components/shared/meta-label";

interface MarkupApplyDialogProps {
  /** The rule to preview/apply. Null keeps the dialog closed. */
  rule: MarkupRule | null;
  onClose: () => void;
}

/**
 * Preview → apply flow for a saved rule. Opening previews (dry-run) the
 * projected price changes; Apply writes them. The preview is the review step,
 * so Apply acts directly (with a typed rate-limit message on 429).
 */
export function MarkupApplyDialog({ rule, onClose }: MarkupApplyDialogProps) {
  const preview = usePreviewMarkupRule();
  const apply = useApplyMarkupRule();
  // Whether this rule has been applied — derived from the mutation, not a
  // separate state (avoids setState-in-effect on reset).
  const applied = apply.isSuccess;

  const ruleId = rule?.id;

  // Fire a fresh dry-run whenever a rule is opened; reset on close.
  useEffect(() => {
    if (!ruleId) {
      preview.reset();
      apply.reset();
      return;
    }
    apply.reset();
    preview.mutate({ ruleId });
    // preview/apply handles are stable; intentionally keyed on the rule id only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ruleId]);

  const handleApply = () => {
    if (!ruleId) return;
    apply.mutate(
      { ruleId },
      {
        onSuccess: (res) => {
          toast.success(
            `Applied — ${res.updated} variant${res.updated === 1 ? "" : "s"} repriced.`,
          );
        },
        onError: (err) => {
          if (err instanceof ApiError && err.status === 429) {
            toast.error("Rate limit reached — max 10 applies per 10 minutes.");
            return;
          }
          toast.error(getErrorMessage(err, "Could not apply the markup rule."));
        },
      },
    );
  };

  const data = preview.data;
  const previewError = preview.error as ApiError | null;
  const noMatches = previewError?.status === 404;

  return (
    <Dialog open={!!rule} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-w-2xl rounded-lg p-0 border-none overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            Apply Markup Rule
          </DialogTitle>
          <MetaLabel tone="pinned" className="block mt-1">
            {rule ? ruleScopeLabel(rule) : ""}
          </MetaLabel>
        </div>

        <div className="p-6 space-y-4">
          {/* Loading */}
          {preview.isPending && (
            <div className="flex flex-col items-center justify-center gap-3 py-12">
              <AppIcon
                icon="solar:refresh-linear"
                className="size-7 animate-spin text-primary-ink"
              />
              <p className="text-xs font-medium text-muted-foreground">
                Calculating projected prices…
              </p>
            </div>
          )}

          {/* No matching variants (404) */}
          {noMatches && (
            <EmptyState
              icon="solar:box-linear"
              title="Nothing to apply"
              body="No active variants match this rule yet. Prices will pick it up as matching products are added."
            />
          )}

          {/* Other preview failure */}
          {previewError && !noMatches && (
            <EmptyState
              icon="solar:danger-circle-linear"
              title="Couldn’t build a preview"
              body={previewError.message || "Please try again shortly."}
              destructive
            />
          )}

          {/* Preview results */}
          {data && (
            <>
              <div className="flex flex-wrap items-center gap-2 text-xs font-medium">
                <Stat label="Products" value={data.totalProducts} />
                <Stat label="Variants" value={data.totalVariants} />
                <Stat label="Markup" value={`${data.markupPercentage}%`} />
              </div>

              <div className="max-h-[320px] overflow-y-auto rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-muted/60 backdrop-blur">
                    <tr className="text-xs text-muted-foreground">
                      <th className={cn(metaLabelVariants(), "text-left px-3 py-2")}>Variant</th>
                      <th className={cn(metaLabelVariants(), "text-right px-3 py-2")}>Current</th>
                      <th className={cn(metaLabelVariants(), "text-right px-3 py-2")}>Projected</th>
                      <th className={cn(metaLabelVariants(), "text-right px-3 py-2 pr-4")}>Margin</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.variants.map((v) => {
                      const up = v.projectedPrice >= v.currentPrice;
                      return (
                        <tr
                          key={v.variantId}
                          className="border-t border-border/50"
                        >
                          <td className="px-3 py-2">
                            <p className="font-semibold text-foreground leading-tight line-clamp-1">
                              {v.productName}
                            </p>
                            <p className="text-xs text-muted-foreground font-mono">
                              {v.sku || v.variantName}
                            </p>
                          </td>
                          <td className="px-3 py-2 text-right font-mono tabular-nums text-muted-foreground">
                            {formatPrice(v.currentPrice)}
                          </td>
                          <td
                            className={cn(
                              "px-3 py-2 text-right font-mono tabular-nums font-semibold",
                              up ? "text-success-ink" : "text-destructive-ink",
                            )}
                          >
                            {formatPrice(v.projectedPrice)}
                          </td>
                          <td className="px-3 py-2 pr-4 text-right font-mono tabular-nums text-muted-foreground">
                            {v.projectedMargin.toFixed(1)}%
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="text-xs text-muted-foreground">
                Applying writes these prices to the database. compareAtPrice is
                cleared where it would fall at or below the new price, and price
                never drops below cost.
              </p>
            </>
          )}

          <div className="flex gap-3 pt-1">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="flex-1 rounded-lg font-medium text-muted-foreground h-11"
            >
              {applied ? "Close" : "Cancel"}
            </Button>
            <Button
              type="button"
              onClick={handleApply}
              disabled={
                !data || apply.isPending || applied || data.totalVariants === 0
              }
              className="flex-[2] rounded-lg bg-primary text-primary-foreground font-semibold h-11"
            >
              {apply.isPending
                ? "Applying…"
                : applied
                  ? "Applied ✓"
                  : data
                    ? `Apply to ${data.totalVariants} variant${data.totalVariants === 1 ? "" : "s"}`
                    : "Apply"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-md border border-border bg-muted/30 px-2.5 py-1">
      <MetaLabel>
        {label}
      </MetaLabel>
      <span className="font-semibold text-foreground tabular-nums">{value}</span>
    </span>
  );
}

function EmptyState({
  icon,
  title,
  body,
  destructive,
}: {
  icon: string;
  title: string;
  body: string;
  destructive?: boolean;
}) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-10 text-center">
      <div
        className={cn(
          "size-14 rounded-full flex items-center justify-center",
          destructive
            ? "bg-destructive/10 text-destructive-ink"
            : "bg-muted text-muted-foreground",
        )}
      >
        <AppIcon icon={icon} className="size-7" />
      </div>
      <div>
        <h3 className="font-semibold tracking-tight text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground mt-1 max-w-sm">{body}</p>
      </div>
    </div>
  );
}
