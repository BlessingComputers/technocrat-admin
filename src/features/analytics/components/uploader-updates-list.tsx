import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { AppIcon } from "@/components/shared/app-icon";
import { UploaderItemsPagination } from "./uploader-items-pagination";
import { UploaderAnalyticsEmpty } from "./uploader-analytics-empty";
import { OPENABLE_ROW } from "./uploader-item-row";
import {
  changedFieldLabels,
  UPDATES_COUNTED_FROM,
  updatedItemHref,
} from "../model/uploader-work";
import type {
  UpdatedCatalogItem,
  UploaderUpdatesResponse,
  CatalogItemRef,
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

/**
 * One product or part the uploader was credited for updating. Click opens the
 * item sheet; a deleted item (no href) is a plain row.
 */
function UpdatedItemRow({
  item,
  onOpen,
}: {
  item: UpdatedCatalogItem;
  onOpen: (ref: CatalogItemRef) => void;
}) {
  const deleted = updatedItemHref(item) === null;
  const labels = changedFieldLabels(item.changedFields);
  const shown = labels.slice(0, MAX_FIELDS);
  const hidden = labels.length - shown.length;

  const content = (
    <>
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
        {!deleted ? (
          <p className="truncate text-sm font-semibold">{item.name}</p>
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
      {!deleted && (
        <AppIcon
          icon="solar:alt-arrow-right-linear"
          className="size-4 shrink-0 text-muted-foreground/60"
        />
      )}
    </>
  );

  if (deleted) {
    return <div className="flex items-center gap-3 px-4 py-3">{content}</div>;
  }
  return (
    <button
      type="button"
      className={OPENABLE_ROW}
      onClick={() =>
        onOpen({ type: item.type, id: item.id, title: item.name, image: item.imageUrl ?? null })
      }
    >
      {content}
    </button>
  );
}

interface UploaderUpdatesListProps {
  data?: UploaderUpdatesResponse;
  isLoading: boolean;
  isError: boolean;
  page: number;
  onPageChange: (page: number) => void;
  onOpen: (ref: CatalogItemRef) => void;
}

/** The "Updated" tab: skeleton / error / empty / rows + pager. */
export function UploaderUpdatesList({
  data,
  isLoading,
  isError,
  page,
  onPageChange,
  onOpen,
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
          <UpdatedItemRow key={`${item.type}:${item.id}`} item={item} onOpen={onOpen} />
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
