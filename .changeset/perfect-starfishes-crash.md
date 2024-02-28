---
"atom.io": patch
---

🐛 When creating new family members during a transaction, a NotFoundError would occur when applying the transaction to the store. Now they are properly recreated in the target store during the application phase.
