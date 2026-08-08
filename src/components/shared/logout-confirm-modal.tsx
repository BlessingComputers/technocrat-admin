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

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isPending: boolean;
}

export function LogoutConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  isPending,
}: LogoutConfirmModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[420px] rounded-2xl p-0 overflow-hidden border-none shadow-soft-lg">
        <div className="bg-destructive/5 p-6 pb-0">
          <div className="size-12 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
            <AppIcon icon="solar:danger-triangle-bold" className="size-6 text-destructive" />
          </div>
          <DialogHeader className="text-left">
            <DialogTitle className="text-xl font-bold">Confirm Logout</DialogTitle>
            <DialogDescription className="text-muted-foreground pt-1 text-sm leading-relaxed">
              Are you sure you want to log out? You will need to re-authenticate to access the management portal.
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
            Stay Logged In
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={isPending}
            className="flex-1 h-11 rounded-md font-semibold hover:bg-destructive/90 transition-all"
          >
            {isPending ? (
              <span className="flex items-center gap-2">
                <AppIcon icon="solar:logout-2-linear" className="size-4 animate-pulse" />
                Logging out...
              </span>
            ) : (
              <span className="flex items-center gap-2">
                <AppIcon icon="solar:logout-2-linear" className="size-4" />
                Yes, Log Out
              </span>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
