"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { BulkSelectionBar } from "@/components/shared/bulk-selection-bar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import { useRowSelection } from "@/lib/hooks/use-row-selection";

import {
  useParts,
  usePartCategories,
  usePartBrands,
  usePartTypes,
  useDeactivatePart,
  useUpdatePart,
  usePermanentlyDeletePart,
  useBulkDeleteParts,
} from "../api/parts.queries";
import { usePartFilters } from "../hooks/use-part-filters";
import { usePartsStats } from "../hooks/use-parts-stats";
import type { Part, PartsListMeta } from "../types/parts";
import { PartsStatsBar } from "./parts-stats-bar";
import { PartsFilterBar } from "./parts-filter-bar";
import { PartsTable } from "./parts-table";
import { PartsPagination } from "./parts-pagination";
import { PartBulkEditDialog } from "./part-bulk-edit-dialog";

/**
 * Parts catalog working view (route `/catalogues/parts`). Filter + pagination
 * state lives in the URL via {@link usePartFilters} (ADR-0005). Reached from the
 * Parts card on the `/catalogues` hub; links back there.
 */
export function PartsBrowseView() {
  const router = useRouter();
  const { params, searchInput, setFilter, setSearch, setPage, reset } =
    usePartFilters();

  const {
    data: partsResponse,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useParts(params);
  const { data: categories = [] } = usePartCategories();
  const { data: brands = [] } = usePartBrands();
  const { data: partTypes = [] } = usePartTypes();
  const stats = usePartsStats();

  const deactivate = useDeactivatePart();
  const updatePart = useUpdatePart();
  const permanentlyDelete = usePermanentlyDeletePart();
  const bulkDelete = useBulkDeleteParts();
  const [deleteTarget, setDeleteTarget] = useState<Part | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const selection = useRowSelection();

  const parts = partsResponse?.data ?? [];
  const meta: PartsListMeta = partsResponse?.meta ?? {
    total: 0,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    totalPages: 1,
    hasNextPage: false,
    hasPrevPage: (params.page ?? 1) > 1,
  };

  const toggleStatus = (part: Part) => {
    if (part.isActive) {
      toast.promise(deactivate.mutateAsync(part.partId), {
        loading: "Deactivating part…",
        success: "Part deactivated",
        error: (err) => getErrorMessage(err, "Failed to deactivate part"),
      });
    } else {
      // Reactivate. UpdatePartRequest requires these fields — preserve current
      // values so flipping isActive doesn't reset stock/featured/order.
      toast.promise(
        updatePart.mutateAsync({
          id: part.partId,
          data: {
            isActive: true,
            stockQuantity: part.stockQuantity,
            isInStock: part.isInStock,
            isFeatured: part.isFeatured,
            sortOrder: part.sortOrder,
          },
        }),
        {
          loading: "Activating part…",
          success: "Part activated",
          error: (err) => getErrorMessage(err, "Failed to activate part"),
        },
      );
    }
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const promise = permanentlyDelete.mutateAsync(deleteTarget.partId);
    toast.promise(promise, {
      loading: "Permanently deleting part…",
      success: "Part permanently deleted",
      // A 409 carries a typed backend message — surface it verbatim.
      error: (err) => getErrorMessage(err, "Failed to delete part"),
    });
    promise.then(() => setDeleteTarget(null)).catch(() => {});
  };

  const confirmBulkDelete = () => {
    if (selection.count === 0) return;
    const promise = bulkDelete.mutateAsync(selection.ids);
    toast.promise(promise, {
      loading: `Deactivating ${selection.count} part${selection.count === 1 ? "" : "s"}…`,
      success: (res) =>
        `Deactivated ${res.deactivated} part${res.deactivated === 1 ? "" : "s"}`,
      error: (err) => getErrorMessage(err, "Failed to deactivate parts"),
    });
    promise
      .then(() => {
        selection.clear();
        setBulkDeleteOpen(false);
      })
      .catch(() => {});
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="All Parts"
        description="Every part across all products — search and audit. Add parts from a product's Parts tab."
      >
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/catalogues/all?page=1&limit=20">
            <AppIcon icon="solar:arrow-left-linear" className="mr-2 size-4" />
            Back to products
          </Link>
        </Button>
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/catalogues/parts/types">
            <AppIcon icon="solar:widget-5-linear" className="mr-2 size-4" />
            Part Types
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/pricing?tab=parts">
            <AppIcon icon="solar:tag-price-linear" className="mr-2 size-4" />
            Pricing
          </Link>
        </Button>
        <Button
          asChild
          className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground"
        >
          <Link href="/catalogues/parts/bulk">
            <AppIcon icon="solar:cloud-upload-linear" className="mr-2 size-5" />
            Bulk Upload
          </Link>
        </Button>
      </PageHeader>

      <PartsStatsBar
        total={stats.total}
        inStock={stats.inStock}
        outOfStock={stats.outOfStock}
        partTypes={stats.partTypes}
        isLoading={stats.isLoading}
      />

      <PartsFilterBar
        params={params}
        categories={categories}
        brands={brands}
        partTypes={partTypes}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onChange={setFilter}
        onReset={reset}
      />

      <BulkSelectionBar
        count={selection.count}
        noun="part"
        onEdit={() => setBulkEditOpen(true)}
        onDelete={() => setBulkDeleteOpen(true)}
        onClear={selection.clear}
        disabled={bulkDelete.isPending}
      />

      <Card className="gap-0 overflow-hidden border bg-card p-0">
        <PartsTable
          parts={parts}
          isLoading={isLoading}
          isError={isError}
          onRetry={() => refetch()}
          onView={(p) => router.push(`/catalogues/parts/${p.partId}`)}
          onEdit={(p) => router.push(`/catalogues/parts/${p.partId}/edit`)}
          onToggleStatus={toggleStatus}
          onDelete={setDeleteTarget}
          selectedIds={selection.selected}
          onToggleRow={selection.toggle}
          onToggleAll={(checked) =>
            selection.toggleMany(
              parts.map((p) => p.id),
              checked,
            )
          }
        />
        <PartsPagination meta={meta} onPageChange={setPage} />
      </Card>

      <PartBulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedIds={selection.ids}
        categories={categories}
        brands={brands}
        partTypes={partTypes}
        onApplied={selection.clear}
      />

      <ConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title={`Deactivate ${selection.count} part${selection.count === 1 ? "" : "s"}?`}
        description="This deactivates (soft-deletes) the selected parts and marks their backing variants out of stock. They're kept in the database and can be reactivated. It does not permanently delete them."
        confirmText="Deactivate"
        variant="destructive"
        isPending={bulkDelete.isPending}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Permanently delete part?"
        description={`This permanently removes “${deleteTarget?.name ?? ""}” along with its product links, images, and specs. This cannot be undone. To hide it instead, use Deactivate.`}
        confirmText="Delete permanently"
        variant="destructive"
        isPending={permanentlyDelete.isPending}
      />
    </div>
  );
}
