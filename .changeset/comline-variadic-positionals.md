---
"comline": patch
---

Support `$...name` positional captures at the end of a route for one or more arguments, including optional parent routes for zero-argument invocations. Captured arguments retain their boundaries and values, including literal words after `--`, while options follow the selected route's parsing rules. Help describes the required number of arguments, and completion reuses positional hints and providers for every captured argument.
