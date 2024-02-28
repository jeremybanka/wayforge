---
"atom.io": patch
---

🔊 Improve logging for changes to mutable atoms. Now they just report the ( `value` ), since the general form `( oldValue -> newValue )` was redundant, always showing the same value twice.
