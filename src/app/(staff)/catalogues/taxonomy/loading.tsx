import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { Skeleton } from "@/components/ui/skeleton";
import { CategoriesPanelSkeleton } from "@/features/products";

export default function ProductTaxonomyLoading() {
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Link
        href="/catalogues"
        className="inline-flex items-center gap-1 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-primary"
      >
        <AppIcon icon="solar:alt-arrow-left-linear" className="size-4" />
        Products
      </Link>

      <PageHeader
        title="Brands & Categories"
        description="Organize the catalog — manufacturers, the category tree, and part types"
      />

      {/* Tab strip (default tab: Categories) */}
      <div className="mb-4 flex gap-6">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-24 rounded-md" />
        ))}
      </div>

      <CategoriesPanelSkeleton />
    </div>
  );
}
