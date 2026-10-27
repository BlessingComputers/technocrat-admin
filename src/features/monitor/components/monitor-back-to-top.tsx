"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { AppIcon } from "@/components/shared/app-icon";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import {
  getScrollContainer,
  getScrollTop,
  scrollToTop,
} from "../utils/scroll-container";

/** Roughly one screen of scrolling before the control earns its place. */
const DEFAULT_THRESHOLD = 800;

interface MonitorBackToTopProps {
  /** Scroll distance, in px, before the button appears. */
  threshold?: number;
}

/**
 * "Back to top" control for the log lists, which run to thousands of rows once
 * infinite scroll has appended a few pages.
 *
 * Positioned `sticky` rather than `fixed`: the shell scrolls an inner
 * `<main>`, so sticky pins the button to the bottom of the scrollport for free
 * and keeps it aligned to the content column instead of the viewport edge (and
 * off the reserved scrollbar gutter).
 */
export function MonitorBackToTop({
  threshold = DEFAULT_THRESHOLD,
}: MonitorBackToTopProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const anchor = anchorRef.current;
    if (!anchor) return;

    let frame = 0;

    /* Scroll events don't bubble, so listen on the capture phase at document
     * level: that catches the shell's `<main>` without having to resolve it up
     * front (it isn't scrollable until enough rows have loaded), and it keeps
     * working if the layout's scroller ever moves. Events from unrelated
     * scrollers — the sidebar, an open menu — are filtered out by the
     * containment check. */
    const handleScroll = (event: Event) => {
      const scroller =
        event.target instanceof HTMLElement ? event.target : null;
      if (scroller && !scroller.contains(anchor)) return;
      if (frame) return;

      frame = requestAnimationFrame(() => {
        frame = 0;
        setVisible(getScrollTop(scroller) > threshold);
      });
    };

    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });

    return () => {
      document.removeEventListener("scroll", handleScroll, { capture: true });
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);

  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      scrollToTop(getScrollContainer(anchorRef.current));
      // The button hides itself once the scroll lands, so don't strand focus
      // on it. Dropping focus also restarts tabbing from the top of the page,
      // which is where the reader just asked to go.
      event.currentTarget.blur();
    },
    [],
  );

  return (
    <div
      ref={anchorRef}
      className="pointer-events-none sticky bottom-6 z-30 flex h-0 justify-end"
    >
      {/* The lift that clears the zero-height sticky line is static, so the
          entry animation is a short 8px rise rather than a full button height. */}
      <div className="-translate-y-full">
        <Button
          type="button"
          variant="outline"
          onClick={handleClick}
          aria-hidden={!visible}
          tabIndex={visible ? 0 : -1}
          className={cn(
            "rounded-full border-border bg-card px-4 font-medium text-xs shadow-soft-lg transition-all duration-200",
            visible
              ? "pointer-events-auto translate-y-0 opacity-100"
              : "pointer-events-none translate-y-2 opacity-0",
          )}
        >
          <AppIcon icon="solar:alt-arrow-up-linear" className="size-4" />
          Back to top
        </Button>
      </div>
    </div>
  );
}
