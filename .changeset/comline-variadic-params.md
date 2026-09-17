---
"comline": patch
---

Support `$...name` positional captures at the end of a route for one or more arguments, including optional parent routes for zero-argument invocations. Expose typed `inputs.params` for ordinary and rest captures while preserving `inputs.path`, route-specific option parsing, argument boundaries, and literal words after `--`. Help describes the required number of arguments, and completion reuses positional hints and providers for every captured argument.

Reject invalid rest declarations and duplicate capture names when creating a CLI, interpreting arguments, or rendering help.
