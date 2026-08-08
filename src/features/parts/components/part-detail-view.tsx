"use client";

import { useState } from "react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

import { usePart } from "../api/parts.queries";
import type { Part } from "../types/parts";
import { PartsStockBadge } from "./parts-stock-badge";
import { PartDetailSkeleton } from "./parts-skeletons";

interface PartDetailViewProps {
  partId: string;
}

/** Part detail view (route `/catalogues/parts/[id]`). */
export function PartDetailView({ partId }: PartDetailViewProps) {
  const { data: part, isLoading, isError } = usePart(partId);

  if (isLoading) return <PartDetailSkeleton />;
  if (isError || !part) return <PartNotFound />;

  return (
    <div className="mx-auto max-w-6xl space-y-6 pb-12">
      <Link
        href="/catalogues/parts"
        className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground transition-colors hover:text-primary"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Parts
      </Link>

      <PageHeader title={part.name} description={part.partId}>
        <Badge
          variant={part.isActive ? "success" : "muted"}
          className="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
        >
          {part.isActive ? "Active" : "Inactive"}
        </Badge>
        {part.isFeatured && (
          <Badge
            variant="warning"
            className="rounded-full px-2.5 py-1 text-xs font-semibold uppercase tracking-wide"
          >
            Featured
          </Badge>
        )}
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href={`/catalogues/parts/${part.partId}/edit`}>
            <AppIcon icon="solar:pen-2-linear" className="mr-2 size-4" />
            Edit Part
          </Link>
        </Button>
      </PageHeader>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <PartGallery part={part} />
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card className="space-y-4 rounded-lg border border-border p-6">
            <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Details
            </h3>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-4 sm:grid-cols-2">
              <Field label="Part Type">
                {part.partType ? (
                  <Badge variant="muted">
                    {part.partType}
                  </Badge>
                ) : (
                  "—"
                )}
              </Field>
              <Field label="Part Number">
                <span className="font-mono">{part.partNumber || "—"}</span>
              </Field>
              <Field label="Belongs to product (SKU)">
                <span className="font-mono">{part.ownerSku || "—"}</span>
              </Field>
              <Field label="Stock">
                <PartsStockBadge
                  isInStock={part.isInStock}
                  stockQuantity={part.stockQuantity}
                />
              </Field>
              <Field label="Price">
                {part.price == null ? (
                  <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    On request
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <span className="font-mono font-bold tabular-nums text-foreground">
                      {formatPrice(part.price)}
                    </span>
                    {part.compareAtPrice != null &&
                      part.compareAtPrice > part.price && (
                        <span className="font-mono text-xs text-muted-foreground line-through">
                          {formatPrice(part.compareAtPrice)}
                        </span>
                      )}
                  </span>
                )}
              </Field>
              <Field label="Purchasable">
                {part.variantId ? (
                  <Badge variant="success" className="gap-1 text-xs">
                    <AppIcon icon="solar:cart-check-bold" className="size-3" />
                    In cart flow
                  </Badge>
                ) : (
                  <Badge variant="muted" className="text-xs">
                    Enquiry only
                  </Badge>
                )}
              </Field>
            </dl>

            {part.description && (
              <div className="border-t border-border pt-4">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Description
                </p>
                <p className="text-sm leading-relaxed text-foreground">
                  {part.description}
                </p>
              </div>
            )}
          </Card>

          <Card className="rounded-lg border border-border p-6">
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Specifications
            </h3>
            {part.specifications.length === 0 ? (
              <p className="text-sm italic text-muted-foreground">
                No specifications.
              </p>
            ) : (
              <dl className="divide-y divide-border">
                {[...part.specifications]
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((s) => (
                    <div
                      key={s.id}
                      className="grid grid-cols-3 gap-4 py-2.5 text-sm"
                    >
                      <dt className="font-medium text-muted-foreground">
                        {s.name}
                      </dt>
                      <dd className="col-span-2 text-foreground">{s.value}</dd>
                    </div>
                  ))}
              </dl>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1">
      <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {label}
      </dt>
      <dd className="text-sm text-foreground">{children}</dd>
    </div>
  );
}

function PartGallery({ part }: { part: Part }) {
  const images = [...part.images].sort((a, b) => a.sortOrder - b.sortOrder);
  const initial =
    images.find((i) => i.isPrimary)?.url ?? images[0]?.url ?? null;
  const [active, setActive] = useState<string | null>(initial);

  return (
    <Card className="space-y-3 rounded-lg border border-border p-3">
      <div className="flex aspect-square items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {active ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={active} alt={part.name} className="h-full w-full object-cover" />
        ) : (
          <AppIcon
            icon="solar:cpu-bolt-linear"
            className="size-16 text-muted-foreground/30"
          />
        )}
      </div>
      {images.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {images.map((img) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setActive(img.url)}
              className={cn(
                "aspect-square overflow-hidden rounded-md border transition-colors",
                active === img.url
                  ? "border-primary ring-2 ring-primary/20"
                  : "border-border hover:border-primary/40",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="h-full w-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </Card>
  );
}

function PartNotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center space-y-4">
      <div className="flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AppIcon icon="solar:danger-circle-linear" className="size-8" />
      </div>
      <div className="space-y-1 text-center">
        <h3 className="text-xl font-semibold text-foreground">Part not found</h3>
        <p className="mx-auto max-w-xs text-sm text-muted-foreground">
          We couldn&apos;t retrieve this part. It may have been removed.
        </p>
      </div>
      <Button asChild variant="outline">
        <Link href="/catalogues/parts">
          <AppIcon icon="solar:alt-arrow-left-linear" className="mr-2 size-4" />
          Back to Parts
        </Link>
      </Button>
    </div>
  );
}

