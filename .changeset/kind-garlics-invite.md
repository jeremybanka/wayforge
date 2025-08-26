---
"atom.io": patch
---

✨ `timeline` overhaul.

Timelines now make the following guarantees:

- `undo` and `redo` iterates over 1 checkpoint in the timeline.
- Reading from the store—"getting" a state—does not produce a checkpoint.
- Writing to the store—"setting" a state—will create exactly 1 checkpoint.
- Running a transaction will create exactly 1 checkpoint.

With these changes, it is easier to use setState on a single atom or selector when the atoms being set are governed by a timeline. You don't need to wrap everything in a transaction, as long as you want a checkpoint for that one change.

That being said, if you are in an `immortal` store, transactions are still preferred. Changes to remedy this are forthcoming.
