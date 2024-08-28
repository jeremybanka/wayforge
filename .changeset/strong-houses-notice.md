---
"atom.io": patch
---

🐛 `atom.io/devtools` The selector index would previously only be created on the `IMPLICIT.STORE`, not the passed store, which could result in the state being unavailable when using a custom `Silo`. Now, that state will be created on whichever store `atom.io/introspection`'s `attachIntrospectionStates` function is called.
