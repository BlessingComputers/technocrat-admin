"use client";

import { Card } from "@/components/ui/card";
import { AppIcon } from "@/components/shared/app-icon";
import { cn } from "@/lib/utils/cn";
import type { OrderTimelineEntry } from "../../types/orders";

interface OrderAuditTrailProps {
  entries: OrderTimelineEntry[];
}

/**
 * Chronological audit trail for the order. Both flows normalize their status
 * history into {@link OrderTimelineEntry} and render it here, so the manual
 * bank-transfer log and the gateway status history read as one component. The
 * newest entry (index 0) is highlighted as the current state.
 */
export function OrderAuditTrail({ entries }: OrderAuditTrailProps) {
  return (
    <Card className="p-8 sm:p-10 border border-border bg-card rounded-xl">
      <h3 className="text-xl font-black text-foreground mb-8 flex items-center gap-3">
        <AppIcon icon="solar:clock-circle-linear" className="w-6 h-6 text-primary" />
        Audit Trail
      </h3>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center">
          <AppIcon
            icon="solar:history-linear"
            className="w-10 h-10 text-muted-foreground/40 mb-3"
          />
          <p className="text-sm font-bold text-muted-foreground">
            No history recorded yet
          </p>
          <p className="text-xs text-muted-foreground/70 mt-1">
            Status changes will appear here as the order progresses.
          </p>
        </div>
      ) : (
        <div className="relative space-y-8 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-border">
          {entries.map((entry, idx) => (
            <div key={entry.id} className="relative flex items-start gap-6 group">
              <div
                className={cn(
                  "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 z-10 transition-transform group-hover:scale-110",
                  idx === 0
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-muted-foreground",
                )}
              >
                <AppIcon
                  icon={
                    idx === 0
                      ? "solar:check-circle-linear"
                      : "solar:clock-circle-linear"
                  }
                  className="w-5 h-5"
                />
              </div>
              <div className="pt-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h4 className="font-black text-foreground text-sm tracking-tight">
                    {entry.status.replace(/_/g, " ")}
                  </h4>
                  <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-widest tabular-nums">
                    {new Date(entry.createdAt).toLocaleString()}
                  </span>
                </div>
                {(entry.actorName || entry.actorId) && (
                  <div className="flex items-center gap-1.5 mt-1">
                    <AppIcon
                      icon="solar:user-linear"
                      className="w-3 h-3 text-muted-foreground/60"
                    />
                    <span className="text-[10px] text-muted-foreground font-bold tracking-wide">
                      {entry.actorName ?? `Staff ${entry.actorId}`}
                    </span>
                    {entry.actorName && entry.actorId && (
                      <span className="text-[10px] text-muted-foreground/60 font-medium">
                        ({entry.actorId})
                      </span>
                    )}
                  </div>
                )}
                {entry.note && (
                  <p className="text-xs text-muted-foreground font-medium leading-relaxed bg-muted/40 p-3 rounded-xl border border-border/50 mt-2">
                    {entry.note}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
