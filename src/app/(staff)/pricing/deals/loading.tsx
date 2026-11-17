import { SkeletonPageHeader } from "@/components/shared/skeletons";

/** Loading state for `/pricing/deals`: header, then the list and detail columns. */
export default function DealsLoading() {
  return (
    <div className="mx-auto w-full max-w-6xl space-y-6" aria-hidden>
      <SkeletonPageHeader />
      <div className="grid gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
        <div className="h-[360px] animate-pulse rounded-xl bg-muted" />
        <div className="h-[360px] animate-pulse rounded-xl bg-muted max-lg:hidden" />
      </div>
    </div>
  );
}
