import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { UploaderItemsPagination } from "./uploader-items-pagination";
import { UploaderAnalyticsEmpty } from "./uploader-analytics-empty";
import {
  changedFieldLabels,
  UPDATES_COUNTED_FROM,
  updatedItemHref,
} from "../model/uploader-work";
import type {
  UpdatedCatalogItem,
  UploaderUpdatesResponse,
} from "../types/upload-analytics";

const DATE_FMT = new Intl.DateTimeFormat("en-NG", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

const COUNTED_FROM = new Intl.DateTimeFormat("en-NG", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
}).format(new Date(`${UPDATES_COUNTED_FROM}T00:00:00Z`));

/** Chips shown per row before "+N more". */
const MAX_FIELDS = 4;

/** One product or part the uploader was credited for updating. */
function UpdatedItemRow({ item }: { item: UpdatedCatalogItem }) {
  const href = updatedItemHref(item);
  const labels = changedFieldLabels(item.changedFields);
  const shown = labels.slice(0, MAX_FIELDS);
  const hidden = labels.length - shown.length;

  return (
    <div className="flex items-center gap-3 px-4 py-3">
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {item.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.imageUrl}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <AppIcon
            icon={item.type === "product" ? "solar:box-linear" : "solar:cpu-linear"}
            className="size-5 text-muted-foreground/40"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        {href ? (
          <Link
            href={href}
            className="block truncate text-sm font-semibold hover:text-primary-ink hover:underline"
          >
            {item.name}
          </Link>
        ) : (
          <p className="truncate text-sm font-semibold text-muted-foreground">
            Deleted item
          </p>
        )}
        <p className="text-xs font-medium text-muted-foreground">
          {item.type === "product" ? "Product" : "Part"}
          {item.code ? ` · ${item.code}` : ""}
        </p>
        {shown.length > 0 && (
          <div className="mt-1.5 flex flex-wrap items-center gap-1">
            {shown.map((label) => (
              <Badge
                key={label}
                variant="secondary"
                className="h-5 rounded-md px-1.5 text-xs font-medium"
              >
                {label}
              </Badge>
            ))}
            {hidden > 0 && (
              <span className="text-xs font-medium text-muted-foreground">
                +{hidden} more
              </span>
            )}
          </div>
        )}
      </div>
      <div className="shrink-0 text-right">
        <p className="text-xs text-muted-foreground">
          {DATE_FMT.format(new Date(item.lastEditedAt))}
        </p>
        {item.editDays > 1 && (
          <p className="text-xs text-muted-foreground">
            {item.editDays} days
          </p>
        )}
      </div>
    </div>
  );
}

interface UploaderUpdatesListProps {
  data?: UploaderUpdatesResponse;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

/** The "Updated" tab: skeleton / error / empty / rows + pager. */
export function UploaderUpdatesList({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
}: UploaderUpdatesListProps) {
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

  const items = data?.data ?? [];
  if (items.length === 0) {
    return (
      <UploaderAnalyticsEmpty
        message={`No updates credited in this period. Updates are counted from ${COUNTED_FROM}.`}
      />
    );
  }

  return (
    <div>
      <div className="divide-y divide-border">
        {items.map((item) => (
          <UpdatedItemRow key={`${item.type}:${item.id}`} item={item} />
        ))}
      </div>
      {data && (
        <UploaderItemsPagination
          meta={data.meta}
          page={page}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}
