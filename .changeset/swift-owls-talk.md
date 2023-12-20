---
"atom.io": minor
---

💥 BREAKING CHANGE: The behavior of transactions has changed. The `get` and `set` available in the scope of a transaction previously acted just like `getState` and `setState`. Both were bound to the child store for the transaction and could be used interchangeably.

Now, `getState` and `setState` remain bound to the parent store, while `get` and `set` are bound to the child store. This means that only `set` will add updates to the transaction.