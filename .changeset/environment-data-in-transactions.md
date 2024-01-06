---
"atom.io": patch
---

✨ `transaction.do` now has an transactor `env()` which, when called, provides the current platform ("node", "browser", or "unknown) and the store's name. It can be used to implement logic that should only run on the server.