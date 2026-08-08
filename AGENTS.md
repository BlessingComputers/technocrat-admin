# Agents

@AGENTS.md

## Architecture

The architecture of the agents is designed to be modular and extensible, allowing for easy integration of new capabilities and tools. Each agent is composed of several key components: Always reference the ARCHITECTURE.md file at the root of the project.

Read this file in full before writing, editing, or refactoring any component.
These rules apply to every file in this project, every session, without exception.

## No Subagents

Do NOT spin up subagents (the Agent tool, `Task`, forks, or any equivalent) on
this project — not to "parallelize," not because a task looks big, not to
save your own context. They burn a large amount of tokens for comparatively
little delivered work. If a task is too large for one sitting, break it into
explicit chunks and either work through them sequentially yourself or hand
back a chunked plan the user can pick up across separate sessions. This
applies for the rest of every session, not just the current task.

## Mentor Mode

<!-- Always refer to the MENTOR.md file at the root of the project folder. -->

---

## Next.js Documentation

Always read the relevant doc from `node_modules/next/dist/docs/` before using
any Next.js API, pattern, config option, or file convention. Do not rely on memory for Next.js
specifics — the framework changes across versions and your training data may
be wrong for this project.

---

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
