import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    // Default stays node for pure unit tests; hook/component tests opt into
    // jsdom per-file via a `// @vitest-environment jsdom` docblock.
    environment: "node",
    // jsdom defaults to an opaque about:blank origin, where localStorage/
    // sessionStorage don't exist (lib/api/client.ts needs them for the
    // cross-tab refresh guard).
    environmentOptions: { jsdom: { url: "http://localhost:3000" } },
    include: ["src/**/*.test.{ts,tsx}"],
    // lib/api/endpoints.ts calls serverEnv() on import in a node environment.
    env: { API_BASE_URL: "http://test.local" },
    // Repairs jsdom's storage globals, which Node 22+'s own experimental
    // localStorage/sessionStorage otherwise shadow with undefined.
    setupFiles: ["./vitest.setup.ts"],
  },
});
