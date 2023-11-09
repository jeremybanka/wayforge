---
"atom.io": patch
---

🐛 Fix a race condition that could, in some cases, cause an async selector to resolve and cache after its value had already been evicted by upstream changes.
