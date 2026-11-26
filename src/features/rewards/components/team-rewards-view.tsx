"use client";

import PageContainer from "@/components/layouts/page-container";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePermissions } from "@/lib/auth/use-permissions";

import { TEAM_TAB_LABELS, visibleTeamTabs } from "../model/reward-rules";
import { RewardRatesTab } from "./reward-rates-tab";
import { RewardsLoading, RewardsNoAccess } from "./rewards-states";
import { UploadersTab } from "./uploaders-tab";

/**
 * `/rewards/team` (ask 20). Tabs follow the permissions; the backend 403 is
 * the real boundary. With only "Uploaders" there is no tab strip.
 */
export function TeamRewardsView() {
  const perms = usePermissions();
  const tabs = visibleTeamTabs(perms);

  return (
    <PageContainer>
      <PageHeader
        title="Team rewards"
        description="Every uploader's monthly reward. A month closes on its own on the 1st; adjust it or mark it paid after that."
      />
      {perms.isLoading ? (
        // Wait for the session, so a permitted user never sees "No access" flash.
        <RewardsLoading />
      ) : tabs.length === 0 ? (
        <RewardsNoAccess />
      ) : (
        <Tabs defaultValue="uploaders" className="space-y-4">
          {tabs.length > 1 && (
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab} value={tab}>
                  {TEAM_TAB_LABELS[tab]}
                </TabsTrigger>
              ))}
            </TabsList>
          )}
          <TabsContent value="uploaders">
            <UploadersTab />
          </TabsContent>
          {tabs.includes("rates") && (
            <TabsContent value="rates">
              <RewardRatesTab />
            </TabsContent>
          )}
        </Tabs>
      )}
    </PageContainer>
  );
}
