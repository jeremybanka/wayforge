---
"atom.io": patch
---

🐛 `atom.io/react-devtools` now properly handles the case where a state is disposed. Previously, deleted states would be left in the state index. Now they are removed.
