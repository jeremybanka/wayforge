# atom.io

## 0.32.0

### Minor Changes

- 6734921: 💥 BREAKING CHANGE: `join` and related functions are now exported directly from `atom.io`, instead of `atom.io/data`.
- 6734921: 💥 BREAKING CHANGE: `Loadable` now is exported from `atom.io`, not `atom.io/data`.
- 6734921: 💥 BREAKING CHANGE: The eslint rule atom.io/lifespan has been removed. It is no longer necessary to use seekState.
- 6734921: 💥 BREAKING CHANGE: `atom.io/immortal` and `atom.io/ephemeral` have been removed. Instead of importing `seekState` or `findState` from them respectively, instead prefer to import `findState` from `atom.io` when strictly necessary. Generally prefer streamlined get/set.

## 0.31.1

### Patch Changes

- a9d139b: ✨ Silo adds the new `install()` method, allowing for the transfer of states from another store into the Silo. Good for applications with a frontend and backend store with some shared models.

## 0.31.0

### Minor Changes

- 91f259e: 💥 BREAKING CHANGE: `moleculeFamily` has been replaced with the new `allocate`, `deallocate`, `claim`, and `fuse` functions for immortal stores.

## 0.30.7

### Patch Changes

- 31ccde2: ✨ `atom.io/internal` exports `CircularBuffer`—a wrapper for a fixed-length Array that can be added to . Once it is full, the oldest entries will be overwritten with newly added entries.

## 0.30.6

### Patch Changes

- 1c68bbb: ♻️ Make logging more versatile for `ChildSocket`. Now the process code and key aren't hardcoded into the logger, but are included in the default logger.

## 0.30.5

### Patch Changes

- b17d2d3: ✨ Now fully compatible with React ^19.

## 0.30.4

### Patch Changes

- 93b721c: 🐛 `atom.io/realtime-server` IPC via `ChildSocket`/`ParentSocket` now reports "ALIVE" instead of "✨" when ready due to difficulties sending emoji over IPC in Bun 1.1.35.

## 0.30.3

### Patch Changes

- 8f6fc6c: ♻️ This release replaces the deprecated `framer-motion` package with `framer`.

## 0.30.2

### Patch Changes

- a9d15f3: 🐛 Always construct the content keys for relations in Join in A:B order.

## 0.30.1

### Patch Changes

- 331800a: ✨ Add type information to Join and Junction reflecting the subtypes of string used by the A- and B- sides of the relations.
- 331800a: ♻️ Made changes to the expermental allocate API: instead of array-based keys like `["socket", <id>]` , the API is now oriented toward "tagged strings" such as `"socket::<id>"`. This should reduce the amount of serialization/deserialization needed to make use of this memory management strategy.

## 0.30.0

### Minor Changes

- a8781d3: 💥 BREAKING CHANGE: `createRootMolecule` has been renamed `createRootMoleculeInStore`.

### Patch Changes

- a8781d3: ✨ The new Allocate API allows hierarchical allocations into a defined superstructure.

  It provides a general alternative to the `moleculeFamily` API, which is still available but is now deprecated.

  ### New: Shapelessness

  `moleculeFamily` required a specific constructor type to be passed in. This is a bit of a pain, because it required the user to maintain the shape of the molecules they were creating, which is really redundant to the types of the states that the molecule governs. The idea was, this could be a way to give the molecule its own "type".

  The new way that molecules are typed is purely through the type of their associated keys, whose types must extend the `Canonical` type. A molecule is 1:1 with a key. Keys are permanent and so are fundamentally different from states.

  ### No more `bond` API

  `moleculeFamily` was also overly rigid in the that it required a molecule to deliberately `bond` to an atomFamily.

  This is no longer a thing. Once a molecule has been allocated, any states can be added to it at any time.

  See `__tests__/experimental/immortal/allocate.test.ts` for an example of how to use the new API.

## 0.29.5

### Patch Changes

- fda0419: `atom.io/realtime-testing` The `teardown()` function for tests now returns a Promise<void>, carried through from awaiting `Server.close(): Promise<void>` in `socket.io@4.8.0`.

## 0.29.4

### Patch Changes

- 8731eb0: ♻️ This update fully consolidates `atom.io`'s internal dependencies under the atom.io root, making its coverage report a true reflection of all the code that belongs to it.

## 0.29.3

### Patch Changes

- 072a7fb: 🐛 `atom.io/realtime-client` useSingleEffect used process.env to check whether it should run effects twice, which could cause errors in the browser.

## 0.29.2

### Patch Changes

- fb286da: ✨ `atom.io/internal` Future gains the `done` property, a way to synchronously observe whether it should still be `use()`-d.

## 0.29.1

### Patch Changes

- d9e8e77: 🐛 Fix bug where an error could be thrown when getting or setting a state that was previously disposed, in the case where the exact token was used, instead of the family token and key. Now an error will be logged but no error will be thrown.
- d9e8e77: 🏷️ ReadableTokens<T, K> may now bear the full type information of their respective families.

## 0.29.0

### Minor Changes

- 03c5827: 💥 BREAKING CHANGE: Cascading disposal has been removed: Selectors are no longer disposed when the atoms or selectors they depend on are disposed.

  This is due to a problematic and hard-to-debug behavior that would occur when disposal cascades down the dependency tree.

  Say for example, you have index atom, a family of atoms, and an selector that maps the index to the values of the atoms in the family.

  ```ts
  const indexAtom = atom<string[]>({ key: `index`, default: [] });
  const countAtoms = atomFamily<number, string>({ key: `count`, default: 0 });
  const allCountsSelector = selector<number[]>({
    key: `allCounts`,
    get: ({ get }) => get(indexAtom).map((key) => get(countAtoms, key)),
  });
  ```

  I create an atom with "my-key" as the key, and then I set the index to include "my-key".

  ```ts
  const myState = findState(countAtoms, `my-key`);
  setState(indexAtom, (current) => [...current, `my-key`]);
  ```

  Now, the `allCountsSelector` will hold `[2]` when retrieved.

  However, if I dispose the `myState` atom, the `allCountsSelector` would be disposed as a result, because it depended on `myState` last time it was computed.

  This happens even if I've removed `my-key` from the index, because the although in this case the selector's expired its cached value, it hasn't recomputed. Therefore from its point of view, it's still dependent on `myState`.

  We can fix this in the cascading-delete paradigm if we force the selector to recompute, but that's quite unintuitive and incurs an arbitrary performance penalty.

  ```ts
  setState(indexAtom, (current) => current.filter((key) => key !== `my-key`));
  getState(allCountsSelector); // []
  disposeState(myState);
  ```

  Suffice to say, cascading disposal is a major footgun, because "dependents" of a disposed state at the time of their last computation are not necessarily dependents at disposal time.

## 0.28.2

### Patch Changes

- 9e91132: 🐛 `atom.io/react-devtools` Previously, state types were only displayed as `(error)`, now they are displayed as the correct type.
- 9e91132: 🐛 `atom.io/devtools` The selector index would previously only be created on the `IMPLICIT.STORE`, not the passed store, which could result in the state being unavailable when using a custom `Silo`. Now, that state will be created on whichever store `atom.io/introspection`'s `attachIntrospectionStates` function is called.

## 0.28.1

### Patch Changes

- bda5f98: 🔇 Remove some extraneous logs that got shipped.

## 0.28.0

### Minor Changes

- b10961b: ✨ `atom.io/immortal` now permits `findState`. Though, it may return a `counterfeit` token.

  - A `counterfeit` token is a reference to a state that is not actually created in the store, but does belong to a real family that is known to the store.
  - We create a counterfeit token when we attempt to `findState`, but we are not permitted to initialize the state we need to find. This can happen in `immortal` stores, where we cannot create free-floating states, but must have previously reserved space for them using the `moleculeFamily` function.
  - Counterfeit is the best of several undesirable options where we cannot return a real token:
    - We could throw an error. This is not preferred because it can lead to unstable production environments and frustrating developer environments.
    - We could return `undefined`. This is not preferred because it overwhelms the developer with constant null checks in situations where the state is practically guaranteed to exist.
    - We can return a functional facsimile (a counterfeit) and log a detailed warning. We prefer this option because it will bring undefined behavior to the developer's attention without demanding their immediate attention.

### Patch Changes

- 20b213f: 🐛 (experimental) `atom.io/realtime` upcoming `continuity` model handles mutable atoms better.
- 20b213f: ✨ `Silo` adds the `runTransaction` method.
- b10961b: ✨ Stack traces are now provided when attempting to get, set, or dispose a previously disposed state. These traces point to line of code responsible for last-known disposal of the state in question.
- b10961b: 🎁 `atom.io/web` Provides platform-specific tools for the browser. ✨ The first such tool is the new `persistSync` function! This function returns an `AtomEffect` that can be used to sync your state to the browser's `window.localStorage` or `window.sessionStorage`.

## 0.27.5

### Patch Changes

- 3e592a6: ♻️ `atom.io/internal` refactors many internal store functions to place `Store` as the zeroth param.
- 69bb0c8: 🐛 No longer throws when overwriting an existing family, as this is a normal part of the development workflow with hot module replacement.

## 0.27.4

### Patch Changes

- ae2e4bc: ✨ `atom.io/immortal` No longer throws when a state can't be found.

## 0.27.3

### Patch Changes

- 5a73363: 🐛 `atom.io/eslint-plugin` previously wouldn't catch cases of a selector calling its `get` toolkit function after an `await`, if that `get` was nested in a ternary. Now, it will catch these cases.
- fe6e090: ✨ For ergonomic purposes, `atom.io` now throws an error when an `atomFamily` or `selectorFamily` is created using a key used for another family in the store.
- 4da50d6: ♻️ For safety, only tokens are now returned from the functions `atomFamily` and `selectorFamily`, in accordance with their TypeScript representations.

## 0.27.2

### Patch Changes

- 17c1e67: 🏷️ The streamlined mode of `getState` and `setState` now require a `Key` extending the type of the family's `Key`.

## 0.27.1

### Patch Changes

- 6ae7d49: ✨ `atom.io/json` adds the `Entries` type, the `fromEntries` function, and the `FromEntries` type. `Entries` are an array of `[key, value]` tuples. `fromEntries` converts an array of entries to an object with full type safety.

## 0.27.0

### Minor Changes

- 663cdd4: ➕ `atom.io` requires `eslint>=9.0.0` as an optional peer dependency. This is due to the fact that eslint versions `<9.0.0` are no longer being tested in `atom.io`'s test suite, as maintenance for them will conclude in coming months.
- cb6912e: 💥 BREAKING CHANGE: (types only) Calling an `atomFamily` or `selectorFamily` directly, a feature previously marked deprecated, now gives a TypeScript error. Documentation has been updated on [atom.io.fyi/docs](https://atom.io.fyi/docs) to reflect this change.
- 9b4470e: 💥 BREAKING CHANGE: `Json.Object` is no longer permitted as a key for `atomFamilies` or `selectorFamilies`. This due to the fact that objects may include extraneous properties that not official to their type, and that property-order is not guaranteed anyway.

## 0.26.0

### Minor Changes

- 8ac767b: ✨ `atom.io` Packages are now built targeting ES2023, providing access to the newer features used in writing the library, for those who desire them.

## 0.25.6

### Patch Changes

- 39c2f18: ⬆️ Patching for semantic-versioning compatibility with the new typescript eslint patterns.

## 0.25.5

### Patch Changes

- 97e69f0: 🐛 Fixed issue with the `get` function in `SelectorToolkit` where, if getting a state that's not present in an ephemeral store, the state would not be initialized but an error would be thrown instead.
- 97e69f0: ✨ `Silo` adds the `moleculeFamily` and `makeMolecule` methods.

## 0.25.4

### Patch Changes

- 434e6d4: 🐛 Fixed bug in AtomIO's core that would occur in situations where a package manager like `pnpm` installed multiple AtomIO instances for purposes of version safety/intercompatibility. This could lead to different `IMPLICIT.STORE`s being used on adjacent lines, and as a result, bizarre errors would be thrown. Resolved this by making the `IMPLICIT.STORE` discoverable on `globalThis`.

## 0.25.3

### Patch Changes

- a6283c4: 🐛 Fix bug where, when using `useO` in `ephemeral` stores, a state would not be created as needed in React components.

## 0.25.2

### Patch Changes

- a9da731: 🐛 Fix bug where, `GetterToolkit`'s and `SetterToolkit`'s `get` method would error when retrieving state from a family that wasn't an `AtomFamily`.

## 0.25.1

### Patch Changes

- 166625e: 🐛 Fixed bug where, when attempting to retrive states with `CtorToolkit["get"]`, the states would be fail to be found.
- 166625e: 🐛 Fixed bug where, when a molecule could not be found, its key would not be properly error-logged.

## 0.25.0

### Minor Changes

- a308896: 💥 BREAKING CHANGE: The method `join` from `MoleculeToolkit` has been absorbed into the `bond` method; it now returns tokens for the relations of the entity bonded to the join in question.
- 3c495a7: 🎨 All attributes and types called `Transactors` have been renamed `Toolkit` to reflect the broader role of this pattern in selector evaluations and molecule constructors.
- 091c5de: ✨ `getState` and `setState` can now be used for family members without requiring `findState`. Simply pass the family member and key.

  ```ts
  const countAtoms = atomFamily<number, string>({
    key: `count`,
    default: 0,
  });

  getState(countAtoms, `find-me`); // -> 0
  setState(countAtoms, `find-me`, 1);
  getState(countAtoms, `find-me`); // -> 1
  ```

  ⚠️ Note that, if the family member is not found, this will throw a `NotFoundError` in `immortal` stores.

### Patch Changes

- 091c5de: 🐛 Fixed bug where, when creating a new `Store`, unless that store was copied from an existing store, its configuration options would not be set.
- 091c5de: ✨ `Silo` receives the `disposeState` method.

## 0.24.8

### Patch Changes

- cf66736: 🚀 Greatly improve performance for selectors with deep dependency trees. Redundant work is now avoided when discovering a selector's root atoms.

## 0.24.7

### Patch Changes

- e4d32db: 🐛 Fixed bug where, when getting a molecule in a selector, the get operation would throw.

## 0.24.6

### Patch Changes

- 44a1d5a: 🐛 Fixed a bug where, when setting a selector in a transaction, that selector would leak to the outer store.
- 44a1d5a: 🐛 Fixed a bug where, when creating a molecule in a transaction, the molecule creation event wouldn't be nested into the transaction update.
- 44a1d5a: 🐛 Fixed a bug where, when creating a molecule which `bond`s atoms, the atom creations would be redundantly captured on transactions/timelines, leading to noisy warnings in the console.

## 0.24.5

### Patch Changes

- 84a0737: 🐛 Fixed an issue where, when applying a transaction in which a mutable atom was created, atom.io would attempt to re-create that atom twice, which led to a pesky error log.

## 0.24.4

### Patch Changes

- 6ab042e: ✨ The `join` function from `MoleculeTransactors` now returns the original join for convenience.

## 0.24.3

### Patch Changes

- aed426f: ✨ `getState` and the `get` transactor can now get the Instance for a `MoleculeToken`.

## 0.24.2

### Patch Changes

- 4326095: ✨ `moleculeFamily` passes the `claim` transactor to the constructor of the molecule instance. This transactor allows your molecule to place itself above another molecule.

## 0.24.1

### Patch Changes

- c38ac4c: 🏷️ The `MoleculeConstructor` type becomes more permissive to prevent a type error when setting up a `moleculeFamily`.

## 0.24.0

### Minor Changes

- 46fbac4: 💥 BREAKING CHANGE: Simplified API for the `moleculeFamily` function. Now it receives a class directly.
- 46fbac4: 💥 BREAKING CHANGE: `moleculeFamily` and associated utilities and types are now exported from `atom.io` (Previously they were exported from `atom.io/immortal`.)

### Patch Changes

- 46fbac4: ✨ `moleculeFamily` adds the `dependsOn: "any" | "all"` option. `"any"` means molecules created by this family will not dispose until all molecules above have been disposed. `"all"` means that any disposal above this molecule will dispose it.

## 0.23.5

### Patch Changes

- fa5943e: 🐛 Fix issue where some molecules could be missed during the disposal process.

## 0.23.4

### Patch Changes

- 687ac19: 🐛 Fix an issue where trying to create a molecule as a child of another molecule during the parent's construction would lead to the child being orphaned. Now parents can spawn children in their constructors by passing `this` to the `makeMoleculeInStore` function: e.g., `makeMoleculeInStore(store, this, <family>, <key>, <...params>)`.

## 0.23.3

### Patch Changes

- 6305e3d: 🐛 It is now possible to override the `[Symbol.dispose]()` method when extending the `Molecule` class.

## 0.23.2

### Patch Changes

- af6d2e0: 🐛 `atom.io/eslint-plugin` was not exporting the `lifespan` rule advertised in 0.22.0. Now it's properly exported.

## 0.23.1

### Patch Changes

- 91543b9: 🐛 `atom.io/ephemeral` and `atom.io/immortal` were missing `.d.ts` files. These are now included.

## 0.23.0

### Minor Changes

- 8bdbabd: 💥 BREAKING CHANGE: The `timeline` option key `atoms` has been renamed `scope`. This is because it now supports `MoleculeFamilyToken`s in addition to `AtomToken`s and `AtomFamilyToken`s.

### Patch Changes

- 8bdbabd: ✨ The `make` transactor lets you create a molecule during a transaction.
- 8bdbabd: ✨ The `dispose` transactor lets you get rid of a state or molecule during a transaction.
- beb1b49: ✨ The `json` transactor allows you to retrieve the JSON token for a mutable atom during a `transaction.do` or a `selector.get`, or `selector.set` procedure.

## 0.22.0

### Minor Changes

- bd2cb19: 🎁 New subpackage: `atom.io/immortal` contains utilities for managing environments with indefinite lifespans where memory leaks must not occur.
- bd2cb19: ✨ `atom.io/immortal` adds the new `Molecule` class. This class can be used to create a chain of ownership for members of your store, making the process of de-initialization more ergonomic.
- bd2cb19: 💥 BREAKING CHANGE: Calling an atom family directly (deprecated; use `seekState` or `findState` instead) always attempts to create a new state now.
- bd2cb19: 💥 BREAKING CHANGE: The `Store` and `Silo` constructors now require an object config including `name` and `lifespan` for the first parameter rather than just a `name`.
- 21b31a1: 💥 BREAKING CHANGE: `findState` is now exported from `atom.io/ephemeral`.
- 78b958f: 💥 BREAKING CHANGE: `disposeState` now only disposes of states that belong to atom families or selector families. An error will be logged when attempting to dispose of standalone states.

### Patch Changes

- bd2cb19: ✨ Transactions and Selectors now include the `seek` transactor, which behaves like `seekState`.
- 21b31a1: 🎁 New subpackage: `atom.io/ephemeral` contains utilities for short-lived environments.
- bd2cb19: 🐛 Restore deprecation notice to directly calling state families to retrive state.
- bd2cb19: 🐛 `disposeState` now properly removes trackers created for mutable atoms.
- bd2cb19: ✨ `atom.io/immortal` adds the `seekState` function. This is an alternative to `findState`, which is not allowed in `immortal` stores. Instead of implicitly initializing a state that doesn't exist as `findState` does, `seekState` will simply return `undefined` in this case.
- bd2cb19: ✨ `atom.io/eslint-plugin` adds a new rule `lifespan` that disallows use of the `findState` function and the `find` transactor when using the `"immortal"` setting.

## 0.21.1

### Patch Changes

- 24826e2: 🐛 Fix a bug with `subscribe` when subscribing to states. When this was done previously, the update would be emitted to subscribers before the close of the operation, which meant that any `setState` calls in the body of the observer would always be deferred until immediately after the operation closed. This was non-obvious behavior and overall just a bad workflow. Now, the update is emitted after the operation closes, preventing deferrals in this use case.

## 0.21.0

### Minor Changes

- 7593a7a: 💥 BREAKING CHANGE: the `dispose` function has been renamed to `disposeState`. (Additionally, the internal functions `deleteAtom` and `deleteSelector` have been renamed to `disposeAtom` and `disposeSelector`, respectively.)

### Patch Changes

- 7593a7a: 🚀 `atom.io/react-devtools` uses more performant patterns in its state indexing.
- 7593a7a: ✨ `atom.io/introspection` now includes a new experimental `Auditor` class. This is a tool for long-running instances, where there is a concern that the store may be holding onto resources that are no longer needed. By running `Auditor.listResources()`, you can get a list of all state tokens that belong to families in the store, along with their creation time.
- 7593a7a: 🐛 `atom.io/react-devtools` now properly handles the case where a state is disposed. Previously, deleted states would be left in the state index. Now they are removed.

## 0.20.3

### Patch Changes

- 7bac548: 🚀 Allocate only one array of dependency unsub functions for the life cycle of a selector subscription.
- bc1e49b: 🔊 Add "info"-level log using the 🟢 icon for when a deferred `setState` is triggered.
- bc1e49b: 🔇 Lowered the log level when a `setState` is deferred due to another `setState` in progress from "warn" to "info".

## 0.20.2

### Patch Changes

- deec3ba: 🐛 Fix bug where, when a subscribed selector was re-evaluated, and its root atoms changed, the subscription would not be updated to track those new roots, but would instead remain tracking the roots that were present when the subscription was originally created.

## 0.20.1

### Patch Changes

- 27a373d: ✨ Calling `setState` during a `setState` operation is more forgiving now. Instead of logging an error and doing nothing, it will now log a warning and enqueue the update for as soon as the current operation completes.

## 0.20.0

### Minor Changes

- cb8fb89: 🐛 Fix bug with `Loadable` (async) selectors.

  It remains the case that, when an atom or selector is set to a Promise, the store will wrap that Promise in an internal mechanism called a "Future". When the Future is resolved, the atom or selector will be updated to the resolved value.

  Previously, the store had the option to "cancel" a Future in the event that a selector was evicted from the store, due to states upstream of the selector being changed. The idea was to prevent a race condition where an earlier value might override a later one. But because a cancelled Future will never resolve, a problem arose with code like the following:

  ```ts
  const urlAtom = atom<string>({
    key: `url`,
    default: `https://example.com`,
  });
  const fetchResponseSelector = selector<Loadable<Response>>({
    key: `fetch`,
    get: async ({ get }) => {
      const url = get(urlAtom);
      return await fetch(url);
    },
  });
  const fetchedJsonSelector = selector<Loadable<Json.Serializable>>({
    key: `fetchedJson`,
    get: async ({ get }) => {
      const responseLoadable = get(fetchResponseSelector);
      const response = await responseLoadable; // <-- ❗ this might never resolve if the urlAtom changes
      return await response.json();
    },
  });
  ```

  The problem here is that, if the `urlAtom` changes while `fetchedJsonSelector`'s getter is running, the `fetchResponseSelector`'s current future value will be cancelled and will never resolve, leading to a getter will hang forever.

  This fix guarantees that every instance of a Loadable selector will always resolve, so atom.io won't cause code like the above to hang.

  However, this also means that selectors whose values are currently a future will not be evicted, and will always be recomputed eagerly when their dependencies change. This behavior may become somewhat lazier in a future release.

## 0.19.4

### Patch Changes

- 56ac53d: ✨ `atom.io/eslint-plugin` adds a new rule, `explicit-state-types`. This rule enforces passing type arguments to your state declarations up-front. A best practice for making your store less amorphous.

## 0.19.3

### Patch Changes

- f288c94: 🎁 `atom.io/eslint-plugin` is a new subpackage providing useful guidance against possible non-obvious pitfalls that may arise for developers. Currently, only one rule is included: `synchronous-selector-dependencies`, which should help prevent the states that selectors depend on from being gathered at arbitrary times. Documentation forthcoming on https://atom.io.fyi.

## 0.19.2

### Patch Changes

- 262135d: 🏷️ The type `ƒn`, a convenience type for generics meaning `(...parameters: any[]) => any` has been renamed `Func`.
- 262135d: 🏷️ The type `TransactionToken<F>` now insists that `F extends Func`. This is true to the nature of the `transaction`, which must always encapsulate a function.
- 262135d: ✨ Permit proper disposal of mutable atoms.

## 0.19.1

### Patch Changes

- eaeb8f6: ✨ Silo now includes a findState function scoped to its store.

## 0.19.0

### Minor Changes

- e00d7b2: 💥 BREAKING CHANGE: `atom.io/data` `join` has changed its API significantly.

  ### Creating a join is still the same.

  ```ts
  import { join } from "atom.io/data";

  const followersOfInfluencers = join({
    key: `followersOfInfluencers`,
    between: [`influencer`, `followers`],
    cardinality: `n:n`,
  });
  ```

  ⚠️ **However**, the type that it returns is now a fully serializable `JoinToken`, not a `Join`.

  ### Getting relations has changed.

  Before:

  ```ts
  import { findState } from "atom.io";

  const influencersIFollowToken = findState(
    followersOfInfluencers.states.influencerKeysOfFollower,
    myUsername,
  );
  ```

  After:

  ```ts
  import { findRelations } from "atom.io/data";

  const influencersIFollowToken = findRelations(
    followersOfInfluencers,
    myUsername,
  ).influencerKeysOfFollower;
  ```

  ### Setting relations has changed.

  Before:

  ```ts
  followersOfInfluencers.set({
    influencer: myUsername,
    follower: anotherUsername,
  });
  ```

  After:

  ```ts
  import { editRelations } from "atom.io/data"

  editRelations(
    followersOfInfluencers,
    (relations) => {relations.set({ influencer: myUsername, follower: anotherUsername }),}
  )
  ```

## 0.18.3

### Patch Changes

- ee6cc64: 🐛 The sourcemap that was being shipped to npm was deficient, and would indicate lines incorrectly in the debugger. The sourcemap is being removed for now. The built, but non-minified js will appear in the debugger instead.

## 0.18.2

### Patch Changes

- 82305d4: ✨ Add experimental testing layer for breaking changes. Once it's seen some use, 1.0.0 arrives.
- 449f81c: 🚀 Very marginal core bundle size reduction and performance when using families.

## 0.18.1

### Patch Changes

- 3bbbb23: 🐛 When retrieving a value from the cache during a transaction, it was possible to get the version of that value belonging to the underlying store, which could be problematic for mutable atoms. Now, when retrieving a mutable atom in this situation, the value will always be a fresh copy.
- 3bbbb23: 🐛 Mutable atoms now properly evict downstream states when they are updated via a tracker update during the process of applying a transaction.
- 3bbbb23: 🔊 Improve logging for changes to mutable atoms. Now they just report the ( `value` ), since the general form `( oldValue -> newValue )` was redundant, always showing the same value twice.
- 3bbbb23: 🐛 When creating new family members during a transaction, a NotFoundError would occur when applying the transaction to the store. Now they are properly recreated in the target store during the application phase.
- 3bbbb23: 🐛 `dispose` was previously unable to handle mutable atoms. Now it can do so.

## 0.18.0

### Minor Changes

- d73205e: 🎁 New Subpackage! `atom.io/realtime` introduces the new end-to-end `continuity` API.

  `continuity` Is an out-of-the-box solution for efficient rollback netcode with adversarial perspectives. It tracks a group of global states, actions, and "perspectives". Assuming the global and perspective-bound states are only updated via the listed actions, `continuity` allows clients to optimistically predict the global state from their perspective, and roll back to the correct state when the server disagrees.

  - ✨ `realtime-server` `continuitySynchronizer`
  - ✨ `realtime-client` `syncContinuity`
  - ✨ `realtime-react` `useSyncContinuity`

### Patch Changes

- 0cf62c4: ✨ `atom.io/data` `join` adds the `in(Store)` method. Use this method when you want to update relations in another store.
- d73205e: ✨ `atom.io/realtime-server` introduces some experimental tools for breaking your monolithic server into multiple processes, in the `ParentSocket` and `ChildSocket` classes.
- 56a29e8: 🗑️ Formally deprecate the family-as-function style of usage.

  ```ts
  const countAtoms = atomFamily<number, string>({
    key: `count`,
    default: 0,
  });

  // Deprecated
  const countState = countAtoms("find-me");

  // Use this instead
  const countState = findState(countAtoms, "find-me");
  ```

## 0.17.0

### Minor Changes

- fd5b715: 💥 BREAKING CHANGE: `getState` and `setState` no longer support accessing a particular store besides the implicit store. If you are looking for this functionality, use the methods returned by the silo class when creating your store.

## 0.16.3

### Patch Changes

- f89cb88: ✨ `atom.io/react` `useI` and `useO` now support the usage `(FamilyToken<T, K>, K): Setter<T>` and `(FamilyToken<T, K>, K): T` respectively.
- f89cb88: ♻️ `atom.io/realtime-testing` clients now must be deliberately initialized.

## 0.16.2

### Patch Changes

- 67e6199: 🐛 Fix bug where, when applying a nested transaction, updates to mutable atoms would leak into the store before the outer transaction was applied.
- 67e6199: 🐛 Fix bug where, when setting relations on a join in a nested transaction, adding and deleting relations could cause leaks to the outer store. Now these methods are properly encapsulated.

## 0.16.1

### Patch Changes

- db948c0: 🐛 `atom.io/data` `join` fix bug where, when using `.replaceRelations` during a transaction, the result would be leaked to the store the transaction was running in. This method is now properly encapsulated, and its performance should be somewhat better for cases where relations are sorted into a new order.

## 0.16.0

### Minor Changes

- 4013686: 💥 BREAKING CHANGE: Types for atoms and selectors have been changed. `Selector` now encompasses `ReadonlySelector` and `WritableSelector`; `MutableAtom` is now differentiated from `RegularAtom` and are given the brands `{ type: "mutable_atom" }` and `{ type: "atom" }` respectively. `Atom` encompasses these.
- 636b095: 💥 BREAKING CHANGE: `atom.io/realtime` has renamed most core functions to organize the design around three core APIs:

  - Isolated
  - Shared
  - Adversarial

  ### Isolated

  Used for data that is controlled by a single user. This data can safely be persisted to the server and relayed to other users without any additional synchronization logic.
  | | Get | Set |
  | ---------- | ---------------------------------------------------------------------------------------------------------- | -------------------------------- |
  | **React** | `usePull` `usePullMutable` `usePullFamilyMember` `usePullFamilyMember` | `usePush` (variants coming soon) |
  | **Client** | `pullState` `pullMutable` `pullFamilyMember` `pullMutableFamilyMember` | `pushState` |
  | **Server** | `realtimeStateProvider` `realtimeMutableProvider` `realtimeFamilyProvider` `realtimeMutableFamilyProvider` | `realtimeStateReceiver` |

  ### Shared

  Used for low-complexity data that is shared between multiple users. Updated on the server via transactions, and updated on the client via state subscriptions.
  | | Get | Set |
  | ---------- | ---------------------------------------------------------------------------------------------------------- | ------------------------ |
  | **React** | `usePull` `usePullMutable` `usePullFamilyMember` `usePullFamilyMember` | `useServerAction` |
  | **Client** | `pullState` `pullMutable` `pullFamilyMember` `pullMutableFamilyMember` | `serverAction` |
  | **Server** | `realtimeStateProvider` `realtimeMutableProvider` `realtimeFamilyProvider` `realtimeMutableFamilyProvider` | `realtimeActionReceiver` |

  ### Adversarial

  Best for situations where speed and the ability to rollback is necessary. Updated on the server via transactions, reconciled on the client.
  | | Get | Set |
  | ---------- | ----------------------------------------- | ---------------------------- |
  | **React** | `useSyncState` (coming soon) | `useSyncAction` |
  | **Client** | `syncState` (coming soon) | `syncAction` |
  | **Server** | `realtimeStateSynchronizer` (coming soon) | `realtimeActionSynchronizer` |

- 636b095: 💥 BREAKING CHANGE: `atom.io/data`: `join.findState` becomes `join.states`

## 0.15.6

### Patch Changes

- 0009fc2: 🐛 Fix bug where, when nesting transactions, mutable atoms modified in the child would not be carried up to the parent, meaning subsequent reads in the parent or other children would retrieve a stale value. The value will now be carried up correctly.

## 0.15.5

### Patch Changes

- 9cb849c: ✨ `transaction.do` now has an transactor `env()` which, when called, provides the current platform ("node", "browser", or "unknown) and the store's name. It can be used to implement logic that should only run on the server.
- 9cb849c: ♻️ The new core function `findState()` and corresponding `find()` transactor represent the future API for using state families. They are intended to replace the direct usage of families as functions.

  The find functions take two parameters, a `FamilyToken<T, K>` of some kind (`atom`, `selector`, etc.) and a `Json.Serializable` key that satisfies `K`. It returns an `Atom<T>` or `Selector<T>` or whatever, depending on the type of family.

  `FamilyToken` is being added to make families more like the rest of `atom.io`, and follow the pattern of exposing serializable references that can be used between stores and processes. In a future breaking update, the family functions will return these tokens instead of the family functions themselves.

  `ReadableFamily<T, K>` (the type that encompasses all state families) extends `FamilyToken<T, K>`, and the subtypes extend their corresponding tokens—e.g., `AtomFamily<T, K>` extends `AtomFamilyToken<T, K>`. This means that you can use a family token anywhere you can use a family function, and vice versa.

- 9cb849c: ✨ `atom.io/realtime-server` has a new hook `useSyncTransaction` that can be used for synchronizing state between client and server in a transaction-driven way. A transaction update received by this hook will be recomputed on the server with the same parameters, and the resulting update will be sent in whole or in part to the client. If the client sees a different result than the server, it will roll back its update and apply the server's version.
- 9cb849c: 🐛 `atom.io/realtime-react` will now create, at most, one instance of a given service for any token. Previously, it would create a new instance for each component that used the service, even if they used the same token. So a given atom, for example, would receive an update for each component with a `usePull` for it, meaning that you might need to be careful to only pull a given atom once. This is now resolved; it's fine to pull an atom in as many components as you like. Only one update stream will be created for it.
- 9cb849c: ✨ `TransactionUpdate` now has bears an "id" property used for tracking it across network boundaries.

## 0.15.4

### Patch Changes

- 90bb2e3: ✨ `isToken` and `belongsTo` can help you check the types of unidentified tokens.

## 0.15.3

### Patch Changes

- 75d7ef1: 🐛 `atom.io/data` `join` Fix bug with `Join.relations.replaceRelations` which would fail to replace all relations.
- 75d7ef1: 🐛 `atom.io/realtime-react`: Fix issue where context provider would fail to initialize your Id in contexts where a socket is not immediately available.

## 0.15.2

### Patch Changes

- 0e4254b: 🏷️ `atom.io/data` `join` state families are now properly identified as readonly.
- 0e4254b: 🐛 Fix bug where a token belonging to a family might be passed to setState without that family member having been initialized previously, leading to a NotFoundError.
- 0e4254b: 🏷️ `atom.io/realtime-react`: Apply type fix from #1108 to `usePullMutableFamilyMember` also.
- 0e4254b: 🐛 `atom.io/data` `join` will not, for the time being, dispose of states that are empty until disposal is easily reversible.
- 0e4254b: 🐛 Trackers are now properly disposed of following a transaction.
- 0e4254b: ✨ Mutating the value of a mutable atom now dispatches an update to the store, even outside of a `setState` callback. Keep in mind that this is a somewhat reckless pattern, as the dispatch is only bound to the layer of the store that the atom's value was gotten from.

  For example, if you have the following code

  ```ts
  const playerIndex = atom({
    key: 'playerIndex',
    default: new SetRTX()
    mutable: true,
    toJson: (set) => set.toJSON(),
    fromJson: (json) => new SetRTX(json),
  })

  const playerIds = getState(playerIndex)

  const addPlayerTX = transaction<(id: string) => void>({
    key: 'addPlayer',
    do: (_, id) => {
      playerIds.add(id)
    }
  }
  ```

  The above transaction, when run, will not include any updates. However, the base store _will_ be updated as the transaction runs.

  ```ts
  const addPlayerTX = transaction<(id: string) => void>({
    key: 'addPlayer',
    do: ({ get }, id) => {
      const playerIds = get(playerIndex)
      playerIds.add(id)
    }
  }
  ```

  The `get` call will produce a copy of the atom's value that is bound to the transaction's scope. If the transaction fails, the store will not be updated. If the transaction succeeds, the store will be updated with the new value.

- 0e4254b: 🐛 `atom.io/transceivers/set-rtx`: Updates are now emitted after mutating the transceivers inner state. Emitting before led to bugs when trying to capture state."
- 0e4254b: 🏷️ `WritableToken` utility type refers to Atom and Selector token (the previous name, `WritableToken`, has been deprecated). `ReadableToken` includes readonly Selector tokens as well.
- 0e4254b: 🐛 When copying mutable state in a transaction, the state would be created without attaching its family metadata. Now, family metadata is properly attached.
- 0e4254b: 🥅 Improve safety when `setState` is misused on a readonly selector. Previously, this would cause things to break badly. Now, it does nothing.
- 0e4254b: 🐛 When `get` called on a mutable atom during a transaction, a copy is now properly created.

## 0.15.1

### Patch Changes

- dc72bfc: 🐛 Fix bug where when a readonly selector family (a family of selectors with no `set` method) was created, it would not be added to the store's family registry. This would result in runtime errors when attempting to implicitly initialize a readonly selector from its family function. Now the family is properly registered and the selector can be implicitly initialized.
- dc72bfc: 🏷️ `atom.io/realtime-client` and `atom.io/realtime-react`: Fix types accepted by `pullMutable` and `pullMutableFamilyMember`, which would reject usage for arbitrary reasons.
- dc72bfc: ✨ `atom.io/data` `join`: Expose `core.getRelatedKeys`. This is a mutable atom family that serves as the actual source of truth for the relations a join stores. This can be used in other atom.io modules such as `/realtime` to synchronize the relations of a join across multiple instances.

  As a part of exposing this family, its JSON interface has been updated to use the `toJSON` and `fromJSON` methods on the `SetRTX` transceiver.

- dc72bfc: 🐛 `atom.io/realtime-react`: Fix bug with `RealtimeContext` where a `socket.io` instance would be preemptively initialized and would remain complaining that it could not connect after being replaced.
- dc72bfc: 🏷️ `atom.io/realtime-client` and `atom.io/realtime-react`: broaden types accepted by the `pullFamilyMember` and `usePullFamilyMember` functions. Instead of just accepting `AtomToken`, they now accept `WritableToken`, allowing for `SelectorToken` and `AtomToken` to be used interchangeably.
- dc72bfc: ♻️ `atom.io/data` `join` States for singular keys or entries now return `null` instead of `undefined` for ease of use in contexts where serialization is necessary.

## 0.15.0

### Minor Changes

- a7e72ea: 💥 BREAKING CHANGE: The behavior of transactions has changed. The `get` and `set` available in the scope of a transaction previously acted just like `getState` and `setState`. Both were bound to the child store for the transaction and could be used interchangeably.

  Now, `getState` and `setState` remain bound to the parent store, while `get` and `set` are bound to the child store. This means that only `set` will add updates to the transaction.

### Patch Changes

- a7e72ea: ✨ `atom.io/data` `join` now offers an API for compatibility with the new transactor policy introduced in this version. To update relations in a transaction, use the `.transact` method on the relation:

  ```ts
  const userGroups = join({
    key: `userGroups`,
    between: [`user`, `group`],
    cardinality: `n:n`,
  });
  const addUsersToGroupTX = transaction<
    (groupKey: string, userKeys: string[]) => void
  >({
    key: `addUsersToGroup`,
    do: (transactors, groupKey, userKeys) => {
      userGroups.transact(transactors, ({ relations }) => {
        for (const userKey of userKeys) {
          relations.add(groupKey, userKey);
        }
      });
    },
  });
  ```

- a7e72ea: 🐛 The `set` transactor now enforces the type of your state properly, which could lead to type errors in existing `transactor` and `selector` code.

## 0.14.8

### Patch Changes

- 3fda99f: 🐛 Fix issue with `useTL` where the `undo` and `redo` methods would not fire properly for dynamic use cases.

## 0.14.7

### Patch Changes

- 1dd8b9c: ✨ `atom.io/react` `useTL` can now have the timeline it consumes updated dynamically.
- 9d1bb23: 🚀 Redundant .d.cts files, which were unreferenced in atom.io's manifests, and identical to their respective .d.ts files, have been removed.

## 0.14.6

### Patch Changes

- e6e007a: 🐛 Fix issue where the main d.ts was not present in the package.

## 0.14.5

### Patch Changes

- 993c5d8: 🐛 Fix bug causing incompatibilities between the types of `atom.io`'s various subpackages.

## 0.14.4

### Patch Changes

- 429da48: 🐛 Fix bug where useTL would not see updates to the timeline it consumed.

## 0.14.3

### Patch Changes

- e01ae8a: 🐛 Fix bad build causing typings to break for the library.

## 0.14.2

### Patch Changes

- 3afd48d: 🐛 Fix issue where mutable atoms would not be affected when using time travel (`undo` and `redo`) when tracking them on a timeline.

## 0.14.1

### Patch Changes

- 092e490: 🚀 Improve bundle size and source mapping.

## 0.14.0

### Minor Changes

- 8a62273: 💥 BREAKING CHANGE: `subscribeToTransaction` and `subscribeToTimeline` have been moved to `atom.io/internal`. Prefer `subscribe`, which now supports transactions and timelines with type safety.
- 8a62273: ✨ `atom.io/react` `useTL` provides a convenient way to use a timeline and observe where you are on it.

## 0.13.0

### Minor Changes

- ed599e9: ✨ `transaction` now includes the `run` function, allowing for nesting other transactions.

### Patch Changes

- ed599e9: ✨ `atom.io/internal` ships the `Lineage<T>` interface. It's a linked list, basically. It's here to power transaction nesting. The "lineage" is the chain of draft stores that have been created in a transaction.

## 0.12.1

### Patch Changes

- 032b0d7: 🚀 Thanks to the new `atom.io/internal` `LazyMap`, `transaction` should see better performance when working in larger stores. Before this update, initializing (or "building") a transaction would copy the entire valueMap, atoms map, selectors map, etc. all at once, incurring a lot of immediate overhead. Now, the `LazyMap` will only copy the values that are actually modified, when they are modified.

## 0.12.0

### Minor Changes

- c400962: ✨ `dispose` function allows for complete cleanup of atoms or selectors created in the store, as well as cleanup of downstream states.
- 89f6123: ✨ `atom.io/data` ships the new `join` function, which can be used to manage data interrelations performantly.
- c400962: 💥 BREAKING CHANGE: `AtomEffect` type, if it returns anything, must return a function. This is intended for cleanup of resources.
- c400962: 💥 BREAKING CHANGE: `deleteAtom` now only exports from `atom.io/internal`. Prefer using the public interface `dispose` from `atom.io`.

### Patch Changes

- c400962: 🚀 Prevent double-reading state onSet.
- 89f6123: 🐛 Mutable atoms would emit an additional update due to their tracker catching and reapplying any update that they emitted. Now, their behavior is more consistent with non-mutable atoms, thanks to an extension of the `Transceiver` class. Transceivers must now implement a serial number representing the last update they applied, and must also be able to derive the serial number from any update they receive.
- 396b8ff: 🐛 `atom.io/react` `UseI` no longer returns fresh references on every render, making it more convenient to use in dependency arrays.

## 0.11.0

### Minor Changes

- 72bfbe4: 💥 BREAKING CHANGE: `Loadable` type is now exported from `atom.io/data`, not `atom.io/internal`.

### Patch Changes

- 72bfbe4: ✨ `until` function exported from `atom.io/data` allows straightforward specification of a fallback when using `Loadable` state in a non-async context.

## 0.10.4

### Patch Changes

- bd3f897: 🐛 Fix bug where simpleLog would stringify all of its extra args leading to hard-to-read logs.

## 0.10.3

### Patch Changes

- 2a491a31: 🔊 Fix a log where non-primitive data would be coerced to a string, potentially resulting in `[Object object]` in the logs.
- 313eeb87: 💥 BREAKING CHANGE: Logger now follows a strict format: [icon] [token-type] [token-key] [message] [...rest].

## 0.10.2

### Patch Changes

- b532e04: 🔊 Report keys of entities more consistently in logs to aid filtering.

## 0.10.1

### Patch Changes

- 41bdd9c: 🐛 Fix bug where logs were cut short.

## 0.10.0

### Minor Changes

- 9e700763: 💥 BREAKING CHANGE: Atom.io now supports multiple loggers and custom log filters per logger. `setLogLevel` and `useLogger` are no longer available. Directly setting `Store.loggers` is preferred.
- a839b9c: ✨ `deleteAtom` allows the complete removal of atoms defined in the store.

## 0.9.10

### Patch Changes

- efecd2d: 🔇 Remove annoying error message that would notify any time a async selector was canceled.
- 4b2e8921: 🚀 Improve performance when tracing dependencies of selectors.

## 0.9.9

### Patch Changes

- a3c366d: 🚑 Hotfix - increase dependency depth to 99999

## 0.9.8

### Patch Changes

- 731d10f: ✨ Add `shouldCapture` option to timeline. This permits the user to specify whether or not the timeline should capture any given update. This is a versatile way to achieve fine-grained control over which updates matter and which don't.

## 0.9.7

### Patch Changes

- b48c52fa: 🐛 Fix bug where, if atoms had already been created in a family before that family's timeline was registered, those atoms would not be tracked. Now they will be retrieved and tracked at timeline creation.

## 0.9.6

### Patch Changes

- cbeddf1: 🐛 Fix bug where in rare conditions stale async states could still cache their resolved values."

## 0.9.5

### Patch Changes

- d507401: 🐛 Fix a race condition that could, in some cases, cause an async selector to resolve and cache after its value had already been evicted by upstream changes.

## 0.9.4

### Patch Changes

- e6f4024: 🐛 Fix issue where `structFamily` would fail to retrieve subfamilies of the struct.

## 0.9.3

### Patch Changes

- 8925069: 🐛 Fix bug where all selectors created using the `dict` function from `atom.io/data` would be given the same key.

## 0.9.2

### Patch Changes

- 7108589: 🐛 Fix incorrect type returned by the `struct` function in `atom.io/data`.
- 7108589: 🐛 Fix issue with `structFamily` function exported from `atom.io/data`. Previously this function would assume any `AtomFamily` it created held strings. Now it properly infers the type from the default object passed.

## 0.9.1

### Patch Changes

- f5d6793: 🐛 Fix incorrect type returned by the `struct` function in `atom.io/data`.

## 0.9.0

### Minor Changes

- 80f7b4f: 🎁 New Subpackage `atom.io/data` provides some handy utilities for destructuring data.

## 0.8.3

### Patch Changes

- 78e2a8e9: 🐛 Fix issue where imports from introspection would be resolved to the json module instead.

## 0.8.2

### Patch Changes

- b34a39e: 🐛 Fix broken imports from the previous version. Add integration testing script to avoid future breakage of this nature.

## 0.8.1

### Patch Changes

- 4439dbb: 💥 Remove unused `isDefault` function.
- 4439dbb: 🐛 Selectors are no longer computed twice!
- 4439dbb: 🥅 Automatically catch and log errors from rejected promises set into state.
- 4439dbb: `atom.io/internal`: withdraw may return undefined now, not null.
- 4439dbb: `atom.io/internal`: openOperation no longer throws, but may return a string signaling the rejection of the action, due to an operation currently being open.

## 0.8.0

### Minor Changes

- 835a1ee7: ✨ **Basic support for asynchronous data.**

  Sometimes the data you're working with comes from a process outside your control.

  For example, you might use `fetch` to get data from a server:

  ```ts
  import { atom } from "atom.io";
  import type { Fated } from "atom.io/internal";

  import { isUser, type User } from "~/store";

  const userState = atom<Fateful<User>>({
    key: `user`,
    default: async () => {
      const response = await fetch("/api/user");
      const parsed = await response.json();
      const user = isUser(parsed) ? parsed : null;
      return user;
    },
  });
  ```

  In this example, we initialize the atom with a function that returns a Promise. The atom will call the function and set its state to the function's return value: a Promise. When the promise resolves, the atom will update its state to the resolved value.

  | _Why would it be useful to set the atom's state to a Promise?_

  When an atom enters a refetching mode, subscribers are notified with an update `{ oldValue: T; newValue: Promise<T> }`, and they may choose one of three options:

  - **Do nothing** — The subscriber will continue to use the atom's current state.
  - **Enter a loading state** — Expose a flag to indicate that the data is loading, while continuing to use the atom's `oldValue`.
  - **Defer to React Suspense** — If the subscriber is a React component, it may prefer access to the promise itself, so it can throw it and trigger suspense.

### Patch Changes

- 835a1ee7: `atom.io/internal` — **`✨ Future`**

  `Future<T>` is just a `Promise<T>` with a `.cancel()` method that detaches listeners to `.then`. Can help avoid race conditions.

- 835a1ee7: `atom.io/internal` — **`🏷️ Eventual`** & **`🏷️ Fated`**

  `Eventful<T>` is a shorthand for data that is variously itself (`T`) or a `Promise<T>`.

  `Fated<T, E>` includes the possibility that instead of `T`, the data may be some kind of `Error` (`E`).

## 0.7.0

### Minor Changes

- a0f5095b: 🎁 New Subpackage `atom.io/transceivers/set-rtx` provides a look at the future of mutability in `atom.io`.
- a0f5095b: 🎁 Separate `atom.io/realtime-client` from `atom.io/realtime-react`.

### Patch Changes

- a0f5095b: ➖ Drop dependency `fp-ts`, bringing dependencies to 0.
- a0f5095b: 🐛 Fix inability to import library.
- a0f5095b: 🎁 Expose `atom.io/internal` as a subpackage.
- a0f5095b: ✨ Mutability stabilizing: `atom` and `atomFamily` now support configurations for mutability state storage.

## 0.6.9

### Patch Changes

- 3654af64: ✨ `atom.io/tracker` is ready for prime time, having demonstrated success working with timelines and transactions.
- 6927d431: 💥 BREAKING CHANGE: `createStore` has been replaced with class `Store`. The class satisfies the original return type and takes the same parameters.
- 23eeda27: 🚀 Some optimizations to the way the selector graph is implemented.
- 3654af64: 🚚 Implement a more effective strategy for submodule isolation, leading to leaner builds that tree-shake more consistently.
- 6927d431: 💥 BREAKING CHANGE: The `silo` function is now a class called `Silo`. The class satisfies the original return type.

## 0.6.8

### Patch Changes

- a8efdaf5: 🏷️ Compatibility with tsconfig's "exactOptionalPropertyTypes" compiler option.
- a8efdaf5: 🎁 New `atom.io/tracker` submodule introduces a experimental new performance pattern for atom.io!

## 0.6.7

### Patch Changes

- 7b9d422f: 🚀 Use a mutable `Map` for the core of the `atom.io` store. There should be less need for GC here than with an immutable `HAMT`.

## 0.6.6

### Patch Changes

- 9a2f4023: ✨ `atom.io/react-devtools`: better layout, views for Transactions and Timelines, no more pesky console errors.
- 9a2f4023: 🎁 `atom.io/introspection` the bare necessities for making devtools for `atom.io`.

## 0.6.5

### Patch Changes

- f00af24: ➖ `fp-ts` this dependency was hardly used, and not worth the extra bundle size.

## 0.6.4

### Patch Changes

- eba68841: ➖ `rxjs` dropping this dependency since the only purpose was IO with the Subject class. This can be accomplished much more simply.

## 0.6.3

### Patch Changes

- a79ddd0f: 🎁 New module: `atom.io/realtime-testing` can be used to test realtime logic and apps with multiple clients.

## 0.6.2

### Patch Changes

- 1ea4c367: 🐛 Fix bad typing that would cause an error when adding an `AtomFamily` to a `timeline`

## 0.6.1

### Patch Changes

- 5fb66302: 🐛 fix bug with react libraries relying on emotion.js

## 0.6.0

### Minor Changes

- 4aa5896: ✨ `subscribeToTimeline` allows you to see all updates that occur on a timeline.
- 4aa5896: ✨ Realtime hooks are now available as direct imports, e.g., `import { usePull } from "atom.io/realtime"`.
- 4aa5896: ✨ `silo` and `Internal.createStore` now accept an optional `Store` parameter that will be copied to the new store.
- 4aa5896: 🎁 Package `atom.io/realtime-react` is now properly exported (previously internal as `atom.io/realtime-client`).
- 4aa5896: ✨ `TimelineUpdate`s now include a `timestamp` when the update first began processing.

## 0.5.0

### Minor Changes

- 16ab1792: ✨ `import { silo } from "atom.io"` is our newest core function. Calling `silo("storeName")` returns an isolated instance of the core atom.io features, which can be very useful for testing libraries that synchronize multiple store instances.
- 87b85031: 🎁 New Subpackage! `atom.io/realtime` is a `socket.io`-powered system for exposing state from your node server to any client running atom.io and socket.io-client.

### Patch Changes

- 87b85031: 🏷️ Improve typings for tokens to include a `__brand?: T` property, where `T` is the type that the token refers to. This is helpful in unions, where a union including tokens of several types would otherwise lose their typing information. Important to note that the brand property is _never there._ It's a fiction, used to improve type inference, which isn't well-supported for discard types.

## 0.4.1

### Patch Changes

- ebfc6b7: 🏷️ New Type: `TransactionIO<TransactionToken>` infers the Params and ReturnType from the internal implementation of an AtomIO transaction.

## 0.4.0

### Minor Changes

- ba5d689: 🎉 New sub-package: `import { AtomIODevtools } from "atom.io/devtools"`. This is a component that shows you the state of every atom in your app, and allows you to change any atom whose value extends Json.
- ba5d689: ✨ For your convenience, `useStore`, `useI`, `useO` and `useIO` can be imported directly from `atom.io/react`
- ba5d689: 💥 BREAKING CHANGE: `useStore` is no longer returned from `composeStoreHooks`

## 0.3.1

### Patch Changes

- 75b0edc: 🏷️ `Read<ƒ>` and `Write<ƒ>` types for selectors and transactions
- 90cca7f: 🥅 nested calls to `setState` are no longer performed and an error is logged
- 90cca7f: 🐛 `timeline` now properly erases the future when a change is made in the past
- 90cca7f: 🐛 setting a `selector` no longer results in multiple timeline events
- 90cca7f: 🥅 an `atom` or `atomFamily` can no longer be tracked by multiple timelines. instead they must belong to only one.

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
