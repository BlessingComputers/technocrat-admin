"use client";

import { AppIcon } from "@/components/shared/app-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

interface ImageLightboxProps {
  src: string;
  alt?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Full-screen photo viewer (WhatsApp-style): a near-black backdrop with the
 * image centered and contained. Tap the backdrop or the close button to dismiss;
 * the image itself swallows the click so tapping it doesn't close.
 */
export function ImageLightbox({
  src,
  alt = "",
  open,
  onOpenChange,
}: ImageLightboxProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        onClick={() => onOpenChange(false)}
        className="flex h-[100dvh] max-h-[100dvh] w-screen max-w-none items-center justify-center rounded-none border-0 bg-black/90 p-0 shadow-none sm:max-w-none"
      >
        <DialogTitle className="sr-only">Photo</DialogTitle>
        <DialogDescription className="sr-only">
          Full-size photo preview
        </DialogDescription>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenChange(false);
          }}
          aria-label="Close photo"
          className="absolute top-4 right-4 rounded-full bg-white/10 p-2 text-white transition-colors hover:bg-white/20"
        >
          <AppIcon icon="solar:close-circle-linear" className="size-6" />
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          onClick={(e) => e.stopPropagation()}
          className="max-h-[88vh] max-w-[92vw] object-contain duration-300 animate-in zoom-in-95"
        />
      </DialogContent>
    </Dialog>
  );
}
