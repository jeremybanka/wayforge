---
"comline": minor
---

Require Nushell 0.116.0 or newer for native Nushell completion. CLI programs that upgrade to this Comline release inherit this minimum version for their generated and installed native Nushell integrations and should announce it in their own release notes.

Use Nushell's named completion inputs to remove the native adapter's positional-input deprecation warning and preserve delegation to providers requesting `token`, `place`, or `buffer` in any order. Preserve multiple Comline registrations and legacy providers during Nushell's compatibility period.

Existing native Nushell completion files must be reinstalled or regenerated with the updated CLI, then loaded in a new shell. Legacy third-party providers may still emit their own deprecation warnings.
