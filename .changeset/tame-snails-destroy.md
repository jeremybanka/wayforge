---
"atom.io": patch
---

🐛 When copying mutable state in a transaction, the state would be created without attaching its family metadata. Now, family metadata is properly attached.
