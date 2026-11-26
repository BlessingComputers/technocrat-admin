"use client";

import { useState } from "react";

import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { usePermissions } from "@/lib/auth/use-permissions";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

import { useRewardMonth, useRewardMonths } from "../api/rewards.queries";
import {
  closesOnLabel,
  formatRewardMonth,
  monthTotal,
  shortDate,
} from "../model/reward-rules";
import type { RewardRow } from "../types/rewards";
import { AdjustRewardDialog } from "./adjust-reward-dialog";
import { MarkPaidDialog } from "./mark-paid-dialog";
import { RewardStatementsTable } from "./reward-statements-table";
import { RewardsError, RewardsLoading } from "./rewards-states";

export function UploadersTab() {
  const { can, canAnyInGroup } = usePermissions();
  const allowed = canAnyInGroup(["rewards"]);
  // undefined = the open month (the backend default).
  const [month, setMonth] = useState<string | undefined>(undefined);
  const [adjusting, setAdjusting] = useState<RewardRow | null>(null);
  const [paying, setPaying] = useState<RewardRow | null>(null);

  const months = useRewardMonths(allowed);
  const view = useRewardMonth(month, allowed);

  if (view.isLoading) return <RewardsLoading />;
  if (view.isError || !view.data) {
    return <RewardsError title="Couldn't load this month" onRetry={() => view.refetch()} />;
  }

  const { data } = view;
  const label = formatRewardMonth(data.month);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">
            {data.closedAt
              ? `Closed on ${shortDate(data.closedAt)}.`
              : `Month in progress. Figures are live and close on ${closesOnLabel(data.month)}.`}
          </p>
        </div>
        {/* The picked month, even while the old month's rows are still shown. */}
        <Select value={month ?? data.month} onValueChange={setMonth}>
          <SelectTrigger className="w-52" aria-label="Month">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(months.data ?? [{ month: data.month, closedAt: data.closedAt }]).map((m) => (
              <SelectItem key={m.month} value={m.month}>
                {formatRewardMonth(m.month)}
                {m.closedAt ? "" : " (open)"}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div
        aria-busy={view.isPlaceholderData}
        className={cn(
          "space-y-4 transition-opacity",
          view.isPlaceholderData && "pointer-events-none opacity-60",
        )}
      >
        {data.statements.length === 0 ? (
          <Card className="py-10 text-center text-sm text-muted-foreground">
            No counted uploads or updates in {label}.
          </Card>
        ) : (
          <>
            <Card className="gap-0 p-0">
              <RewardStatementsTable
                rows={data.statements}
                canAdjust={can("rewards:manage")}
                canPay={can("rewards:pay")}
                onAdjust={setAdjusting}
                onPay={setPaying}
              />
              <p className="border-t px-4 py-3 text-right text-sm font-semibold text-foreground">
                Total for {label}: {formatPrice(monthTotal(data.statements))}
              </p>
            </Card>
          </>
        )}
      </div>
      <AdjustRewardDialog row={adjusting} onClose={() => setAdjusting(null)} />
      <MarkPaidDialog row={paying} onClose={() => setPaying(null)} />
    </div>
  );
}
