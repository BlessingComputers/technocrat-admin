"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { usePermissions } from "@/lib/auth/use-permissions";
import { AccountSettingsView } from "@/features/settings";
import { SalesNotificationsPanel } from "@/features/sales-notifications";

type SettingsTab = "account" | "store";

function isSettingsTab(value: string | null): value is SettingsTab {
  return value === "account" || value === "store";
}

/**
 * The `/settings` workspace. Splits what used to be an account-only page into
 * Account (your password, your sessions) and Store (configuration that affects
 * everyone), so store-level settings have somewhere obvious to land instead of
 * being scattered across unrelated sections.
 *
 * Lives in the `app` layer (not `features/`) on purpose: it composes sibling
 * features, and only `app` may depend on more than one (the boundaries rule
 * forbids feature→feature imports). Same shape as `/pricing`'s workspace.
 *
 * The active tab is mirrored in the URL (`?tab=store`, default = account). The
 * Store tab is gated on the `salesNotifications` group — presentation gating
 * only (ADR-0001); the backend's 403 is the authority — and a deep-link to it
 * without that permission falls back to Account rather than showing an empty
 * tab. When a second store setting arrives under a different permission, this
 * check becomes "any of the store groups" instead.
 */
export function SettingsWorkspace() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { canAnyInGroup } = usePermissions();
  const canManageStore = canAnyInGroup(["salesNotifications"]);

  const tabParam = searchParams.get("tab");
  const requestedTab: SettingsTab = isSettingsTab(tabParam)
    ? tabParam
    : "account";
  const activeTab: SettingsTab =
    requestedTab === "store" && !canManageStore ? "account" : requestedTab;

  const handleTabChange = useCallback(
    (value: string) => {
      const params = new URLSearchParams(searchParams);
      if (value === "account") params.delete("tab");
      else params.set("tab", value);
      const query = params.toString();
      router.replace(query ? `/settings?${query}` : "/settings", {
        scroll: false,
      });
    },
    [router, searchParams],
  );

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="Manage your administrative account and store-wide configuration"
      />
      <Tabs value={activeTab} onValueChange={handleTabChange} className="gap-6">
        <TabsList>
          <TabsTrigger value="account">
            <AppIcon icon="solar:user-circle-linear" />
            Account
          </TabsTrigger>
          {canManageStore && (
            <TabsTrigger value="store">
              <AppIcon icon="solar:shop-linear" />
              Store
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="account">
          <AccountSettingsView />
        </TabsContent>

        {canManageStore && (
          <TabsContent value="store">
            <section className="space-y-4">
              <h2 className="font-heading text-lg font-semibold tracking-tight text-foreground">
                Sales Notifications
              </h2>
              <SalesNotificationsPanel />
            </section>
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
}
