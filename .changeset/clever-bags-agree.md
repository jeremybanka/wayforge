---
"atom.io": patch
---

🐛 Fix bug where when a readonly selector family (a family of selectors with no `set` method) was created, it would not be added to the store's family registry. This would result in runtime errors when attempting to implicitly initialize a readonly selector from its family function. Now the family is properly registered and the selector can be implicitly initialized.
