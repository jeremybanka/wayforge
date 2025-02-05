---
"varmint": patch
---

🐛 Fix issue with `varmintWorkspaceManager`, where, on cleanup, the `.ferret` folder, if initialized in the default location (nested under `.varmint`) would be deleted.
