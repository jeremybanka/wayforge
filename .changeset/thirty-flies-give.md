---
"recoverage": patch
---

🐛 Fix bug where, if recoverage was run from a diectory in a repo other than the root itself, when that repo was dirty, it would fail to compute the hash representing the repo's dirty state.
