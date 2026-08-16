// Generate src/types/api.d.ts from the backend's OpenAPI spec (ADR-0006).
//
// Source order:
//   1. $API_DOCS_URL, else `<backend origin>/api-docs.json` where the origin is
//      the single backend seam, NEXT_PUBLIC_BACKEND_URL (ADR-0015) — fetched
//      live. No host is hardcoded here: repointing the app must also repoint
//      codegen, or the types would silently come from the previous backend.
//   2. scripts/api-docs.json — the committed snapshot, used when the URL is
//      unreachable (offline / CI without network) so the build stays hermetic.
//
// The generated d.ts is committed; regenerate after a backend contract change
// (never in the hot `npm run dev` loop). Codegen owns OUTPUT/response types;
// Zod owns request/form inputs (ADR-0006).

import { execFileSync } from "node:child_process";
import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { backendOrigin } from "./backend-origin.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const SNAPSHOT = resolve(here, "api-docs.json");
const OUT = resolve(here, "../src/types/api.d.ts");
const URL =
  process.env.API_DOCS_URL || `${backendOrigin()}/api-docs.json`;

async function loadSpec() {
  try {
    const res = await fetch(URL, { signal: AbortSignal.timeout(30_000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const text = await res.text();
    JSON.parse(text); // validate it's JSON before trusting it
    writeFileSync(SNAPSHOT, text); // refresh the committed snapshot
    console.log(`✔ fetched live spec from ${URL}`);
    return SNAPSHOT;
  } catch (err) {
    console.warn(`⚠ live fetch failed (${err.message}); using snapshot`);
    readFileSync(SNAPSHOT, "utf8"); // throws if the snapshot is missing too
    return SNAPSHOT;
  }
}

const source = await loadSpec();
execFileSync(
  process.execPath,
  [resolve(here, "../node_modules/openapi-typescript/bin/cli.js"), source, "-o", OUT],
  { stdio: "inherit" },
);
console.log(`✔ wrote ${OUT}`);
