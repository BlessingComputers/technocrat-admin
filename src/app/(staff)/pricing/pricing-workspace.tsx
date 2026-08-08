"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { AppIcon } from "@/components/shared/app-icon";
import { usePermissions } from "@/lib/auth/use-permissions";
import { MarkupRulesView } from "@/features/products";
import { PartsPricingView } from "@/features/parts";
import { TaxWorkspaceView } from "@/features/tax";

type PricingTab = "products" | "parts" | "tax";

function isPricingTab(value: string | null): value is PricingTab {
  return value === "products" || value === "parts" || value === "tax";
}

/**
 * Standalone pricing workspace (route `/pricing`). Hosts the product and part
 * markup-rule managers plus store tax as tabs. Each inner view keeps its own
 * header and actions, so the tab bar sits above them without a second page
 * header.
 *
 * Lives in the `app` layer (not `features/`) on purpose: it composes sibling
 * features, and only `app` may depend on multiple features (the boundaries rule
 * forbids feature→feature imports).
 *
 * The active tab is mirrored in the URL (`?tab=parts`, default = products) so
 * the Catalogue "Markup Rules" and Parts "Pricing" buttons can deep-link in.
 * The Tax tab is gated on `tax:manage`; without it the tab is hidden and a
 * deep-link falls back to Products.
 */
export function PricingWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { can } = usePermissions();
  const canManageTax = can("tax:manage");

  const tabParam = searchParams.get("tab");
  const requestedTab: PricingTab = isPricingTab(tabParam) ? tabParam : "products";
  const activeTab: PricingTab =
    requestedTab === "tax" && !canManageTax ? "products" : requestedTab;

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value === "products") params.delete("tab");
      else params.set("tab", value);
      const query = params.toString();
      router.replace(query ? `/pricing?${query}` : "/pricing", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  return (
    <Tabs
      value={activeTab}
      onValueChange={handleTabChange}
      className="mx-auto w-full max-w-6xl gap-6"
    >
      <TabsList>
        <TabsTrigger value="products">
          <AppIcon icon="solar:box-linear" />
          Products
        </TabsTrigger>
        <TabsTrigger value="parts">
          <AppIcon icon="solar:layers-minimalistic-linear" />
          Parts
        </TabsTrigger>
        {canManageTax && (
          <TabsTrigger value="tax">
            <AppIcon icon="solar:bill-list-linear" />
            Tax
          </TabsTrigger>
        )}
      </TabsList>
      <TabsContent value="products">
        <MarkupRulesView />
      </TabsContent>
      <TabsContent value="parts">
        <PartsPricingView />
      </TabsContent>
      {canManageTax && (
        <TabsContent value="tax">
          <TaxWorkspaceView />
        </TabsContent>
      )}
    </Tabs>
  );
}
