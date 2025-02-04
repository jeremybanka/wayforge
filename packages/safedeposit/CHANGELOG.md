# safedeposit

## 0.1.0

### Minor Changes

- 3057cd5: ✨ Add optional initialization option `eagerInit` to `FilesystemStorage` which, if present and `true`, creates the `rootDir` when the class instance is constructed.
- 3057cd5: ✨ Add `initialize()` method to `FilesystemStorage`, which, when called, creates the `rootDir` if it doesn't already exist. This method is called preemptively to prevent methods like `setItem` and `removeItem` from throwing.
- 3057cd5: ✨ Add property `initialized` to `FilesystemStorage`. This property indicates whether the `rootDir` exists.

## 0.0.2

### Patch Changes

- 635ef98: 🔧 Add repository declaration to manifest.

## 0.0.1

### Patch Changes

- 3e15317: 🔧 Include CHANGELOG.md
