---
"comline": patch
---

Use Nushell 0.116's named completion inputs to remove the native adapter's positional-input deprecation warning and preserve delegation to providers requesting `token`, `place`, or `buffer` in any order. Keep compatibility with Nushell 0.115.1, legacy providers, and multiple Comline registrations.

Existing native Nushell completion files must be reinstalled or regenerated with the updated CLI, then loaded in a new shell. Legacy third-party providers may still emit their own deprecation warnings.
