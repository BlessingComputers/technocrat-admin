"use client";

import { Card } from "@/components/ui/card";
import { formatInvoiceDateTime } from "../../utils/invoice-utils";
import type { InvoiceTimelineEntry } from "../../types/invoice";

interface InvoiceTimelineProps {
  timeline: InvoiceTimelineEntry[];
}

export function InvoiceTimeline({ timeline }: InvoiceTimelineProps) {
  return (
    <Card className="h-full gap-0 border bg-card p-8">
      <h3 className="text-base font-bold text-foreground">Timeline</h3>

      {timeline.length === 0 ? (
        <p className="mt-5 text-sm text-muted-foreground">No events yet</p>
      ) : (
        <ol className="mt-6 space-y-7">
          {timeline.map((entry, idx) => (
            <li key={entry.id ?? idx} className="relative flex gap-4">
              <div className="relative flex flex-col items-center">
                <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-primary" />
                {idx < timeline.length - 1 && (
                  <span className="absolute top-3.5 h-[calc(100%+1.25rem)] w-px bg-border" />
                )}
              </div>
              <div className="-mt-0.5">
                <p className="text-sm font-medium text-foreground">
                  {entry.label}
                </p>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {formatInvoiceDateTime(entry.createdAt)}
                </p>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Card>
  );
}
