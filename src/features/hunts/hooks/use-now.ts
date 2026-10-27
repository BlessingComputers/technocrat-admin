"use client";

import { useEffect, useState } from "react";

/**
 * The clock, re-read every `intervalMs`.
 *
 * The monitor's labels depend on time passing as well as on data: a drop goes
 * live and a hold's deadline passes without the server saying anything new.
 * Ticking at the poll interval keeps the labels as fresh as the data.
 */
export function useNow(intervalMs: number): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);

  return now;
}
