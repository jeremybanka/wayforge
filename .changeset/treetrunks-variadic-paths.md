---
"treetrunks": patch
---

Support `$...name` leaf branches that capture one or more string segments. `TreePath`, `Deref`, and `isTreePath` represent and validate variadic paths, while `TreePathName`, `flattenTree`, and `mapTree` retain the declared branch names. Optional trees also allow a path to stop before entering the rest branch.

Export `TreePathParams` to infer named capture values from each alternative path name. `Join` supports variadic paths, including their shortest valid form. Path validation checks the supplied path without imposing capture-naming rules on the tree.
