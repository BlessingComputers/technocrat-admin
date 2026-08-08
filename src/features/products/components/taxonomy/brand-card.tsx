import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import type { ProductBrand } from "../../types/products";

interface BrandCardProps {
  brand: ProductBrand;
  onEdit: (brand: ProductBrand) => void;
  onDelete: (brand: ProductBrand) => void;
}

export function BrandCard({ brand, onEdit, onDelete }: BrandCardProps) {
  const productCount = brand.productCount ?? brand.count ?? 0;

  return (
    <Card className="p-5 border border-border flex flex-col gap-4 group">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <div className="size-11 rounded-xl bg-muted border border-border flex items-center justify-center overflow-hidden shrink-0">
            {brand.logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={brand.logoUrl}
                alt={brand.name}
                className="w-full h-full object-contain p-1"
              />
            ) : (
              <span className="text-base font-semibold text-muted-foreground uppercase">
                {brand.name.charAt(0)}
              </span>
            )}
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-foreground truncate">{brand.name}</h3>
            <p className="text-xs text-muted-foreground font-mono truncate">
              {brand.slug}
            </p>
          </div>
        </div>
        <Badge variant={brand.isActive ? "success" : "muted"} className="text-xs shrink-0">
          {brand.isActive ? "Active" : "Hidden"}
        </Badge>
      </div>

      <div className="flex items-center justify-between mt-auto pt-3 border-t border-border">
        <Badge variant="muted" className="text-xs">
          {productCount} Products
        </Badge>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-md hover:text-primary"
            onClick={() => onEdit(brand)}
          >
            <AppIcon icon="solar:pen-2-linear" className="size-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-8 rounded-md text-destructive hover:bg-destructive/10"
            onClick={() => onDelete(brand)}
          >
            <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
          </Button>
        </div>
      </div>
    </Card>
  );
}
