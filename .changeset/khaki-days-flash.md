---
"atom.io": patch
---

🐛 Fixed a bug where, when creating a molecule which `bond`s atoms, the atom creations would be redundantly captured on transactions/timelines, leading to noisy warnings in the console.
