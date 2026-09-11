---
"comline": patch
---

Add explicit `completion install <bash|zsh|fish|nushell|carapace>` commands and an `installCompletion()` helper that check dependencies and discover conventional destinations, then atomically install or replace this CLI's completion file. Report the installed path or an actionable error when setup is incomplete, no suitable writable destination exists, or an existing registration conflicts with installation.

Use native completion-file discovery for Bash, Zsh, and Fish, Nushell's user vendor autoload directory, and Carapace's reported specs directory. Preserve Nushell's existing external completion provider for other commands and its enable setting. Nushell and Carapace integrations are independent; users already using Carapace need only the Carapace spec.

Remove profile-injection helpers and managed-block delimiters; preserve Zsh's required `#compdef` header. Installation never edits shell profiles or configures the user's shared Carapace integration.
