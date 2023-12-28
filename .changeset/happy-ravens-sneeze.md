---
"atom.io": patch
---

🐛 Fix bug where a token belonging to a family might be passed to setState without that family member having been initialized previously, leading to a NotFoundError.
