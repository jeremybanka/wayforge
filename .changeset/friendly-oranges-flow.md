---
"atom.io": patch
---

🐛 Fix bug where, when setting relations on a join in a nested transaction, adding and deleting relations could cause leaks to the outer store. Now these methods are properly encapsulated.
