---
"comline": patch
---

Stop parsing options after the first `--` delimiter and preserve route arguments
before it. Treat all subsequent tokens as positional arguments.

Identify runtime and script arguments explicitly so a directory containing the
CLI name cannot shift the positional route. Preserve direct scripts and Windows
executable paths.
