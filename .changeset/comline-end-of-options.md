---
"comline": patch
---

Stop parsing options after the first `--` delimiter and preserve route arguments
before it. Treat all subsequent tokens as positional arguments.
