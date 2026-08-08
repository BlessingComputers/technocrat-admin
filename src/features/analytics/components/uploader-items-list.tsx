import { Skeleton } from "@/components/ui/skeleton";
import { UploaderItemRow } from "./uploader-item-row";
import { UploaderItemsPagination } from "./uploader-items-pagination";
import { UploaderAnalyticsEmpty } from "./uploader-analytics-empty";
import type { ItemsMeta, UploaderItem } from "../types/upload-analytics";

interface UploaderItemsListProps {
  items: UploaderItem[];
  isLoading: boolean;
  isError: boolean;
  meta?: ItemsMeta;
  page: number;
  onPageChange: (page: number) => void;
  emptyLabel: string;
}

/** The active tab's item list: skeleton / error / empty / rows + pager. */
export function UploaderItemsList({
  items,
  isLoading,
  isError,
  meta,
  page,
  onPageChange,
  emptyLabel,
}: UploaderItemsListProps) {
  if (isLoading) {
    return (
      <div className="divide-y divide-border">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="flex items-center gap-3 px-4 py-3">
            <Skeleton className="size-11 shrink-0 rounded-lg" />
            <Skeleton className="h-4 w-48" />
            <Skeleton className="ml-auto h-4 w-20" />
          </div>
        ))}
      </div>
    );
  }

  if (isError) {
    return <UploaderAnalyticsEmpty message="Couldn't load these items." />;
  }

  if (items.length === 0) {
    return <UploaderAnalyticsEmpty message={emptyLabel} />;
  }

  return (
    <div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <UploaderItemRow key={item.key} item={item} />
        ))}
      </div>
      {meta && (
        <UploaderItemsPagination
          meta={meta}
          page={page}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
