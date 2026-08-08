"use client";

import Link from "next/link";
import PageContainer from "@/components/layouts/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import {
  useUploaderAnalytics,
  useUploaderProducts,
  useUploaderParts,
} from "../api/analytics.queries";
import { useUploaderDetailFilters } from "../hooks/use-uploader-detail-filters";
import { UploaderDateRange } from "./uploader-date-range";
import { UploaderDetailHeader } from "./uploader-detail-header";
import { UploaderItemsTabs } from "./uploader-items-tabs";
import { UploaderItemsList } from "./uploader-items-list";
import type { UploaderItem } from "../types/upload-analytics";

/** Per-uploader drill-down (route `/users/uploads/[staffId]`): header stats plus
 * the actual products and parts they created in the selected window. */
export function UploaderDetailView({ staffId }: { staffId: string }) {
  const { range, tab, page, setRange, setTab, setPage } =
    useUploaderDetailFilters();

  const report = useUploaderAnalytics({
    startDate: range.startDate,
    endDate: range.endDate,
    staffId,
  });
  const uploader = report.data?.uploaders?.[0];

  const itemsParams = {
    staffId,
    startDate: range.startDate,
    endDate: range.endDate,
    page,
  };
  const productsQuery = useUploaderProducts(itemsParams, tab === "products");
  const partsQuery = useUploaderParts(itemsParams, tab === "parts");

  const productItems: UploaderItem[] = (productsQuery.data?.data ?? []).map(
    (p) => ({
      key: p.id,
      image: p.primaryImage,
      title: p.name,
      code: p.productId,
      createdAt: p.createdAt,
      price: p.lowestPrice,
    }),
  );
  const partItems: UploaderItem[] = (partsQuery.data?.data ?? []).map((pt) => ({
    key: pt.id,
    image:
      pt.images?.find((img) => img.isPrimary)?.url ??
      pt.images?.[0]?.url ??
      null,
    title: pt.name,
    code: pt.partId,
    createdAt: pt.createdAt,
    price: pt.price,
  }));

  const active = tab === "products" ? productsQuery : partsQuery;
  const items = tab === "products" ? productItems : partItems;

  return (
    <PageContainer>
      <PageHeader
        title={uploader?.staff.name ?? "Uploader"}
        description="Everything this staff member created in the selected period."
      >
        <Button asChild variant="ghost" size="sm" className="font-medium">
          <Link href="/users/uploads">
            <AppIcon icon="solar:arrow-left-linear" className="mr-1.5 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>

      <div className="space-y-6">
        <div className="rounded-xl border border-border bg-card p-4 sm:p-5">
          <UploaderDateRange range={range} onChange={setRange} />
        </div>

        <UploaderDetailHeader uploader={uploader} isLoading={report.isLoading} />

        <div>
          <UploaderItemsTabs
            tab={tab}
            onTabChange={setTab}
            productCount={uploader?.totals.products ?? 0}
            partCount={uploader?.totals.parts ?? 0}
          />
          <UploaderItemsList
            items={items}
            isLoading={active.isLoading}
            isError={active.isError}
            meta={active.data?.meta}
            page={page}
            onPageChange={setPage}
            emptyLabel={
              tab === "products"
                ? "No products created in this period."
                : "No parts created in this period."
            }
          />
        </div>
      </div>
    </PageContainer>
  );
}
