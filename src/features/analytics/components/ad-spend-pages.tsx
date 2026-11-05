import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { getStaffSessionServer } from "@/lib/auth/get-server-session";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { parsePeriod } from "../model/ad-spend";
import { AdSpendCreate, AdSpendEdit } from "./ad-spend-editor";
import { AdSpendList } from "./ad-spend-list";
import { TrafficPeriodSelect } from "./traffic-period-select";
import { TrafficNotice } from "./traffic-view";

/**
 * `/analytics/spend`: what each campaign cost, typed in from Ads Manager.
 * Reading needs `analytics:read` like the rest of Analytics; writing needs
 * `analytics:write`. The backend enforces both. These checks only pick what
 * to show.
 */
async function access() {
  const session = await getStaffSessionServer();
  const permissions = session?.permissions ?? [];
  const superAdmin = isSuperAdmin(session);
  return {
    canRead: superAdmin || hasPermission(permissions, "analytics:read"),
    canWrite: superAdmin || hasPermission(permissions, "analytics:write"),
  };
}

const NO_READ = (
  <TrafficNotice icon="solar:lock-keyhole-linear" title="You can't view analytics">
    This page needs the analytics:read permission. Ask an admin to add it to your role.
  </TrafficNotice>
);

const NO_WRITE = (
  <TrafficNotice icon="solar:lock-keyhole-linear" title="You can't log ad spend">
    This needs the analytics:write permission. Ask an admin to add it to your role.
  </TrafficNotice>
);

export async function AdSpendSpendPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { canRead, canWrite } = await access();
  if (!canRead) return NO_READ;
  const period = parsePeriod((await searchParams).period);

  return (
    <div className="space-y-6">
      <PageHeader
        title="Ad spend"
        description="What each campaign cost. Analytics divides order value by this to show return on ad spend."
        className="mb-0"
      >
        <Button asChild variant="outline" size="sm" className="h-9 gap-2 rounded-lg text-xs font-medium">
          <Link href={`/analytics?period=${period}`}>
            <AppIcon icon="solar:arrow-left-linear" className="size-4" />
            Back to Analytics
          </Link>
        </Button>
        <TrafficPeriodSelect value={period} />
        {canWrite && (
          <Button asChild size="sm" className="h-9 gap-2 rounded-lg text-xs font-medium">
            <Link href={`/analytics/spend/new?period=${period}`}>
              <AppIcon icon="solar:add-circle-linear" className="size-4" />
              Log spend
            </Link>
          </Button>
        )}
      </PageHeader>
      <AdSpendList period={period} canWrite={canWrite} />
    </div>
  );
}

export async function AdSpendNewPage({ searchParams }: { searchParams: Promise<{ period?: string }> }) {
  const { canWrite } = await access();
  if (!canWrite) return NO_WRITE;
  const period = parsePeriod((await searchParams).period);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Log ad spend" description="Copy the amount and dates from Ads Manager." className="mb-0" />
      <AdSpendCreate period={period} />
    </div>
  );
}

export async function AdSpendEditPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ period?: string }>;
}) {
  const { canWrite } = await access();
  if (!canWrite) return NO_WRITE;
  const [{ id }, { period }] = await Promise.all([params, searchParams]);
  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <PageHeader title="Edit ad spend" className="mb-0" />
      <AdSpendEdit id={id} period={parsePeriod(period)} />
    </div>
  );
}
