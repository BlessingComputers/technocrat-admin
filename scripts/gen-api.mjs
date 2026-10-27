// Generate src/types/api.d.ts from the backend's OpenAPI spec (ADR-0006).
//
// Source order:
//   1. $API_DOCS_URL, else `<backend origin>/api-docs.json` where the origin is
//      the single backend seam, NEXT_PUBLIC_BACKEND_URL — fetched
//      live. No host is hardcoded here: repointing the app must also repoint
//      codegen, or the types would silently come from the previous backend.
//   2. scripts/api-docs.json — the committed snapshot, used when the URL is
//      unreachable (offline / CI without network) so the build stays hermetic.
//
// The live spec needs `x-api-docs-token` on the borrowed Blessing backend since
// `68680de` (ask 32). The token lives in `.env.codegen` and is bound to one
// host, so repointing the seam at Technocrat's own backend stops sending it.
// With a token sent, a 401 or 403 fails the run instead of quietly falling
// back to a stale snapshot.
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
const DOCS_URL =
  process.env.API_DOCS_URL || `${backendOrigin()}/api-docs.json`;

/**
 * A value from the process env, else from `.env.codegen` at the app root.
 * That file is git-ignored by `.env*` and is not a name Next loads, so it sits
 * outside the no-`.env.local` policy in backend-origin.mjs.
 */
function readCodegenEnv(key) {
  if (process.env[key]) return process.env[key];
  let text;
  try {
    text = readFileSync(resolve(here, "../.env.codegen"), "utf8");
  } catch {
    return undefined; // no file: fetch anonymously
  }
  for (const line of text.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq !== -1 && trimmed.slice(0, eq).trim() === key) {
      return trimmed.slice(eq + 1).trim() || undefined;
    }
  }
  return undefined;
}

/** The token header, only for the host the token belongs to. */
function docsHeaders() {
  const token = readCodegenEnv("API_DOCS_TOKEN");
  if (!token) return {};
  const host = readCodegenEnv("API_DOCS_TOKEN_HOST");
  const target = new URL(DOCS_URL).host;
  if (host !== target) {
    console.warn(
      `⚠ API_DOCS_TOKEN is for ${host ?? "an unset API_DOCS_TOKEN_HOST"}; not sending it to ${target}`,
    );
    return {};
  }
  return { "x-api-docs-token": token };
}

async function loadSpec() {
  const headers = docsHeaders();
  const withToken = "x-api-docs-token" in headers;
  let res;
  try {
    res = await fetch(DOCS_URL, { headers, signal: AbortSignal.timeout(30_000) });
  } catch (err) {
    return loadSnapshot(err.message);
  }

  if (withToken && (res.status === 401 || res.status === 403)) {
    console.error(
      `✖ ${DOCS_URL} refused the docs token (HTTP ${res.status}). ` +
        "Check API_DOCS_TOKEN in .env.codegen against the backend's. Not falling back.",
    );
    process.exit(1);
  }
  if (!res.ok) {
    return loadSnapshot(
      res.status === 401
        ? "HTTP 401: set API_DOCS_TOKEN in .env.codegen"
        : `HTTP ${res.status}`,
    );
  }

  const text = await res.text();
  JSON.parse(text); // validate it's JSON before trusting it
  writeFileSync(SNAPSHOT, text); // refresh the committed snapshot
  console.log(`✔ fetched live spec from ${DOCS_URL}${withToken ? " (docs token)" : ""}`);
  return SNAPSHOT;
}

function loadSnapshot(reason) {
  console.warn(`⚠ live fetch failed (${reason}); using snapshot`);
  readFileSync(SNAPSHOT, "utf8"); // throws if the snapshot is missing too
  return SNAPSHOT;
}

const source = await loadSpec();
execFileSync(
  process.execPath,
  [resolve(here, "../node_modules/openapi-typescript/bin/cli.js"), source, "-o", OUT],
  { stdio: "inherit" },
);
console.log(`✔ wrote ${OUT}`);
