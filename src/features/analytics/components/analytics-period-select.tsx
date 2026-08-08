"use client";

import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils/cn";
import type { AnalyticsPeriod } from "../types/chart-analytics";

const PERIODS: { value: AnalyticsPeriod; label: string }[] = [
  { value: "7d", label: "7 Days" },
  { value: "30d", label: "30 Days" },
  { value: "90d", label: "90 Days" },
  { value: "12m", label: "12 Months" },
];

interface AnalyticsPeriodSelectProps {
  value: AnalyticsPeriod;
  onChange: (period: AnalyticsPeriod) => void;
}

/** Compact dropdown for the chart window (7 Days / 30 Days / 90 Days / 12 Months). */
export function AnalyticsPeriodSelect({
  value,
  onChange,
}: AnalyticsPeriodSelectProps) {
  const current = PERIODS.find((p) => p.value === value) ?? PERIODS[1];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="h-9 gap-2 rounded-lg text-xs font-medium uppercase tracking-wide"
        >
          <AppIcon icon="solar:calendar-linear" className="size-4 text-primary" />
          {current.label}
          <AppIcon
            icon="solar:alt-arrow-down-linear"
            className="size-3.5 text-muted-foreground"
          />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-40 rounded-xl">
        {PERIODS.map((p) => (
          <DropdownMenuItem
            key={p.value}
            onClick={() => onChange(p.value)}
            className={cn(
              "cursor-pointer text-xs font-medium uppercase tracking-wide",
              value === p.value && "text-primary",
            )}
          >
            {p.label}
            {value === p.value && (
              <AppIcon
                icon="solar:check-circle-bold"
                className="ml-auto size-4 text-primary"
              />
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
