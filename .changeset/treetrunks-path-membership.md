---
"treetrunks": patch
---

Have `isTreePath` consider every matching capture branch when checking whether a path belongs to a tree. A path is accepted if any matching literal or capture branch accepts the complete path. Literal lookups only consider the tree's own branch properties.
