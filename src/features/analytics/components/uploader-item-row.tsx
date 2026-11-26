import { AppIcon } from "@/components/shared/app-icon";
import { formatPrice } from "@/lib/utils/format";
import type { UploaderItem } from "../types/upload-analytics";

const DATE_FMT = new Intl.DateTimeFormat("en-NG", {
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
});

/** Row look shared by the item lists: the whole row opens the item sheet. */
export const OPENABLE_ROW =
  "flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/50 focus-visible:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring";

/** A single created product/part in the drill-down list. Click opens the sheet. */
export function UploaderItemRow({
  item,
  onOpen,
}: {
  item: UploaderItem;
  onOpen: () => void;
}) {
  return (
    <button type="button" onClick={onOpen} className={OPENABLE_ROW}>
      <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-muted">
        {item.image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.image}
            alt=""
            className="size-full object-cover"
            loading="lazy"
          />
        ) : (
          <AppIcon
            icon="solar:box-linear"
            className="size-5 text-muted-foreground/40"
          />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{item.title}</p>
        <p className="text-xs font-medium text-muted-foreground">
          {item.code}
        </p>
      </div>
      <div className="shrink-0 text-right">
        <p className="text-sm font-semibold tabular-nums">
          {item.price == null ? "—" : formatPrice(item.price)}
        </p>
        <p className="text-xs text-muted-foreground">
          {DATE_FMT.format(new Date(item.createdAt))}
        </p>
      </div>
      <AppIcon
        icon="solar:alt-arrow-right-linear"
        className="size-4 shrink-0 text-muted-foreground/60"
      />
    </button>
  );
}
