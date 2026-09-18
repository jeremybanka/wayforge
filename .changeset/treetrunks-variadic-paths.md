---
"treetrunks": patch
---

Support `$...name` leaf branches that capture one or more string segments. `TreePath`, `ExpandCaptures`, and `isTreePath` represent and validate variadic paths, while `TreePathName`, `flattenTree`, and `mapTree` retain the declared branch names. Expanded path types preserve literal alternatives alongside every wildcard segment for editor suggestions. Optional trees also allow a path to stop before entering the rest branch.
