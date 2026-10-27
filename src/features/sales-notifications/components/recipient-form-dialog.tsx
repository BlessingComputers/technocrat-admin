"use client";

import { useState } from "react";

import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { MetaLabel } from "@/components/shared/meta-label";
import { cn } from "@/lib/utils/cn";

import { recipientFormSchema } from "../schemas/recipient-form";
import type { SalesNotificationEmail } from "../types/sales-notifications";

/** Normalised values the dialog emits. `label` is dropped when left blank. */
export interface RecipientFormSubmit {
  email: string;
  label?: string;
  isActive: boolean;
}

interface RecipientFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Recipient being edited, or null when adding. */
  initial: SalesNotificationEmail | null;
  onSubmit: (values: RecipientFormSubmit) => void;
  isSubmitting: boolean;
  /**
   * The email address the last submit was rejected for as a duplicate (409).
   * Kept in the parent because only the parent sees the failed mutation; shown
   * here as an inline field error, and dismissed as soon as the user edits the
   * field — otherwise a stale conflict would sit under a corrected address.
   */
  duplicateEmail?: string | null;
}

/**
 * Add / edit one sales-notification recipient.
 *
 * State is seeded from `initial` on mount and the parent remounts this dialog
 * via a changing `key` on every open, so add resets and edit prefills without a
 * setState-in-effect sync (the codebase's form-dialog reset pattern).
 */
export function RecipientFormDialog({
  isOpen,
  onOpenChange,
  initial,
  onSubmit,
  isSubmitting,
  duplicateEmail = null,
}: RecipientFormDialogProps) {
  const isEditing = !!initial;

  const [email, setEmail] = useState(initial?.email ?? "");
  const [label, setLabel] = useState(initial?.label ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);
  const [error, setError] = useState<string | null>(null);

  // The conflict only applies to the address it was raised for. Once the field
  // is edited to anything else, it stops being the truth about this input.
  const showDuplicate =
    !!duplicateEmail &&
    email.trim().toLowerCase() === duplicateEmail.trim().toLowerCase();

  const emailError = showDuplicate
    ? `${duplicateEmail} is already on the list. Edit that entry instead — a duplicate can’t be added twice.`
    : null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const parsed = recipientFormSchema.safeParse({
      email,
      label: label.trim() || undefined,
      isActive,
    });

    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Please check your input.");
      return;
    }
    setError(null);
    onSubmit(parsed.data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-0 border-none">
        <div className="bg-primary rounded-t-lg p-6 text-primary-foreground">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditing ? "Edit Recipient" : "Add Recipient"}
          </DialogTitle>
          <MetaLabel tone="pinned" className="block mt-1">
            Sales notification emails
          </MetaLabel>
        </div>

        <form onSubmit={handleSubmit} className="min-w-0 p-6 space-y-5">
          <Field label="Email address" htmlFor="recipient-email">
            <Input
              id="recipient-email"
              type="email"
              inputMode="email"
              autoComplete="off"
              placeholder="name@blessingcomputers.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              maxLength={255}
              aria-invalid={!!emailError}
              aria-describedby={emailError ? "recipient-email-error" : undefined}
              className={cn(
                emailError &&
                  "border-destructive focus-visible:ring-destructive/30",
              )}
              autoFocus
              required
            />
            {emailError && (
              <p
                id="recipient-email-error"
                role="alert"
                className="mt-1 text-xs font-semibold text-destructive-ink"
              >
                {emailError}
              </p>
            )}
          </Field>

          <Field label="Label (optional)" htmlFor="recipient-label">
            <Input
              id="recipient-label"
              placeholder="e.g. Accounts, Warehouse"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              maxLength={100}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              A note for your team about whose inbox this is. It never appears
              in the email itself.
            </p>
          </Field>

          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/10">
            <div>
              <p className="text-sm font-semibold text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Paused recipients keep their place on the list but stop
                receiving sale emails
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

          {error && (
            <p
              className="text-xs font-semibold text-destructive-ink"
              role="alert"
            >
              {error}
            </p>
          )}

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="flex-1 rounded-lg font-medium text-muted-foreground h-11"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="flex-[2] rounded-lg bg-primary text-primary-foreground font-medium h-11"
            >
              {isSubmitting
                ? "Saving…"
                : isEditing
                  ? "Update Recipient"
                  : "Add Recipient"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label
        htmlFor={htmlFor}
        className="ml-1 text-xs font-medium text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  );
}
