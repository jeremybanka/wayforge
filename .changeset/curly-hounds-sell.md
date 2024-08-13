---
"atom.io": patch
---

🐛 `atom.io/eslint-plugin` previously wouldn't catch cases of a selector calling its `get` toolkit function after an `await`, if that `get` was nested in a ternary. Now, it will catch these cases.
