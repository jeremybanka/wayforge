---
"atom.io": patch
---

✨ `moleculeFamily` adds the `dependsOn: "any" | "all"` option. `"any"` means molecules created by this family will not dispose until all molecules above have been disposed. `"all"` means that any disposal above this molecule will dispose it.
