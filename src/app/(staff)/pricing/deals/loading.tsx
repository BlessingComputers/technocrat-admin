import { SkeletonListPage } from "@/components/shared/skeletons";

/**
 * Loading state for `/pricing/deals` — header, filter chips, then the table,
 * at the same heights the list resolves into so nothing jumps.
 */
export default function DealsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <SkeletonListPage />
    </div>
  );
}
