"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "react-hot-toast";
import { AppIcon } from "@/components/shared/app-icon";
import { publicEnv } from "@/config/env";

/**
 * Recovery UI for the backend's IP-block security (suspected brute-force, etc.).
 * The fetch client dispatches `api:ip-blocked` on a `code: IP_BLOCKED` response
 * (see `lib/api/client.ts`); this listens for it, shows a floating button, and
 * POSTs an admin-provided secret to the unblock endpoint.
 *
 * The endpoint URL comes from env (ADR-0009 — no hardcoded internal URLs); set
 * `NEXT_PUBLIC_EMERGENCY_UNBLOCK_URL` in `.env.local` / Vercel.
 */
const UNBLOCK_URL = publicEnv.emergencyUnblockUrl;

export function EmergencyUnblock() {
  const [showButton, setShowButton] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [secret, setSecret] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const handleIpBlocked = () => {
      setShowButton(true);
      toast.error("Access Denied: Your IP has been blocked.", {
        id: "ip-blocked-toast",
        duration: 6000,
      });
    };

    window.addEventListener("api:ip-blocked", handleIpBlocked);
    return () => window.removeEventListener("api:ip-blocked", handleIpBlocked);
  }, []);

  const handleUnblock = async () => {
    if (!secret.trim()) {
      toast.error("Please enter the unblock secret");
      return;
    }
    if (!UNBLOCK_URL) {
      toast.error("Unblock endpoint is not configured.");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch(UNBLOCK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const data: { message?: string } = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.message || "Failed to unblock IP.");
      }
      toast.success("IP successfully unblocked. You can now refresh the page.");
      setIsOpen(false);
      setShowButton(false);
      setSecret("");
    } catch (error) {
      toast.error(
        error instanceof Error
          ? error.message
          : "Failed to unblock IP. Please check the secret.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!showButton) return null;

  return (
    <>
      <div className="fixed bottom-6 right-6 z-[60] animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Button
          variant="destructive"
          size="lg"
          className="rounded-md gap-2 font-bold ring-4 ring-destructive/20 h-12 px-6"
          onClick={() => setIsOpen(true)}
        >
          <AppIcon icon="solar:shield-warning-bold" className="size-5" />
          IP Blocked? Unblock Now
        </Button>
      </div>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AppIcon icon="solar:shield-warning-bold" className="size-5" />
              Emergency IP Unblock
            </DialogTitle>
            <DialogDescription>
              Your IP has been flagged by our security system. Enter the
              emergency secret provided by your administrator to restore access.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="secret">Emergency Secret</Label>
              <Input
                id="secret"
                type="password"
                placeholder="Enter secret code..."
                value={secret}
                onChange={(e) => setSecret(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleUnblock()}
                disabled={isSubmitting}
                autoFocus
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleUnblock}
              disabled={isSubmitting || !secret.trim()}
              className="gap-2"
            >
              {isSubmitting ? (
                "Unblocking..."
              ) : (
                <>
                  <AppIcon
                    icon="solar:lock-keyhole-unlocked-bold"
                    className="size-4"
                  />
                  Restore Access
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
