# anvl

## 0.3.3

### Patch Changes

- f903d0e: ♻️ Build with tsdown; ship .d.ts.map file.

## 0.3.2

### Patch Changes

- Updated dependencies [ba95e13]
  - atom.io@0.33.9

## 0.3.1

### Patch Changes

- 635ef98: 🔧 Add repository declaration to manifest.

## 0.3.0

### Minor Changes

- a0f5095b: 🔥 Remove `reactivity` subpackage. The `Subject` implementation now lives in `atom.io/internal, and all`Transceiver`implementations will now live in`atom.io/transceivers/\*` subpackages.
- a0f5095b: 💥 Rename `anvl/refinement` members: `mustBe` ➡️ `mustSatisfyAllOfTheFollowing` and `couldBe` ➡️ `mustSatisfyOneOfTheFollowing`.

### Patch Changes

- a0f5095b: ✨ `anvl/function` now ships a `pipe` implementation.
- a0f5095b: ➖ Drop dependencies `fp-ts` and `io-ts`, bringing dependencies to 0.
- a0f5095b: 🎁 New Subpackage `anvl/primitive` provides the `primitive` type and associated refinements.

## 0.2.6

### Patch Changes

- 3654af64: ✨ `TransceiverSet` shows use of the Transceiver pattern.

## 0.2.5

### Patch Changes

- a8efdaf5: 🏷️ Compatibility with tsconfig's "exactOptionalPropertyTypes" compiler option.

## 0.2.4

### Patch Changes

- 1bbac79d: ✨ New `stringToColor` function returns a deterministically generated hexcode from an arbitrary string.

## 0.2.3

### Patch Changes

- 9a2f4023: ✨ `Refinery` class is good for sorting types. Just hand it some type-checker (or `Refinement`) functions and/or class constructors, and it can tell you what's what!
- 9a2f4023: 🏷️ `ClassSignature` utility type can stand in for any class with a constructor. Useful in generics.
- 9a2f4023: ✨ `discoverType` is a nice way to get the `prototype.constructor.name` or `typeof` any data.
- 9a2f4023: ✨ `fallback(fn, val)` tries to return `fn()`, and if it catches, returns `val` instead.
- 9a2f4023: ✨ `Differ` is a pluggable system that lets you print nice summaries of deltas between data of any types.

## 0.2.2

### Patch Changes

- 16ab1792: ✨ anvl/string: add `capitalize` function.
- 87b85031: ♻️ Improve API for safe-parsing a Join from JSON

## 0.2.1

### Patch Changes

- e8f1879: 🏷️ `ƒn` type. Shorthand for `(...parameters: any[]) => any`

## 0.2.0

### Minor Changes

- 485ed95: 💥 BREAKING CHANGE: Join now supports names for each side of the relation

## 0.1.2

### Patch Changes

- 381887c: ✨ isPlainJson (fails when prototype is anything but Object or Array)
- 381887c: ✨ FractalArray

## 0.1.1

### Patch Changes

- 0a428cb: Fix bug with anvl's `redact` function.

## 0.1.0

### Minor Changes

- 04923d5: Export subpackages.
