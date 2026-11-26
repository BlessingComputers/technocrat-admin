"use client";

import PageContainer from "@/components/layouts/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils/format";
import { workSplitLabel } from "@/lib/utils/work-split";

import { useMyRewards } from "../api/rewards.queries";
import {
  closesOnLabel,
  formatAdjustment,
  formatRewardMonth,
  paidOnLabel,
  uploadsOf,
} from "../model/reward-rules";
import type { RewardRow } from "../types/rewards";
import { RewardsError, RewardsLoading } from "./rewards-states";

/**
 * `/rewards` (ask 20): the signed-in uploader's own rewards. No tabs; the
 * team view is `/rewards/team`.
 */
export function MyRewardsView() {
  return (
    <PageContainer>
      <PageHeader
        title="My rewards"
        description="Your cash reward for catalogue work. Each month closes on its own on the 1st, and payroll pays it."
      />
      <MyRewardsBody />
    </PageContainer>
  );
}

function MyRewardsBody() {
  const { data, isLoading, isError, refetch } = useMyRewards();

  if (isLoading) return <RewardsLoading />;
  if (isError || !data) {
    return <RewardsError title="Couldn't load your rewards" onRetry={() => refetch()} />;
  }

  return (
    <div className="space-y-4">
      <OpenMonthCard row={data.openMonth} />
      {data.statements.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No closed months yet. Your first month closes on{" "}
          {closesOnLabel(data.openMonth.month)}.
        </p>
      ) : (
        <Card className="divide-y gap-0 p-0">
          {data.statements.map((row) => (
            <ClosedMonthRow key={row.month} row={row} />
          ))}
        </Card>
      )}
    </div>
  );
}

function OpenMonthCard({ row }: { row: RewardRow }) {
  return (
    <Card className="gap-2 p-6">
      <p className="text-sm font-medium text-muted-foreground">
        {formatRewardMonth(row.month)}
      </p>
      <p className="text-3xl font-semibold tracking-tight text-foreground">
        {formatPrice(row.finalAmount)}
      </p>
      <p className="text-sm text-foreground/80">
        {workSplitLabel(uploadsOf(row), row.updates)}
      </p>
      <p className="text-xs text-muted-foreground">
        Month in progress, closes on {closesOnLabel(row.month)}
      </p>
    </Card>
  );
}

function ClosedMonthRow({ row }: { row: RewardRow }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-4 p-4">
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {formatRewardMonth(row.month)}
        </p>
        <p className="text-sm text-foreground/80">
          {workSplitLabel(uploadsOf(row), row.updates)}
        </p>
        <p className="text-xs text-muted-foreground">
          {formatPrice(row.uploadRate)} per upload, {formatPrice(row.updateRate)} per
          update. Computed {formatPrice(row.computedAmount)}.
        </p>
        {row.adjustment !== 0 && (
          <p className="text-xs text-muted-foreground">
            Adjustment {formatAdjustment(row.adjustment)}: {row.adjustmentReason}
          </p>
        )}
      </div>
      <div className="space-y-1 text-right">
        <p className="text-lg font-semibold text-foreground">
          {formatPrice(row.finalAmount)}
        </p>
        {row.paidAt ? (
          <Badge variant="success">{paidOnLabel(row.paidAt)}</Badge>
        ) : (
          <Badge variant="muted">Not paid yet</Badge>
        )}
      </div>
    </div>
  );
}
