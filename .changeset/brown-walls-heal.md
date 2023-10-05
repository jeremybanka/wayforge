---
"atom.io": patch
---

`atom.io/internal` — **`✨ Future`**

`Future<T>` is just a `Promise<T>` with a `.cancel()` method that detaches listeners to `.then`. Can help avoid race conditions.