"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import { MetaLabel } from "@/components/shared/meta-label";
import {
  EMPTY_BANK_ACCOUNT_FORM,
  type BankAccountFormData,
} from "../../schemas/bank-account-form";

interface BankAccountFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-fill values when editing; pass `null` for create mode. */
  initialData: BankAccountFormData | null;
  /** Called on submit with the current form values. */
  onSubmit: (data: BankAccountFormData) => void;
  isSubmitting: boolean;
}

/**
 * Add / edit dialog for a company bank account. Owns its own draft state so
 * it can be reset when reopened for a different account.
 */
export function BankAccountFormDialog({
  isOpen,
  onOpenChange,
  initialData,
  onSubmit,
  isSubmitting,
}: BankAccountFormDialogProps) {
  // Draft is seeded once at mount. The parent remounts this dialog (via a
  // changing `key`) each time it's opened, so the draft starts fresh without a
  // reset-in-effect.
  const [formData, setFormData] = useState<BankAccountFormData>(
    initialData ?? EMPTY_BANK_ACCOUNT_FORM,
  );

  const isEditing = !!initialData;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  const updateField = <K extends keyof BankAccountFormData>(
    key: K,
    value: BankAccountFormData[K],
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-lg p-0 border-none overflow-hidden">
        <BankAccountFormDialogHeader isEditing={isEditing} />

        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 gap-6">
            <FormFieldText
              label="Bank Name"
              placeholder="e.g. Guaranty Trust Bank"
              value={formData.bankName}
              onChange={(v) => updateField("bankName", v)}
              required
            />

            <FormFieldText
              label="Account Name"
              placeholder="e.g. Acme Electronics Ltd"
              value={formData.accountName}
              onChange={(v) => updateField("accountName", v)}
              required
            />

            <div className="grid grid-cols-2 gap-4">
              <FormFieldText
                label="Account Number"
                placeholder="0123456789"
                value={formData.accountNumber}
                onChange={(v) => updateField("accountNumber", v)}
                required
                inputClassName="font-semibold tracking-widest"
              />
              <FormFieldText
                label="Bank Code"
                placeholder="058"
                value={formData.bankCode}
                onChange={(v) => updateField("bankCode", v)}
                required
              />
            </div>

            <FormFieldText
              label="Description (Internal)"
              placeholder="e.g. Primary NGN collection account"
              value={formData.description}
              onChange={(v) => updateField("description", v)}
              inputClassName="font-medium"
            />

            <div className="flex gap-4 items-center pt-2">
              <PrimaryToggle
                isPrimary={formData.isPrimary}
                onToggle={() => updateField("isPrimary", !formData.isPrimary)}
              />
              <ActiveToggle
                isActive={formData.isActive}
                onToggle={() => updateField("isActive", !formData.isActive)}
              />
            </div>
          </div>

          <BankAccountFormDialogActions
            isEditing={isEditing}
            isSubmitting={isSubmitting}
            onCancel={() => onOpenChange(false)}
          />
        </form>
      </DialogContent>
    </Dialog>
  );
}

function BankAccountFormDialogHeader({ isEditing }: { isEditing: boolean }) {
  return (
    <div className="bg-primary p-8 text-primary-foreground relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16" />
      <DialogTitle className="text-2xl font-semibold tracking-tight relative z-10">
        {isEditing ? "Edit Account" : "Add Account"}
      </DialogTitle>
      <MetaLabel tone="pinned" className="block mt-1 relative z-10">
        Configure payment details
      </MetaLabel>
    </div>
  );
}

function FormFieldText({
  label,
  placeholder,
  value,
  onChange,
  required,
  inputClassName,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  required?: boolean;
  inputClassName?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="text-xs font-medium text-muted-foreground ml-1">
        {label}
      </Label>
      <Input
        required={required}
        placeholder={placeholder}
        className={cn(
          "rounded-lg bg-muted/50 border-border h-12 focus:bg-card transition-all font-semibold",
          inputClassName,
        )}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function PrimaryToggle({
  isPrimary,
  onToggle,
}: {
  isPrimary: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all font-medium text-xs",
        isPrimary
          ? "bg-primary/5 border-primary text-primary-ink"
          : "bg-card border-border text-muted-foreground",
      )}
    >
      <AppIcon
        icon={isPrimary ? "solar:star-bold" : "solar:star-linear"}
        className="w-4 h-4"
      />
      Primary
    </button>
  );
}

function ActiveToggle({
  isActive,
  onToggle,
}: {
  isActive: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className={cn(
        "flex-1 flex items-center justify-center gap-2 p-4 rounded-lg border-2 transition-all font-medium text-xs",
        isActive
          ? "bg-success/10 border-success text-success-ink"
          : "bg-destructive/10 border-destructive text-destructive-ink",
      )}
    >
      <AppIcon icon="solar:power-linear" className="w-4 h-4" />
      {isActive ? "Active" : "Inactive"}
    </button>
  );
}

function BankAccountFormDialogActions({
  isEditing,
  isSubmitting,
  onCancel,
}: {
  isEditing: boolean;
  isSubmitting: boolean;
  onCancel: () => void;
}) {
  return (
    <div className="flex gap-3 pt-4">
      <Button
        type="button"
        variant="ghost"
        onClick={onCancel}
        className="flex-1 rounded-lg font-medium text-muted-foreground h-12"
      >
        Cancel
      </Button>
      <Button
        type="submit"
        disabled={isSubmitting}
        className="flex-2 rounded-lg bg-primary text-primary-foreground font-medium h-12"
      >
        {isSubmitting ? "Saving..." : isEditing ? "Update Account" : "Add Account"}
      </Button>
    </div>
  );
}
