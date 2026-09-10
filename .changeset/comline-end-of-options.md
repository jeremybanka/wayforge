---
"comline": minor
"break-check": patch
"flightdeck": patch
"varmint": patch
---

Stop parsing options after the first `--` delimiter and preserve route arguments
before it. Treat all subsequent tokens as positional arguments.

Breaking: explicit CLI input now contains command words only. Calling a configured
CLI with no arguments reads `process.argv.slice(2)`. Replace `myCli(process.argv)`
with `myCli()` or `myCli(process.argv.slice(2))`; callers with other argv layouts
must supply their command words explicitly. Remove invocation-name heuristics and
migrate the workspace CLI entry points to the explicit input contract.
