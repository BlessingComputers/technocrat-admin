"use client";

import { DataPagination } from "@/components/shared/data-pagination";
import type { PartsListMeta } from "../types/parts";

interface PartsPaginationProps {
  meta: PartsListMeta;
  onPageChange: (page: number) => void;
}

/**
 * The parts table footer. Shares the products footer's primitive so the two
 * catalogue lists page identically; its own window had no first/last anchor,
 * so page 1 was unreachable from deep in the list without stepping back.
 */
export function PartsPagination({ meta, onPageChange }: PartsPaginationProps) {
  return (
    <DataPagination
      page={meta.page}
      totalPages={meta.totalPages}
      total={meta.total}
      limit={meta.limit}
      onPageChange={onPageChange}
      noun="parts"
    />
  );
}
