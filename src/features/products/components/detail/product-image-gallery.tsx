import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import type { ProductImage } from "../../types/products";

interface ProductImageGalleryProps {
  images: ProductImage[];
  productName: string;
}

export function ProductImageGallery({
  images,
  productName,
}: ProductImageGalleryProps) {
  if (images.length === 0) return null;

  return (
    <div className="pt-6 space-y-4">
      <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
        <AppIcon icon="solar:gallery-linear" className="size-5 text-primary" />
        Image Gallery
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {[...images]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((img) => (
            <div
              key={img.id}
              className="aspect-square relative rounded-xl border border-border overflow-hidden bg-muted hover:ring-2 hover:ring-primary/20 transition-all group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img.url}
                alt={img.altText || productName}
                className="w-full h-full object-contain p-4 transition-transform group-hover:scale-105"
              />
              {img.isPrimary && (
                <Badge className="absolute top-2 left-2 text-xs h-4 px-1.5">
                  Primary
                </Badge>
              )}
            </div>
          ))}
      </div>
    </div>
  );
}
