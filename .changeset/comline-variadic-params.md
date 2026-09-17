---
"comline": patch
"treetrunks": patch
---

Support terminal `$...name` positional captures for one or more arguments, including optional parent routes for zero-argument invocations. Comline exposes typed `inputs.params` for ordinary and rest captures while preserving `inputs.path`, route-specific option parsing, argument boundaries, and literal words after `--`. Help describes rest cardinality, and completion reuses positional hints and providers for every captured argument.

Tree path types, validation, and dereferencing support nonempty rest captures. Export `TreePathParams` for named capture types and `validateTreeCaptures` to reject nonterminal or ambiguous rest declarations and duplicate capture names within a route.
