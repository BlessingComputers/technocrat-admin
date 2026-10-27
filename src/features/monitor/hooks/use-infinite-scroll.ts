"use client";

import { useCallback, useEffect, useRef } from "react";
import { getScrollContainer } from "../utils/scroll-container";

/** How far below the viewport the sentinel starts loading the next page.
 * ~1.5 screens of lead time, so the rows are already in the DOM by the time
 * the reader scrolls to them and the list never visibly stalls. */
const DEFAULT_ROOT_MARGIN = "0px 0px 1200px 0px";

interface UseInfiniteScrollOptions {
  /** Whether another page exists. No sentinel work happens when false. */
  hasNextPage: boolean;
  /** True while any page request is in flight — stops duplicate fetches. */
  isFetching: boolean;
  onLoadMore: () => void;
  rootMargin?: string;
}

/**
 * Attaches an IntersectionObserver to a sentinel element and calls
 * `onLoadMore` while that sentinel is near the viewport.
 *
 * The observer is torn down while a fetch is in flight and re-created after it
 * settles; if the sentinel is still inside the margin at that point the next
 * page fires again, so a fast scroll chains pages instead of stopping at one.
 */
export function useInfiniteScroll<T extends HTMLElement = HTMLDivElement>({
  hasNextPage,
  isFetching,
  onLoadMore,
  rootMargin = DEFAULT_ROOT_MARGIN,
}: UseInfiniteScrollOptions) {
  const sentinelRef = useRef<T>(null);
  const onLoadMoreRef = useRef(onLoadMore);

  useEffect(() => {
    onLoadMoreRef.current = onLoadMore;
  }, [onLoadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel || !hasNextPage || isFetching) return;

    // Older browsers (and jsdom) without IntersectionObserver fall back to the
    // "Load more" button the table always renders.
    if (typeof IntersectionObserver === "undefined") return;

    // The staff shell scrolls an inner `<main>`, so the root has to be that
    // element. With the default viewport root, `rootMargin` expands the
    // viewport box but NOT the ancestor's clip rect, so the sentinel would
    // only register once it truly scrolled into view and the lead time would
    // quietly vanish. Resolved per effect run, since the container only
    // becomes scrollable once enough rows have landed.
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          onLoadMoreRef.current();
        }
      },
      { root: getScrollContainer(sentinel), rootMargin },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetching, rootMargin]);

  /** Manual trigger for the visible "Load more" button. */
  const loadMore = useCallback(() => {
    if (hasNextPage && !isFetching) onLoadMoreRef.current();
  }, [hasNextPage, isFetching]);

  return { sentinelRef, loadMore };
}
