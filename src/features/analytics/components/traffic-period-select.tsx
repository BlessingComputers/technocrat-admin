"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AnalyticsPeriodSelect } from "./analytics-period-select";
import type { AnalyticsPeriod } from "../types/chart-analytics";

/**
 * The period dropdown for `/analytics`. The report is built on the server, so
 * the period lives in the URL (`?period=`, ADR-0005) and a change re-renders
 * the page; the transition keeps the current report on screen meanwhile.
 */
export function TrafficPeriodSelect({ value }: { value: AnalyticsPeriod }) {
  const router = useRouter();
  const pathname = usePathname();
  const [pending, startTransition] = useTransition();

  return (
    <div className={pending ? "pointer-events-none opacity-60" : undefined} aria-busy={pending}>
      <AnalyticsPeriodSelect
        value={value}
        onChange={(period) => startTransition(() => router.push(`${pathname}?period=${period}`))}
      />
    </div>
  );
}
