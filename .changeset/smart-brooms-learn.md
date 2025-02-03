---
"safedeposit": minor
---

✨ Add `initialize()` method to `FilesystemStorage`, which, when called, creates the `rootDir` if it doesn't already exist. This method is called preemptively to prevent methods like `setItem` and `removeItem` from throwing.
