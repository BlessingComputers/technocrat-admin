import { DashboardSkeleton } from "@/features/analytics";

/**
 * The dashboard (`/`) lives in the `(overview)` route group so it can own a
 * `DashboardSkeleton` loader without that skeleton leaking to sibling routes.
 * The neutral `(staff)/loading.tsx` remains the fallback for placeholder/static
 * routes. `(overview)` is a route group, so the URL stays `/`.
 */
export default function DashboardLoading() {
  return <DashboardSkeleton />;
}
