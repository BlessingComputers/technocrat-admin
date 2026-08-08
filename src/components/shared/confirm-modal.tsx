"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isPending?: boolean;
  variant?: "destructive" | "primary";
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  isPending = false,
  variant = "primary",
}: ConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[400px] rounded-2xl p-0 overflow-hidden border-none shadow-soft-lg">
        <div
          className={cn(
            "p-6 pb-0",
            variant === "destructive" ? "bg-destructive/5" : "bg-primary/5",
          )}
        >
          <div
            className={cn(
              "size-12 rounded-full flex items-center justify-center mb-4",
              variant === "destructive" ? "bg-destructive/10" : "bg-primary/10",
            )}
          >
            <AppIcon
              icon="solar:danger-triangle-bold"
              className={cn(
                "size-6",
                variant === "destructive" ? "text-destructive" : "text-primary",
              )}
            />
          </div>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold">{title}</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 text-sm leading-relaxed">
              {description}
            </DialogDescription>
          </DialogHeader>
        </div>

        <DialogFooter className="p-6 pt-8 bg-background flex flex-col-reverse sm:flex-row gap-3">
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isPending}
            className="flex-1 h-11 rounded-md font-medium hover:bg-muted"
          >
            {cancelText}
          </Button>
          <Button
            variant={variant === "destructive" ? "destructive" : "default"}
            onClick={onConfirm}
            disabled={isPending}
            className={cn(
              "flex-1 h-11 rounded-md font-semibold transition-all active:scale-[0.98]",
              variant === "destructive"
                ? "bg-destructive hover:bg-destructive/90"
                : "bg-primary hover:bg-primary/90",
            )}
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <AppIcon icon="solar:refresh-linear" className="size-4 animate-spin" />
                Processing...
              </span>
            ) : (
              confirmText
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
