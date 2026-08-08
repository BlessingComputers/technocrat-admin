"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { DlqRow } from "./dlq-row";
import { PaymentsTableSkeleton } from "../payments-skeletons";
import type { DlqEntry } from "../../types/payments";

const HEADERS = ["Job", "Payment", "Failure", ""];

interface DlqTableProps {
  entries: DlqEntry[];
  isLoading: boolean;
  isError: boolean;
  onRetry: () => void;
}

export function DlqTable({ entries, isLoading, isError, onRetry }: DlqTableProps) {
  if (isLoading) return <PaymentsTableSkeleton />;

  if (isError) {
    return (
      <div className="py-20 text-center bg-card rounded-lg border border-border">
        <div className="mx-auto mb-4 flex size-16 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AppIcon icon="solar:danger-circle-linear" className="size-8" />
        </div>
        <h3 className="text-lg font-semibold text-foreground">
          Dead letter queue unavailable
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We hit an error loading the DLQ. Please try again shortly.
        </p>
        <Button variant="outline" onClick={onRetry} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  if (entries.length === 0) {
    return (
      <div className="py-20 text-center bg-card rounded-lg border border-border">
        <AppIcon
          icon="solar:inbox-archive-linear"
          className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4"
        />
        <h3 className="text-lg font-semibold text-foreground">
          Nothing dead-lettered
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          Jobs that exhaust every retry land here — empty is good news.
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-card rounded-lg border border-border w-full">
      <table className="w-full text-left min-w-[800px]">
        <thead>
          <tr className="border-b border-border bg-primary/[0.04]">
            {HEADERS.map((label) => (
              <th
                key={label || "actions"}
                className="px-8 py-4 text-xs font-semibold uppercase tracking-wide text-muted-foreground"
              >
                {label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/60">
          {entries.map((entry) => (
            <DlqRow key={entry.id} entry={entry} />
          ))}
        </tbody>
      </table>
    </div>
  );
}
