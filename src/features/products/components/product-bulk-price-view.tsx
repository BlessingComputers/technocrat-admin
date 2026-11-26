"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { BulkPriceEditor, type BulkPriceRow } from "@/components/shared/bulk-price-editor";
import { parseBulkPriceIds } from "@/lib/utils/bulk-price";

import { useBulkPriceProducts, useSaveProductVariantPrice } from "../api/products.queries";

/** /catalogues/all/bulk-price?ids=… — one row per variant of each selected product. */
export function ProductBulkPriceView() {
  return (
    <Suspense>
      <ProductBulkPriceEditor />
    </Suspense>
  );
}

function ProductBulkPriceEditor() {
  const ids = parseBulkPriceIds(useSearchParams().get("ids"));
  const { data, isLoading } = useBulkPriceProducts(ids);
  const { save, refresh } = useSaveProductVariantPrice();

  const rows = useMemo<BulkPriceRow[]>(
    () =>
      (data ?? []).flatMap((r) => {
        if (r.status !== "fulfilled") return [];
        const p = r.value;
        return p.variants.map((v) => ({
          key: `${p.id}:${v.id}`,
          title: p.name,
          subtitle: [p.variants.length > 1 ? v.name : null, v.sku].filter(Boolean).join(" · "),
          current: v.basePrice ?? v.price,
          shelfPrice: v.price,
          costPrice: v.costPrice,
          fxLinked: p.fxLinked,
        }));
      }),
    [data],
  );

  return (
    <BulkPriceEditor
      noun="product"
      backHref="/catalogues/all"
      rows={rows}
      isLoading={isLoading}
      failedToLoad={(data ?? []).filter((r) => r.status === "rejected").length}
      onSave={(key, price) => {
        const [productId, variantId] = key.split(":");
        return save(productId, variantId, price);
      }}
      onSaved={refresh}
    />
  );
}
