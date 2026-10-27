"use client";

import { useCallback, useRef } from "react";
import { getScrollContainer, scrollToTop } from "../utils/scroll-container";

/**
 * Returns a ref to drop on the page wrapper plus a `scrollToTop` that drives
 * whichever element actually scrolls it (the shell's `<main>`, not the window).
 *
 * The container is resolved at call time, not on mount: a page whose first
 * render is short only becomes scrollable once rows arrive.
 */
export function useScrollToTop<T extends HTMLElement = HTMLDivElement>() {
  const anchorRef = useRef<T>(null);

  const scroll = useCallback(() => {
    scrollToTop(getScrollContainer(anchorRef.current));
  }, []);

  return { anchorRef, scrollToTop: scroll };
}
