"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";
import { AppIcon } from "@/components/shared/app-icon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { ChatAvatar } from "./chat-avatar";
import { ImageLightbox } from "./image-lightbox";

interface CustomerProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  name: string;
  /** Stable seed for the avatar tint (the conversation id). */
  seed: string;
  avatarUrl?: string | null;
  email?: string | null;
  phone?: string | null;
  /** Small line under the name — e.g. the conversation status. */
  subtitle?: string | null;
}

/**
 * WhatsApp-style contact info: a large avatar over the customer's name and
 * contact rows. Tapping the avatar (when there's a real photo) expands it into
 * the full-screen `ImageLightbox`, mirroring WhatsApp's photo view.
 */
export function CustomerProfileDialog({
  open,
  onOpenChange,
  name,
  seed,
  avatarUrl,
  email,
  phone,
  subtitle,
}: CustomerProfileDialogProps) {
  const [photoOpen, setPhotoOpen] = useState(false);
  const hasPhoto = Boolean(avatarUrl);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm gap-0 overflow-hidden p-0">
          <DialogTitle className="sr-only">{name} details</DialogTitle>
          <DialogDescription className="sr-only">
            Customer contact information
          </DialogDescription>

          <div className="flex flex-col items-center gap-3 bg-muted/40 px-6 pt-8 pb-6">
            <button
              type="button"
              disabled={!hasPhoto}
              onClick={() => setPhotoOpen(true)}
              aria-label={hasPhoto ? "View photo" : undefined}
              className={cn(
                "rounded-full outline-none",
                hasPhoto &&
                  "cursor-zoom-in transition-transform hover:scale-105 focus-visible:ring-2 focus-visible:ring-ring",
              )}
            >
              <ChatAvatar name={name} seed={seed} avatarUrl={avatarUrl} size="xl" />
            </button>
            <div className="text-center">
              <p className="text-lg font-semibold text-foreground">{name}</p>
              {subtitle ? (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              ) : null}
            </div>
          </div>

          <div className="divide-y divide-border">
            {email ? (
              <ProfileRow
                icon="solar:letter-linear"
                label="Email"
                value={email}
                href={`mailto:${email}`}
              />
            ) : null}
            {phone ? (
              <ProfileRow
                icon="solar:phone-linear"
                label="Phone"
                value={phone}
                href={`tel:${phone}`}
              />
            ) : null}
            {!email && !phone ? (
              <p className="px-6 py-5 text-sm text-muted-foreground">
                No contact details on file.
              </p>
            ) : null}
          </div>
        </DialogContent>
      </Dialog>

      {hasPhoto ? (
        <ImageLightbox
          src={avatarUrl as string}
          alt={name}
          open={photoOpen}
          onOpenChange={setPhotoOpen}
        />
      ) : null}
    </>
  );
}

function ProfileRow({
  icon,
  label,
  value,
  href,
}: {
  icon: string;
  label: string;
  value: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="flex items-center gap-3 px-6 py-4 transition-colors hover:bg-muted/40"
    >
      <AppIcon icon={icon} className="size-5 shrink-0 text-primary-ink" />
      <div className="min-w-0">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="truncate text-sm font-medium text-foreground">{value}</p>
      </div>
    </a>
  );
}
