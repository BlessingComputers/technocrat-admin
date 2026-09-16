"use client";

import { DataPagination } from "@/components/shared/data-pagination";
import type { PaginationMeta } from "../types/products";

interface ProductsPaginationProps {
  meta: Pick<PaginationMeta, "total" | "page" | "totalPages" | "limit">;
  onPageChange: (page: number) => void;
  /** Omit to hide the rows-per-page control. */
  onLimitChange?: (limit: number) => void;
}

/**
 * The products table footer. This used to render one button per page, which on
 * a real catalog meant hundreds of them wrapping over several rows; the shared
 * primitive bounds the list and adds the rows-per-page control.
 */
export function ProductsPagination({
  meta,
  onPageChange,
  onLimitChange,
}: ProductsPaginationProps) {
  return (
    <DataPagination
      page={meta.page}
      totalPages={meta.totalPages}
      total={meta.total}
      limit={meta.limit}
      onPageChange={onPageChange}
      onLimitChange={onLimitChange}
      noun="products"
    />
  );
}
