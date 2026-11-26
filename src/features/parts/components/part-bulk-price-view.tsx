"use client";

import { Suspense, useMemo } from "react";
import { useSearchParams } from "next/navigation";

import { BulkPriceEditor, type BulkPriceRow } from "@/components/shared/bulk-price-editor";
import { parseBulkPriceIds } from "@/lib/utils/bulk-price";

import { useBulkPriceParts, useSavePartPrice } from "../api/parts.queries";
import type { Part } from "../types/parts";

/** Wire fields the generated PartResponse does not list yet. */
type PricedPart = Part & { basePrice?: number | null; fxLinked?: boolean };

/** /catalogues/parts/bulk-price?ids=… — one row per selected part. */
export function PartBulkPriceView() {
  return (
    <Suspense>
      <PartBulkPriceEditor />
    </Suspense>
  );
}

function PartBulkPriceEditor() {
  const ids = parseBulkPriceIds(useSearchParams().get("ids"));
  const { data, isLoading } = useBulkPriceParts(ids);
  const { save, refresh } = useSavePartPrice();

  const rows = useMemo<BulkPriceRow[]>(
    () =>
      (data ?? []).flatMap((r) => {
        if (r.status !== "fulfilled") return [];
        const p: PricedPart = r.value;
        return [
          {
            key: p.id,
            title: p.name,
            subtitle: [p.partNumber, p.partId].filter(Boolean).join(" · "),
            current: p.basePrice ?? p.price,
            shelfPrice: p.price,
            costPrice: p.costPrice,
            fxLinked: p.fxLinked,
          },
        ];
      }),
    [data],
  );

  return (
    <BulkPriceEditor
      noun="part"
      backHref="/catalogues/parts"
      rows={rows}
      isLoading={isLoading}
      failedToLoad={(data ?? []).filter((r) => r.status === "rejected").length}
      onSave={save}
      onSaved={refresh}
    />
  );
}
