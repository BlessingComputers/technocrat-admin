"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { CategoryBanner } from "../../types/products";

interface CategoryBannerCardProps {
  banner: CategoryBanner;
  categoryName: string;
  isSettingPrimary: boolean;
  onSetPrimary: (bannerId: string) => void;
  onDelete: (bannerId: string) => void;
  disabled: boolean;
}

/**
 * One stored banner.
 *
 * The frame is 12:5, matching the storefront's `CategoryBanner` — staff should
 * see the crop the shopper will see, not a square thumbnail that hides how much
 * of the artwork gets cut off.
 */
export function CategoryBannerCard({
  banner,
  categoryName,
  isSettingPrimary,
  onSetPrimary,
  onDelete,
  disabled,
}: CategoryBannerCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg border bg-muted/30",
        banner.isPrimary ? "border-primary" : "border-border",
      )}
    >
      {/* Matches the storefront frame exactly (16:9 at every width), so what
          staff see here is what the category page renders. */}
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-muted">
        {/* Plain <img>: these are absolute CDN URLs on a staff-only screen, so
            there is nothing for the optimizer to win here. */}
        <img
          src={banner.url}
          alt={banner.altText || `${categoryName} banner`}
          className="pointer-events-none h-full w-full object-cover"
        />

        {banner.isPrimary && (
          <Badge className="absolute left-2 top-2 gap-1">
            <AppIcon icon="solar:star-linear" className="size-3" />
            Primary
          </Badge>
        )}
      </div>

      <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          {banner.altText || (
            <span className="italic">No alt text</span>
          )}
        </p>

        <div className="flex shrink-0 items-center gap-1">
          {!banner.isPrimary && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => onSetPrimary(banner.id)}
              disabled={disabled}
            >
              <AppIcon
                icon={
                  isSettingPrimary
                    ? "solar:refresh-linear"
                    : "solar:star-linear"
                }
                className={cn("mr-1 size-3", isSettingPrimary && "animate-spin")}
              />
              Make primary
            </Button>
          )}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-7 px-2 text-xs text-destructive hover:text-destructive"
            onClick={() => onDelete(banner.id)}
            disabled={disabled}
            aria-label={`Delete banner${banner.altText ? `: ${banner.altText}` : ""}`}
          >
            <AppIcon icon="solar:trash-bin-trash-linear" className="size-3.5" />
          </Button>
        </div>
      </div>
    </div>
  );
}
