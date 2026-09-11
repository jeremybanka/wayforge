---
"comline": patch
---

Use readable completion setup markers containing only the CLI name and purpose, such as `# >>> mycli completions >>>`. Bash setup injection now inserts a short guarded loader that obtains its adapter from the installed CLI, keeping implementation details out of `.bashrc` and picking up adapter updates in new shells. Standalone completion output continues to include the full adapter.
