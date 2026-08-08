import { AppIcon } from "@/components/shared/app-icon";

/**
 * A breadcrumb-style "where to click" trail, e.g. Products › Parts › Bulk Upload.
 * Renders each hop as a keycap chip separated by chevrons.
 */
export function Path({ items }: { items: string[] }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {items.map((item, i) => (
        <span key={item} className="flex items-center gap-1.5">
          <span className="rounded-md border border-border bg-muted/40 px-2 py-1 text-[11px] font-bold text-foreground">
            {item}
          </span>
          {i < items.length - 1 && (
            <AppIcon
              icon="solar:alt-arrow-right-linear"
              className="size-3 text-muted-foreground"
            />
          )}
        </span>
      ))}
    </div>
  );
}
