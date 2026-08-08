"use client";

import type { ReactNode } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { ProductTableRow } from "./product-table-row";
import { ProductsTableSkeleton } from "./products-skeletons";
import type { ProductSummary } from "../types/products";

interface ProductsTableProps {
  products: ProductSummary[];
  isLoading: boolean;
  isError: boolean;
  sortKey: string;
  sortDir: "asc" | "desc";
  onSort: (key: string) => void;
  onRetry: () => void;
  onToggleStatus: (product: ProductSummary) => void;
  onDelete: (product: ProductSummary) => void;
  /** DB UUIDs of the currently selected rows. */
  selectedIds: Set<string>;
  onToggleRow: (id: string) => void;
  /** Toggle all rows on the current page. */
  onToggleAll: (checked: boolean) => void;
}

const COL_SPAN = 9;

const HEAD =
  "font-semibold text-xs uppercase tracking-wide text-muted-foreground";

function SortableHead({
  sortKey,
  activeKey,
  dir,
  onSort,
  children,
}: {
  sortKey: string;
  activeKey: string;
  dir: "asc" | "desc";
  onSort: (key: string) => void;
  children: ReactNode;
}) {
  const isActive = activeKey === sortKey;
  return (
    <TableHead className={HEAD}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className="flex items-center gap-1 group select-none uppercase"
      >
        {children}
        <AppIcon
          icon={
            isActive && dir === "asc"
              ? "solar:alt-arrow-up-linear"
              : "solar:alt-arrow-down-linear"
          }
          className={cn(
            "size-3 transition-opacity",
            isActive
              ? "opacity-100 text-primary"
              : "opacity-0 group-hover:opacity-50",
          )}
        />
      </button>
    </TableHead>
  );
}

export function ProductsTable({
  products,
  isLoading,
  isError,
  sortKey,
  sortDir,
  onSort,
  onRetry,
  onToggleStatus,
  onDelete,
  selectedIds,
  onToggleRow,
  onToggleAll,
}: ProductsTableProps) {
  if (isLoading) return <ProductsTableSkeleton />;

  const allSelected =
    products.length > 0 && products.every((p) => selectedIds.has(p.id));
  const someSelected = products.some((p) => selectedIds.has(p.id));

  return (
    <div className="w-full overflow-x-auto">
      <Table className="min-w-[900px]">
        <TableHeader className="bg-primary/[0.04]">
          <TableRow className="border-b-border/60">
            <TableHead className="w-10 pl-4">
              <Checkbox
                checked={allSelected ? true : someSelected ? "indeterminate" : false}
                onCheckedChange={(c) => onToggleAll(c === true)}
                aria-label="Select all products on this page"
              />
            </TableHead>
            <SortableHead sortKey="name" activeKey={sortKey} dir={sortDir} onSort={onSort}>
              Product Details
            </SortableHead>
            <TableHead className={HEAD}>Category</TableHead>
            <SortableHead sortKey="price" activeKey={sortKey} dir={sortDir} onSort={onSort}>
              Pricing
            </SortableHead>
            <TableHead className={HEAD}>Stock Level</TableHead>
            <TableHead className={HEAD}>Source</TableHead>
            <SortableHead sortKey="createdAt" activeKey={sortKey} dir={sortDir} onSort={onSort}>
              Date Added
            </SortableHead>
            <TableHead className={HEAD}>Status</TableHead>
            <TableHead className={cn(HEAD, "text-right pr-6")}>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isError ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="h-[360px]">
                <div className="flex flex-col items-center justify-center gap-4 text-center max-w-md mx-auto">
                  <div className="size-16 rounded-full bg-destructive/10 flex items-center justify-center text-destructive">
                    <AppIcon icon="solar:danger-circle-linear" className="size-8" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold tracking-tight text-foreground">
                      Product service unavailable
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      We hit an error fetching products. Please try again shortly.
                    </p>
                  </div>
                  <Button variant="outline" onClick={onRetry} className="mt-1">
                    Retry
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ) : products.length === 0 ? (
            <TableRow>
              <TableCell colSpan={COL_SPAN} className="h-40 text-center text-muted-foreground">
                <AppIcon
                  icon="solar:box-linear"
                  className="size-8 opacity-30 mx-auto mb-2"
                />
                <span className="text-xs font-medium uppercase tracking-wide">
                  No products match your filters
                </span>
              </TableCell>
            </TableRow>
          ) : (
            products.map((p) => (
              <ProductTableRow
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                onToggleSelected={() => onToggleRow(p.id)}
                onToggleStatus={onToggleStatus}
                onDelete={onDelete}
              />
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
