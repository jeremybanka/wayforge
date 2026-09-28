---
"workflowup": patch
---

Add a Node CLI and TypeScript API for upgrading GitHub Actions to stable release commit SHAs and updating pinned mise inputs, with dry runs, annotated-tag resolution, and preservation of workflow comments and formatting. Enforce immutable remote action references: resolve release tags to full commit SHAs, require Docker action digests, and reject mutable or unsupported references before writing files.
