---
"atom.io": patch
---

🐛 When copying mutable state in a transaction, the wrong function might have been used when that state belonged to a family. Now, the correct function is used.
