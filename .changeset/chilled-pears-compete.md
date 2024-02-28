---
"atom.io": patch
---

🐛 When retrieving a value from the cache during a transaction, it was possible to get the version of that value belonging to the underlying store, which could be problematic for mutable atoms. Now, when retrieving a mutable atom in this situation, the value will always be a fresh copy.
