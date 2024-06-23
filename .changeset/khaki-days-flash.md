---
"atom.io": patch
---

🐛 Fix bug where, when creating a molecule which `bond`s atoms, the atom creations would be redundantly captured on transactions/timelines, leading to noisy warnings in the console.
