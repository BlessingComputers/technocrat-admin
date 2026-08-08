"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";

interface OrderMetaCardProps {
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
  cancelledAt?: string | null;
}

const DATE_OPTS: Intl.DateTimeFormatOptions = {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
};

function fmt(value: string) {
  return new Date(value).toLocaleString(undefined, DATE_OPTS);
}

/**
 * Order lifecycle timestamps — created, last updated, and the terminal event
 * (completed / cancelled) when it has happened. Shared by both flows.
 */
export function OrderMetaCard({
  createdAt,
  updatedAt,
  completedAt,
  cancelledAt,
}: OrderMetaCardProps) {
  return (
    <Card className="p-6 border border-border bg-card rounded-xl">
      <h3 className="text-sm font-black uppercase tracking-widest text-muted-foreground mb-5 flex items-center gap-2">
        <AppIcon icon="solar:calendar-linear" className="w-4 h-4 text-primary" />
        Timeline
      </h3>
      <div className="space-y-3">
        <MetaRow label="Created" value={fmt(createdAt)} />
        <MetaRow label="Last Update" value={fmt(updatedAt)} />
        {completedAt && (
          <MetaRow label="Completed" value={fmt(completedAt)} tone="success" />
        )}
        {cancelledAt && (
          <MetaRow label="Cancelled" value={fmt(cancelledAt)} tone="danger" />
        )}
      </div>
    </Card>
  );
}

function MetaRow({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone?: "success" | "danger";
}) {
  const valueClass =
    tone === "success"
      ? "text-success"
      : tone === "danger"
        ? "text-destructive"
        : "text-foreground";
  return (
    <div className="flex justify-between items-center gap-4">
      <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">
        {label}
      </span>
      <span className={`text-xs font-bold tabular-nums ${valueClass}`}>
        {value}
      </span>
    </div>
  );
}
