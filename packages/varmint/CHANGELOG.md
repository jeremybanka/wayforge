# varmint

## 0.2.0

### Minor Changes

- 8a4e38e: 💥 BREAKING CHANGE: Squirrel uses subfolders instead of segments in the filepath.

### Patch Changes

- 8a4e38e: ✨ Squirrel adds the `flush()` method, allowing for the cleanup of derelict mocks."

## 0.1.1

### Patch Changes

- c9993a6: 🐛 Fix issue where sometimes, if a test timed out during a recording, the old output would remain present for a new input. Fixed this by removing old outputs when new inputs are written.

## 0.1.0

### Minor Changes

- da8f2fd: 🏷️ Squirrel, instead of the completions object having a `get` method, it now has a `for` method that take the key and returns an object with a `get` method. This method matches the original function signature.
