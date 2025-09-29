---
"atom.io": patch
---

✨ Add `oListDisposedKeyCleanupEffect` to `atom.io/transceivers/o-list`. This effect is designed for a `OList` atom given the role of holding the keys of entities in your program. Whenever a new value is added to a `OList` with this effect, if that value has been previously allocated, it will be removed when it is disposed (deallocated).
