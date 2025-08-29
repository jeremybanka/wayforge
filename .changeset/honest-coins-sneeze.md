---
"atom.io": patch
---

🐛 Fixed bug where states with caught rejected promises would not propagate updates to some consumers, such as `useLoadable`.
