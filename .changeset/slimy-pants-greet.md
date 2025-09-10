---
"atom.io": patch
---

🚀 Mutable atoms now set the state of their \*tracker states within the same operation. This is more efficient, and also means that the tracker does not attempt and fail a redundant update against the mutable.
