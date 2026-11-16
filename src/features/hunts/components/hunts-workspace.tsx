"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";

import { AppIcon } from "@/components/shared/app-icon";
import { ListDetailLayout } from "@/components/shared/list-detail-layout";
import { PageHeader } from "@/components/shared/page-header";
import { RefreshButton } from "@/components/shared/refresh-button";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { usePermissions } from "@/lib/auth/use-permissions";

import { huntKeys, useHuntCampaigns } from "../api/hunts.queries";
import { useNow } from "../hooks/use-now";
import { defaultCampaign, groupCampaigns } from "../utils/hunt-groups";
import { HuntDetailView } from "./hunt-detail-view";
import { HuntList } from "./hunt-list";

/**
 * `/pricing/hunts`: grouped list left, the campaign right (spec 2026-11-13).
 * The selection is `?campaign=<id>`. From `lg`, an empty URL opens the live
 * campaign, else the next scheduled one. On a phone the list shows first.
 */
export function HuntsWorkspace() {
  const router = useRouter();
  const selectedId = useSearchParams().get("campaign");
  const { can } = usePermissions();
  const queryClient = useQueryClient();
  const now = useNow(60_000);
  const { data: campaigns = [], isLoading, isError } = useHuntCampaigns();
  const fetching = useIsFetching({ queryKey: huntKeys.all }) > 0;
  const groups = groupCampaigns(campaigns);
  const fallbackId = selectedId ? undefined : defaultCampaign(campaigns, now)?.id;

  useEffect(() => {
    if (!fallbackId || !window.matchMedia("(min-width: 1024px)").matches) return;
    router.replace(`/pricing/hunts?campaign=${encodeURIComponent(fallbackId)}`, { scroll: false });
  }, [fallbackId, router]);

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6">
      <PageHeader
        title="Treasure hunts"
        description="Secret five-minute drops inside a public window. Each drop sells one unit of one product."
      >
        <RefreshButton
          onRefresh={() => queryClient.invalidateQueries({ queryKey: huntKeys.all })}
          isRefreshing={fetching}
        />
        {can("huntCampaigns:write") && (
          <Button asChild className="h-10 rounded-lg font-semibold">
            <Link href="/pricing/hunts/new">
              <AppIcon icon="solar:add-circle-linear" className="mr-2 size-4" />
              New campaign
            </Link>
          </Button>
        )}
      </PageHeader>

      <ListDetailLayout
        hasSelection={!!selectedId}
        backHref="/pricing/hunts"
        backLabel="All campaigns"
        list={
          <HuntList
            groups={groups}
            selectedId={selectedId}
            now={now}
            isLoading={isLoading}
            isError={isError}
            onRetry={() => queryClient.invalidateQueries({ queryKey: huntKeys.list() })}
          />
        }
        detail={
          selectedId ? (
            <HuntDetailView key={selectedId} campaignId={selectedId} />
          ) : (
            <Card className="items-center gap-3 px-6 py-16 text-center">
              <AppIcon icon="solar:gift-linear" className="size-8 opacity-30" />
              <p className="text-sm font-semibold">No campaign live or coming up</p>
              <p className="max-w-xs text-xs text-muted-foreground">
                A campaign holds a few secret five-minute drops inside a public window.
              </p>
            </Card>
          )
        }
      />
    </div>
  );
}
