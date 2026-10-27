import type { ReactNode } from "react";
import Link from "next/link";
import { AppIcon } from "@/components/shared/app-icon";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

interface AnalyticsChartCardProps {
  title: string;
  subtitle?: string;
  /** Solar icon name for the header chip. */
  icon: string;
  /** Tailwind classes for the icon chip (e.g. "bg-primary/10 text-primary-ink"). */
  iconClass?: string;
  /** Optional node rendered at the top-right of the header (e.g. a KPI value). */
  headerRight?: ReactNode;
  /** Deep-link to the resource's management page. */
  href?: string;
  /** Footer link label, e.g. "View all orders". */
  linkLabel?: string;
  className?: string;
  children: ReactNode;
}

/**
 * Shared shell for a dashboard analytics chart: header (icon chip + title +
 * optional KPI) → chart body → optional deep-link footer. Keeps the four chart
 * cards visually consistent and every card one click from its resource page.
 */
export function AnalyticsChartCard({
  title,
  subtitle,
  icon,
  iconClass = "bg-primary/10 text-primary-ink",
  headerRight,
  href,
  linkLabel = "View all",
  className,
  children,
}: AnalyticsChartCardProps) {
  return (
    <Card
      className={cn(
        "group flex h-full flex-col overflow-hidden transition-colors hover:border-primary/25",
        className,
      )}
    >
      <CardContent className="flex h-full flex-col gap-4 p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-xl",
                iconClass,
              )}
            >
              <AppIcon icon={icon} className="size-5" />
            </span>
            <div className="space-y-0.5">
              <h3 className="text-base font-semibold text-foreground">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-muted-foreground">{subtitle}</p>
              )}
            </div>
          </div>
          {headerRight}
        </div>

        <div className="flex-1">{children}</div>

        {href && (
          <Link
            href={href}
            className="mt-auto inline-flex items-center gap-1.5 self-start text-xs font-medium text-muted-foreground transition-colors hover:text-primary-ink"
          >
            {linkLabel}
            <AppIcon
              icon="solar:arrow-right-linear"
              className="size-3.5 transition-transform group-hover:translate-x-0.5"
            />
          </Link>
        )}
      </CardContent>
    </Card>
  );
}
