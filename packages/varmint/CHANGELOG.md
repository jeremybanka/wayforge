# varmint

## 0.1.1

### Patch Changes

- c9993a6: 🐛 Fix issue where sometimes, if a test timed out during a recording, the old output would remain present for a new input. Fixed this by removing old outputs when new inputs are written.

## 0.1.0

### Minor Changes

- da8f2fd: 🏷️ Squirrel, instead of the completions object having a `get` method, it now has a `for` method that take the key and returns an object with a `get` method. This method matches the original function signature.
