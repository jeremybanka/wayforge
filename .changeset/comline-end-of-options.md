---
"comline": minor
---

Stop parsing options after the first `--` delimiter and preserve route arguments
before it. Treat all subsequent tokens as positional arguments.

Accept full `process.argv` explicitly and use the standard runtime/entry-point
boundary instead of guessing invocation names. This works for direct and global
commands and for Node, Bun, pnpm, and mise launches.

Breaking: calls with full `process.argv` remain unchanged; callers supplying
command words alone must select `{ from: "user" }`. Remove the ambiguous
invocation-name heuristics.
