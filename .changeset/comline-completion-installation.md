---
"comline": patch
---

Add explicit `completion install <bash|zsh|fish>` commands and an `installCompletion()` helper that check shell dependencies and configured completion search paths, then atomically install or replace this CLI's completion file. Report the installed path or an actionable error when setup is incomplete, no suitable writable destination exists, or a user override would hide the installed file.

Use native completion-file discovery for Bash, Zsh, and Fish. Remove their profile-injection support and managed-block delimiters; preserve Zsh's required `#compdef` header. Installation never edits shell startup files. Nushell setup helpers remain text-only and limited to Nushell.
