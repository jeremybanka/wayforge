---
"atom.io": patch
---

✨ Add `uListDisposedKeyCleanupEffect` to `atom.io/transceivers/u-list`. This effect is designed for a `UList` atom given the role of holding the keys of entities in your program. Whenever a new value is added to a `UList` with this effect, if that value has been previously allocated, it will be removed when it is disposed (deallocated).
