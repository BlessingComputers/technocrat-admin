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

---


<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
