---
"atom.io": patch
---

🐛 Fixed an issue where, when applying a transaction in which a mutable atom was created, atom.io would attempt to re-create that atom twice, which led to a pesky error log.
