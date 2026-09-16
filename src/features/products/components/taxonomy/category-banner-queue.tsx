"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

export interface PendingBanner {
  id: string;
  file: File;
  previewUrl: string;
  altText: string;
  isPrimary: boolean;
}

interface CategoryBannerQueueProps {
  pending: PendingBanner[];
  disabled: boolean;
  onAltTextChange: (id: string, altText: string) => void;
  onSetPrimary: (id: string) => void;
  onRemove: (id: string) => void;
}

/**
 * The staging queue: files chosen but not yet uploaded.
 *
 * **Alt text is captured here or not at all.** The backend takes `bannerAlt_{i}`
 * as an upload-time multipart field and ships no endpoint to change it
 * afterwards (BACKEND-ASKS item 20), so a banner uploaded blank can only be
 * corrected by deleting it and uploading the file again. That is why the field
 * sits in the queue with a visible prompt rather than being an afterthought on
 * the stored card — this is the only moment it can be set.
 */
export function CategoryBannerQueue({
  pending,
  disabled,
  onAltTextChange,
  onSetPrimary,
  onRemove,
}: CategoryBannerQueueProps) {
  if (pending.length === 0) return null;

  return (
    <div className="space-y-2">
      {pending.map((item) => (
        <div
          key={item.id}
          className={cn(
            "flex items-start gap-3 rounded-lg border bg-card p-2",
            item.isPrimary ? "border-primary" : "border-border",
          )}
        >
          <div className="relative h-16 w-40 shrink-0 overflow-hidden rounded-md bg-muted">
            <img
              src={item.previewUrl}
              alt=""
              className="pointer-events-none h-full w-full object-cover"
            />
            {item.isPrimary && (
              <Badge className="absolute left-1 top-1 h-4 px-1 text-[10px]">
                Primary
              </Badge>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <p className="truncate text-xs font-medium text-foreground">
              {item.file.name}
            </p>
            <Input
              value={item.altText}
              onChange={(e) => onAltTextChange(item.id, e.target.value)}
              placeholder="Alt text — describe the banner (cannot be changed after upload)"
              className="h-7 text-xs"
              disabled={disabled}
            />
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {!item.isPrimary && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={() => onSetPrimary(item.id)}
                disabled={disabled}
              >
                <AppIcon icon="solar:star-linear" className="mr-1 size-3" />
                Primary
              </Button>
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="h-7 px-2 text-xs text-destructive hover:text-destructive"
              onClick={() => onRemove(item.id)}
              disabled={disabled}
              aria-label={`Remove ${item.file.name} from the queue`}
            >
              <AppIcon icon="solar:close-circle-linear" className="size-3.5" />
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
