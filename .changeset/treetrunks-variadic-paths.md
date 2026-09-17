---
"treetrunks": patch
---

Support `$...name` leaf branches that capture one or more string segments. `TreePath`, `Deref`, and `isTreePath` represent and validate variadic paths, while `TreePathName`, `flattenTree`, and `mapTree` retain the declared branch names. Optional trees also allow a path to stop before entering the rest branch.

Export `TreePathParams` to infer named capture values from a path name and `validateTreeCaptures` to validate capture declarations. Rest captures must have a nonempty name, no children, and no siblings; capture names must be unique along each path. `isTreePath` also validates these declarations before checking a path.
