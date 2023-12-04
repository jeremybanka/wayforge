# rel8

## 0.0.6

### Patch Changes

- 89f6123: ✨ `Junction` adds the `replaceRelations` method, which allows you to quickly set all the relations for one entry. By default, it does this with a cleanup step, which removes incompatible relations. But optionally, by passing `{ reckless: true }`, you will override the relations for any referenced entries.
- 89f6123: ♻️ When setting a relation, content is now updated right before the relation is set.
- 89f6123: 🐛 Load serialized relations into external store correctly.
- 89f6123: 🏷️ When using the `externalStore` API, `getContent` and `setContent` require type consistency properly.

## 0.0.5

### Patch Changes

- a0f5095b: 🚀 Very minor performance enhancement in getRelatedKey.
- a0f5095b: 🔈 Improve warning logged when multiple related keys are found, but only one was expected.

## 0.0.4

### Patch Changes

- 23eeda27: ✨ Pass a custom `makeContentKey` function into your `Junction`'s second constructor param, `JunctionAdvancedConfiguration`.
- 3654af64: ✨ `rel8/junction`: Add new `externalStore` API. By passing this option in the `JunctionAdvancedConfig`, you can force the Junction to read and write data from some other source, instead of keeping its own encapsulated state. This is useful when working with a global store that isolates pieces of state to manage dispatching renders, since you can manage the separation of relations yourself.

## 0.0.3

### Patch Changes

- ce3acb1: 🔧 Fix package configuration so that the entrypoint is properly identified.

## 0.0.2

### Patch Changes

- ac2744f: 🏷️ The type of a `Junction`'s `<Content>` type parameter now defaults to null unless directly passed, or inferred from a `Refinement` function passed to the `Junction` constructor.
- ac2744f: 💥 Exports previously from `rel8/types` now come from `rel8`
- ac2744f: 🏷️ Expose some helpful utility types from `rel8/junction`, including types to explicitly differentiate between the semi-optional `JunctionConfig` passed to the constructor and the `JunctionJSON` returned from the `Junction.toJSON()` method.

## 0.0.1

### Patch Changes

- a8efdaf5: 🏷️ Compatibility with tsconfig's "exactOptionalPropertyTypes" compiler option.
- a8efdaf5: ✨ The `Junction<ASide, BSide, Content>` class now includes `Content` as its third generic Parameter. `Content` must be a JSON object only (at least for now) but can be used to make your Junction expect new relations to include Content of a certain type.
- a8efdaf5: 🎁 New submodule: `rel8/types`! Provides typings used among `rel8`'s other submodules.
- a8efdaf5: ✨ `Junction.cardinality` is now applied when setting relations.
