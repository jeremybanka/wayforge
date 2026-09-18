---
"comline": patch
---

Validate route declarations when creating a CLI, interpreting arguments, or rendering help. Rest captures must have a name, a `null` child, and no siblings. Capture names must be unique within each route, and branch names cannot contain the route separator `/`. Positional values may contain `/` as usual.
