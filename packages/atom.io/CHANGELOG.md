# atom.io

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
