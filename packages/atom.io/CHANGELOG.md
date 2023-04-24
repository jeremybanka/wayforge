# atom.io

## 0.3.0

### Minor Changes

- fe9fe8d: 💥 simplify API for `atom`, `selector`, related families and `transaction`
- fe9fe8d: ✨ `useLogger` and `setLogLevel` allow custom logging configuration for atom.io
- 30865e7: ✨ `timeline` tracks atoms over time. navigate it with the new `undo` and `redo` functions
- 9b9c775: ✨ `subscribeToTransaction` accepts a `TransactionToken` and a function that will be called with each `TransactionUpdate`
- fe9fe8d: ✨ export `Serializable` type used for keys in families
- 30865e7: ✨ `runTransaction` accepts a `TransactionToken` and returns the function signature of the transaction.
- 9b9c775: ✨ `AtomFamily`, `SelectorFamily`, and `ReadonlySelectorFamily` functions include a `key`, a `type`, and (at least for now) an exposed `Rx.Subject`. this subject emits newly minted `AtomToken`s, `SelectorToken`s, and `ReadonlyValueToken`s, respectively.
- fe9fe8d: ✨ `AtomToken`, `SelectorToken`, and `ReadonlyValueToken` include family metadata if they were created by a family function

### Patch Changes

- fe9fe8d: 🚀 effect in `useStore` now only runs onMount
- 30865e7: ♻️ `transaction`s do not emit changes until they succeed
- fe9fe8d: 🐛 `selector` no longer throws, but logs error when run with a living key

## 0.2.0

### Minor Changes

- 86dc905: ✨ `atom.io/react` module: `composeStoreHooks` ✨ `useI` `useO` `useIO`
- 5f86821: 🚀 major performance improvement: selectors no longer eagerly evaluate by default
- d3ebb42: ✨ give your `atom<T>` a function `() => T` as its `default` value
- 86dc905: 💥 `atom.io/react` module: `composeStoreHook` ➡️ `composeStoreHooks`
- d3ebb42: ✨ `isDefault` can be used to know whether state has been set before
- 86dc905: ✨ support for preact

### Patch Changes

- fbfca11: 🚀 improve performance when updating selectors

## 0.1.0

### Minor Changes

- 2a6ee48: `"atom.io/react"` module: `{ useSubject, useStore }`

### Patch Changes

- 2a6ee48: propagateDown no longer affects atoms
- 2a6ee48: states no longer propagate down to themselves
