"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";

/**
 * A button that fires only after it is held: press and hold the pointer, or
 * hold Space or Enter, for `durationMs`. Release early and the fill drains
 * and nothing happens. For a one-way action where a second dialog would be
 * one dialog too many.
 *
 * The fill is the progress. Under reduced motion it moves in four steps
 * instead of a smooth sweep, and drains at once.
 */
export function HoldToConfirmButton({
  onConfirm,
  children,
  disabled,
  durationMs = 1200,
  className,
}: {
  onConfirm: () => void;
  children: ReactNode;
  disabled?: boolean;
  durationMs?: number;
  className?: string;
}) {
  const [holding, setHolding] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hintId = useId();

  const stop = () => {
    if (!timer.current) return;
    clearTimeout(timer.current);
    timer.current = null;
    setHolding(false);
  };

  const start = () => {
    if (disabled || timer.current) return;
    setHolding(true);
    timer.current = setTimeout(() => {
      timer.current = null;
      setHolding(false);
      onConfirm();
    }, durationMs);
  };

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const isHoldKey = (key: string) => key === " " || key === "Enter";

  return (
    <>
      <Button
        type="button"
        disabled={disabled}
        aria-describedby={hintId}
        onPointerDown={(e) => {
          if (e.button === 0) start();
        }}
        onPointerUp={stop}
        onPointerLeave={stop}
        onPointerCancel={stop}
        onBlur={stop}
        onContextMenu={(e) => e.preventDefault()}
        onKeyDown={(e) => {
          if (!isHoldKey(e.key)) return;
          // No click on Enter/Space: the hold is the only way through.
          e.preventDefault();
          if (!e.repeat) start();
        }}
        onKeyUp={(e) => {
          if (isHoldKey(e.key)) stop();
        }}
        className={cn(
          "relative isolate touch-none overflow-hidden select-none",
          className,
        )}
      >
        <span
          aria-hidden
          className={cn(
            "absolute inset-0 -z-10 origin-left bg-[color-mix(in_oklch,var(--primary)_78%,black)] transition-transform",
            holding
              ? "scale-x-100 ease-linear motion-reduce:[transition-timing-function:steps(4)]"
              : "scale-x-0 duration-300 ease-out motion-reduce:duration-0",
          )}
          style={holding ? { transitionDuration: `${durationMs}ms` } : undefined}
        />
        {children}
      </Button>
      <span id={hintId} className="sr-only">
        Press and hold to confirm. Holding Space or Enter also works.
      </span>
    </>
  );
}
