---
"atom.io": patch
---

🐛 Fix bug where, when applying a nested transaction, updates to mutable atoms would leak into the store before the outer transaction was applied.
