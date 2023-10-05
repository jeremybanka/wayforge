---
"atom.io": patch
---

**`✨ Future`**

`Future<T>` is just a `Promise<T>` with a `.cancel()` method that detaches listeners to `.then`. Can help avoid race conditions.