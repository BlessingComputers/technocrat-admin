const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? "" : "s"}`;

/**
 * "7 uploads + 3 updates": the split behind one total. Shared by the analytics
 * (uploads) and rewards slices, which may not import each other.
 */
export function workSplitLabel(uploads: number, updates: number): string {
  return `${plural(uploads, "upload")} + ${plural(updates, "update")}`;
}
