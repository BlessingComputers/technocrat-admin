"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { slugify } from "../../schemas/product-form";
import type { BrandInput, ProductBrand } from "../../types/products";
import { MetaLabel } from "@/components/shared/meta-label";

interface BrandFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  initial: ProductBrand | null;
  onSubmit: (data: BrandInput) => void;
  isSubmitting: boolean;
}

export function BrandFormDialog({
  isOpen,
  onOpenChange,
  initial,
  onSubmit,
  isSubmitting,
}: BrandFormDialogProps) {
  const isEditing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [logoUrl, setLogoUrl] = useState(initial?.logoUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(initial?.websiteUrl ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      slug: slugify(name),
      description: description || undefined,
      logoUrl: logoUrl || undefined,
      websiteUrl: websiteUrl || undefined,
      isActive,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-0 border-none overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditing ? "Edit Brand" : "Add Brand"}
          </DialogTitle>
          <MetaLabel tone="pinned" className="block mt-1">
            Product manufacturer
          </MetaLabel>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <Field label="Brand Name">
            <Input
              autoFocus
              placeholder="e.g. Apple, Dell, Lenovo"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </Field>
          <Field label="Description (optional)">
            <Input
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </Field>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field label="Logo URL (optional)">
              <Input
                placeholder="https://…"
                value={logoUrl}
                onChange={(e) => setLogoUrl(e.target.value)}
              />
            </Field>
            <Field label="Website (optional)">
              <Input
                placeholder="https://…"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
              />
            </Field>
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/10">
            <div>
              <p className="text-sm font-semibold text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Visible as a product filter
              </p>
            </div>
            <Switch checked={isActive} onCheckedChange={setIsActive} />
          </div>

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
              disabled={isSubmitting || !name.trim()}
              className="flex-2 rounded-lg bg-primary text-primary-foreground font-semibold h-11"
            >
              {isSubmitting ? "Saving…" : isEditing ? "Update Brand" : "Add Brand"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold text-muted-foreground ml-1">
        {label}
      </Label>
      {children}
    </div>
  );
}
