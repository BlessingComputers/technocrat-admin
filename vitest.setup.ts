/**
 * Node 22+ defines its own experimental `localStorage`/`sessionStorage`
 * getters on `globalThis` (undefined unless Node runs with
 * `--localstorage-file`). They shadow jsdom's storages when Vitest populates
 * the global object, so bare `localStorage.getItem(...)` in production code
 * (e.g. lib/api/client.ts cross-tab refresh guard) explodes under the jsdom
 * environment. Replace them with a plain in-memory Storage. Fresh per test
 * file (Vitest isolates environments); clear in beforeEach within a file if
 * a test depends on a clean slate.
 */

import { afterEach } from "vitest";
import { cleanup } from "@testing-library/react";

// RTL only auto-registers its DOM cleanup when Vitest globals are enabled
// (they aren't) — without this, one test's tree leaks into the next.
afterEach(() => cleanup());

function createMemoryStorage(): Storage {
  let store = new Map<string, string>();
  return {
    get length() {
      return store.size;
    },
    clear: () => {
      store = new Map();
    },
    getItem: (key: string) => store.get(key) ?? null,
    key: (index: number) => [...store.keys()][index] ?? null,
    removeItem: (key: string) => {
      store.delete(key);
    },
    setItem: (key: string, value: string) => {
      store.set(key, String(value));
    },
  };
}

if (typeof window !== "undefined") {
  for (const key of ["localStorage", "sessionStorage"] as const) {
    if (!globalThis[key]) {
      Object.defineProperty(globalThis, key, {
        value: createMemoryStorage(),
        configurable: true,
        writable: true,
      });
    }
  }
}
