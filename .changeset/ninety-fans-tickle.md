---
"atom.io": patch
---

🐛 Fixed issue with the `get` function in `SelectorToolkit` where, if getting a state that's not present in an ephemeral store, the state would not be initialized but an error would be thrown instead.
