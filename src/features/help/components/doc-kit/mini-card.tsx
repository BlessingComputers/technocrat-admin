import type { ReactNode } from "react";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";

/**
 * A small labelled card for a terse point: icon, title, and a short body.
 * Typically laid out three-across to summarise related actions.
 */
export function MiniCard({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: ReactNode;
}) {
  return (
    <Card className="p-4">
      <AppIcon icon={icon} className="mb-2 size-5 text-primary-ink" />
      <p className="text-sm font-semibold text-foreground">{title}</p>
      <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
        {children}
      </p>
    </Card>
  );
}
