---
"atom.io": patch
---

🐛 Fix bug where, when nesting transactions, mutable atoms modified in the child would not be carried up to the parent, meaning subsequent reads in the parent or other children would retrieve a stale value. The value will now be carried up correctly.
