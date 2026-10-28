import { Stat, StatsBar } from "@/components/shared/stats-bar";

interface CatalogueOverviewStatsProps {
  productTotal: number;
  productOutOfStock: number;
  partTotal: number;
  partOutOfStock: number;
  isLoading?: boolean;
}

/**
 * The hub's "All" KPI row — the whole catalogue, and how it splits.
 *
 * Products and parts are different models on the backend (parts have no
 * low-stock state, products have no part types), so this row deliberately does
 * NOT try to sum "Active" or "Low stock" across the two. It answers the only
 * two questions that are meaningful catalogue-wide: how big is it, and how much
 * of it is unsellable. The per-domain health numbers live behind the Products
 * and Parts filters, where the models actually match.
 */
export function CatalogueOverviewStats({
  productTotal,
  productOutOfStock,
  partTotal,
  partOutOfStock,
  isLoading,
}: CatalogueOverviewStatsProps) {
  return (
    <StatsBar>
      <Stat
        icon="solar:widget-4-linear"
        tone="primary"
        label="Catalogue items"
        value={(productTotal + partTotal).toLocaleString()}
        loading={isLoading}
      />
      <Stat
        icon="solar:box-linear"
        tone="info"
        label="Products"
        value={productTotal.toLocaleString()}
        loading={isLoading}
        href="/catalogues/all"
      />
      <Stat
        icon="solar:cpu-bolt-linear"
        tone="success"
        label="Parts"
        value={partTotal.toLocaleString()}
        loading={isLoading}
        href="/catalogues/parts"
      />
      <Stat
        icon="solar:close-circle-linear"
        tone="danger"
        label="Out of stock"
        value={(productOutOfStock + partOutOfStock).toLocaleString()}
        loading={isLoading}
      />
    </StatsBar>
  );
}
