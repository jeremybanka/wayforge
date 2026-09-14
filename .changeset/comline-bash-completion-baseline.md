---
"comline": minor
---

Bash completion integration now supports bash-completion 2.18 and newer; older versions are outside the supported environment. Installation guidance names the minimum version. Installation continues to reject an extensionless completion for the same command in the destination directory, reporting a conflict instead of claiming that it takes precedence over the `.bash` file.
