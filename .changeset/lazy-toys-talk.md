---
"treetrunks": patch
---

🐛 Fixed a bug where paths that ran to the end of branches, themselves ending in a $wildcard, would be wrongly rejected by `isTreePath()`.
