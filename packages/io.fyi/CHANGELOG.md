# treetrunks

## 0.1.2

### Patch Changes

- f0a729f: 📝 Finish inline documentation for functions and types.

## 0.1.1

### Patch Changes

- f51ef63: 📝 Add JSDoc annotations to most types.
- f51ef63: ✨ Add mergeTrees function for combining the structures of two trees.
- f51ef63: ✨ Add flattenTree function.
- f51ef63: ✨ Add reduceTrees function for combining the structures of N trees.
- f51ef63: ✨ Add mapTree function.

## 0.1.0

### Minor Changes

- 9e9afe4: 💥 BREAKING CHANGE: Renamed the type `ToPath` to `Split`.
- 9e9afe4: 💥 BREAKING CHANGE: Renamed the type `Flat` to `Flatten`.

### Patch Changes

- 9e9afe4: ✨ Add the new `ReduceTree` type which applies `MergeTree` over a tuple of trees.
- 9e9afe4: ✨ Add new types `ExhaustiveTreeMap` and `ExhaustiveTreePath` which include 'partway' paths which wouldn't be valid in terms of 'required/optional' terms, but which may still be useful when analyzing the structure of a `Tree`.
- 9e9afe4: ✨ Add the new `MergeTree` type, which neatly merges the structures of two different trees. Any path valid in one of the two trees `(A B)` given to `MergeTree<A, B>` is valid in the resulting tree.
- 9e9afe4: ♻️ Refactored `isTreePath`, bringing treetrunks' code coverage to 100%.

## 0.0.5

### Patch Changes

- 93e1af1: 📝 Update README.md.

## 0.0.4

### Patch Changes

- 635ef98: 🔧 Add repository declaration to manifest.

## 0.0.3

### Patch Changes

- 331800a: 🧹 Remove extra console.log

## 0.0.2

### Patch Changes

- d191b75: 🐛 Fix bug where wildcards were always rejected from `isTreePath`.

## 0.0.1

### Patch Changes

- c847711: ✨ isTreePath provides runtime validation for unknown paths.
