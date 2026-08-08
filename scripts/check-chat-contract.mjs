/**
 * Verify the synced chat wire contract hasn't been hand-edited.
 *
 * The contract is owned by the backend repo (BlessingComputerBackend) and
 * copied here by its scripts/sync-chat-contract.mjs, which also writes the
 * .sha256 companion. If this check fails, DO NOT edit the local copy — edit
 * the backend's chat.contract.ts and re-run the sync script there.
 *
 * Usage: node scripts/check-chat-contract.mjs   (wired as check:chat-contract)
 */

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const contractPath = resolve(here, '..', 'src', 'features', 'chat', 'types', 'chat.contract.ts');

const contract = readFileSync(contractPath, 'utf8');
const expected = readFileSync(`${contractPath}.sha256`, 'utf8').trim();
// LF-normalized to match the sync script — git CRLF checkout can't break it.
const actual = createHash('sha256').update(contract.replace(/\r/g, '')).digest('hex');

if (actual !== expected) {
    console.error('chat.contract.ts does not match its checksum.');
    console.error('It was hand-edited or partially synced. Re-sync from the backend repo:');
    console.error('  (in BlessingComputerBackend/backend)  node scripts/sync-chat-contract.mjs');
    process.exit(1);
}
console.log('chat contract in sync.');
