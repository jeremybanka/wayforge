---
"break-check": patch
---

Add an uncached `break-check prelude` command that resolves and fetches the selected release into a deterministic, atomically written, gitignored snapshot. Use `--baseline-file` to replay contracts from its exact commit without rediscovering remote tags, allowing task runners to cache compatibility checks while invalidating them for new releases or moved tags. Document Turbo deferred hashing and preserve ordinary single-command checks, certification, and test restoration.
