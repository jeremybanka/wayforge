---
"atom.io": patch
---

🐛 Fix an issue where trying to create a molecule as a child of another molecule during the parent's construction would lead to the child being orphaned. Now parents can spawn children in their constructors by passing `this` to the `makeMoleculeInStore` function: e.g., `makeMoleculeInStore(store, this, <family>, <key>, <...params>)`.
