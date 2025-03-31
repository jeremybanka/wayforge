---
"treetrunks": patch
---

✨ Add the new `MergeTree` type, which neatly merges the structures of two different trees. Any path valid in one of the two trees `(A B)` given to `MergeTree<A, B>` is valid in the resulting tree.
