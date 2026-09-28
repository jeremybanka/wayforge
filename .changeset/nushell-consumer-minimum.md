---
"break-check": minor
"flightdeck": minor
"varmint": minor
---

Native Nushell completion for `break-check`, `flightdeck`, `klaxon`, and `varmint` now requires Nushell 0.116.0 or newer, inheriting the updated Comline adapter's minimum version. The adapter uses named completion inputs, removes its positional-input deprecation warning, and preserves delegation to other completion providers.

Upgrade Nushell before loading the updated native integration. For each CLI you use, rerun `<command> completion install nushell` (or regenerate its `.nu` file with `<command> completion nushell`) and open a new shell. Installed completion files are static copies and are not replaced by a package upgrade alone.
