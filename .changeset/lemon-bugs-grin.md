---
"atom.io": patch
---

🐛 `atom.io/realtime-server` IPC via `ChildSocket`/`ParentSocket` now reports "ALIVE" instead of "✨" when ready due to difficulties sending emoji over IPC in Bun 1.1.35.
