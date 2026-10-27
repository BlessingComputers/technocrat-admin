import { PageHeader } from "@/components/shared/page-header";
import { AppIcon } from "@/components/shared/app-icon";

interface FeaturePlaceholderProps {
  /** Page title (also the nav label). */
  title: string;
  /** Short subtitle under the title. */
  description?: string;
  /** Solar icon name for the empty-state chip (default: a clock). */
  icon?: string;
  /** Override the body copy explaining why the module is empty. */
  note?: string;
}

/**
 * Empty-state for Phase 5 features that don't have a UI yet, so their nav route
 * renders cleanly instead of 404-ing. Built in the design system (tokens, Solar
 * icon, dashed card). Replace the route's `<FeaturePlaceholder/>` with the real
 * view once the feature lands.
 */
export function FeaturePlaceholder({
  title,
  description,
  icon = "solar:clock-circle-linear",
  note = "This module hasn't been built yet — check back soon.",
}: FeaturePlaceholderProps) {
  return (
    <div>
      <PageHeader title={title} description={description} />
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-20 text-center">
        <div className="mb-5 flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary-ink">
          <AppIcon icon={icon} className="size-7" />
        </div>
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Coming soon
        </h2>
        <p className="mt-1.5 max-w-md text-sm text-muted-foreground">{note}</p>
      </div>
    </div>
  );
}
