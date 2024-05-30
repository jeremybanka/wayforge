---
"varmint": patch
---

🐛 Fix issue where sometimes, if a test timed out during a recording, the old output would remain present for a new input. Fixed this by removing old outputs when new inputs are written.
