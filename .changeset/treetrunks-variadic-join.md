---
"treetrunks": patch
---

Allow `Join` to represent an empty variadic tail as well as longer tuples. For example, `Join<["a", ...string[]], "/">` accepts both `"a"` and `"a/b"`, and joining a nonempty variadic path includes its shortest valid form.
