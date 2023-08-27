---
"rel8": patch
---

✨ `rel8/junction`: Add new `externalStore` API. By passing this option in the `JunctionAdvancedConfig`, you can force the Junction to read and write data from some other source, instead of keeping its own encapsulated state. This is useful when working with a global store that isolates pieces of state to manage dispatching renders, since you can manage the separation of relations yourself.
