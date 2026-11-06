"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "react-hot-toast";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { PageHeader } from "@/components/shared/page-header";
import { getErrorMessage } from "@/lib/api/error-message";

import {
  useBulkEditProducts,
  useCategories,
  useMoveCategory,
} from "../api/products.queries";
import { productsService } from "../api/products.service";
import {
  CATEGORY_CLEANUP_BATCHES,
  PARENT_MOVES,
} from "../constants/category-cleanup";
import type { CleanupBatch, CleanupParentMove, CleanupProduct } from "../types/category-cleanup";
import { BulkCategoriesCard } from "./bulk-categories-card";

/**
 * Temporary local-only page (route `/catalogues/cleanup`) for moving the
 * misfiled products found in the 2 November 2026 catalogue check. Not linked
 * from the nav and not meant to ship. Delete the route, this view, its types,
 * constants and the bulk categories card when the cleanup is finished.
 */

interface CategoryInfo {
  id: string;
  name: string;
  /** "Parent › Child" for subcategories, the name alone otherwise. */
  label: string;
  parentId?: string;
}

function useCategoryIndex() {
  const { data: tree = [], isLoading } = useCategories();
  const bySlug = useMemo(() => {
    const map = new Map<string, CategoryInfo>();
    for (const c of tree) {
      map.set(c.slug, { id: c.id, name: c.name, label: c.name, parentId: c.parentId });
      for (const s of c.children ?? []) {
        if (typeof s === "string") continue;
        map.set(s.slug, {
          id: s.id,
          name: s.name,
          label: `${c.name} › ${s.name}`,
          parentId: c.id,
        });
      }
    }
    return map;
  }, [tree]);
  return { bySlug, isLoading };
}

/** The list can answer 500 under load, so try a page three times before failing. */
async function getCataloguePage(page: number) {
  for (let attempt = 1; ; attempt++) {
    try {
      return await productsService.getProducts({ page, limit: 100, isActive: true });
    } catch (err) {
      if (attempt === 3) throw err;
      await new Promise((resolve) => setTimeout(resolve, attempt * 2000));
    }
  }
}

const CATALOGUE_KEY = ["cleanup-catalogue"];

/**
 * Every active product's current category slug, read live so finished rows
 * drop off the page. About 25 slow sequential pages of 100 (the API's cap), so
 * it is not under the product lists: a move updates this data directly instead
 * of starting a full read.
 */
function useLiveCatalogue() {
  return useQuery({
    queryKey: CATALOGUE_KEY,
    queryFn: async () => {
      const slugById = new Map<string, string>();
      for (let page = 1; ; page++) {
        const res = await getCataloguePage(page);
        for (const p of res.data) slugById.set(p.id, p.category?.slug ?? "");
        if (page >= res.meta.totalPages) break;
      }
      return slugById;
    },
    // Each page retries itself. A query-level retry would restart from page 1.
    retry: false,
    staleTime: 5 * 60_000,
    refetchOnWindowFocus: false,
  });
}

/** Done when the product is no longer active, or its move has landed. */
function isRowDone(batch: CleanupBatch, p: CleanupProduct, live: Map<string, string>) {
  const slug = live.get(p.id);
  return slug === undefined || slug === batch.targetSlug;
}

const PRIORITY_HEADINGS: Record<CleanupBatch["priority"], string> = {
  1: "Fix these first",
  2: "Then these",
  3: "When you have time",
};

export function CategoryCleanupView() {
  const { bySlug, isLoading } = useCategoryIndex();
  const live = useLiveCatalogue();

  // Until the check succeeds, show every row: hiding on a failed read would
  // look like finished work.
  const batches = useMemo(() => {
    if (!live.data) return CATEGORY_CLEANUP_BATCHES;
    return CATEGORY_CLEANUP_BATCHES.map((b) => ({
      ...b,
      products: b.products.filter((p) => !isRowDone(b, p, live.data)),
    })).filter((b) => b.products.length > 0);
  }, [live.data]);

  const rowsLeft = batches.reduce((n, b) => n + b.products.length, 0);
  const checkedAt = live.dataUpdatedAt
    ? new Date(live.dataUpdatedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <Link
        href="/catalogues"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary-ink transition-colors"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Products
      </Link>

      <PageHeader
        title="Category cleanup"
        description="Products that are filed in the wrong category, grouped by where they should go."
      >
        {live.data && (
          <Badge variant={rowsLeft === 0 ? "success" : "secondary"}>
            {rowsLeft === 0
              ? "All done"
              : `${rowsLeft} products left in ${batches.length} groups`}
          </Badge>
        )}
      </PageHeader>

      <Card>
        <CardContent className="space-y-2 text-sm">
          <p className="font-medium">How to use this page</p>
          <ol className="list-decimal space-y-1 pl-5 text-muted-foreground">
            <li>Check the tax and markup rules in Pricing. A move can change which rule applies.</li>
            <li>Create the missing categories, then move the two subcategories below.</li>
            <li>Work from the top down. Each box is one group of products going to one category.</li>
            <li>Read the product names. Untick any product that is already in the right place.</li>
            <li>Press the move button and confirm. Moved products drop off the list.</li>
          </ol>
          <p className="text-muted-foreground">
            The page checks every row against the live catalogue and hides the ones already
            moved or no longer listed. Changes go straight to the live store.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void live.refetch()}
              disabled={live.isFetching}
            >
              {live.isFetching ? "Checking the catalogue…" : "Check again"}
            </Button>
            {checkedAt && !live.isFetching && (
              <span className="text-xs text-muted-foreground">Last checked at {checkedAt}</span>
            )}
          </div>
          {live.isError && (
            <p className="text-destructive-ink">
              {getErrorMessage(live.error, "Could not read the catalogue")}. Showing every row,
              including ones that may already be done.
            </p>
          )}
        </CardContent>
      </Card>

      <BulkCategoriesCard />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Move subcategories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {PARENT_MOVES.map((move) => (
            <ParentMoveRow key={move.slug} move={move} bySlug={bySlug} />
          ))}
        </CardContent>
      </Card>

      {isLoading || live.isLoading ? (
        <p className="text-sm text-muted-foreground">Checking the catalogue…</p>
      ) : live.data && rowsLeft === 0 ? (
        <Card className="gap-0 py-16 text-center border-dashed">
          <AppIcon
            icon="solar:check-circle-linear"
            className="size-12 text-success/60 mx-auto mb-3"
          />
          <h3 className="font-semibold text-foreground">All done</h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">
            Every product on this list is in the right category or no longer listed. There is
            nothing left to move.
          </p>
        </Card>
      ) : (
        <>
          {([1, 2, 3] as const).map((priority) => {
            const group = batches.filter((b) => b.priority === priority);
            if (group.length === 0) return null;
            return (
              <section key={priority} className="space-y-4">
                <h2 className="text-lg font-semibold">{PRIORITY_HEADINGS[priority]}</h2>
                {group.map((batch) => (
                  <BatchCard key={batch.id} batch={batch} bySlug={bySlug} />
                ))}
              </section>
            );
          })}
        </>
      )}
    </div>
  );
}

function ParentMoveRow({
  move,
  bySlug,
}: {
  move: CleanupParentMove;
  bySlug: Map<string, CategoryInfo>;
}) {
  const moveCategory = useMoveCategory();
  const [confirming, setConfirming] = useState(false);

  const category = bySlug.get(move.slug);
  const parent = bySlug.get(move.parentSlug);
  const done = !!category && !!parent && category.parentId === parent.id;

  const handleConfirm = () => {
    if (!category || !parent) return;
    const promise = moveCategory.mutateAsync({
      categoryId: category.id,
      newParentId: parent.id,
    });
    toast.promise(promise, {
      loading: `Moving ${category.name}…`,
      success: `${move.label}: done`,
      error: (err) => getErrorMessage(err, "Could not move this subcategory"),
    });
    promise.finally(() => setConfirming(false)).catch(() => {});
  };

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
      <span>{move.label}</span>
      {done ? (
        <Badge variant="success">Done</Badge>
      ) : (
        <Button
          size="sm"
          variant="outline"
          onClick={() => setConfirming(true)}
          disabled={!category || !parent || moveCategory.isPending}
        >
          Move
        </Button>
      )}
      <ConfirmModal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        title={`Move ${move.label}?`}
        description="Every product in this subcategory moves with it. The tax or markup rule on those products can change."
        confirmText="Move it"
        isPending={moveCategory.isPending}
        variant="primary"
      />
    </div>
  );
}

function BatchCard({
  batch,
  bySlug,
}: {
  batch: CleanupBatch;
  bySlug: Map<string, CategoryInfo>;
}) {
  const bulkEdit = useBulkEditProducts();
  const queryClient = useQueryClient();
  const [unticked, setUnticked] = useState<Set<string>>(new Set());
  const [confirming, setConfirming] = useState(false);

  const target = bySlug.get(batch.targetSlug);
  const selected = batch.products.filter((p) => !unticked.has(p.id));

  const toggle = (id: string) =>
    setUnticked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const handleConfirm = () => {
    if (!target) return;
    const promise = bulkEdit.mutateAsync({
      productIds: selected.map((p) => p.id),
      categoryId: target.id,
    });
    toast.promise(promise, {
      loading: `Moving ${selected.length} products…`,
      success: (res) => `Moved ${res.updated} products to ${target.label}`,
      error: (err) => getErrorMessage(err, "Could not move these products"),
    });
    promise
      .then(() =>
        queryClient.setQueryData<Map<string, string>>(
          CATALOGUE_KEY,
          (prev) => {
            if (!prev) return prev;
            const next = new Map(prev);
            for (const p of selected) next.set(p.id, batch.targetSlug);
            return next;
          },
          // Keep "Last checked" true: this is not a new read.
          { updatedAt: queryClient.getQueryState(CATALOGUE_KEY)?.dataUpdatedAt },
        ),
      )
      .finally(() => setConfirming(false))
      .catch(() => {});
  };

  const productWord = selected.length === 1 ? "product" : "products";

  return (
    <Card>
      <CardHeader className="space-y-1">
        <CardTitle className="text-base">{batch.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{batch.why}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm">
          Move to{" "}
          {target ? (
            <span className="font-semibold">{target.label}</span>
          ) : (
            <span className="font-semibold text-destructive-ink">
              category &ldquo;{batch.targetSlug}&rdquo; not found. Create it above.
            </span>
          )}
        </p>

        <ul className="max-h-72 divide-y overflow-y-auto rounded-md border">
          {batch.products.map((p) => {
            const checked = !unticked.has(p.id);
            const from = bySlug.get(p.from)?.label ?? p.from;
            return (
              <li key={p.id} className="flex items-start gap-3 px-3 py-2 text-sm">
                <Checkbox
                  id={`cleanup-${p.id}`}
                  checked={checked}
                  onCheckedChange={() => toggle(p.id)}
                  className="mt-0.5"
                />
                <label htmlFor={`cleanup-${p.id}`} className="min-w-0 flex-1 cursor-pointer">
                  <span className={checked ? undefined : "text-muted-foreground line-through"}>
                    {p.name}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    Now in {from} · {p.productId}
                  </span>
                </label>
                <Link
                  href={`/catalogues/${p.id}`}
                  target="_blank"
                  className="shrink-0 text-xs font-medium text-primary-ink hover:underline"
                >
                  View
                </Link>
              </li>
            );
          })}
        </ul>

        <Button
          onClick={() => setConfirming(true)}
          disabled={!target || selected.length === 0 || bulkEdit.isPending}
        >
          Move {selected.length} {productWord}
        </Button>
      </CardContent>

      <ConfirmModal
        isOpen={confirming}
        onClose={() => setConfirming(false)}
        onConfirm={handleConfirm}
        title={`Move ${selected.length} ${productWord}?`}
        description={`They will be moved to ${target?.label ?? batch.targetSlug}.`}
        confirmText="Move them"
        isPending={bulkEdit.isPending}
        variant="primary"
      />
    </Card>
  );
}
