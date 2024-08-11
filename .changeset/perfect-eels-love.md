---
"atom.io": minor
---

💥 BREAKING CHANGE: `Json.Object` is no longer permitted as a key for `atomFamilies` or `selectorFamilies`. This due to the fact that objects may include extraneous properties that not official to their type, and that property-order is not guaranteed anyway.
