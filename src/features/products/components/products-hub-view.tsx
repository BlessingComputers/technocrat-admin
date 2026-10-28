"use client";

import { useCallback, useState, type ReactNode } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";

import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { PermissionGate } from "@/lib/auth/permission-gate";
import { cn } from "@/lib/utils/cn";

import { useSyncCatalog, useClearProductCache } from "../api/products.queries";
import { useCatalogProductStats } from "../hooks/use-catalog-product-stats";
import { ProductsStatsBar } from "./products-stats-bar";
import { CatalogueOverviewStats } from "./catalogue-overview-stats";
import { RecentProductsSnapshot } from "./recent-products-snapshot";
import { ProductsInventoryHealth } from "./products-inventory-health";
import { ProductsRestockList } from "./products-restock-list";

const LOW_STOCK_HREF = "/catalogues/all?stock=low";
const OUT_OF_STOCK_HREF = "/catalogues/all?stock=out";

/**
 * Parts KPI numbers, owned by the parts feature and handed in by the route.
 *
 * The hub reports on products AND parts, but a feature may not import a sibling
 * feature (boundaries rule) — so the app-layer route calls the parts feature's
 * `usePartsStats()` and passes the result down. Optional, so the products
 * feature still renders standalone if the parts slice is ever gated off.
 */
export interface HubPartsStats {
  total: number;
  inStock: number;
  outOfStock: number;
  partTypes: number;
  isLoading: boolean;
}

/** Which slice of the catalogue the overview strip is reporting on. */
type CatalogueView = "all" | "products" | "parts";

function isCatalogueView(value: string | null): value is CatalogueView {
  return value === "all" || value === "products" || value === "parts";
}

interface ProductsHubViewProps {
  /** Numbers for the combined row and the Parts entry card. */
  partsStats?: HubPartsStats;
  /**
   * The parts KPI row, rendered when the Parts filter is active. A slot rather
   * than an import for the same boundary reason as {@link HubPartsStats} — the
   * markup belongs to the parts feature, the layout belongs here.
   */
  partsStatsBar?: ReactNode;
}

/**
 * Catalogue hub (route `/catalogues`). A management surface — header actions, a
 * filterable overview strip, entry cards into each working list, and the
 * product-side operational blocks (inventory health, restock queue, recently
 * added). The working lists themselves (filters/search/sort) deliberately live
 * at `/catalogues/all` and `/catalogues/parts`, not here.
 *
 * Two things this layout is deliberately fixing:
 *
 *  1. **The counts used to blend products and parts.** They came from
 *     `/v1/admin/dashboard`, whose product numbers are raw table counts — and
 *     every priced part carries a hidden `BKNG-…` backing product + variant, so
 *     parts were silently inflating "Total Products", "Low Stock" and "Out of
 *     Stock". The overview strip is now filterable (`?view=all|products|parts`):
 *     the "All" row reports catalogue size and its split, and each domain's real
 *     health numbers sit behind its own filter, where the models actually match.
 *     See {@link useCatalogProductStats} for how the product-only counts are
 *     derived.
 *  2. **Creating was asymmetric** — products were added from here, parts only
 *     from a product's Parts tab or the parts route. Every "Add" for both
 *     domains is now gathered into one menu here, each entry card carries its
 *     own, and each working list carries its own too.
 */
export function ProductsHubView({
  partsStats,
  partsStatsBar,
}: ProductsHubViewProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [maintenanceAction, setMaintenanceAction] = useState<
    "sync" | "cache" | null
  >(null);

  const stats = useCatalogProductStats();
  const syncCatalog = useSyncCatalog();
  const clearCache = useClearProductCache();

  const viewParam = searchParams.get("view");
  const view: CatalogueView = isCatalogueView(viewParam) ? viewParam : "all";

  const setView = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value === "all") params.delete("view");
      else params.set("view", value);
      const query = params.toString();
      router.replace(query ? `/catalogues?${query}` : "/catalogues", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  const confirmMaintenance = () => {
    if (!maintenanceAction) return;
    const mutation = maintenanceAction === "sync" ? syncCatalog : clearCache;
    mutation.mutate(undefined, { onSettled: () => setMaintenanceAction(null) });
  };

  const partsLoading = partsStats?.isLoading ?? false;

  const productsMeta = stats.isLoading
    ? "Loading…"
    : `${stats.active.toLocaleString()} active · ${stats.lowStock.toLocaleString()} low stock`;
  const partsMeta = !partsStats
    ? "Components & spare parts"
    : partsLoading
      ? "Loading…"
      : `${partsStats.partTypes.toLocaleString()} part types · ${partsStats.inStock.toLocaleString()} in stock`;

  const viewDescription =
    view === "all"
      ? "Everything in the catalogue, and how it splits."
      : view === "products"
        ? "Product health only — parts are excluded from these counts."
        : "Part health only — products are excluded from these counts.";

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
          <Link href="/pricing/markup">
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
        {/* One "Add" for the whole catalogue — products and parts grouped and
            labelled, rather than split across two routes. */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button className="h-10 rounded-lg bg-primary px-5 font-semibold text-primary-foreground">
              <AppIcon icon="solar:add-circle-linear" className="mr-2 size-5" />
              Add to Catalogue
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>Product</DropdownMenuLabel>
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
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Part</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => router.push("/catalogues/parts/new")}
            >
              <AppIcon icon="solar:cpu-bolt-linear" className="mr-2 size-4" />
              Single part
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => router.push("/catalogues/parts/bulk")}
            >
              <AppIcon
                icon="solar:cloud-upload-linear"
                className="mr-2 size-4"
              />
              Bulk part upload
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </PageHeader>

      {/* Overview strip. The filter governs THIS row only — everything below it
          stays put, so changing the lens never reshuffles the page. */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <MetaLabel className="block">Catalogue overview</MetaLabel>
            <p className="text-sm text-muted-foreground">{viewDescription}</p>
          </div>
          <Tabs value={view} onValueChange={setView}>
            <TabsList>
              <TabsTrigger value="all">
                <AppIcon icon="solar:widget-4-linear" />
                All
              </TabsTrigger>
              <TabsTrigger value="products">
                <AppIcon icon="solar:box-linear" />
                Products
              </TabsTrigger>
              <TabsTrigger value="parts">
                <AppIcon icon="solar:cpu-bolt-linear" />
                Parts
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

        {view === "all" && (
          <CatalogueOverviewStats
            productTotal={stats.total}
            productOutOfStock={stats.outOfStock}
            partTotal={partsStats?.total ?? 0}
            partOutOfStock={partsStats?.outOfStock ?? 0}
            isLoading={stats.isLoading || partsLoading}
          />
        )}

        {view === "products" && (
          <ProductsStatsBar
            stats={stats}
            lowStockHref={LOW_STOCK_HREF}
            outOfStockHref={OUT_OF_STOCK_HREF}
            isLoading={stats.isLoading}
          />
        )}

        {view === "parts" && partsStatsBar}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <CatalogEntryCard
          browseHref="/catalogues/all"
          icon="solar:box-bold"
          accent="primary"
          title="Products"
          description="Search, filter, and manage the full catalog."
          meta={productsMeta}
          addLabel="Add product"
          addHref="/catalogues/new"
        />
        <CatalogEntryCard
          browseHref="/catalogues/parts"
          icon="solar:layers-minimalistic-bold"
          accent="info"
          title="Parts"
          description="Search and audit every part, or add a standalone one."
          meta={partsMeta}
          addLabel="Add part"
          addHref="/catalogues/parts/new"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <ProductsInventoryHealth stats={stats} />
        <div className="lg:col-span-2">
          <ProductsRestockList />
        </div>
      </div>

      <Card className="gap-0 overflow-hidden p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h3 className="text-base font-semibold text-foreground">
            Recently added
          </h3>
          <Link
            href="/catalogues/all"
            className="text-xs font-medium text-primary-ink hover:underline"
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
            ? "Re-indexes every active product and part in OpenSearch so search reflects the latest catalog. This runs in the background and may take a few minutes."
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
    tile: "bg-primary/10 text-primary-ink",
    border: "hover:border-primary/30",
    arrow: "group-hover:text-primary-ink",
  },
  info: {
    tile: "bg-info/10 text-info-ink",
    border: "hover:border-info/40",
    arrow: "group-hover:text-info-ink",
  },
} as const;

/**
 * A prominent entry card into a catalog surface (Products / Parts).
 *
 * Each card now carries BOTH of its domain's affordances — browse and add — so
 * the two destinations are symmetrical and neither one's "add" is stranded on
 * some other route. The card is no longer one big link: an anchor can't nest
 * another anchor, so the body link and the footer buttons are siblings inside a
 * plain container, and the container owns the group hover.
 */
function CatalogEntryCard({
  browseHref,
  icon,
  accent,
  title,
  description,
  meta,
  addLabel,
  addHref,
}: {
  browseHref: string;
  icon: string;
  accent: keyof typeof ENTRY_ACCENTS;
  title: string;
  description: string;
  meta: string;
  addLabel: string;
  addHref: string;
}) {
  const styles = ENTRY_ACCENTS[accent];

  return (
    <div
      className={cn(
        "group relative flex flex-col gap-5 rounded-xl border border-border bg-card p-6 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-[0_18px_50px_-24px_rgba(0,0,0,0.22)]",
        styles.border,
      )}
    >
      <Link href={browseHref} className="flex flex-col gap-5">
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
      </Link>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-3 border-t border-border/60 pt-4">
        <span className="text-xs font-medium text-muted-foreground">{meta}</span>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm" className="h-8 rounded-lg">
            <Link href={browseHref}>Browse</Link>
          </Button>
          <Button asChild size="sm" className="h-8 rounded-lg">
            <Link href={addHref}>
              <AppIcon icon="solar:add-circle-linear" className="mr-1.5 size-4" />
              {addLabel}
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
