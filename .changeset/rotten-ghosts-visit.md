---
"atom.io": patch
---

🔊 Improved the information given to atom.io's built-in logger in several key areas:

1. **state creation**: logged for selectors as well as atoms
2. **writing to cache**: now straightforward writes are logged, with further logging for futures forthcoming
3. **value origination**: now all values for states are logged when derived, whether from selector computation, atom defaults, or setState
