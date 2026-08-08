import Link from "next/link";
import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";

interface InvoiceKpiCardProps {
  title: string;
  value: string | number;
  icon: string;
  /** Color class for the trailing glyph, e.g. `text-warning`. */
  iconClassName?: string;
  note?: string;
  noteClassName?: string;
  isLoading?: boolean;
  /** When set, the whole card links here. */
  href?: string;
}

export function InvoiceKpiCard({
  title,
  value,
  icon,
  iconClassName,
  note,
  noteClassName,
  isLoading,
  href,
}: InvoiceKpiCardProps) {
  const card = (
    <Card
      className={cn(
        "gap-0 rounded-xl border border-border/60 bg-card p-6 shadow-soft",
        href && "transition-shadow hover:shadow-soft-lg",
      )}
    >
      <div className="flex items-start justify-between">
        <p className="text-sm font-medium text-muted-foreground">{title}</p>
        <AppIcon
          icon={icon}
          className={cn("h-5 w-5 text-muted-foreground", iconClassName)}
        />
      </div>
      <p
        className={cn(
          "mt-4 text-3xl font-bold tracking-tight text-foreground tabular-nums",
          isLoading && "animate-pulse text-muted-foreground/30",
        )}
      >
        {isLoading ? "—" : value}
      </p>
      {note && (
        <p className={cn("mt-2 text-[11px] font-semibold", noteClassName)}>
          {note}
        </p>
      )}
    </Card>
  );

  return href ? (
    <Link href={href} className="block">
      {card}
    </Link>
  ) : (
    card
  );
}
