"use client";

import { useState } from "react";
import Link from "next/link";

import PageContainer from "@/components/layouts/page-container";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePermissions } from "@/lib/auth/use-permissions";

import { useStaffRewardHistory } from "../api/rewards.queries";
import { staffName } from "../model/reward-rules";
import type { RewardRow } from "../types/rewards";
import { AdjustRewardDialog } from "./adjust-reward-dialog";
import { MarkPaidDialog } from "./mark-paid-dialog";
import { RewardStatementsTable } from "./reward-statements-table";
import { RewardsError, RewardsLoading, RewardsNoAccess } from "./rewards-states";

/**
 * `/rewards/team/<staffId>` (ask 20): every month for one uploader, with
 * Adjust and Mark paid. Same gate as the team page; the backend 403 is the
 * real boundary.
 */
export function StaffRewardsView({ staffId }: { staffId: string }) {
  const { can, canAnyInGroup, isLoading } = usePermissions();
  const allowed = canAnyInGroup(["rewards"]);
  const history = useStaffRewardHistory(staffId, allowed);
  const [adjusting, setAdjusting] = useState<RewardRow | null>(null);
  const [paying, setPaying] = useState<RewardRow | null>(null);

  const name = history.rows[0] ? staffName(history.rows[0]) : "Uploader";

  return (
    <PageContainer>
      <PageHeader
        title={`${name}'s rewards`}
        description="Every month for this uploader. Adjust or mark a month paid after it closes."
      >
        <Button asChild variant="outline" size="sm" className="font-medium">
          <Link href={`/uploads/${encodeURIComponent(staffId)}`}>
            <AppIcon icon="solar:upload-square-linear" className="mr-1.5 size-4" />
            View uploads
          </Link>
        </Button>
        <Button asChild variant="ghost" size="sm" className="font-medium">
          <Link href="/rewards/team">
            <AppIcon icon="solar:arrow-left-linear" className="mr-1.5 size-4" />
            Back
          </Link>
        </Button>
      </PageHeader>
      {isLoading || history.isLoading ? (
        <RewardsLoading />
      ) : !allowed ? (
        <RewardsNoAccess />
      ) : history.isError ? (
        <RewardsError title="Couldn't load this uploader's rewards" onRetry={history.refetch} />
      ) : history.rows.length === 0 ? (
        <Card className="py-10 text-center text-sm text-muted-foreground">
          No counted uploads or updates yet.
        </Card>
      ) : (
        <Card className="gap-0 p-0">
          <RewardStatementsTable
            by="month"
            rows={history.rows}
            canAdjust={can("rewards:manage")}
            canPay={can("rewards:pay")}
            onAdjust={setAdjusting}
            onPay={setPaying}
          />
        </Card>
      )}
      <AdjustRewardDialog row={adjusting} onClose={() => setAdjusting(null)} />
      <MarkPaidDialog row={paying} onClose={() => setPaying(null)} />
    </PageContainer>
  );
}
