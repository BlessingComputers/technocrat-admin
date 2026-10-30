"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { BulkSelectionBar } from "@/components/shared/bulk-selection-bar";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";

import {
  useProducts,
  useCategories,
  useBrands,
  useUpdateProductStatus,
  usePermanentlyDeleteProduct,
  useBulkDeleteProducts,
  useBulkPermanentlyDeleteProducts,
} from "../api/products.queries";
import type { BulkHardDeleteProductsResult, ProductSummary } from "../types/products";
import { deactivatableIds, hardDeleteSummary } from "../utils/bulk-hard-delete";
import { BulkHardDeleteResultModal } from "./bulk-hard-delete-result-modal";
import { useProductFilters } from "../hooks/use-product-filters";
import { useCatalogProductStats } from "../hooks/use-catalog-product-stats";
import { useRowSelection } from "@/lib/hooks/use-row-selection";
import { ProductsStatsBar } from "./products-stats-bar";
import { ProductsFilterBar } from "./products-filter-bar";
import { ProductsTable } from "./products-table";
import { ProductsPagination } from "./products-pagination";
import { ProductBulkEditDialog } from "./product-bulk-edit-dialog";
import type { ConditionOption } from "./products-more-filters";

/** "REFURBISHED" → "Refurbished", "OPEN_BOX" → "Open Box". */
function conditionLabel(key: string): string {
  return key
    .toLowerCase()
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

/**
 * Full catalog working view (route `/catalogues/all`). All filter/sort/pagination
 * state lives in the URL via {@link useProductFilters} (ADR-0005); this is where
 * staff search, filter, and act on products. The slim hub at `/catalogues` links
 * here. Drops the old `max-w-7xl` cap to fill the wider canvas (ADR-0010).
 */
export function ProductBrowseView() {
  const {
    params,
    searchInput,
    setFilter,
    setSearch,
    setPage,
    setLimit,
    setSort,
    reset,
  } = useProductFilters();
  const router = useRouter();
  // Products-only counts — the same numbers the hub shows under its Products
  // filter, so the two surfaces can never disagree.
  const stats = useCatalogProductStats();
  const [deleteTarget, setDeleteTarget] = useState<ProductSummary | null>(null);
  const [bulkEditOpen, setBulkEditOpen] = useState(false);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkHardDeleteOpen, setBulkHardDeleteOpen] = useState(false);
  const [hardDeleteResult, setHardDeleteResult] =
    useState<BulkHardDeleteProductsResult | null>(null);
  const selection = useRowSelection();

  const {
    data: productsResponse,
    isLoading,
    isError,
    isFetching,
    refetch,
  } = useProducts(params);
  const { data: categories = [] } = useCategories();
  const { data: brands = [] } = useBrands();

  const updateStatus = useUpdateProductStatus();
  const permanentlyDelete = usePermanentlyDeleteProduct();
  const bulkDelete = useBulkDeleteProducts();
  const bulkHardDelete = useBulkPermanentlyDeleteProducts();

  const products = productsResponse?.data ?? [];
  const meta = productsResponse?.meta ?? {
    total: 0,
    page: params.page ?? 1,
    limit: params.limit ?? 20,
    totalPages: 1,
  };

  const conditionOptions: ConditionOption[] = (
    productsResponse?.facets?.conditions ?? []
  ).map((f) => ({
    value: f.key,
    label: conditionLabel(f.key),
    count: f.docCount,
  }));

  const toggleStatus = (product: ProductSummary) => {
    const isActive = !product.isActive;
    toast.promise(updateStatus.mutateAsync({ id: product.id, isActive }), {
      loading: `${isActive ? "Activating" : "Deactivating"} product…`,
      success: `Product ${isActive ? "activated" : "deactivated"}`,
      error: (err) => getErrorMessage(err, "Failed to update product status"),
    });
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const promise = permanentlyDelete.mutateAsync(deleteTarget.id);
    toast.promise(promise, {
      loading: "Permanently deleting product…",
      success: "Product permanently deleted",
      // A 409 (order history / reserved stock) carries a typed backend message
      // telling the user to deactivate instead — surface it verbatim.
      error: (err) => getErrorMessage(err, "Failed to delete product"),
    });
    // Close on success; keep the dialog open on error so the message is readable.
    promise.then(() => setDeleteTarget(null)).catch(() => {});
  };

  const confirmBulkDelete = () => {
    if (selection.count === 0) return;
    const promise = bulkDelete.mutateAsync(selection.ids);
    toast.promise(promise, {
      loading: `Deactivating ${selection.count} product${selection.count === 1 ? "" : "s"}…`,
      success: (res) =>
        `Deactivated ${res.deactivated} product${res.deactivated === 1 ? "" : "s"}`,
      error: (err) => getErrorMessage(err, "Failed to deactivate products"),
    });
    promise
      .then(() => {
        selection.clear();
        setBulkDeleteOpen(false);
      })
      .catch(() => {});
  };

  const confirmBulkHardDelete = () => {
    if (selection.count === 0) return;
    const promise = bulkHardDelete.mutateAsync(selection.ids);
    toast.promise(promise, {
      loading: `Permanently deleting ${selection.count} product${selection.count === 1 ? "" : "s"}…`,
      // A 200 can still skip products (orders, reserved stock), so the line
      // counts what went; the result modal lists the rest.
      success: (res) => hardDeleteSummary(res),
      error: (err) => getErrorMessage(err, "Failed to delete products"),
    });
    promise
      .then((res) => {
        selection.clear();
        setBulkHardDeleteOpen(false);
        setHardDeleteResult(res);
      })
      .catch(() => {});
  };

  const deactivateSkipped = () => {
    const ids = deactivatableIds(hardDeleteResult?.skipped ?? []);
    setHardDeleteResult(null);
    if (ids.length === 0) return;
    toast.promise(bulkDelete.mutateAsync(ids), {
      loading: `Deactivating ${ids.length} product${ids.length === 1 ? "" : "s"}…`,
      success: (res) =>
        `Deactivated ${res.deactivated} product${res.deactivated === 1 ? "" : "s"}`,
      error: (err) => getErrorMessage(err, "Failed to deactivate products"),
    });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Browse Products"
        description="Search, filter, and manage the full catalog"
      >
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/catalogues">
            <AppIcon icon="solar:arrow-left-linear" className="mr-2 size-4" />
            Back to catalogue
          </Link>
        </Button>
        <RefreshButton onRefresh={() => refetch()} isRefreshing={isFetching} />
        {/* Adding a product belongs on the list you are already working in, not
            only on the hub one level up. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground">
              <AppIcon icon="solar:add-circle-linear" className="mr-2 size-5" />
              Add Product
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuItem onClick={() => router.push("/catalogues/new")}>
              <AppIcon icon="solar:box-linear" className="mr-2 size-4" />
              Single product
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => router.push("/catalogues/bulk")}>
              <AppIcon
                icon="solar:magic-stick-3-linear"
                className="mr-2 size-4"
              />
              Bulk / AI import
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      <ProductsStatsBar
        stats={stats}
        lowStockHref="/catalogues/all?stock=low"
        outOfStockHref="/catalogues/all?stock=out"
        isLoading={stats.isLoading}
      />

      <ProductsFilterBar
        params={params}
        categories={categories}
        brands={brands}
        conditionOptions={conditionOptions}
        searchValue={searchInput}
        onSearchChange={setSearch}
        onChange={setFilter}
        onReset={reset}
      />

      <BulkSelectionBar
        count={selection.count}
        noun="product"
        onEdit={() => setBulkEditOpen(true)}
        onDelete={() => setBulkDeleteOpen(true)}
        onDeletePermanently={() => setBulkHardDeleteOpen(true)}
        onClear={selection.clear}
        disabled={bulkDelete.isPending || bulkHardDelete.isPending}
      />

      <Card className="gap-0 overflow-hidden p-0">
        <ProductsTable
          products={products}
          isLoading={isLoading}
          isError={isError}
          sortKey={params.sortKey ?? "newest"}
          sortDir={params.sortDir ?? "desc"}
          onSort={setSort}
          onRetry={() => refetch()}
          onToggleStatus={toggleStatus}
          onDelete={setDeleteTarget}
          selectedIds={selection.selected}
          onToggleRow={selection.toggle}
          onToggleAll={(checked) =>
            selection.toggleMany(
              products.map((p) => p.id),
              checked,
            )
          }
        />
        <ProductsPagination
          meta={meta}
          onPageChange={setPage}
          onLimitChange={setLimit}
        />
      </Card>

      <ProductBulkEditDialog
        open={bulkEditOpen}
        onOpenChange={setBulkEditOpen}
        selectedIds={selection.ids}
        categories={categories}
        brands={brands}
        onApplied={selection.clear}
      />

      <ConfirmModal
        isOpen={bulkDeleteOpen}
        onClose={() => setBulkDeleteOpen(false)}
        onConfirm={confirmBulkDelete}
        title={`Deactivate ${selection.count} product${selection.count === 1 ? "" : "s"}?`}
        description="This deactivates (soft-deletes) the selected products — they're hidden from the storefront but kept in the database and can be reactivated. It does not permanently delete them."
        confirmText="Deactivate"
        variant="destructive"
        isPending={bulkDelete.isPending}
      />

      <ConfirmModal
        isOpen={bulkHardDeleteOpen}
        onClose={() => setBulkHardDeleteOpen(false)}
        onConfirm={confirmBulkHardDelete}
        title={`Permanently delete ${selection.count} product${selection.count === 1 ? "" : "s"}?`}
        description="This permanently removes the selected products with their variants, images, specs, reviews and part links. It cannot be undone. Products with past orders, manual orders or a purchase in progress are skipped, and you can deactivate those instead."
        confirmText="Delete permanently"
        variant="destructive"
        isPending={bulkHardDelete.isPending}
      />

      <BulkHardDeleteResultModal
        result={hardDeleteResult}
        onDeactivate={deactivateSkipped}
        onClose={() => setHardDeleteResult(null)}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Permanently delete product?"
        description={`This permanently removes “${deleteTarget?.name ?? ""}” along with its variants, images, specs, reviews, and part links. This cannot be undone. Tip: if the product has past orders it can't be deleted — deactivate it instead.`}
        confirmText="Delete permanently"
        variant="destructive"
        isPending={permanentlyDelete.isPending}
      />
    </div>
  );
}
