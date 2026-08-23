# safedeposit

## 0.1.3

### Patch Changes

- 7b66e63: License all first-party code and assets under the Mozilla Public License 2.0 and include the license notice in published packages.

## 0.1.2

### Patch Changes

- f903d0e: ✨ Go-to-definition should now route to source files via source maps now shipped for type declarations.

## 0.1.1

### Patch Changes

- 29c48a5: ♻️ Changed build vendor from `tsup` to `tsdown`.

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
