---
"comline": patch
---

Support `$...name` positional captures at the end of a route for one or more arguments, including optional parent routes for zero-argument invocations. Expose typed `inputs.params` for ordinary and rest captures. Narrowing `inputs.case` also narrows `inputs.path` to the selected route's tuple and `inputs.params` to its named captures. Preserve route-specific option parsing, argument boundaries, and literal words after `--`. Help describes the required number of arguments, and completion reuses positional hints and providers for every captured argument.

Reject invalid rest declarations, duplicate capture names, and branch names containing the route separator `/` when creating a CLI, interpreting arguments, or rendering help. Positional values may contain `/` as usual.

Preserve a standalone `-` as a positional argument unless the selected route consumes it as an option value.

Prefer successful literal routes, with fallback to capture branches that accept the full positional path. When multiple captures accept the same path, declaration order determines the selected route.
