---
"comline": patch
---

Add opt-in tab completion for Bash, Zsh, Fish, Nushell, and Carapace, driven by the same CLI definitions and argument interpretation as normal parsing. Integrations work with globally installed commands and Bun-compiled executables.

- Add `interpret()` and asynchronous `complete()` methods to configured CLIs, plus standalone interpretation and completion functions. Inspect unfinished commands, routes, raw option occurrences, and cursor replacement ranges without running option parsers, validating input, or discovering application configuration.
- Suggest commands, option names, schema-derived values, and explicitly configured candidates. Support file and directory hints, descriptions, spacing control, variable positional arguments, and synchronous or asynchronous candidate providers.
- Add option `aliases` for additional long names and `valueKind` to override schema-based value consumption consistently in parsing and completion.

Use `completionResponse(definition, process.argv)` at the CLI entry point to opt in to completion requests and installation commands. `completion <target>` prints a standalone integration file; `completionScript()` provides the same generation API. Support Cobra's `__complete` and `__completeNoDesc` protocols and Carapace's native JSON export protocol.

Install files explicitly with `completion install <bash|zsh|fish|nushell|carapace>` or `installCompletion()`. Installation checks dependencies, discovers conventional destinations, and atomically installs or replaces the CLI's completion file without editing shell profiles. Report actionable errors for missing prerequisites, unsuitable destinations, or conflicting registrations.

Nushell uses its user vendor autoload directory and preserves existing completion providers and the external-completion enable setting. Carapace uses its discovered specs directory and the user's existing shell integration. The two integrations are independent; Nu users already using Carapace need only the Carapace spec.
