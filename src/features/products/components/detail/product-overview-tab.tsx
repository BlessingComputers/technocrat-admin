"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { MetaLabel } from "@/components/shared/meta-label";
import { usePermissions } from "@/lib/auth/use-permissions";
import { useCategories } from "../../api/products.queries";
import { splitCategoryId } from "../../utils/category-tree";
import type { ProductDetail } from "../../types/products";

interface ProductOverviewTabProps {
  product: ProductDetail;
}

export function ProductOverviewTab({ product }: ProductOverviewTabProps) {
  const { isSuperAdmin } = usePermissions();

  // `product.category` is the leaf the product is filed under, which may be a
  // subcategory. Showing it alone reads as though the product left its parent
  // category, so resolve the pair against the tree.
  const { data: categories = [] } = useCategories();
  const { parent, child } = splitCategoryId(product.categoryId, categories);

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-base font-semibold text-foreground">Description</h3>
        {product.description ? (
          <p className="max-w-[70ch] text-sm leading-relaxed text-foreground/80">
            {product.description}
          </p>
        ) : (
          <p className="text-sm text-muted-foreground">
            No description yet. The storefront listing will show only the name
            and specs until one is written.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <InfoCard icon="solar:tag-linear" title="Classification">
          <InfoRow
            label="Category"
            value={parent?.name ?? product.category.name}
          />
          {child && <InfoRow label="Subcategory" value={child.name} />}
          <InfoRow label="Brand" value={product.brand.name} />
          <InfoRow label="Slug" value={product.slug} mono />
        </InfoCard>

        <InfoCard icon="solar:layers-minimalistic-linear" title="System Metadata">
          {isSuperAdmin && product.createdBy && (
            <InfoRow label="Uploaded by" value={product.createdBy.fullName} />
          )}
          <InfoRow label="Internal UUID" value={product.id} mono />
          <InfoRow
            label="Created At"
            value={new Date(product.createdAt).toLocaleString()}
          />
          <InfoRow
            label="Last Updated"
            value={new Date(product.updatedAt).toLocaleString()}
          />
        </InfoCard>
      </div>
    </div>
  );
}

function InfoCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card>
      <CardHeader className="pb-0">
        <CardTitle className="flex items-center gap-2 text-base font-semibold text-foreground">
          <AppIcon icon={icon} className="size-4 text-muted-foreground" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}

function InfoRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-b border-border/40 py-2.5 last:border-b-0">
      <MetaLabel className="shrink-0">{label}</MetaLabel>
      {mono ? (
        <span className="max-w-[60%] truncate rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-muted-foreground">
          {value}
        </span>
      ) : (
        <span className="min-w-0 truncate text-right text-sm font-semibold text-foreground">
          {value}
        </span>
      )}
    </div>
  );
}
