# Agents

## Architecture

`ARCHITECTURE.md` at the project root holds the slice rules and the import
table. Read it before creating, moving, or restructuring a component.

## No Subagents

Do NOT spin up subagents (the Agent tool, `Task`, forks, or any equivalent) on
this project — not to "parallelize," not because a task looks big, not to
save your own context. They burn a large amount of tokens for comparatively
little delivered work. If a task is too large for one sitting, break it into
explicit chunks and either work through them sequentially yourself or hand
back a chunked plan the user can pick up across separate sessions. This
applies for the rest of every session, not just the current task.

## Rules and what enforces them

When a rule here has no enforcement and an agent breaks it again, add the
enforcement in the same change.

| Rule | Enforced by |
| --- | --- |
| Write icon names as literal `solar:<name>` / `brand:<name>` strings. Never build them with templates. | `scripts/build-icons.mjs` (predev, prebuild) builds the subset from src/ and fails on unknown names. |
| Feature code imports another slice only through its `index.ts`. | `eslint-plugin-boundaries` in `eslint.config.mjs` (`npm run lint`). |
| Do not write a local `unwrap`/`unwrapEnvelope` in a service. Four copies exist (chat, whatsapp, tax, sales-notifications). | Nothing yet. Next: make `src/lib/api/client.ts` peel every backend envelope shape, then delete the copies. |
| Port Blessing admin changes by 3-way merge or by hand. Never copy UI files over; 52117ed lost the restyle that way (restored in 24f9f92). | Nothing; judgment rule. |
| No subagents. | Nothing; judgment rule (see above). |

---


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
