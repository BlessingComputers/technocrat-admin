"use client";

import { TableCell, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { Part } from "../types/parts";
import { PartsStockBadge } from "./parts-stock-badge";

interface PartTableRowProps {
  part: Part;
  selected: boolean;
  onToggleSelected: () => void;
  onView: (part: Part) => void;
  onEdit: (part: Part) => void;
  onToggleStatus: (part: Part) => void;
  onDelete: (part: Part) => void;
}

export function PartTableRow({
  part: p,
  selected,
  onToggleSelected,
  onView,
  onEdit,
  onToggleStatus,
  onDelete,
}: PartTableRowProps) {
  const primaryImage =
    p.images.find((img) => img.isPrimary)?.url ?? p.images[0]?.url ?? null;
  const priceText =
    p.price == null ? "On request" : formatPrice(p.price);

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

      {/* Part details */}
      <TableCell>
        <div className="flex items-start gap-3 py-1.5">
          <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
            {primaryImage ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={primaryImage}
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
          <div className="flex min-w-0 flex-col gap-1">
            <button
              type="button"
              onClick={() => onView(p)}
              title={p.name}
              className="block max-w-[280px] truncate text-left text-sm font-semibold leading-tight text-foreground transition-colors hover:text-primary-ink hover:underline"
            >
              {p.name}
            </button>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-xs font-medium text-muted-foreground">
                {p.partId}
              </span>
              {p.partNumber && (
                <span
                  className="max-w-[160px] truncate font-mono text-xs text-muted-foreground/80"
                  title={p.partNumber}
                >
                  {p.partNumber}
                </span>
              )}
              {p.isFeatured && (
                <Badge
                  variant="outline"
                  className="gap-1 px-1.5 py-0 text-xs text-warning-ink"
                >
                  <AppIcon icon="solar:star-bold" className="size-2.5" />
                  Featured
                </Badge>
              )}
              {!primaryImage && (
                <Badge
                  variant="warning"
                  className="gap-1 px-1.5 py-0 text-xs"
                  title="This part has no images — add them from its page"
                >
                  <AppIcon icon="solar:gallery-linear" className="size-2.5" />
                  No image
                </Badge>
              )}
            </div>
          </div>
        </div>
      </TableCell>

      {/* Part type */}
      <TableCell>
        {p.partType ? (
          <Badge variant="muted" className="rounded-md py-0.5 text-xs">
            {p.partType}
          </Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </TableCell>

      {/* Pricing */}
      <TableCell className="font-mono text-sm font-semibold tracking-tight tabular-nums text-foreground">
        {p.price == null ? (
          <span className="text-xs font-medium text-muted-foreground">
            On request
          </span>
        ) : (
          priceText
        )}
      </TableCell>

      {/* Stock */}
      <TableCell>
        <PartsStockBadge isInStock={p.isInStock} stockQuantity={p.stockQuantity} />
      </TableCell>

      {/* Status */}
      <TableCell>
        <Badge
          variant={p.isActive ? "success" : "muted"}
          className="rounded-full px-2.5 py-1 text-xs"
        >
          {p.isActive ? "Active" : "Inactive"}
        </Badge>
      </TableCell>

      {/* Actions */}
      <TableCell className="pr-6 text-right">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 rounded-md border border-transparent text-muted-foreground hover:border-border hover:text-foreground"
            >
              <AppIcon icon="solar:menu-dots-bold" className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-44">
            <DropdownMenuItem onClick={() => onView(p)}>
              <AppIcon icon="solar:eye-linear" className="mr-2 size-4" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onEdit(p)}>
              <AppIcon icon="solar:pen-2-linear" className="mr-2 size-4" />
              Edit Part
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onToggleStatus(p)}>
              {p.isActive ? (
                <>
                  <AppIcon
                    icon="solar:forbidden-circle-linear"
                    className="mr-2 size-4"
                  />
                  Deactivate
                </>
              ) : (
                <>
                  <AppIcon
                    icon="solar:check-circle-linear"
                    className="mr-2 size-4 text-success-ink"
                  />
                  Activate
                </>
              )}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => onDelete(p)}
              className="font-medium text-destructive-ink focus:bg-destructive/10 focus:text-destructive-ink"
            >
              <AppIcon icon="solar:trash-bin-trash-linear" className="mr-2 size-4" />
              Delete permanently
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  );
}
