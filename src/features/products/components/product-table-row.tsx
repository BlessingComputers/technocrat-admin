"use client";

import Link from "next/link";
import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { ProductSummary } from "../types/products";
import { SOURCE_LABEL } from "../constants/product-display";
import { ProductStockBadge } from "./product-stock-badge";

interface ProductTableRowProps {
  product: ProductSummary;
  selected: boolean;
  onToggleSelected: () => void;
  onToggleStatus: (product: ProductSummary) => void;
  onDelete: (product: ProductSummary) => void;
}

export function ProductTableRow({
  product: p,
  selected,
  onToggleSelected,
  onToggleStatus,
  onDelete,
}: ProductTableRowProps) {
  const detailHref = `/catalogues/${p.id}`;
  const editHref = `/catalogues/${p.id}/edit`;
  const isRange =
    p.lowestPrice && p.highestPrice && p.lowestPrice !== p.highestPrice;
  const priceText = isRange
    ? `${formatPrice(p.lowestPrice)} – ${formatPrice(p.highestPrice)}`
    : formatPrice(p.lowestPrice || 0);

  const dateAdded = p.createdAt
    ? new Date(p.createdAt).toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "—";

  return (
    <TableRow
      className="hover:bg-muted/30 border-b-border/40 data-[selected=true]:bg-primary/[0.04]"
      data-selected={selected}
    >
      {/* Selection */}
      <TableCell className="pl-4">
        <Checkbox
          checked={selected}
          onCheckedChange={onToggleSelected}
          aria-label={`Select ${p.name}`}
        />
      </TableCell>

      {/* Product details */}
      <TableCell>
        <div className="flex items-start gap-3 py-1.5">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border overflow-hidden">
            {p.primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={p.primaryImage}
                alt={p.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <AppIcon
                icon="solar:box-linear"
                className="size-5 text-muted-foreground/50"
              />
            )}
          </div>
          <div className="flex flex-col gap-1 min-w-0">
            <Link
              href={detailHref}
              title={p.name}
              className="block max-w-[280px] truncate text-left font-semibold text-sm leading-tight text-foreground hover:text-primary hover:underline transition-colors"
            >
              {p.name}
            </Link>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-medium">
                {p.productId}
              </span>
              {p.brand?.name && (
                <Badge
                  variant="outline"
                  className="text-xs py-0 px-1.5 uppercase tracking-wide"
                >
                  {p.brand.name}
                </Badge>
              )}
              {!p.primaryImage && (
                <Badge
                  variant="warning"
                  className="gap-1 text-xs py-0 px-1.5 uppercase tracking-wide"
                  title="This product has no images — add them from its page"
                >
                  <AppIcon icon="solar:gallery-linear" className="size-2.5" />
                  No image
                </Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Category */}
      <TableCell>
        <Badge variant="muted" className="text-xs rounded-md py-0.5">
          {p.category?.name || "—"}
        </Badge>
      </TableCell>

      {/* Pricing range */}
      <TableCell className="font-mono font-semibold text-sm tracking-tight text-foreground tabular-nums">
        {priceText}
      </TableCell>

      {/* Stock level */}
      <TableCell>
        <ProductStockBadge status={p.availabilityStatus} />
      </TableCell>

      {/* Source */}
      <TableCell>
        {p.sourcingType ? (
          <Badge
            variant="outline"
            className="text-xs uppercase tracking-wide px-2 py-0.5 rounded-md"
          >
            {SOURCE_LABEL[p.sourcingType] ?? p.sourcingType}
          </Badge>
        ) : (
          <span className="text-muted-foreground text-xs">—</span>
        )}
      </TableCell>

      {/* Date added */}
      <TableCell className="text-muted-foreground text-xs">
        {dateAdded}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge
          variant={p.isActive ? "success" : "muted"}
          className="text-xs uppercase tracking-wide px-2.5 py-1 rounded-full"
        >
          {p.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="text-right pr-6">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground hover:text-foreground rounded-md border border-transparent hover:border-border"
            >
              <AppIcon icon="solar:menu-dots-bold" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem asChild>
              <Link href={detailHref}>
                <AppIcon icon="solar:eye-linear" className="size-4 mr-2" />
                View Details
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href={editHref}>
                <AppIcon icon="solar:pen-2-linear" className="size-4 mr-2" />
                Edit Product
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(p)}>
              {p.isActive ? (
                <>
                  <AppIcon
                    icon="solar:forbidden-circle-linear"
                    className="size-4 mr-2"
                  />
                  Deactivate
                </>
              ) : (
                <>
                  <AppIcon
                    icon="solar:check-circle-linear"
                    className="size-4 mr-2 text-success"
                  />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => onDelete(p)}
              className="text-destructive focus:text-destructive focus:bg-destructive/10 font-bold"
            >
              <AppIcon icon="solar:trash-bin-trash-linear" className="size-4 mr-2" />
              Delete permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
