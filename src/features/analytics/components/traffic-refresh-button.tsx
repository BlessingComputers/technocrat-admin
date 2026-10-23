"use client";

import { useTransition } from "react";
import { RefreshButton } from "@/components/shared/refresh-button";
import { refreshTrafficAction } from "../api/traffic.actions";

/** Skips the five-minute cache and rebuilds the report from PostHog now. */
export function TrafficRefreshButton() {
  const [pending, startTransition] = useTransition();

  return (
    <RefreshButton
      onRefresh={() => startTransition(() => refreshTrafficAction())}
      isRefreshing={pending}
      label="Refresh"
      className="h-9 rounded-lg"
    />
  );
}
