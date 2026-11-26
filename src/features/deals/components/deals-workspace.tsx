"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

import { AppIcon } from "@/components/shared/app-icon";
import { ListDetailLayout } from "@/components/shared/list-detail-layout";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";
import { usePermissions } from "@/lib/auth/use-permissions";

import { dealKeys, useDeals, useEndedDeals } from "../api/deals.queries";
import { groupDeals } from "../utils/deal-groups";
import { DealDetailView } from "./deal-detail-view";
import { DealList } from "./deal-list";
import { DealOverview } from "./deal-overview";

/**
 * `/pricing/deals`: grouped list left, detail right (spec 2026-11-13). The
 * selection is `?deal=<id>`. Running, coming-up and draft deals load whole
 * (`limit: 100`, the backend cap); ended deals page 20 at a time.
 */
export function DealsWorkspace() {
  const selectedId = useSearchParams().get("deal");
  const { can } = usePermissions();
  const canWrite = can("discounts:write") || can("priceMarkup:write");
  const queryClient = useQueryClient();
  // Read once per mount, like the markup page: refresh to move the clock.
  const [now] = useState(() => Date.now());
  const [showEnded, setShowEnded] = useState(false);

  const active = useDeals({ status: "ACTIVE", limit: 100 });
  const scheduled = useDeals({ status: "SCHEDULED", limit: 100 });
  const drafts = useDeals({ status: "DRAFT", limit: 100 });
  const ended = useEndedDeals();
  const fetching = useIsFetching({ queryKey: dealKeys.all }) > 0;

  const groups = groupDeals([
    ...(active.data?.data ?? []),
    ...(scheduled.data?.data ?? []),
    ...(drafts.data?.data ?? []),
  ]);
  const others = [...groups.running, ...groups.comingUp];

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Deals"
        description="Named sales over any mix of products and parts. Standing markups live under Markup."
      >
        <RefreshButton
          onRefresh={() => queryClient.invalidateQueries({ queryKey: dealKeys.all })}
          isRefreshing={fetching}
        />
        {canWrite && (
          <Button asChild className="h-10 rounded-lg px-5 font-semibold">
            <Link href="/pricing/deals/new">
              <AppIcon icon="solar:add-circle-linear" className="mr-2 size-5" />
              New deal
            </Link>
          </Button>
        )}
      </PageHeader>

      <ListDetailLayout
        hasSelection={!!selectedId}
        backHref="/pricing/deals"
        backLabel="All deals"
        list={
          <DealList
            groups={groups}
            ended={{
              deals: ended.data?.pages.flatMap((p) => p.data) ?? [],
              total: ended.data?.pages[0]?.meta.total ?? null,
              hasMore: !!ended.hasNextPage,
              isFetchingMore: ended.isFetchingNextPage,
              onMore: () => ended.fetchNextPage(),
            }}
            selectedId={selectedId}
            now={now}
            isLoading={active.isLoading || scheduled.isLoading || drafts.isLoading}
            isError={active.isError || scheduled.isError || drafts.isError}
            onRetry={() => queryClient.invalidateQueries({ queryKey: dealKeys.lists() })}
            showEnded={showEnded}
            onShowEnded={() => setShowEnded(true)}
          />
        }
        detail={
          selectedId ? (
            <DealDetailView key={selectedId} dealId={selectedId} others={others} now={now} />
          ) : (
            <DealOverview running={groups.running} comingUp={groups.comingUp} now={now} canWrite={canWrite} />
          )
        }
      />
    </div>
  );
}
