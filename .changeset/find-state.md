---
"atom.io": patch
---

♻️ The new core function `findState()` and corresponding `find()` transactor represent the future API for using state families. They are intended to replace the direct usage of families as functions.

The find functions take two parameters, a `FamilyToken<T, K>` of some kind (`atom`, `selector`, etc.) and a `Json.Serializable` key that satisfies `K`. It returns an `Atom<T>` or `Selector<T>` or whatever, depending on the type of family.

`FamilyToken` is being added to make families more like the rest of `atom.io`, and follow the pattern of exposing serializable references that can be used between stores and processes. In a future breaking update, the family functions will return these tokens instead of the family functions themselves.

`ReadableFamily<T, K>` (the type that encompasses all state families) extends `FamilyToken<T, K>`, and the subtypes extend their corresponding tokens—e.g., `AtomFamily<T, K>` extends `AtomFamilyToken<T, K>`. This means that you can use a family token anywhere you can use a family function, and vice versa.