---
"comline": patch
---

Add opt-in completion command handling and generated integrations for Bash, Zsh, Fish, Nushell, and Carapace. Support Cobra's `__complete`/`__completeNoDesc` protocol and Carapace's `_carapace export` protocol, including descriptions, filesystem suggestions, and spacing hints. Keep normal invocation explicit and independent from completion requests.

Add helpers to update and remove Nushell completion setup blocks using comment delimiters. Match delimiters independently of indentation and whitespace, preserve surrounding configuration, replace duplicate blocks, and reject unmatched delimiters.
