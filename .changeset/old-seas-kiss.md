---
"atom.io": patch
---

🏷️ The type `TransactionToken<F>` now insists that `F extends Func`. This is true to the nature of the `transaction`, which must always encapsulate a function.
