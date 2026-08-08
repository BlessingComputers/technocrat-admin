"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AppIcon } from "@/components/shared/app-icon";
import { PermissionsTab } from "./permissions-tab";
import { RolesTab } from "./roles-tab";
import { StaffTab } from "./staff-tab";
import { RbacTabsSkeleton } from "./users-skeletons";

function RbacTabsInner() {
  const searchParams = useSearchParams();
  const defaultTab = searchParams.get("tab") || "permissions";

  return (
    <Tabs defaultValue={defaultTab} className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-md mb-8">
        <TabsTrigger value="permissions" className="flex items-center gap-2">
          <AppIcon icon="solar:key-linear" className="size-4" />
          Permissions
        </TabsTrigger>
        <TabsTrigger value="roles" className="flex items-center gap-2">
          <AppIcon icon="solar:shield-check-linear" className="size-4" />
          Roles
        </TabsTrigger>
        <TabsTrigger value="staff" className="flex items-center gap-2">
          <AppIcon icon="solar:users-group-rounded-linear" className="size-4" />
          Staff
        </TabsTrigger>
      </TabsList>
      <TabsContent value="permissions" className="mt-0">
        <PermissionsTab />
      </TabsContent>
      <TabsContent value="roles" className="mt-0">
        <RolesTab />
      </TabsContent>
      <TabsContent value="staff" className="mt-0">
        <StaffTab />
      </TabsContent>
    </Tabs>
  );
}

export function RbacTabs() {
  return (
    <Suspense fallback={<RbacTabsSkeleton />}>
      <RbacTabsInner />
    </Suspense>
  );
}
