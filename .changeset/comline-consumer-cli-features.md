---
"break-check": patch
"flightdeck": patch
"varmint": patch
---

Add shell completion and explicit completion installation for break-check, flightdeck, klaxon, and varmint, supporting Bash, Zsh, Fish, Nushell, and Carapace. Completion works without valid application configuration or running application commands. Suggest config files and directory options for break-check and flightdeck, CI as a suggested environment-variable name for varmint clean, and hide singleton options after they have been supplied.

Accept kebab-case aliases for break-check, flightdeck, and klaxon options while preserving existing option names and configuration keys. Break-check also accepts --pattern as an alias for --testPattern.

Display warnings on stderr for unknown options and options ignored on the selected command. FlightDeck keeps warnings separate from its JSON log output. Warnings remain advisory and do not change successful command exit codes.
