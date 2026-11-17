import type { ReactNode } from "react";
import Link from "next/link";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

interface ListDetailLayoutProps {
  list: ReactNode;
  detail: ReactNode;
  /** True when the URL names an item. Below `lg` it swaps the list for the detail. */
  hasSelection: boolean;
  /** Where Back goes on a phone: the same route without the selection. */
  backHref: string;
  backLabel: string;
}

/**
 * List left, detail right (spec decision 1). From `lg` both show and the page
 * has one scroll. Below `lg` only one shows: the list, or the detail with Back.
 * Not sticky on purpose; see the plan's Global Constraints.
 */
export function ListDetailLayout({
  list,
  detail,
  hasSelection,
  backHref,
  backLabel,
}: ListDetailLayoutProps) {
  return (
    <div className="grid items-start gap-5 lg:grid-cols-[300px_minmax(0,1fr)]">
      <div className={cn("min-w-0", hasSelection && "max-lg:hidden")}>{list}</div>
      <div className={cn("min-w-0", !hasSelection && "max-lg:hidden")}>
        {hasSelection && (
          <Button asChild variant="ghost" className="mb-3 -ml-2 h-9 lg:hidden">
            <Link href={backHref} scroll={false}>
              <AppIcon icon="solar:alt-arrow-left-linear" className="mr-1.5 size-4" />
              {backLabel}
            </Link>
          </Button>
        )}
        {detail}
      </div>
    </div>
  );
}
