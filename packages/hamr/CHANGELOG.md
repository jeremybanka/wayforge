# hamr

## 3.0.3

### Patch Changes

- Updated dependencies [f903d0e]
  - anvl@0.3.3
  - luum@0.0.17
  - atom.io@0.40.7

## 3.0.2

### Patch Changes

- 85be35d: ⬆️ Allow `@vitejs/plugin-react` version 5.

## 3.0.1

### Patch Changes

- Updated dependencies [ba95e13]
  - atom.io@0.33.9
  - anvl@0.3.2
  - luum@0.0.16

## 3.0.0

### Patch Changes

- Updated dependencies [d654c2d]
  - atom.io@0.33.0

## 2.0.0

### Patch Changes

- Updated dependencies [6734921]
- Updated dependencies [6734921]
- Updated dependencies [6734921]
- Updated dependencies [6734921]
  - atom.io@0.32.0

## 1.0.0

### Patch Changes

- Updated dependencies [91f259e]
  - atom.io@0.31.0

## 0.5.2

### Patch Changes

- 635ef98: 🔧 Add repository declaration to manifest.

## 0.5.1

### Patch Changes

- 4fcd106: 🐛 Improved the manifests for hamr's submodules to include types first.

## 0.5.0

### Minor Changes

- b17d2d3: 💥 BREAKING CHANGE: Recoil submodules (`hamr/recoil-tools`, `hamr/recoil-error-boundary`, `hamr-recoil-effect-storage`) have been removed. `hamr/atom.io-tools` added to replace `hamr/recoil-tools`. With the abandonment of recoil and its incompatibility with React 19 internals, advise moving all recoil code to atom.io.

### Patch Changes

- b17d2d3: ✨ Now fully compatible with React ^19.
- Updated dependencies [b17d2d3]
  - atom.io@0.30.5

## 0.4.6

### Patch Changes

- 8f6fc6c: ♻️ This release replaces the deprecated `framer-motion` package with `framer`.

## 0.4.5

### Patch Changes

- 0e4254b: ✨ `react-click-handlers` is a new module for making writing complicated click handlers a little more declarative.

## 0.4.4

### Patch Changes

- a0f5095b: ➖ Drop dependencies `fp-ts` and `ajv`, bringing dependencies from 6 to 4.

## 0.4.3

### Patch Changes

- a8efdaf5: 🏷️ Compatibility with tsconfig's "exactOptionalPropertyTypes" compiler option.

## 0.4.2

### Patch Changes

- 1bbac79d: 🎁 `hamr/react-id` is a beautiful and space-efficient way to render ids.
- edb28ca9: 🧑‍🏫 Improve quality-of-life for importing from the `hamr/*` submodules.

## 0.4.1

### Patch Changes

- 9a2f4023: 🥅 `react-json-editor` handles non-json content more elegantly now.
- 9a2f4023: ✨ `react-json-editor` now wraps all primitive editor in the appropriate wrapper passed to the `<JsonEditor>` component.
- 9a2f4023: ✨ `react-elastic-input` component now accepts a `readOnly` prop.

## 0.4.0

### Minor Changes

- 8a96b02: 💥 BREAKING CHANGE: `recoil-combo` is the new name for the subpackage previously called `react-combo

## 0.3.0

### Minor Changes

- b126378: ✨ New subpackages! `hamr/react-radial` and `hamr/react-css-vars`

## 0.2.0

### Minor Changes

- 309bb23: 🎉 `hamr/react-rx` module ✨ `useSubject` hook

## 0.1.0

### Minor Changes

- 9fc5472: - React Combo, a combo box that unpack recoil state or work with state/setter props.
  - React Elastic Input, an input that expands or contracts to the size of its content.
  - React Error Boundary, a convenient, resettable error boundary with built-in recoil state.
  - React Json Editor, a powerful tool for manipulating arbitrary JSON data.

  - Recoil Effect Storage, an atom effect for the common use case of using local storage.
  - Recoil Tools, a grab-bag of handy utilities for common patterns such as indices and transaction creation.
