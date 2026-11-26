"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import { useCatalogPart, useCatalogProduct } from "../api/analytics.queries";
import type {
  CatalogItemRef,
  CatalogPart,
  CatalogProduct,
} from "../types/upload-analytics";

const DATE_FMT = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const formatDate = (iso: string) => DATE_FMT.format(new Date(iso));

/**
 * Quick look at one product or part from the uploader page. A sheet, not a
 * modal: the list stays in view, and the staff member can check item after
 * item. The full record loads on open; the row's title and image show at once.
 */
export function UploaderItemSheet({
  item,
  onClose,
}: {
  item: CatalogItemRef | null;
  onClose: () => void;
}) {
  // Keep the last item while the sheet slides out, so it does not go blank.
  const [shown, setShown] = useState(item);
  if (item && item !== shown) setShown(item);

  // Fetch for `shown`, not `item`, so the query stays on while the sheet closes.
  const product = useCatalogProduct(shown?.type === "product" ? shown.id : null);
  const part = useCatalogPart(shown?.type === "part" ? shown.id : null);
  const query = shown?.type === "part" ? part : product;

  const basePath =
    shown?.type === "part" ? `/catalogues/parts/${shown.id}` : `/catalogues/${shown?.id}`;

  return (
    <Sheet open={!!item} onOpenChange={(open) => !open && onClose()}>
      <SheetContent
        side="right"
        className="w-full gap-0 border-border bg-card shadow-soft-lg sm:max-w-lg"
      >
        {shown && (
          <>
            <SheetHeader className="border-b border-border px-5 pt-5 pb-4 pr-12">
              <SheetTitle className="text-base leading-snug">{shown.title}</SheetTitle>
              <SheetDescription asChild>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span>{shown.type === "product" ? "Product" : "Part"}</span>
                  {query.data && (
                    <>
                      <span aria-hidden>·</span>
                      <span className="font-medium">
                        {"productId" in query.data
                          ? query.data.productId
                          : query.data.partId}
                      </span>
                      <Badge variant={query.data.isActive ? "success" : "muted"}>
                        {query.data.isActive ? "Active" : "Hidden"}
                      </Badge>
                      {query.data.isFeatured && <Badge variant="info">Featured</Badge>}
                    </>
                  )}
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5">
              {query.isLoading ? (
                <SheetSkeleton image={shown.image} />
              ) : query.isError || !query.data ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  Couldn&apos;t load this item. It may have been deleted.
                </p>
              ) : shown.type === "product" ? (
                <ProductBody key={shown.id} product={query.data as CatalogProduct} />
              ) : (
                <PartBody key={shown.id} part={query.data as CatalogPart} />
              )}
            </div>

            <SheetFooter className="flex-row justify-end gap-2 border-t border-border px-5 py-3">
              <Button asChild variant="outline" size="sm">
                <Link href={`${basePath}/edit`}>
                  <AppIcon icon="solar:pen-linear" className="mr-1.5 size-4" />
                  Edit
                </Link>
              </Button>
              <Button asChild size="sm">
                <Link href={basePath}>
                  Open full page
                  <AppIcon icon="solar:arrow-right-up-linear" className="ml-1.5 size-4" />
                </Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ── Bodies ────────────────────────────────────────────────────────────

function ProductBody({ product }: { product: CatalogProduct }) {
  const prices = product.variants.filter((v) => v.isActive).map((v) => v.price);
  const low = prices.length ? Math.min(...prices) : null;
  const high = prices.length ? Math.max(...prices) : null;
  const stock = product.variants.reduce((sum, v) => sum + v.stockQuantity, 0);

  return (
    <div className="space-y-6">
      <Gallery images={product.images} />
      <Facts
        rows={[
          [
            "Price",
            low == null
              ? "No active variant"
              : low === high
                ? formatPrice(low)
                : `${formatPrice(low)} – ${formatPrice(high!)}`,
          ],
          ["Stock", `${stock} in stock`],
          ["Category", product.category?.name],
          ["Brand", product.brand?.name],
          ["Uploaded by", product.createdBy?.name],
          ["Created", formatDate(product.createdAt)],
          ["Last updated", formatDate(product.updatedAt)],
        ]}
      />
      {product.variants.length > 0 && (
        <Section title={`Variants (${product.variants.length})`}>
          <ul className="divide-y divide-border rounded-lg border border-border">
            {product.variants.map((v) => (
              <li key={v.id} className="flex items-start justify-between gap-3 px-3 py-2.5">
                <div className="min-w-0">
                  <p className={cn("truncate text-sm font-semibold", !v.isActive && "text-muted-foreground")}>
                    {v.name}
                    {!v.isActive && <span className="ml-1.5 text-xs font-medium">(hidden)</span>}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {[v.condition, v.sku].filter(Boolean).join(" · ")}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-semibold tabular-nums">{formatPrice(v.price)}</p>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    {v.stockQuantity} in stock
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Specs specs={product.specifications} />
      <Description text={product.description} />
    </div>
  );
}

function PartBody({ part }: { part: CatalogPart }) {
  return (
    <div className="space-y-6">
      <Gallery images={part.images} />
      <Facts
        rows={[
          ["Price", part.price == null ? "No price (enquire only)" : formatPrice(part.price)],
          ["Stock", part.isInStock ? `${part.stockQuantity} in stock` : "Out of stock"],
          ["Part type", part.partType],
          ["Part number", part.partNumber],
          ["Owner SKU", part.ownerSku],
          ["Uploaded by", part.createdBy?.name],
          ["Created", formatDate(part.createdAt)],
          ["Last updated", formatDate(part.updatedAt)],
        ]}
      />
      <Specs specs={part.specifications} />
      <Description text={part.description} />
    </div>
  );
}

// ── Pieces ────────────────────────────────────────────────────────────

interface GalleryImage {
  id: string;
  url: string;
  altText: string | null;
  isPrimary: boolean;
  sortOrder: number;
}

function Gallery({ images }: { images: GalleryImage[] }) {
  const sorted = [...images].sort(
    (a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.sortOrder - b.sortOrder,
  );
  const [index, setIndex] = useState(0);
  const current = sorted[index];

  if (!current) {
    return (
      <div className="flex aspect-[4/3] items-center justify-center rounded-xl border border-dashed border-border bg-muted/40 text-sm text-muted-foreground">
        No images
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={current.url} alt={current.altText ?? ""} className="size-full object-contain" />
      </div>
      {sorted.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {sorted.map((img, i) => (
            <button
              key={img.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Show image ${i + 1} of ${sorted.length}`}
              aria-pressed={i === index}
              className={cn(
                "size-14 shrink-0 overflow-hidden rounded-lg border-2 bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                i === index ? "border-primary" : "border-transparent opacity-70 hover:opacity-100",
              )}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={img.url} alt="" className="size-full object-cover" loading="lazy" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function Facts({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-3">
      {rows.map(([label, value]) => (
        <div key={label} className="min-w-0">
          <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
          <dd className="mt-0.5 truncate text-sm font-semibold">{value || "—"}</dd>
        </div>
      ))}
    </dl>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-2">
      <h3 className="text-sm font-semibold">{title}</h3>
      {children}
    </section>
  );
}

function Specs({ specs }: { specs: { name: string; value: string }[] }) {
  if (specs.length === 0) return null;
  return (
    <Section title="Specifications">
      <dl className="divide-y divide-border rounded-lg border border-border text-sm">
        {specs.map((s, i) => (
          <div key={`${i}:${s.name}`} className="grid grid-cols-[minmax(0,2fr)_minmax(0,3fr)] gap-3 px-3 py-2">
            <dt className="text-muted-foreground">{s.name}</dt>
            <dd className="font-medium">{s.value}</dd>
          </div>
        ))}
      </dl>
    </Section>
  );
}

function Description({ text }: { text: string | null }) {
  if (!text?.trim()) return null;
  return (
    <Section title="Description">
      <p className="whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{text}</p>
    </Section>
  );
}

function SheetSkeleton({ image }: { image: string | null }) {
  return (
    <div className="space-y-6">
      {image ? (
        <div className="flex aspect-[4/3] items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/40">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image} alt="" className="size-full object-contain" />
        </div>
      ) : (
        <Skeleton className="aspect-[4/3] w-full rounded-xl" />
      )}
      <div className="grid grid-cols-2 gap-4">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="space-y-1.5">
            <Skeleton className="h-3 w-16" />
            <Skeleton className="h-4 w-28" />
          </div>
        ))}
      </div>
    </div>
  );
}
