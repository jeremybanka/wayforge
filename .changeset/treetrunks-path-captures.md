---
"treetrunks": patch
---

Export `TreePathCaptures` to infer a record of named capture values from a path name. `$name` produces a string, `$...name` produces a nonempty string tuple, and fixed segments are omitted. A union of alternative path names produces a union of their capture records.
