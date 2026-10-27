import { PageHeader } from "@/components/shared/page-header";
import { Skeleton } from "@/components/ui/skeleton";

export default function SettingsLoading() {
  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Settings"
        description="Manage your administrative account and store-wide configuration"
      />
      <div className="space-y-6">
        {/* The Account / Store tab bar. */}
        <Skeleton className="h-10 w-56 rounded-lg" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
