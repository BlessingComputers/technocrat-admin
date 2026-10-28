/**
 * Resolve the backend origin for dev-time scripts (ADR-0015).
 *
 * The app reads `NEXT_PUBLIC_BACKEND_URL` through Next's env loading; scripts
 * run under plain node and get none of that, so they parse the env files
 * themselves. Same one variable, same single seam — codegen must never hardcode
 * a host, or "point the app at a new backend" would silently regenerate types
 * from the old one.
 *
 * Precedence: process env → .env.development → .env.production → .env.
 * Deliberately no `.env.local`: it does not exist in this app by policy.
 *
 * Dependency-free on purpose (mirrors src/config/env.ts). The env files are
 * plain `KEY=value` with `#` comments — no quoting or interpolation to support.
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const FILES = ['.env.development', '.env.production', '.env'];

function readFromEnvFiles(key) {
    for (const file of FILES) {
        let text;
        try {
            text = readFileSync(resolve(ROOT, file), 'utf8');
        } catch {
            continue; // missing file is normal
        }
        for (const line of text.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed || trimmed.startsWith('#')) continue;
            const eq = trimmed.indexOf('=');
            if (eq === -1) continue;
            if (trimmed.slice(0, eq).trim() !== key) continue;
            const value = trimmed.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
            if (value) return { value, source: file };
        }
    }
    return undefined;
}

/**
 * @returns {string} backend origin, no trailing slash.
 * @throws if the seam variable is set nowhere — better a loud failure than
 *         quietly regenerating types against a stale hardcoded host.
 */
export function backendOrigin() {
    const key = 'NEXT_PUBLIC_BACKEND_URL';
    const fromProcess = process.env[key];
    const found = fromProcess
        ? { value: fromProcess, source: 'process env' }
        : readFromEnvFiles(key);

    if (!found) {
        throw new Error(
            `Missing ${key}. It is the single backend seam (ADR-0015) — set it in ` +
            `.env.development (see ARCHITECTURE.md) or pass it inline:\n` +
            `  ${key}=https://your-backend npm run gen:api`,
        );
    }

    console.log(`backend origin: ${found.value}  (from ${found.source})`);
    return found.value.replace(/\/+$/, '');
}
