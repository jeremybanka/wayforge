---
"comline": patch
---

Expose `inputs.params` with named capture values for the selected route. Ordinary captures such as `$name` produce strings, rest captures such as `$...paths` produce nonempty string tuples, and routes without captures produce `{}`. Narrowing `inputs.case` narrows the available params. Argument interpretation and completion contexts also expose captured values through `params`.
