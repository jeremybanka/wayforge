---
"comline": patch
---

Add `parse.async(argv)` alongside synchronous parsing to load configuration modules with top-level await, including asynchronous initialization in transitive imports. Preserve route-discriminated result types, config-only callbacks, strict validation before CLI overrides, and transformations of the merged original input. Import and initialization failures reject parsing, while help and completion remain independent of configuration loading. Synchronous parsing reports an actionable diagnostic when Node requires asynchronous module evaluation.
