---
"atom.io": patch
---

🐛 Fixed issue where, if a selector was set to a Promise, that Promise would be given out as the newValue without being merged into a manager for further updates that may occur before it is resolved.
