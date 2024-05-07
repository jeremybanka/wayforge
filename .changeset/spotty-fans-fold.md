---
"atom.io": patch
---

🐛 Fix a bug with `subscribe` when subscribing to states. When this was done previously, the update would be emitted to subscribers before the close of the operation, which meant that any `setState` calls in the body of the observer would always be deferred until immediately after the operation closed. This was non-obvious behavior and overall just a bad workflow. Now, the update is emitted after the operation closes, preventing deferrals in this use case.
