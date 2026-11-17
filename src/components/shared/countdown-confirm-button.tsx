"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * A button that fires `durationMs` after one click. While it counts down,
 * the fill sweeps across and the label shows the seconds left; a second
 * click cancels. For a one-way action where a second dialog would be one
 * dialog too many.
 *
 * Under reduced motion the fill moves in steps instead of a smooth sweep,
 * and drains at once.
 */
export function CountdownConfirmButton({
  onConfirm,
  children,
  disabled,
  durationMs = 5000,
  className,
}: {
  onConfirm: () => void;
  children: ReactNode;
  disabled?: boolean;
  durationMs?: number;
  className?: string;
}) {
  const totalSeconds = Math.ceil(durationMs / 1000);
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ticker = useRef<ReturnType<typeof setInterval> | null>(null);
  const hintId = useId();
  const counting = secondsLeft !== null;

  const clear = () => {
    if (timer.current) clearTimeout(timer.current);
    if (ticker.current) clearInterval(ticker.current);
    timer.current = null;
    ticker.current = null;
  };

  const cancel = () => {
    clear();
    setSecondsLeft(null);
  };

  const start = () => {
    setSecondsLeft(totalSeconds);
    ticker.current = setInterval(
      () => setSecondsLeft((s) => (s && s > 1 ? s - 1 : s)),
      1000,
    );
    timer.current = setTimeout(() => {
      clear();
      setSecondsLeft(null);
      onConfirm();
    }, durationMs);
  };

  useEffect(() => clear, []);

  return (
    <>
      <Button
        type="button"
        disabled={disabled}
        aria-describedby={hintId}
        onClick={() => (counting ? cancel() : start())}
        className={cn("relative isolate overflow-hidden select-none", className)}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10 origin-left bg-[color-mix(in_oklch,var(--primary)_78%,black)] transition-transform",
            counting
              ? "scale-x-100 ease-linear motion-reduce:[transition-timing-function:steps(5)]"
              : "scale-x-0 duration-300 ease-out motion-reduce:duration-0",
          )}
          style={counting ? { transitionDuration: `${durationMs}ms` } : undefined}
        />
        {counting ? (
          <span className="tabular-nums">
            Saving in {secondsLeft}s · click to cancel
          </span>
        ) : (
          children
        )}
      </Button>
      <span id={hintId} className="sr-only" aria-live="polite">
        {counting
          ? `Saving in ${totalSeconds} seconds. Press again to cancel.`
          : `Saves ${totalSeconds} seconds after you press it. Press again to cancel.`}
      </span>
    </>
  );
}
