---
"comline": patch
---

Add shared argument interpretation and shell-neutral completion APIs with cursor
replacement ranges, raw option occurrences, schema-derived choices, declarative
file and positional hints, and opt-in asynchronous providers. Support additional
long aliases and explicit value-consumption kinds in execution and completion.

Deduplicate equivalent completion hints without collapsing distinct providers,
preserve candidate spacing across ambiguous targets, combine filesystem hints
independently of route order, and complete grouped inline flags before command
selection using the existing parser semantics.
