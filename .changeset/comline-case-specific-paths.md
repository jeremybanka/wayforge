---
"comline": patch
---

Narrow `inputs.path` to the selected route's positional tuple when switching on `inputs.case`. Destructuring retains literal segments, single captured strings, and nonempty rest tuples. A CLI without declared routes infers an empty path tuple.
