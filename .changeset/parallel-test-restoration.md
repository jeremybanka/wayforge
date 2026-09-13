---
"break-check": patch
---

Run checks for disjoint public test paths in parallel without stashing other packages' changes. Coordinate Git setup and cleanup, recognize test paths owned by active checks, and restore only the tests replaced by each invocation. Preserve the Git index, existing stashes, file permissions, unrelated changes, and command outputs. Reject overlapping checks and protect existing ignored files from being overwritten by release-only tests.
