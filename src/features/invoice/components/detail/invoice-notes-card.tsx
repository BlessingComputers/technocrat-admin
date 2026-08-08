"use client";

import { Card } from "@/components/ui/card";

interface InvoiceNotesCardProps {
  notes: string;
}

export function InvoiceNotesCard({ notes }: InvoiceNotesCardProps) {
  return (
    <Card className="gap-0 rounded-2xl border border-border/60 bg-card p-8 shadow-soft">
      <h3 className="text-base font-bold text-foreground">Notes</h3>
      <p className="mt-3 text-sm text-muted-foreground">{notes}</p>
    </Card>
  );
}
