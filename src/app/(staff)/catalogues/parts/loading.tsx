import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui/card";
import { PartsTableSkeleton } from "@/features/parts";
import {
  SkeletonStatCards,
  SkeletonFilterBar,
} from "@/components/shared/skeletons";

export default function PartsBrowseLoading() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="All Parts"
        description="Every part across all products — search and audit. Add parts from a product's Parts tab."
      />
      <SkeletonStatCards count={4} />
      <SkeletonFilterBar />
      <Card className="gap-0 overflow-hidden border bg-card p-0">
        <PartsTableSkeleton />
      </Card>
    </div>
  );
}
