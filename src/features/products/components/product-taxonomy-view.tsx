"use client";

import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { BrandsPanel } from "./taxonomy/brands-panel";
import { CategoriesPanel } from "./taxonomy/categories-panel";

/** Brands & categories management (route `/catalogues/taxonomy`). Part Types moved
 *  to Parts (`/catalogues/parts/types`). */
export function ProductTaxonomyView() {
  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <Link
        href="/catalogues"
        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-primary-ink transition-colors"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Products
      </Link>

      <PageHeader
        title="Brands & Categories"
        description="Organize the catalog — manufacturers and the category tree"
      />

      <Tabs defaultValue="categories" className="w-full">
        <TabsList variant="line" className="mb-4">
          <TabsTrigger value="categories">
            <AppIcon icon="solar:folder-linear" className="size-4" />
            Categories
          </TabsTrigger>
          <TabsTrigger value="brands">
            <AppIcon icon="solar:tag-linear" className="size-4" />
            Brands
          </TabsTrigger>
        </TabsList>

        <TabsContent value="categories">
          <CategoriesPanel />
        </TabsContent>
        <TabsContent value="brands">
          <BrandsPanel />
        </TabsContent>
      </Tabs>
    </div>
  );
}
