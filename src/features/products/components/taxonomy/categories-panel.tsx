"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { CategoriesListSkeleton } from "../products-skeletons";
import { cn } from "@/lib/utils/cn";
import { ApiError } from "@/lib/api/error";
import { getErrorMessage } from "@/lib/api/error-message";
import {
  useCategories,
  useSubcategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
  useCreateSubcategory,
  useUpdateSubcategory,
  useDeleteSubcategory,
} from "../../api/products.queries";
import type {
  ProductCategory,
  ProductSubcategory,
} from "../../types/products";
import {
  CategoryFormDialog,
  type CategoryFormValues,
} from "./category-form-dialog";

const conflictMessage = (fallback: string) => (err: unknown) =>
  err instanceof ApiError && err.status === 409
    ? "Has products — reassign or remove them first"
    : getErrorMessage(err, fallback);

export function CategoriesPanel() {
  const { data: categories = [], isLoading } = useCategories();
  const topLevel = categories.filter((c) => !c.parentId);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const activeId = selectedId ?? topLevel[0]?.id ?? "";
  const activeCategory = topLevel.find((c) => c.id === activeId) ?? null;

  const { data: subcategories = [], isLoading: subsLoading } =
    useSubcategories(activeId);

  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();
  const createSub = useCreateSubcategory();
  const updateSub = useUpdateSubcategory();
  const deleteSub = useDeleteSubcategory();

  // Dialog + delete state
  const [catDialog, setCatDialog] = useState(false);
  const [editingCat, setEditingCat] = useState<ProductCategory | null>(null);
  const [catKey, setCatKey] = useState(0);
  const [deleteCat, setDeleteCat] = useState<ProductCategory | null>(null);

  const [subDialog, setSubDialog] = useState(false);
  const [editingSub, setEditingSub] = useState<ProductSubcategory | null>(null);
  const [subKey, setSubKey] = useState(0);
  const [deleteSubTarget, setDeleteSubTarget] =
    useState<ProductSubcategory | null>(null);

  const openCatDialog = (cat: ProductCategory | null) => {
    setEditingCat(cat);
    setCatKey((k) => k + 1);
    setCatDialog(true);
  };
  const openSubDialog = (sub: ProductSubcategory | null) => {
    setEditingSub(sub);
    setSubKey((k) => k + 1);
    setSubDialog(true);
  };

  const submitCategory = (data: CategoryFormValues) => {
    const promise = editingCat
      ? updateCategory.mutateAsync({ categoryId: editingCat.id, data })
      : createCategory.mutateAsync(data);
    toast.promise(promise, {
      loading: editingCat ? "Updating category…" : "Adding category…",
      success: `Category “${data.name}” ${editingCat ? "updated" : "added"}`,
      error: (err) =>
        getErrorMessage(err, `Failed to ${editingCat ? "update" : "add"} category`),
    });
    promise.then(() => setCatDialog(false)).catch(() => {});
  };

  const submitSubcategory = (data: CategoryFormValues) => {
    if (!activeId) return;
    const promise = editingSub
      ? updateSub.mutateAsync({
          categoryId: activeId,
          subId: editingSub.id,
          data,
        })
      : createSub.mutateAsync({ categoryId: activeId, data });
    toast.promise(promise, {
      loading: editingSub ? "Updating subcategory…" : "Adding subcategory…",
      success: `Subcategory “${data.name}” ${editingSub ? "updated" : "added"}`,
      error: (err) =>
        getErrorMessage(err, `Failed to ${editingSub ? "update" : "add"} subcategory`),
    });
    promise.then(() => setSubDialog(false)).catch(() => {});
  };

  const confirmDeleteCat = () => {
    if (!deleteCat) return;
    const promise = deleteCategory.mutateAsync(deleteCat.id);
    toast.promise(promise, {
      loading: "Deleting category…",
      success: "Category deleted",
      error: conflictMessage("Failed to delete category"),
    });
    promise.then(() => setDeleteCat(null)).catch(() => {});
  };

  const confirmDeleteSub = () => {
    if (!deleteSubTarget || !activeId) return;
    const promise = deleteSub.mutateAsync({
      categoryId: activeId,
      subId: deleteSubTarget.id,
    });
    toast.promise(promise, {
      loading: "Deleting subcategory…",
      success: "Subcategory deleted",
      error: conflictMessage("Failed to delete subcategory"),
    });
    promise.then(() => setDeleteSubTarget(null)).catch(() => {});
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Top-level categories */}
      <Card className="border border-border p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-semibold text-foreground flex items-center gap-2">
            <AppIcon icon="solar:folder-linear" className="size-5 text-primary" />
            Categories
          </h3>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg font-medium text-xs"
            onClick={() => openCatDialog(null)}
          >
            <AppIcon icon="solar:add-circle-linear" className="size-4 mr-1" />
            Add
          </Button>
        </div>

        {isLoading ? (
          <CategoriesListSkeleton />
        ) : topLevel.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No categories yet.
          </p>
        ) : (
          <div className="divide-y divide-border/60 max-h-[28rem] overflow-y-auto">
            {topLevel.map((cat) => {
              const isActive = cat.id === activeId;
              return (
                <div
                  key={cat.id}
                  className={cn(
                    "group flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors",
                    isActive ? "bg-primary/5" : "hover:bg-muted/30",
                  )}
                  onClick={() => setSelectedId(cat.id)}
                >
                  <RowThumb
                    imageUrl={cat.imageUrl}
                    name={cat.name}
                    fallbackIcon={
                      isActive ? "solar:folder-open-bold" : "solar:folder-linear"
                    }
                    active={isActive}
                  />
                  <div className="min-w-0 flex-1">
                    <p
                      className={cn(
                        "text-sm font-semibold truncate",
                        isActive ? "text-primary" : "text-foreground",
                      )}
                    >
                      {cat.name}
                    </p>
                    <p className="text-xs text-muted-foreground font-mono truncate">
                      {cat.slug}
                    </p>
                  </div>
                  <Badge variant="muted" className="text-xs shrink-0">
                    {cat.productCount ?? 0}
                  </Badge>
                  <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                    <RowAction
                      icon="solar:pen-2-linear"
                      onClick={(e) => {
                        e.stopPropagation();
                        openCatDialog(cat);
                      }}
                    />
                    <RowAction
                      icon="solar:trash-bin-trash-linear"
                      destructive
                      onClick={(e) => {
                        e.stopPropagation();
                        setDeleteCat(cat);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Subcategories of the active category */}
      <Card className="border border-border p-0 overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-border">
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">
              Subcategories
            </h3>
            <p className="text-xs text-muted-foreground truncate">
              {activeCategory ? `In ${activeCategory.name}` : "Select a category"}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="h-8 rounded-lg font-medium text-xs"
            disabled={!activeId}
            onClick={() => openSubDialog(null)}
          >
            <AppIcon icon="solar:add-circle-linear" className="size-4 mr-1" />
            Add
          </Button>
        </div>

        {!activeId ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            Select a category to manage its subcategories.
          </p>
        ) : subsLoading ? (
          <div className="p-4 space-y-2">
            {[1, 2].map((i) => (
              <Skeleton key={i} className="h-12 rounded-lg" />
            ))}
          </div>
        ) : subcategories.length === 0 ? (
          <p className="p-8 text-center text-sm text-muted-foreground">
            No subcategories in this category yet.
          </p>
        ) : (
          <div className="divide-y divide-border/60 max-h-[28rem] overflow-y-auto">
            {subcategories.map((sub) => (
              <div
                key={sub.id}
                className="group flex items-center gap-3 px-4 py-3 hover:bg-muted/30"
              >
                <RowThumb
                  imageUrl={sub.imageUrl}
                  name={sub.name}
                  fallbackIcon="solar:folder-linear"
                />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground truncate">
                    {sub.name}
                  </p>
                  <p className="text-xs text-muted-foreground font-mono truncate">
                    {sub.slug}
                  </p>
                </div>
                {!sub.isActive && (
                  <Badge variant="muted" className="text-xs shrink-0">
                    Hidden
                  </Badge>
                )}
                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                  <RowAction
                    icon="solar:pen-2-linear"
                    onClick={() => openSubDialog(sub)}
                  />
                  <RowAction
                    icon="solar:trash-bin-trash-linear"
                    destructive
                    onClick={() => setDeleteSubTarget(sub)}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      <CategoryFormDialog
        key={`cat-${catKey}`}
        isOpen={catDialog}
        onOpenChange={setCatDialog}
        kind="Category"
        initial={editingCat}
        onSubmit={submitCategory}
        isSubmitting={createCategory.isPending || updateCategory.isPending}
      />
      <CategoryFormDialog
        key={`sub-${subKey}`}
        isOpen={subDialog}
        onOpenChange={setSubDialog}
        kind="Subcategory"
        initial={editingSub}
        onSubmit={submitSubcategory}
        isSubmitting={createSub.isPending || updateSub.isPending}
      />

      <ConfirmModal
        isOpen={!!deleteCat}
        onClose={() => setDeleteCat(null)}
        onConfirm={confirmDeleteCat}
        title="Delete category?"
        description={`Remove “${deleteCat?.name ?? ""}” and its organization. Categories with products cannot be deleted.`}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteCategory.isPending}
      />
      <ConfirmModal
        isOpen={!!deleteSubTarget}
        onClose={() => setDeleteSubTarget(null)}
        onConfirm={confirmDeleteSub}
        title="Delete subcategory?"
        description={`Remove “${deleteSubTarget?.name ?? ""}”. Subcategories with products cannot be deleted.`}
        confirmText="Delete"
        variant="destructive"
        isPending={deleteSub.isPending}
      />
    </div>
  );
}

function RowThumb({
  imageUrl,
  name,
  fallbackIcon,
  active,
}: {
  imageUrl?: string;
  name: string;
  fallbackIcon: string;
  active?: boolean;
}) {
  return (
    <div className="size-9 rounded-lg bg-muted border border-border overflow-hidden flex items-center justify-center shrink-0">
      {imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={imageUrl} alt={name} className="w-full h-full object-cover" />
      ) : (
        <AppIcon
          icon={fallbackIcon}
          className={cn("size-5", active ? "text-primary" : "text-muted-foreground")}
        />
      )}
    </div>
  );
}

function RowAction({
  icon,
  onClick,
  destructive,
}: {
  icon: string;
  onClick: (e: React.MouseEvent) => void;
  destructive?: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "size-7 rounded-md",
        destructive
          ? "text-destructive hover:bg-destructive/10"
          : "text-muted-foreground hover:text-primary",
      )}
      onClick={onClick}
    >
      <AppIcon icon={icon} className="size-3.5" />
    </Button>
  );
}
