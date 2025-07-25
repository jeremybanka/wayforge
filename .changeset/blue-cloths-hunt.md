---
"atom.io": patch
---

✨ `atom.io` adds a new `resetState` function, which sets an atom to its default value. It also sets a writable selector to its default value, by setting all of its root atoms to its defaults. Look for new `resetState` and `reset` methods on `Silo` and `ActorToolkit` respectively.
