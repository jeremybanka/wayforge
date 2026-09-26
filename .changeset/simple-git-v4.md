---
"break-check": minor
---

Upgrade Git operations to simple-git v4 with stricter argument validation and environment filtering. Git subprocesses no longer inherit `GIT_*` variables or other guarded variables such as `SSH_ASKPASS`. Projects using environment-based authentication or Git configuration must move those settings to Git configuration files, SSH configuration, or an SSH agent. Test and certification commands continue to inherit the normal process environment.
