---
"comline": patch
---

Replace Cobra-generated Bash, Zsh, and Fish completion scripts with maintained shell adapters. Embed the scripts in the package and compiled executables, preserve the Cobra-compatible completion endpoint, and avoid evaluating command-line text when requesting suggestions.

Separate upstream Cobra compatibility tests from the real-shell suite. Go is needed only for the dedicated upstream tests; it no longer generates shipped code or runs during ordinary shell compatibility checks.
