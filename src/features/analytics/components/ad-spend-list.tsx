"use client";

import Link from "next/link";
import { useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { ConfirmModal } from "@/components/shared/confirm-modal";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatPrice } from "@/lib/utils/format";
import { useAdSpend, useDeleteAdSpend } from "../api/ad-spend.queries";
import { PERIOD_DAYS, spendWindow } from "../model/ad-spend";
import { AD_PLATFORM_LABEL } from "../schemas/ad-spend.schema";
import type { AnalyticsPeriod } from "../types/chart-analytics";
import type { AdSpend } from "../types/ad-spend";

const dates = (e: AdSpend) => (e.startDate === e.endDate ? e.startDate : `${e.startDate} to ${e.endDate}`);

export function AdSpendList({ period, canWrite }: { period: AnalyticsPeriod; canWrite: boolean }) {
  const range = spendWindow(PERIOD_DAYS[period]);
  const { data: entries = [], isPending, isError } = useAdSpend(range);
  const remove = useDeleteAdSpend();
  const [deleting, setDeleting] = useState<AdSpend | null>(null);

  if (isError) {
    return <p className="py-10 text-center text-sm text-muted-foreground">Couldn&apos;t load ad spend. Reload in a minute.</p>;
  }

  return (
    <Card>
      <CardContent className="p-0">
        {isPending ? (
          <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>
        ) : entries.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            No spend logged between {range.from} and {range.to}.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="pl-5 sm:pl-6">Campaign</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Dates</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                  <TableHead>Logged by</TableHead>
                  {canWrite && <TableHead className="pr-5 text-right sm:pr-6">Actions</TableHead>}
                </TableRow>
              </TableHeader>
              <TableBody>
                {entries.map((e) => (
                  <TableRow key={e.id}>
                    <TableCell className="max-w-[18rem] pl-5 sm:pl-6">
                      <p className="truncate font-medium text-foreground">{e.campaign}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {e.adContent ? `ad ${e.adContent}` : "Whole campaign"}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </TableCell>
                    <TableCell className="text-sm">{AD_PLATFORM_LABEL[e.platform]}</TableCell>
                    <TableCell className="whitespace-nowrap text-sm tabular-nums">{dates(e)}</TableCell>
                    <TableCell className="whitespace-nowrap text-right tabular-nums">{formatPrice(e.amount)}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{e.createdBy.name}</TableCell>
                    {canWrite && (
                      <TableCell className="pr-5 text-right sm:pr-6">
                        <div className="flex justify-end gap-1">
                          <Button asChild variant="ghost" size="sm" aria-label={`Edit ${e.campaign}`}>
                            <Link href={`/analytics/spend/${e.id}/edit?period=${period}`}>
                              <AppIcon icon="solar:pen-linear" className="size-4" />
                            </Link>
                          </Button>
                          <Button variant="ghost" size="sm" aria-label={`Delete ${e.campaign}`} onClick={() => setDeleting(e)}>
                            <AppIcon icon="solar:trash-bin-trash-linear" className="size-4" />
                          </Button>
                        </div>
                      </TableCell>
                    )}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
      <ConfirmModal
        isOpen={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id, { onSuccess: () => setDeleting(null) })}
        title="Delete this spend?"
        description={deleting ? `${formatPrice(deleting.amount)} on ${deleting.campaign}, ${dates(deleting)}.` : ""}
        confirmText="Delete"
        isPending={remove.isPending}
        variant="destructive"
      />
    </Card>
  );
}
