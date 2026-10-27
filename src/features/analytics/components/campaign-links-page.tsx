import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { getStaffSessionServer } from "@/lib/auth/get-server-session";
import { hasPermission, isSuperAdmin } from "@/lib/auth/permissions";
import { storefrontOrigin } from "../api/traffic.server";
import { CampaignLinkBuilder } from "./campaign-link-builder";
import { TrafficNotice } from "./traffic-view";

/** `/analytics/links`: tagged links for ads and posts, behind the same `analytics:read` as the report. */
export async function CampaignLinksPage() {
  const session = await getStaffSessionServer();
  if (!isSuperAdmin(session) && !hasPermission(session?.permissions ?? [], "analytics:read")) {
    return (
      <TrafficNotice icon="solar:lock-keyhole-linear" title="You can't view analytics">
        This page needs the analytics:read permission. Ask an admin to add it to your role.
      </TrafficNotice>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Campaign links"
        description="Tag every link you share, so Analytics can tell which campaign and which ad brought each visitor and order."
        className="mb-0"
      >
        <Button asChild variant="outline" size="sm" className="h-9 gap-2 rounded-lg text-xs font-medium">
          <Link href="/analytics">
            <AppIcon icon="solar:arrow-left-linear" className="size-4" />
            Back to Analytics
          </Link>
        </Button>
      </PageHeader>
      <CampaignLinkBuilder storefrontOrigin={storefrontOrigin()} />
    </div>
  );
}
