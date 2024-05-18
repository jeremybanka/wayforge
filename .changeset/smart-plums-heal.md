---
"atom.io": patch
---

✨ `atom.io/immortal` adds the `seekState` function. This is an alternative to `findState`, which is not allowed in `immortal` stores. Instead of implicitly initializing a state that doesn't exist as `findState` does, `seekState` will simply return `undefined` in this case.
