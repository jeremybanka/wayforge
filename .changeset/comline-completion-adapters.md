---
"comline": patch
---

Add opt-in completion command handling and generated integrations for Bash, Zsh, Fish, Nushell, and Carapace. Support Cobra's `__complete`/`__completeNoDesc` protocol and Carapace's `_carapace export` protocol, including descriptions, filesystem suggestions, and spacing hints. Keep normal invocation explicit and independent from completion requests.
