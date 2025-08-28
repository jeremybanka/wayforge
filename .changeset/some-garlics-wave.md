---
"atom.io": patch
---

✨ `Realm.deallocate()` and `Realm.claim` now use transactions under the hood to guarantee that only one timeline checkpoint is created when running them.
