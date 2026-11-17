import { useEffect, useState } from "react";

/**
 * `value`, held back until it has stopped changing for `delayMs`.
 *
 * Compare by a stable key (a string or a JSON string), not by an object made
 * on every render, or the timer restarts on every render and never fires.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(id);
  }, [value, delayMs]);
  return debounced;
}
