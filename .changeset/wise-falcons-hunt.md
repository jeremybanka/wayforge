---
"atom.io": patch
---

♻️ Made changes to the expermental allocate API: instead of array-based keys like `["socket", <id>]` , the API is now oriented toward "tagged strings" such as `"socket::<id>"`. This should reduce the amount of serialization/deserialization needed to make use of this memory management strategy.
