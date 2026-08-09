"use client";

import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { usePermissions } from "@/lib/auth/use-permissions";
import type { ProductDetail } from "../../types/products";

interface ProductOverviewTabProps {
  product: ProductDetail;
}

export function ProductOverviewTab({ product }: ProductOverviewTabProps) {
  const { isSuperAdmin } = usePermissions();

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
          <AppIcon icon="solar:info-circle-linear" className="size-5 text-primary" />
          About this Product
        </h3>
        <p className="text-sm text-muted-foreground leading-relaxed">
          {product.description || "No description provided."}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <InfoCard icon="solar:tag-linear" title="Classification">
          <InfoRow label="Category" value={product.category.name} />
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
    <Card className="border bg-muted/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <AppIcon icon={icon} className="size-3.5" />
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1 pt-0">{children}</CardContent>
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
    <div className="flex justify-between items-center gap-3 text-sm py-1.5 border-b border-border/40 last:border-0">
      <span className="text-muted-foreground shrink-0">{label}</span>
      {mono ? (
        <span className="font-mono text-xs bg-muted px-1.5 py-0.5 rounded truncate max-w-[60%]">
          {value}
        </span>
      ) : (
        <span className="font-bold text-foreground text-right truncate">
          {value}
        </span>
      )}
    </div>
  );
}
