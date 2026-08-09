"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { PermissionGate } from "@/lib/auth/permission-gate";
import { cn } from "@/lib/utils/cn";

import {
  useProductStats,
  useSyncCatalog,
  useClearProductCache,
} from "../api/products.queries";
import type { ProductStats } from "../types/products";
import { ProductsStatsBar } from "./products-stats-bar";
import { RecentProductsSnapshot } from "./recent-products-snapshot";
import { ProductsInventoryHealth } from "./products-inventory-health";
import { ProductsRestockList } from "./products-restock-list";

const LOW_STOCK_HREF = "/catalogues/all?stock=low";
const OUT_OF_STOCK_HREF = "/catalogues/all?stock=out";

/**
 * Products hub (route `/catalogues`). A management surface — header actions, the
 * stats bar, a "recently added" snapshot, and a CTA into the full browse view
 * at `/catalogues/all`. The working list (filters/search/sort) deliberately lives
 * on the browse view, not here.
 */
export function ProductsHubView() {
  const router = useRouter();
  const [maintenanceAction, setMaintenanceAction] = useState<
    "sync" | "cache" | null
  >(null);

  const { data: statsResponse } = useProductStats();
  const syncCatalog = useSyncCatalog();
  const clearCache = useClearProductCache();

  const stats: ProductStats = {
    total: statsResponse?.total ?? 0,
    active: statsResponse?.active ?? 0,
    lowStock: statsResponse?.lowStock ?? 0,
    outOfStock: statsResponse?.outOfStock ?? 0,
    needsRestock: statsResponse?.needsRestock ?? 0,
  };

  const confirmMaintenance = () => {
    if (!maintenanceAction) return;
    const mutation = maintenanceAction === "sync" ? syncCatalog : clearCache;
    mutation.mutate(undefined, { onSettled: () => setMaintenanceAction(null) });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Catalogue"
        description="Products, parts, categories and brands in one place"
      >
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/catalogues/taxonomy">
            <AppIcon icon="solar:folder-linear" className="mr-2 size-4" />
            Brands & Categories
          </Link>
        </Button>
        <Button asChild variant="outline" className="h-10 rounded-lg font-medium">
          <Link href="/pricing">
            <AppIcon icon="solar:tag-price-linear" className="mr-2 size-4" />
            Markup Rules
          </Link>
        </Button>
        <PermissionGate permission="search:admin">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-10 rounded-lg font-medium">
                <AppIcon icon="solar:refresh-linear" className="mr-2 size-4" />
                Maintenance
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuItem onClick={() => setMaintenanceAction("sync")}>
                <AppIcon icon="solar:magnifer-linear" className="mr-2 size-4" />
                Rebuild search index
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setMaintenanceAction("cache")}>
                <AppIcon
                  icon="solar:trash-bin-trash-linear"
                  className="mr-2 size-4"
                />
                Clear product cache
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </PermissionGate>
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
        lowStockHref={LOW_STOCK_HREF}
        outOfStockHref={OUT_OF_STOCK_HREF}
      />

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CatalogEntryCard
          href="/catalogues/all"
          icon="solar:box-bold"
          accent="primary"
          title="Products"
          description="Search, filter, and manage the full catalog."
          meta={`${stats.total.toLocaleString()} in catalog · ${stats.active.toLocaleString()} active`}
        />
        <CatalogEntryCard
          href="/catalogues/parts"
          icon="solar:layers-minimalistic-bold"
          accent="info"
          title="Parts"
          description="Search and audit every part. Add parts from a product's page."
          meta="Components & spare parts"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProductsInventoryHealth stats={stats} />
        <div className="lg:col-span-2">
          <ProductsRestockList />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden border bg-card p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Recently added
          </h3>
          <Link
            href="/catalogues/all"
            className="text-xs font-medium text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        <RecentProductsSnapshot />
      </Card>

      <ConfirmModal
        isOpen={maintenanceAction !== null}
        onClose={() => setMaintenanceAction(null)}
        onConfirm={confirmMaintenance}
        title={
          maintenanceAction === "sync"
            ? "Rebuild search index?"
            : "Clear product cache?"
        }
        description={
          maintenanceAction === "sync"
            ? "Re-indexes the entire catalog in OpenSearch so search reflects the latest products. This runs in the background and may take a few minutes."
            : "Clears all cached product data so the storefront reloads fresh from the database."
        }
        confirmText={maintenanceAction === "sync" ? "Rebuild" : "Clear cache"}
        isPending={syncCatalog.isPending || clearCache.isPending}
      />
    </div>
  );
}

const ENTRY_ACCENTS = {
  primary: {
    tile: "bg-primary/10 text-primary",
    border: "hover:border-primary/30",
    arrow: "group-hover:text-primary",
  },
  info: {
    tile: "bg-info/10 text-info",
    border: "hover:border-info/40",
    arrow: "group-hover:text-info",
  },
} as const;

/**
 * A prominent entry card into a catalog surface (Products / Parts). Replaces the
 * old identical full-width rows: distinct accent, live meta, and a lift-on-hover
 * that makes the two destinations feel like real, differentiated sections.
 */
function CatalogEntryCard({
  href,
  icon,
  accent,
  title,
  description,
  meta,
}: {
  href: string;
  icon: string;
  accent: keyof typeof ENTRY_ACCENTS;
  title: string;
  description: string;
  meta: string;
}) {
  const styles = ENTRY_ACCENTS[accent];

  return (
    <Link
      href={href}
      className={cn(
        "group relative flex flex-col gap-5 rounded-xl border border-border bg-card p-6 transition-colors duration-150 hover:border-primary/25 hover:bg-muted/40",
        styles.border,
      )}
    >
      <div className="flex items-start justify-between">
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-xl",
            styles.tile,
          )}
        >
          <AppIcon icon={icon} className="size-6" />
        </span>
        <AppIcon
          icon="solar:arrow-right-up-linear"
          className={cn(
            "size-5 text-muted-foreground/40 transition-all group-hover:-translate-y-0.5 group-hover:translate-x-0.5",
            styles.arrow,
          )}
        />
      </div>
      <div className="space-y-1.5">
        <h3 className="text-lg font-semibold tracking-tight text-foreground">
          {title}
        </h3>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <div className="mt-auto flex items-center gap-2 border-t border-border/60 pt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        {meta}
      </div>
    </Link>
  );
}
