# rel8

## 0.0.1

### Patch Changes

- a8efdaf5: 🏷️ Compatibility with tsconfig's "exactOptionalPropertyTypes" compiler option.
- a8efdaf5: ✨ The `Junction<ASide, BSide, Content>` class now includes `Content` as its third generic Parameter. `Content` must be a JSON object only (at least for now) but can be used to make your Junction expect new relations to include Content of a certain type.
- a8efdaf5: 🎁 New submodule: `rel8/types`! Provides typings used among `rel8`'s other submodules.
- a8efdaf5: ✨ `Junction.cardinality` is now applied when setting relations.
