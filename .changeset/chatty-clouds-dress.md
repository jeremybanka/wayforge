---
"atom.io": minor
---

💥 BREAKING CHANGE: Types for atoms and selectors have been changed. `Selector` now encompasses `ReadonlySelector` and `WritableSelector`; `MutableAtom` is now differentiated from `RegularAtom` and are given the brands `{ type: "mutable_atom" }` and `{ type: "atom" }` respectively. `Atom` encompasses these.