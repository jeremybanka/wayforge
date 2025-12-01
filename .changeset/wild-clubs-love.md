---
"atom.io": patch
---

🐛 `atom.io/react` Fixed a bug with `useO()` that caused issues with mutable atoms and held selectors, which reuse the same reference, not to visibly update your components. Now a rerender happens consistently when these atoms are updated.
