"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { getErrorMessage } from "@/lib/api/error-message";
import { BrandsGridSkeleton } from "../products-skeletons";
import {
  useBrands,
  useCreateBrand,
  useUpdateBrand,
  useDeleteBrand,
} from "../../api/products.queries";
import type { BrandInput, ProductBrand } from "../../types/products";
import { BrandCard } from "./brand-card";
import { BrandFormDialog } from "./brand-form-dialog";

export function BrandsPanel() {
  const { data: brands = [], isLoading } = useBrands();
  const createBrand = useCreateBrand();
  const updateBrand = useUpdateBrand();
  const deleteBrand = useDeleteBrand();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<ProductBrand | null>(null);
  const [formKey, setFormKey] = useState(0);
  const [deleteTarget, setDeleteTarget] = useState<ProductBrand | null>(null);

  const openCreate = () => {
    setEditing(null);
    setFormKey((k) => k + 1);
    setDialogOpen(true);
  };
  const openEdit = (brand: ProductBrand) => {
    setEditing(brand);
    setFormKey((k) => k + 1);
    setDialogOpen(true);
  };

  const handleSubmit = (data: BrandInput) => {
    const promise = editing
      ? updateBrand.mutateAsync({ brandId: editing.id, data })
      : createBrand.mutateAsync(data);
    toast.promise(promise, {
      loading: editing ? "Updating brand…" : "Adding brand…",
      success: `Brand “${data.name}” ${editing ? "updated" : "added"}`,
      error: (err) => getErrorMessage(err, `Failed to ${editing ? "update" : "add"} brand`),
    });
    promise.then(() => setDialogOpen(false)).catch(() => {});
  };

  const confirmDelete = () => {
    if (!deleteTarget) return;
    const promise = deleteBrand.mutateAsync(deleteTarget.id);
    toast.promise(promise, {
      loading: "Deleting brand…",
      success: "Brand deleted",
      error: (err) => getErrorMessage(err, "Failed to delete brand"),
    });
    promise.then(() => setDeleteTarget(null)).catch(() => {});
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {brands.length} brand{brands.length === 1 ? "" : "s"}
        </p>
        <Button onClick={openCreate} className="rounded-lg font-semibold h-10">
          <AppIcon icon="solar:add-circle-linear" className="size-5 mr-2" />
          Add Brand
        </Button>
      </div>

      {isLoading ? (
        <BrandsGridSkeleton />
      ) : brands.length === 0 ? (
        <EmptyState onAdd={openCreate} />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {brands.map((brand) => (
            <BrandCard
              key={brand.id}
              brand={brand}
              onEdit={openEdit}
              onDelete={setDeleteTarget}
            />
          ))}
        </div>
      )}

      <BrandFormDialog
        key={formKey}
        isOpen={dialogOpen}
        onOpenChange={setDialogOpen}
        initial={editing}
        onSubmit={handleSubmit}
        isSubmitting={createBrand.isPending || updateBrand.isPending}
      />

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        title="Delete brand?"
        description={`Remove “${deleteTarget?.name ?? ""}”. Products keep their data but lose this brand association.`}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteBrand.isPending}
      />
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="py-16 text-center bg-card rounded-2xl border border-dashed border-border">
      <AppIcon
        icon="solar:tag-linear"
        className="size-12 text-muted-foreground/30 mx-auto mb-3"
      />
      <h3 className="font-semibold text-foreground">No brands yet</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Add your first brand to organize products.
      </p>
      <Button onClick={onAdd} variant="outline" className="rounded-lg font-medium">
        <AppIcon icon="solar:add-circle-linear" className="size-4 mr-2" />
        Add Brand
      </Button>
    </div>
  );
}
