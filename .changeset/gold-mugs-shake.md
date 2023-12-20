---
"atom.io": patch
---

🐛 The `set` transactor now enforces the type of your state properly, which could lead to type errors in existing `transactor` and `selector` code.