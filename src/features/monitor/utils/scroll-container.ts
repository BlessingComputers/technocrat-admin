/**
 * Scroll-container helpers.
 *
 * The staff shell does NOT scroll the window: `(staff)/layout.tsx` pins the
 * inset to `h-screen overflow-hidden` and scrolls an inner `<main>`. So
 * `window.scrollY` is always 0 here and `window.scrollTo` is a no-op — both the
 * infinite-scroll sentinel and the back-to-top control have to find the real
 * scroller instead of assuming the viewport.
 */

/** Nearest scrollable ancestor of `from`, or `null` when the window scrolls.
 *
 * The `scrollHeight > clientHeight` test is load-bearing: the log table's card
 * sets `overflow-x-auto`, and CSS computes the other axis to `auto` alongside
 * it, so the card would otherwise look like a vertical scroller when it has no
 * vertical overflow at all. */
export function getScrollContainer(from: HTMLElement | null): HTMLElement | null {
  let node = from?.parentElement ?? null;

  while (node) {
    const { overflowY } = window.getComputedStyle(node);
    const scrollable = overflowY === "auto" || overflowY === "scroll";

    if (scrollable && node.scrollHeight > node.clientHeight) return node;
    node = node.parentElement;
  }

  return null;
}

/** Current scroll offset of a container, falling back to the window. */
export function getScrollTop(container: HTMLElement | null): number {
  return container ? container.scrollTop : window.scrollY;
}

/** Sends a container (or the window) back to the top, honouring the reader's
 * reduced-motion preference. */
export function scrollToTop(container: HTMLElement | null): void {
  const prefersReducedMotion = window.matchMedia(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  const options: ScrollToOptions = {
    top: 0,
    behavior: prefersReducedMotion ? "auto" : "smooth",
  };

  if (container) container.scrollTo(options);
  else window.scrollTo(options);
}
