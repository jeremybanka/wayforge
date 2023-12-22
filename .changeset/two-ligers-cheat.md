---
"atom.io": patch
---

♻️ `atom.io/data` `join` States for singular keys or entries now return `null` instead of `undefined` for ease of use in contexts where serialization is necessary.