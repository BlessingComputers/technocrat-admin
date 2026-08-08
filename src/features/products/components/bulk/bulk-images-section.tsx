"use client";

import { useRef, useState } from "react";
import { toast } from "react-hot-toast";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { convertToUploadableImage } from "@/lib/utils/convert-image";
import { newBulkImage, type BulkImage } from "./bulk-helpers";

const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100 MB — backend per-file limit
const MAX_IMAGES = 10; // per product — matches backend gallery limit

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

interface BulkImagesSectionProps {
  productName: string;
  images: BulkImage[];
  onChange: (images: BulkImage[]) => void;
}

/**
 * Gallery images for one bulk row. Files are held locally (object-URL
 * previews) and pre-uploaded at import time — see the two-step flow in
 * `bulk-upload-view`. Images already uploaded show a badge and are reused
 * on retry instead of re-uploading.
 */
export function BulkImagesSection({
  productName,
  images,
  onChange,
}: BulkImagesSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isConverting, setIsConverting] = useState(false);

  const addFiles = async (fileList: FileList | File[]) => {
    const accepted = Array.from(fileList).filter((file) => {
      if (!ACCEPTED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only JPEG, PNG, WebP, or AVIF`);
        return false;
      }
      if (file.size > MAX_FILE_SIZE) {
        toast.error(`${file.name}: exceeds 100 MB`);
        return false;
      }
      return true;
    });

    const room = MAX_IMAGES - images.length;
    if (accepted.length > room) {
      toast.error(`Maximum ${MAX_IMAGES} images per product`);
      accepted.splice(Math.max(room, 0));
    }
    if (accepted.length === 0) return;

    // AVIF can't be stored by the pipeline; re-encode (and downscale) to
    // WebP/PNG first. Renaming would leave AVIF bytes → corrupt file.
    const valid: File[] = [];
    setIsConverting(true);
    try {
      for (const file of accepted) {
        try {
          valid.push(await convertToUploadableImage(file));
        } catch {
          toast.error(`${file.name}: couldn't be read as an image`);
        }
      }
    } finally {
      setIsConverting(false);
    }
    if (valid.length === 0) return;

    const hasPrimary = images.some((img) => img.isPrimary);
    onChange([
      ...images,
      ...valid.map((file, i) =>
        newBulkImage(file, productName, {
          isPrimary: !hasPrimary && i === 0,
          sortOrder: images.length + i,
        }),
      ),
    ]);
  };

  const removeImage = (id: string) => {
    const removed = images.find((img) => img.id === id);
    if (removed?.file) URL.revokeObjectURL(removed.preview);
    const remaining = images
      .filter((img) => img.id !== id)
      .map((img, i) => ({ ...img, sortOrder: i }));
    if (removed?.isPrimary && remaining.length > 0) {
      remaining[0] = { ...remaining[0], isPrimary: true };
    }
    onChange(remaining);
  };

  const setPrimary = (id: string) =>
    onChange(images.map((img) => ({ ...img, isPrimary: img.id === id })));

  const setAltText = (id: string, altText: string) =>
    onChange(images.map((img) => (img.id === id ? { ...img, altText } : img)));

  return (
    <div className="space-y-2">
      {/* Drop zone */}
      <button
        type="button"
        onClick={() => fileInputRef.current?.click()}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files.length > 0) addFiles(e.dataTransfer.files);
        }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();
          setIsDragging(false);
        }}
        disabled={images.length >= MAX_IMAGES || isConverting}
        className={cn(
          "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed p-5 transition-colors",
          isDragging
            ? "border-primary bg-primary/5"
            : "border-border bg-card hover:border-primary/40 hover:bg-muted/30",
          (images.length >= MAX_IMAGES || isConverting) &&
            "pointer-events-none opacity-50",
        )}
      >
        <AppIcon
          icon={isConverting ? "solar:refresh-linear" : "solar:gallery-add-linear"}
          className={cn(
            "size-7",
            isConverting && "animate-spin text-primary",
            !isConverting &&
              (isDragging ? "text-primary" : "text-muted-foreground/50"),
          )}
        />
        <p className="text-xs font-medium text-foreground">
          {isConverting
            ? "Preparing images…"
            : isDragging
              ? "Drop images here"
              : "Click to browse or drag & drop"}
        </p>
        <p className="text-xs text-muted-foreground">
          JPEG, PNG, WebP, or AVIF · up to {MAX_IMAGES} images · sent when you
          upload the products
        </p>
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/avif"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files) addFiles(e.target.files);
          e.target.value = "";
        }}
      />

      {/* Attached images */}
      {images.map((img) => (
        <div
          key={img.id}
          className={cn(
            "flex items-start gap-3 rounded-xl border bg-card p-2.5",
            img.isPrimary ? "border-primary/40" : "border-border",
          )}
        >
          <div className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-muted">
            {/* Previews can be blob: URLs, which next/image can't optimize. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={img.uploaded?.url || img.preview}
              alt={img.altText || img.file?.name || "Product image"}
              className="size-full object-cover"
            />
          </div>

          <div className="min-w-0 flex-1 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-xs font-medium text-foreground">
                {img.file?.name ?? img.key}
              </p>
              <div className="flex shrink-0 items-center gap-1.5">
                {img.isPrimary && <Badge variant="warning">Primary</Badge>}
                {img.uploaded && <Badge variant="success">Uploaded</Badge>}
                {img.file && (
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {formatFileSize(img.file.size)}
                  </span>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Input
                value={img.altText}
                onChange={(e) => setAltText(img.id, e.target.value)}
                placeholder="Alt text (optional)"
                className="h-8 bg-card text-xs"
              />
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-primary"
                title="Set as primary"
                onClick={() => setPrimary(img.id)}
                disabled={img.isPrimary}
              >
                <AppIcon
                  icon={img.isPrimary ? "solar:star-bold" : "solar:star-linear"}
                  className="size-4"
                />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="size-7 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                title="Remove image"
                onClick={() => removeImage(img.id)}
              >
                <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
