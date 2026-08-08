"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import { getErrorMessage } from "@/lib/api/error-message";

import { useProductParts, useUnlinkPart } from "../api/parts.queries";
import type { ProductPartLink } from "../types/parts";
import { PartsStockBadge } from "./parts-stock-badge";
import { AttachPartDialog } from "./attach-part-dialog";

interface ProductPartsPanelProps {
  productId: string;
  productSku?: string;
  categoryId?: string;
  subcategoryId?: string | null;
  brandId?: string;
}

/**
 * A product's parts (route content of the product detail "Parts" tab). Lists the
 * product's parts grouped by category, with Add Part (inherits the product's SKU
 * + taxonomy), Attach existing, and inline edit/remove. Lives in the parts
 * feature and is injected into the product page at the app layer (no cross-feature
 * import).
 */
export function ProductPartsPanel({
  productId,
  productSku,
  categoryId,
  subcategoryId,
  brandId,
}: ProductPartsPanelProps) {
  const { data, isLoading, isError } = useProductParts(productId);
  const unlink = useUnlinkPart();
  const [attachOpen, setAttachOpen] = useState(false);
  const [toRemove, setToRemove] = useState<ProductPartLink["part"] | null>(null);

  const groups = Object.entries(data ?? {});
  const allLinks = groups.flatMap(([, links]) => links);
  const linkedPartIds = allLinks.map((l) => l.part.id);

  const addParams = new URLSearchParams({ sku: productSku ?? "" });
  if (categoryId) addParams.set("categoryId", categoryId);
  if (subcategoryId) addParams.set("subcategoryId", subcategoryId);
  if (brandId) addParams.set("brandId", brandId);
  const addHref = `/catalogues/${productId}/parts/new?${addParams.toString()}`;

  const confirmRemove = () => {
    if (!toRemove) return;
    const promise = unlink.mutateAsync({ productId, partId: toRemove.partId });
    toast.promise(promise, {
      loading: "Removing part…",
      success: "Part removed from product",
      error: (err) => getErrorMessage(err, "Failed to remove part"),
    });
    promise.then(() => setToRemove(null)).catch(() => {});
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-foreground">
            Parts
          </h3>
          <p className="text-xs text-muted-foreground">
            Components for this product — added or attached individually
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-lg font-medium"
            onClick={() => setAttachOpen(true)}
          >
            <AppIcon icon="solar:link-linear" className="mr-1.5 size-4" />
            Attach existing
          </Button>
          <Button
            asChild
            size="sm"
            className="h-9 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
          >
            <Link href={addHref}>
              <AppIcon icon="solar:add-circle-linear" className="mr-1.5 size-4" />
              Add Part
            </Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <AppIcon icon="solar:refresh-linear" className="size-7 animate-spin text-primary" />
        </div>
      ) : isError ? (
        <div className="rounded-lg border border-border bg-muted/20 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            Couldn&apos;t load this product&apos;s parts.
          </p>
        </div>
      ) : groups.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-muted/10 px-6 py-12 text-center">
          <div className="mb-3 flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
            <AppIcon icon="solar:cpu-bolt-linear" className="size-6" />
          </div>
          <h4 className="text-sm font-semibold tracking-tight text-foreground">
            No parts yet
          </h4>
          <p className="mt-1 max-w-xs text-xs text-muted-foreground">
            Add a part specific to this product, or attach one that already exists.
          </p>
          <Button
            asChild
            size="sm"
            className="mt-4 h-9 rounded-lg bg-primary px-4 font-semibold text-primary-foreground"
          >
            <Link href={addHref}>
              <AppIcon icon="solar:add-circle-linear" className="mr-1.5 size-4" />
              Add the first part
            </Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-5">
          {groups.map(([category, links]) => (
            <div key={category} className="space-y-2">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {category}
              </p>
              <div className="space-y-2">
                {links.map((link) => {
                  const p = link.part;
                  const primary =
                    p.images.find((i) => i.isPrimary)?.url ??
                    p.images[0]?.url ??
                    null;
                  return (
                    <div
                      key={link.linkId}
                      className="flex items-center gap-3 rounded-lg border border-border bg-card p-2.5"
                    >
                      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-md border border-border bg-muted">
                        {primary ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={primary}
                            alt={p.name}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <AppIcon
                            icon="solar:cpu-bolt-linear"
                            className="size-5 text-muted-foreground/50"
                          />
                        )}
                      </div>

                      <div className="min-w-0 flex-1">
                        <Link
                          href={`/catalogues/parts/${p.partId}/edit`}
                          className="block truncate text-sm font-semibold text-foreground transition-colors hover:text-primary hover:underline"
                          title={p.name}
                        >
                          {p.name}
                        </Link>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                            {p.partId}
                          </span>
                          {p.partNumber && (
                            <span className="truncate font-mono text-xs text-muted-foreground/80">
                              {p.partNumber}
                            </span>
                          )}
                          {link.compatNote && (
                            <span className="truncate text-xs italic text-muted-foreground">
                              {link.compatNote}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden shrink-0 font-mono text-sm font-semibold tabular-nums text-foreground sm:block">
                        {p.price == null ? (
                          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            On request
                          </span>
                        ) : (
                          formatPrice(p.price)
                        )}
                      </div>

                      <div className="hidden shrink-0 md:block">
                        <PartsStockBadge
                          isInStock={p.isInStock}
                          stockQuantity={p.stockQuantity}
                          showCount={false}
                        />
                      </div>

                      {!p.isActive && (
                        <Badge variant="muted" className="shrink-0 text-xs">
                          Inactive
                        </Badge>
                      )}

                      <div className="flex shrink-0 items-center gap-1">
                        <Button
                          asChild
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-foreground"
                        >
                          <Link href={`/catalogues/parts/${p.partId}/edit`}>
                            <AppIcon icon="solar:pen-2-linear" className="size-4" />
                          </Link>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => setToRemove(p)}
                          title="Remove from product"
                        >
                          <AppIcon icon="solar:link-broken-linear" className="size-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      <AttachPartDialog
        productId={productId}
        open={attachOpen}
        onOpenChange={setAttachOpen}
        linkedPartIds={linkedPartIds}
      />

      <ConfirmModal
        isOpen={!!toRemove}
        onClose={() => setToRemove(null)}
        onConfirm={confirmRemove}
        title="Remove part from product?"
        description={`This unlinks “${toRemove?.name ?? ""}” from this product. The part itself is not deleted and can be re-attached.`}
        confirmText="Remove"
        variant="destructive"
        isPending={unlink.isPending}
      />
    </div>
  );
}
