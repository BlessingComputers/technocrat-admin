"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";

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
import { getErrorMessage } from "@/lib/api/error-message";

import { useDeleteHuntCampaign } from "../api/hunts.queries";
import type { HuntCampaign } from "../types/hunts";

/**
 * Delete a campaign, confirmed by typing its name. A deleted campaign loses its
 * whole schedule and its announced items, and nothing brings them back.
 */
export function HuntDeleteDialog({
  campaign,
  open,
  onOpenChange,
}: {
  campaign: HuntCampaign;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const { mutate: deleteCampaign, isPending } = useDeleteHuntCampaign();
  const [typed, setTyped] = useState("");

  const confirm = () =>
    deleteCampaign(campaign.id, {
      onSuccess: () => {
        toast.success("Campaign deleted.");
        router.push("/pricing/hunts");
      },
      onError: (err) =>
        toast.error(getErrorMessage(err, "Couldn’t delete this campaign.")),
    });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setTyped("");
        onOpenChange(next);
      }}
    >
      <DialogContent className="sm:max-w-[440px]">
        <DialogHeader>
          <DialogTitle>Delete this campaign?</DialogTitle>
          <DialogDescription>
            Its schedule and its announced items are lost, and you can’t undo
            this. Type the campaign name to confirm.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="hunt-delete-name" className="text-xs font-semibold">
            {campaign.name}
          </Label>
          <Input
            id="hunt-delete-name"
            value={typed}
            autoComplete="off"
            onChange={(e) => setTyped(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            disabled={isPending}
          >
            Keep it
          </Button>
          <Button
            variant="destructive"
            onClick={confirm}
            disabled={typed.trim() !== campaign.name.trim() || isPending}
          >
            {isPending ? "Deleting…" : "Delete campaign"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
