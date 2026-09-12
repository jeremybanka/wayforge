---
"comline": patch
---

Require the selected route's own grammar to support the positional match during final invocation. Reject positional arguments that only a descendant command's option grammar would consume, instead of silently discarding them. Completion can still interpret those arguments as an unfinished descendant command.
