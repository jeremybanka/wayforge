# varmint

## 0.3.1

### Patch Changes

- 460ada1: 🏷️ Squirreled type represents the interface to a function that is being cached via Squirrel.

## 0.3.0

### Minor Changes

- 1883903: 💥 BREAKING CHANGE: cache files created by varmint will now only contain characters matching "a-z", "A-Z", "0-9", "-", "+", and "\_". All characters aside from this will be replaced with "\_".

### Patch Changes

- 1883903: ✨ Excessively long cache file names will be truncated, prioritizing the end of the string, and suffixed with a hash of the full string in the form `<...truncated>+<hash>.json`.

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
