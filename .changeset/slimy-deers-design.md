---
"atom.io": patch
---

✨ `atom.io/introspection` now includes a new experimental `Auditor` class. This is a tool for long-running instances, where there is a concern that the store may be holding onto resources that are no longer needed. By running `Auditor.listResources()`, you can get a list of all state tokens that belong to families in the store, along with their creation time.