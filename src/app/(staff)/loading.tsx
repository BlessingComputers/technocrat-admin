import { SkeletonPage } from "@/components/shared/skeletons";

/**
 * Fallback loading UI for the `(staff)` segment. Because the `(staff)` layout
 * reads the session cookie, every route here is dynamic — without a `loading.tsx`
 * boundary Next.js skips prefetching and blocks navigation on the server
 * round-trip (see `.next-docs` linking-and-navigating). This neutral shell
 * covers the dashboard index and any placeholder/static route that doesn't ship
 * its own tailored `loading.tsx`.
 */
export default function StaffLoading() {
  return <SkeletonPage />;
}
