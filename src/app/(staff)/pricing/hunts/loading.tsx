import { SkeletonListPage } from "@/components/shared/skeletons";

/**
 * Loading state for `/pricing/hunts`: header, status chips, then the table,
 * at the heights the list resolves into so nothing jumps.
 */
export default function HuntsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl">
      <SkeletonListPage />
    </div>
  );
}
