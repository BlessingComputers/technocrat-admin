"use client";

import { Card } from "@/components/ui/card";

interface InvoiceNotesCardProps {
  notes: string;
}

export function InvoiceNotesCard({ notes }: InvoiceNotesCardProps) {
  return (
    <Card className="gap-0 p-8">
      <h3 className="text-base font-semibold text-foreground">Notes</h3>
      <p className="mt-3 text-sm text-muted-foreground">{notes}</p>
    </Card>
  );
}
