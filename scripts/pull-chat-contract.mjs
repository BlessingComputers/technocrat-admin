/**
 * Pull the chat wire contract from the backend repo.
 *
 * The contract is owned by the backend (a separate repo, separate developer):
 *   https://github.com/TechnocratBlessingComputersBackend/BlessingComputerBackend
 *   → backend/src/modules/chats/chat.contract.ts
 *
 * This script fetches that file and writes the local copy plus its sha256
 * (which `npm run check:chat-contract` verifies). Never hand-edit the copy.
 *
 * Source order (first that works wins):
 *   1. --from <path>            — a local backend checkout
 *   2. the DEPLOYED backend     — $CHAT_CONTRACT_URL or the default below,
 *                                 mirroring gen-api.mjs; types match what is
 *                                 actually serving in production
 *   3. GitHub at --ref (default main) — gh CLI, then GITHUB_TOKEN
 *
 * Usage:
 *   npm run pull:chat-contract
 *   npm run pull:chat-contract -- --ref dev     # GitHub branch/tag/sha fallback
 *   npm run pull:chat-contract -- --from <path> # local backend checkout
 */

import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const OWNER_REPO = 'TechnocratBlessingComputersBackend/BlessingComputerBackend';
const CONTRACT_REPO_PATH = 'backend/src/modules/chats/chat.contract.ts';

const here = dirname(fileURLToPath(import.meta.url));
const LOCAL_COPY = resolve(here, '..', 'src', 'features', 'chat', 'types', 'chat.contract.ts');

function arg(name) {
    const i = process.argv.indexOf(name);
    return i !== -1 ? process.argv[i + 1] : undefined;
}

async function fetchContract() {
    const from = arg('--from');
    if (from) {
        console.log(`reading local file: ${from}`);
        return readFileSync(resolve(from), 'utf8');
    }

    // Deployed backend first — same pattern as gen-api.mjs, and it types the
    // frontend against the contract that is actually serving.
    const deployedUrl =
        process.env.CHAT_CONTRACT_URL ||
        'https://hard-berty-elijay-27db4d69.koyeb.app/chat.contract.ts';
    try {
        console.log(`fetching deployed contract: ${deployedUrl}`);
        const res = await fetch(deployedUrl, { signal: AbortSignal.timeout(30_000) });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const text = await res.text();
        if (!text.includes('CHAT_CONTRACT_VERSION')) throw new Error('response is not the contract');
        return text;
    } catch (err) {
        console.warn(`deployed fetch failed (${err.message}); falling back to GitHub`);
    }

    const ref = arg('--ref') ?? process.env.CHAT_CONTRACT_REF ?? 'main';
    const apiPath = `repos/${OWNER_REPO}/contents/${CONTRACT_REPO_PATH}?ref=${ref}`;

    // 1) gh CLI (handles auth for private repos on dev machines)
    try {
        console.log(`fetching via gh: ${OWNER_REPO}@${ref}`);
        return execFileSync(
            'gh', ['api', '-H', 'Accept: application/vnd.github.raw', apiPath],
            { encoding: 'utf8', maxBuffer: 10 * 1024 * 1024 },
        );
    } catch {
        // fall through to token fetch
    }

    // 2) GITHUB_TOKEN (CI)
    const token = process.env.GITHUB_TOKEN;
    if (!token) {
        console.error('Could not fetch: gh CLI unavailable/unauthenticated and GITHUB_TOKEN not set.');
        console.error('Options: install+login gh, set GITHUB_TOKEN, or pass --from <local path>.');
        process.exit(1);
    }
    console.log(`fetching via API token: ${OWNER_REPO}@${ref}`);
    const res = await fetch(`https://api.github.com/${apiPath}`, {
        headers: {
            Accept: 'application/vnd.github.raw',
            Authorization: `Bearer ${token}`,
        },
    });
    if (!res.ok) {
        console.error(`GitHub API responded ${res.status} ${res.statusText}`);
        process.exit(1);
    }
    return res.text();
}

const contract = await fetchContract();
// Hash over LF-normalized content so git's CRLF checkout normalization
// (core.autocrlf) can't invalidate the checksum on a fresh clone.
const hash = createHash('sha256').update(contract.replace(/\r/g, '')).digest('hex');

writeFileSync(LOCAL_COPY, contract, 'utf8');
writeFileSync(`${LOCAL_COPY}.sha256`, `${hash}\n`, 'utf8');
console.log(`updated: ${LOCAL_COPY}`);
console.log(`contract sha256: ${hash}`);
