---
"atom.io": patch
---

🐛 Fix bug where an error could be thrown when getting or setting a state that was previously disposed, in the case where the exact token was used, instead of the family token and key. Now an error will be logged but no error will be thrown.
