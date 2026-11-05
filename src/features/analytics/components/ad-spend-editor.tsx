"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAdSpend, useCreateAdSpend, useUpdateAdSpend } from "../api/ad-spend.queries";
import { PERIOD_DAYS, spendWindow } from "../model/ad-spend";
import type { AnalyticsPeriod } from "../types/chart-analytics";
import { AdSpendForm } from "./ad-spend-form";

const listHref = (period: AnalyticsPeriod) => `/analytics/spend?period=${period}`;

export function AdSpendCreate({ period }: { period: AnalyticsPeriod }) {
  const router = useRouter();
  const create = useCreateAdSpend();
  return (
    <AdSpendForm
      backHref={listHref(period)}
      pending={create.isPending}
      submitLabel="Log spend"
      onSubmit={(body) => create.mutate(body, { onSuccess: () => router.push(listHref(period)) })}
    />
  );
}

/** No GET by id: read the list the edit link came from and find the entry there. */
export function AdSpendEdit({ id, period }: { id: string; period: AnalyticsPeriod }) {
  const router = useRouter();
  const update = useUpdateAdSpend();
  const { data: entries, isPending } = useAdSpend(spendWindow(PERIOD_DAYS[period]));
  const entry = entries?.find((e) => e.id === id);

  if (isPending) return <p className="py-10 text-center text-sm text-muted-foreground">Loading…</p>;
  if (!entry) {
    return (
      <p className="py-10 text-center text-sm text-muted-foreground">
        This entry isn&apos;t in the {period} list any more. It may have been deleted.{" "}
        <Link href={listHref(period)} className="text-foreground underline-offset-2 hover:underline">
          Back to ad spend
        </Link>
      </p>
    );
  }

  return (
    <AdSpendForm
      entry={entry}
      backHref={listHref(period)}
      pending={update.isPending}
      submitLabel="Save changes"
      onSubmit={(body) => update.mutate({ id, body }, { onSuccess: () => router.push(listHref(period)) })}
    />
  );
}
