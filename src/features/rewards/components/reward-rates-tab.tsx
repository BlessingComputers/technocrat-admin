"use client";

import { useState } from "react";
import { toast } from "react-hot-toast";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getErrorMessage } from "@/lib/api/error-message";
import { usePermissions } from "@/lib/auth/use-permissions";

import { useRewardRate, useUpdateRewardRate } from "../api/rewards.queries";
import { parseWholeNaira, shortDate } from "../model/reward-rules";
import { rateFormSchema } from "../schemas/reward-forms";
import type { RewardRate } from "../types/rewards";
import { RewardsError, RewardsLoading } from "./rewards-states";

export function RewardRatesTab() {
  const { can } = usePermissions();
  const { data, isLoading, isError, refetch } = useRewardRate(can("rewards:manage"));

  if (isLoading) return <RewardsLoading />;
  if (isError || !data) {
    return <RewardsError title="Couldn't load the rates" onRetry={() => refetch()} />;
  }
  // Keyed so local edits reseed after a save changes `updatedAt`.
  return <RatesForm key={data.updatedAt} rate={data} />;
}

function RatesForm({ rate }: { rate: RewardRate }) {
  const update = useUpdateRewardRate();
  const [uploadRate, setUploadRate] = useState(String(rate.uploadRate));
  const [updateRate, setUpdateRate] = useState(String(rate.updateRate));
  const [error, setError] = useState<string | null>(null);

  const dirty =
    parseWholeNaira(uploadRate) !== rate.uploadRate ||
    parseWholeNaira(updateRate) !== rate.updateRate;

  const handleSave = () => {
    const parsed = rateFormSchema.safeParse({
      uploadRate: parseWholeNaira(uploadRate),
      updateRate: parseWholeNaira(updateRate),
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Check the rates.");
      return;
    }
    setError(null);
    const promise = update.mutateAsync(parsed.data);
    toast.promise(promise, {
      loading: "Saving rates…",
      success: "Rates saved.",
      error: (err) => getErrorMessage(err, "Couldn't save the rates."),
    });
  };

  return (
    <Card className="max-w-xl gap-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="reward-upload-rate">Per upload (₦)</Label>
          <Input
            id="reward-upload-rate"
            inputMode="numeric"
            value={uploadRate}
            onChange={(e) => setUploadRate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">A product or a part.</p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="reward-update-rate">Per update (₦)</Label>
          <Input
            id="reward-update-rate"
            inputMode="numeric"
            value={updateRate}
            onChange={(e) => setUpdateRate(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">An existing item, corrected.</p>
        </div>
      </div>
      <p className="text-sm text-muted-foreground">
        A new rate applies to the whole open month. Closed months keep the rate
        they closed with.
      </p>
      {error && <p className="text-xs font-medium text-destructive-ink">{error}</p>}
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs text-muted-foreground">Updated {shortDate(rate.updatedAt)}</p>
        <Button onClick={handleSave} disabled={!dirty || update.isPending} className="font-semibold">
          Save rates
        </Button>
      </div>
    </Card>
  );
}
