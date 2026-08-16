import React from "react";
import { cn } from "@/lib/utils/cn";

interface PageHeaderProps {
  title: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
}

/**
 * Page title + description with an optional actions slot on the right. Shared
 * across feature views (dashboard, orders, …) — hence `components/shared`.
 */
export function PageHeader({
  title,
  description,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div
      // Sharp instrument (ticket 07): the header is ruled off from the content
      // it labels, so every route opens on a definite masthead instead of
      // floating text. The rule is the single most-repeated piece of the new
      // surface language — it appears on all 62 routes.
      className={cn(
        "flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-8 border-b border-border pb-5",
        className,
      )}
    >
      <div className="space-y-1">
        <h1 className="font-heading text-2xl font-semibold text-foreground tracking-tight">
          {title}
        </h1>
        {description && (
          <p className="text-sm text-muted-foreground font-medium">
            {description}
          </p>
        )}
      </div>
      {children && (
        <div className="flex items-center gap-3 shrink-0">{children}</div>
      )}
    </div>
  );
}
