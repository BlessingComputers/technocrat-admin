"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { slugify } from "../../schemas/product-form";

export interface CategoryFormValues {
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  isActive: boolean;
}

interface CategoryFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Heading noun, e.g. "Category" or "Subcategory". */
  kind: string;
  initial:
    | { name: string; description?: string; imageUrl?: string; isActive: boolean }
    | null;
  onSubmit: (data: CategoryFormValues) => void;
  isSubmitting: boolean;
}

export function CategoryFormDialog({
  isOpen,
  onOpenChange,
  kind,
  initial,
  onSubmit,
  isSubmitting,
}: CategoryFormDialogProps) {
  const isEditing = !!initial;
  const [name, setName] = useState(initial?.name ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [imageUrl, setImageUrl] = useState(initial?.imageUrl ?? "");
  const [isActive, setIsActive] = useState(initial?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSubmit({
      name: name.trim(),
      slug: slugify(name),
      description: description || undefined,
      imageUrl: imageUrl.trim() || undefined,
      isActive,
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-0 border-none overflow-hidden">
        <div className="bg-primary p-6 text-primary-foreground">
          <DialogTitle className="text-xl font-semibold tracking-tight">
            {isEditing ? `Edit ${kind}` : `Add ${kind}`}
          </DialogTitle>
          <p className="text-primary-foreground/70 text-xs font-medium uppercase tracking-wide mt-1">
            Catalog organization
          </p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">
              {kind} Name
            </Label>
            <Input
              autoFocus
              placeholder={`e.g. ${kind === "Subcategory" ? "Gaming Laptops" : "Laptops"}`}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">
              Description (optional)
            </Label>
            <Input
              placeholder="Short description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground ml-1">
              Image URL (optional)
            </Label>
            <Input
              placeholder="https://…"
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
            />
          </div>

          <div className="flex items-center justify-between rounded-lg border border-border p-3 bg-muted/10">
            <div>
              <p className="text-sm font-semibold text-foreground">Active</p>
              <p className="text-xs text-muted-foreground">
                Shown to customers
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
              {isSubmitting ? "Saving…" : isEditing ? `Update ${kind}` : `Add ${kind}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
