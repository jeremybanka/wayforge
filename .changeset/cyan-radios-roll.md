---
"atom.io": patch
---

🐛 Fix bug where, when a subscribed selector was re-evaluated, and its root atoms changed, the subscription would not be updated to track those new roots, but would instead remain tracking the roots that were present when the subscription was originally created.
