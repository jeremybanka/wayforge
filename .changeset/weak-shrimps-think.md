---
"atom.io": patch
---

✨ Calling `setState` during a `setState` operation is more forgiving now. Instead of logging an error and doing nothing, it will now log a warning and enqueue the update for as soon as the current operation completes.
