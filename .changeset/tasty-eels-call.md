---
"atom.io": patch
---

🐛 Fix issue with `structFamily` function exported from `atom.io/data`. Previously this function would assume any `AtomFamily` it created held strings. Now it properly infers the type from the default object passed.
