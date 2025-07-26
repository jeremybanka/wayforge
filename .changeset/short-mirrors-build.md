---
"atom.io": patch
---

🐛 Fixed an issue where resetting states that belong to a family wouldn't cause them to re-execute their `default` function, in the case `default` is defined as a function `(key) => T`.
