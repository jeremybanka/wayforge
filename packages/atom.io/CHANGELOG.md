# atom.io

## 0.46.31

### Patch Changes

- 579b866: ✨ `subscribe()`, when used on a `timeline`, now includes metadata like `length` and `at` for each update.

## 0.46.30

### Patch Changes

- 67d68ff: ✨ `atom.io/web` added `searchParamSync()`. A new effect similar to `storageSync()`, except using `URLSearchParams` instead of a browser `Storage` interface.

## 0.46.29

### Patch Changes

- 40c001b: ✨ `clearTimeline()` is a new utility to remove all history from a timeline.
- 40c001b: `atom.io/react` and `atom.io/solid` The `useTL()` function adds a new `clear()` utility for removing all history.

## 0.46.28

### Patch Changes

- fbde1a3: ✨ Allow for async atom effects.

## 0.46.27

### Patch Changes

- cfa5d27: 🐛 `atom.io` Fixed an issue where certain `Loadable` selectors, downstream of other `Loadable` selectors, would keep stale values in the cache.

## 0.46.26

### Patch Changes

- 7706a15: 🎁 `atom.io/solid` is a new integration with Solid (https://solidjs.com), with the same interface as `atom.io/react`.

## 0.46.25

### Patch Changes

- 7bc5a4c: 🏷️ `atom.io/realtime-server` Updated types for `realtimeStateProvider()` and `realtimeStateReceiver()` to be a bit more ergonomic.

## 0.46.24

### Patch Changes

- db9547a: 🐛 `atom.io/react` Fixed a bug with `useI()` where the target state would not be updated when this hook was used in "streamlined" (familyToken, key) mode and the passed key changed.

## 0.46.23

### Patch Changes

- 7b7227e: 🐛 `atom.io/react` Fixed bug where `useAtomicRef()` couldn't target contexts with a `Store` other than the `IMPLICIT.STORE`.

## 0.46.22

### Patch Changes

- 3bf1ad0: 🐛 `atom.io/react`: Fixed bug where the streamlined family-key overload for `useAtomicRef()` would only accept families with a key type of `string`.

## 0.46.21

### Patch Changes

- 585391e: ✨ `atom.io/react` Added an streamlined (familyToken, key, ...) to `useAtomicRef()`.

## 0.46.20

### Patch Changes

- b925598: ✨ `atom.io/eslint-plugin` Added a new rule, `naming-convention`. This rule enforces that any `atom`, `atomFamily`, `mutableAtom`, `mutableAtomFamily`, `selector`, or `selectorFamily` variable name end with -Atom, -Selector, etc. respectively. It also enforces that the `key` property given in these declarations match the variable name provided.
- b925598: 🐛 `atom.io/realtime` Updated the names of several states to match the new ESLint rule, `atom.io/naming-convention`.
  - `visibleUsersInRoomsSelector` ➡️ `visibleUsersInRoomsSelectors`
  - `visibilityFromRoomSelector` ➡️ `visibilityFromRoomSelectors`
  - `mutualUsersSelector` ➡️ `mutualUsersSelectors`

## 0.46.19

### Patch Changes

- a47c12a: 🏷️ `atom.io/realtime-client` Don't require JSON type for selectors accessed with `pullSelector`.

## 0.46.18

### Patch Changes

- 89fa483: ✨ Added tools for working with a `join` to the toolkit for selectors and transactions. These tools are nested under the `relations` property of the toolkit.

  ```ts
  import { join, transaction } from "atom.io";

  const userGroups = join({
    key: `userGroups`,
    between: [`user`, `group`],
    cardinality: `n:n`,
    isAType: (input): input is `user::${string}` => input.startsWith(`user::`),
    isBType: (input): input is `group::${string}` =>
      input.startsWith(`group::`),
  });

  const removeUserFromAllGroupsTX = transaction<
    (userKey: `user::${string}`) => void
  >({
    key: `removeUserFromAllGroups`,
    do: ({ relations }, userKey) => {
      relations.edit(userGroups, (ugs) => ugs.delete(userKey));
    },
  });
  ```

  This makes joins more implicitly portable between stores.

## 0.46.17

### Patch Changes

- b211c6c: ✨ `atom.io/realtime-client` Added `roomOwnerSelector` and `usersHereSelector` to make working with rooms more convenient.
- b211c6c: `atom.io/realtime-server` Allow null for the key index values gived to family providers.

## 0.46.16

### Patch Changes

- 0c6ef46: ✨ `atom.io/realtime-server` Added control over room administration (creating/deleting rooms).

## 0.46.15

### Patch Changes

- c38ed7f: ✨ `atom.io/realtime-server` Included room name in a room's key.

## 0.46.14

### Patch Changes

- a061ed7: 🏷️ `atom.io/realtime-server` Renamed `castSocket()` to more descriptive `guardSocket()` and simplified associated typings and inferences.

## 0.46.13

### Patch Changes

- a0f4ee4: 🐛 `atom.io/react-devtools` Fixed a crash when states were given values with circular internals, and devtools tried to `JSON.parse()` to display in the list.
- a0f4ee4: ✨ `atom.io/realtime-server` `::` `mutualUsersSelector` Now always includes a user's own key, even when that user is not in a room.

## 0.46.12

### Patch Changes

- 70646ec: 🐛 `atom.io/realtime-client` Fixed bug where using `pullSelector` could result in early, incorrect unsubscriptions to states pulled elsewhere in a client.

## 0.46.11

### Patch Changes

- efcba16: 🐛 `atom.io/realtime-client` `::` `myRoomKeySelector` Fixed bug where, used in a server-side room, this would look for an environment variable in an incorrect place.
- efcba16: 🐛 `atom.io/realtime-server` `::` `ParentSocket` now reattaches relay services if an existing relay is found.
- efcba16: 🐛 `atom.io/realtime-server` `::` `provideRooms()` Fixed a bug where a userKey would be redundantly added to a room that user was already present in, resulting in noise over the wire for other players in that room.

## 0.46.10

### Patch Changes

- 7aa3138: ✨ `atom.io/realtime-client` `::` `useRealtimeRooms()` No longer requires a `UserKey` as a parameter.

## 0.46.9

### Patch Changes

- 0cf0dd4: ✨ `atom.io/realtime-client` Improved handling for client implementations like react that are likely to quickly oscillate between mounting and remounting a service before reaching stability.
- 1c9ed67: ✨ `atom.io/realtime-server` Rooms spawned with `provideRooms()` now include an environment variable `REALTIME_ROOM_KEY` with their `RoomKey`.
- 9e17723: 🐛 Fixed bug where messages from a room intended for specific users would be broadcast to all users.
- c5c9562: 🔊 Added a log for when a `ChildSocket` emits to a parent.
- 79d2a6d: 🐛 `atom.io/realtime-client` Fixed an issue where `myRoomKeyAtom` was being stored independently of `usersInRooms` such that the two might not agree. Replaced `myRoomKeyAtom` with `myRoomKeySelector`. Server-side, this selector uses only the new environment variable, `env["REALTIME_ROOM_KEY]"`, and no other states, if it is found.

## 0.46.8

### Patch Changes

- 518d1c1: 🔊 Improved consistency between logs for `ChildSocket`.
- 518d1c1: 🐛 `atom.io/realtime-server` Fixed issue where the `user-leave` event would not be properly transmitted to rooms.

## 0.46.7

### Patch Changes

- 3e53dd1: 🐛 Fixed a bug where emitting to a `ChildSocket` would leak listeners onto stdin.

## 0.46.6

### Patch Changes

- 8742047: ✨ `atom.io/realtime-server` Clean up services in room on user disconnect.
- 8742047: 🐛 `atom.io/realtime-client` Removed dependency on browser environment.
- 8742047: ✨ `atom.io/realtime-server` Provide `myRoomKeyAtom` and `usersInRooms` to rooms created with `provideRooms`.

## 0.46.5

### Patch Changes

- 9414e56: ✨ `atom.io/realtime-react` `::` `useRealtimeRooms()` Now pulls relevant room-related states from the server.

## 0.46.4

### Patch Changes

- 85844b8: 🐛 `atom.io/realtime-server` Fixed a bug where colored text would not be logged by `ChildSocket`.
- 85844b8: 🚀 `atom.io/realtime-server` Improved the performance of checking for a clear sequence.
- 85844b8: 🔊 `atom.io/realtime-server` Improved the logging in `ChildSocket` when a chunk sent to stdout or stderr fails to parse.

## 0.46.3

### Patch Changes

- fa186d1: 🔇 `atom.io/realtime-server` Don't put noise in the console when a subprocess starts up.

## 0.46.2

### Patch Changes

- 63ed158: ✨ `atom.io/realtime-server` `::` `realtime()` The server setup function now supports async functions for `auth` and `onConnect`.

## 0.46.1

### Patch Changes

- 773f333: 🏷️ `atom.io/realtime-server` Improved the type signature for `realtimeStateProvider()` to allow for the admission of looser-typed client states than server states.
- 773f333: ✨ `atom.io/realtime-server` Adds the `realtime()` function. This simplifies the process of establishing user identities for realtime applications.
- 773f333: 🐛 `atom.io/realtime-server` Fixed a bug where the other users in a user's rooms would not be revealed.
- 773f333: 🏷️ `atom.io/realtime-server` Improved the type signature for `realtimeStateReceiver()` to allow for the admission of more narrowly typed client states than server states.
- 773f333: ✨ `atom.io/realtime-server` Required a `StandardSchemaV1` for a `realtimeStateReceiver`.

## 0.46.0

### Minor Changes

- 954ec71: ♻️ Subscriptions are now fulfilled immediately, instead of waiting for the store's operation to close.

## 0.45.5

### Patch Changes

- 92769eb: 🐛 `atom.io/realtime-server` Fixed a bug with server rooms where messages from users would be forwarded double-wrapped with the `user::` prefix.

## 0.45.4

### Patch Changes

- 07e23e2: ✨ `atom.io/realtime-server` Adds a `provideIdentity()` convenience function which allows a user to pull their `UserKey`.
- 07e23e2: ✨ `atom.io/realtime-server` can now provide a static constant for the value for a state requested by a client.
- 07e23e2: ✨ `atom.io/realtime-server` can now alias one provided state for another.

## 0.45.3

### Patch Changes

- cbc77d0: 🏷️ `atom.io/realtime-server` Fixed requirement for an accurately typed index when calling `realtimeFamilyProvider()` and `realtimeMutableFamilyProvider()`.
- cbc77d0: 🏷️ `atom.io/react` Fixed requirement for matching key type when accessing a family member with `useJSON()`.
- cbc77d0: ✨ `atom.io/realtime-server` Added automatic serving of `ownersOfRooms` for a user's `UserKey`. That is, the list of rooms they own.

## 0.45.2

### Patch Changes

- bb3c09c: 🐛 `atom.io/react` Fixed bug where `atom.io/react` was loading `atom.io/realtime-react`. Now this no longer happens.

## 0.45.1

### Patch Changes

- 70df246: 🐛 `atom.io/react` Fixed a bug with `useO()` that caused issues with mutable atoms and held selectors, which reuse the same reference, not to visibly update your components. Now a rerender happens consistently when these atoms are updated.

## 0.45.0

### Minor Changes

- c72a165: 🚚 Consolidated the contents of `atom.io/struct` under `atom.io/json`; removed `atom.io/struct`.
- 7947236: 🏷️ This release contains a deliberate breaking change to types in the interest of correctness. Specifically, the `ViewOf<T>` type has been changed to be more accurate and more useful.

  ### Background

  `ViewOf<T>` is used to type the return value of functions that get or read atoms or selectors. For example,
  - `atom.io` `::` `getState<T>()` returns a `ViewOf<T>`
  - `atom.io/react` `::` `useO<T>()` returns a `ViewOf<T>`
  - `atom.io/react` `::` `useLoadable<T>()` returns a `{ value: ViewOf<T> ... }`

  Previously, this was used primarily to present an interface to a mutable atom's `Transceiver` value like `atom.io/transceivers/u-list` or `atom.io/transceivers/o-list` that did not provide for doing mutation.

  ### What Changed

  The values of selectors and non-mutable atoms can also benefit from this pattern, however. So, now `ViewOf<T>` gives a readonly type for Arrays, Sets, and Maps.

  The previous definition of `ViewOf<T>` was:

  ```ts
  type ViewOf<T> = T extends { READONLY_VIEW: infer View } ? View : T;
  ```

  The new definition is:

  ```ts
  type ViewOf<T> = T extends { READONLY_VIEW: infer View }
    ? View
    : T extends Array<any>
      ? readonly [...T]
      : T extends Set<infer U>
        ? ReadonlySet<ViewOf<U>>
        : T extends Map<infer K, infer V>
          ? ReadonlyMap<ViewOf<K>, ViewOf<V>>
          : T;
  ```

- 3ae92e2: 💥 Removed the disused submodule `atom.io/data`.

## 0.44.15

### Patch Changes

- d6fd8c2: 🔊 `atom.io/realtime` Added logging to state providers.

## 0.44.14

### Patch Changes

- 5ce6f7b: 🐛 `atom.io/react` Fixed an error that result in an error in the console: "The result of getSnapshot should be cached".
- 5ce6f7b: 🚀 `atom.io/react` Fixed a performance mistake where unstable references were being passed to `React.useSyncExternalStore()`. As a result, each render would cause react to re-subscribe to any states being observed with `useO()` or `useLoadable()`.
- 5ce6f7b: 🏷️ `atom.io/react` Fixed typing for `useO()` and `useLoadable()` to return `ViewOf<T>` instead of just `T`.

## 0.44.13

### Patch Changes

- 8145d09: 🔊 `atom.io/realtime-server` `::` `provideRooms` Added logging to room events like creation/deletion/joining/leaving.
- 09e6be8: ✨ `atom.io/realtime` `::` `castSocket` A new function that wraps a socket using standard schema to validate inputs.

## 0.44.12

### Patch Changes

- a7d2b74: ✨ `atom.io/realtime-server` `::` `provideRooms` adds automatic reattachment to rooms for users.

## 0.44.11

### Patch Changes

- f5d6f4d: 🐛 `atom.io/eslint-plugin` `::` `exact-catch-types` Fixed false error reports when validating the catch properties of top-level annotated atoms and selectors.
- f5d6f4d: ✏️ Fixed a typo in an eslint error.

## 0.44.10

### Patch Changes

- 0e2faad: ✨ `atom.io/eslint-plugin`: Added a new rule `exact-catch-types`. This rule makes it harder to make mistakes with built-in error handling for atoms and selectors, by verifying that the types of errors in your state's type signaturer perfectly align with its "catch" property.

## 0.44.9

### Patch Changes

- 68f85c6: ✨ `atom.io/eslint-plugin`: Added an option to the rule `explicit-state-types` called `permitAnnotation`. When enabled, this rule is satisfied by deliberate, top-level annotations of your state variables. This may be the preferred style in codebases where `isolatedDeclarations` are required by TypeScript anyway, as it removes the redundant need for both annotations and type parameters on states.

## 0.44.8

### Patch Changes

- 3f1d98a: ✨ `getRelations` now accepts a `split` option, which returns two atom families instead of one. These families are actually the same family under the hood, but provide different type signatures from the a and b sides of the join.

## 0.44.7

### Patch Changes

- 0ad6180: 🐛 `atom.io/internal` Fixed bug where using `getFromStore()` would give an `unknown` return type when using the streamlined family get.
- 0ad6180: 🏷️ Improved the accuracy of the type of a Join's `relatedKeysAtoms` family to be keyed by the Join's `A` and `B` keys.

## 0.44.6

### Patch Changes

- 98df48d: ✨ `atom.io/realtime-react` adds the `useRealtimeRooms` hook for managing the creation/joining/leaving/disposal of rooms.
- 98df48d: ✨ `atom.io/realtime-server` adds the new `provideRooms` function useful for managing realtime experiences in separate processes.

## 0.44.5

### Patch Changes

- a844b25: ✨ `atom.io/realtime-server` updated experimental join/leave/create/delete room functionality to no longer use transactions. `joinRoom` now buffers additional messages until a connection to the room is established.

## 0.44.4

### Patch Changes

- caae14e: ✨ `atom.io/react`: Added new function `useAtomicRef`. This is a useful tool for making a rendered element available wherever you'd like to manage it.

## 0.44.3

### Patch Changes

- cc25032: 🏷️ Fix types for `disposeState` to permit the disposal of atoms with a `catch` property.

## 0.44.2

### Patch Changes

- 0e28cff: 🚀 When an atom that wasn't previously computed is set, it will not compute its default function unless a current value is needed to derive the new value.

## 0.44.1

### Patch Changes

- f99df81: 🐛 `atom.io/react`: Fixed a bug with `useLoadable` where falsy values passed as a fallback would be treated as though a fallback had not been passed.

## 0.44.0

### Minor Changes

- 35486b1: 🔨 Upgrade vitest to version 4, which required a slight rework to internal tests. No breaking changes.

## 0.43.2

### Patch Changes

- 396ed3b: 🐛 Fix issue where mutable atoms observed with `useO` from `atom.io/react` would be given an incorrect typing of `unknown`.

## 0.43.1

### Patch Changes

- f74e340: 🐛 Fix a case where `process` was accessed as a global instead of via `globalThis`.

## 0.43.0

### Minor Changes

- 164cf83: ✨ Store adds a configurable flag to indicate whether it exists in a production context.

  ```ts
  Store.config.isProduction: boolean
  ```

  Currently this is only used to suppress the warning that a state was created with an already-used key. If we're not in production, we don't want to log this warning.

  The sensible default value is safely acquired as follows:

  ```ts
  globalThis.process?.env?.[`NODE_ENV`] === `production`;
  ```

  ### Motivation

  This warning would occur when running in a development hot-module-replacement (HMR) environment. Under these condition your code, including calls to `atom` or `atomFamily`, is being continually reevaluated on change. When this happens, the store would attempt to re-create these states. In the case of an atom, it would not do so, logging a warning. In the case of a family, it would overwrite the existing family, but also logging a warning.

  In the case that a key was actually used twice, this _can_ a helpful indication of the root cause of errors with non obvious causes. For example, maybe you created a state by copying an existing state and forgot to change the key. This would likely result in type errors down the line.

  However, there is a boy-who-cried-wolf situation here, since the warning, as it is designed, is mostly experienced as a false-positive due to HMR. Furthermore, In some contexts like react native, where errors are surfaced in the development UI, seeing it pop up on your screen is especially annoying.

  If you have a custom way to indicate what environment you are in, you can configure this behavior.

  For instance,

  ```ts
  import { IMPLICIT } from "atom.io/internal";
  import { env } from "./env";

  IMPLICIT.STORE.config.isProduction = env.MODE === `prod`;
  ```

## 0.42.2

### Patch Changes

- 37f6486: ✨ Add `oListDisposedKeyCleanupEffect` to `atom.io/transceivers/o-list`. This effect is designed for a `OList` atom given the role of holding the keys of entities in your program. Whenever a new value is added to a `OList` with this effect, if that value has been previously allocated, it will be removed when it is disposed (deallocated).

## 0.42.1

### Patch Changes

- 6a37bde: ✨ Add store and token as parameters to atom effects.
- 6a37bde: ✨ Add `uListDisposedKeyCleanupEffect` to `atom.io/transceivers/u-list`. This effect is designed for a `UList` atom given the role of holding the keys of entities in your program. Whenever a new value is added to a `UList` with this effect, if that value has been previously allocated, it will be removed when it is disposed (deallocated).

## 0.42.0

### Minor Changes

- c2e8fb6: 💥 BREAKING CHANGE: `Join` no longer supports creating state for relation contents. Instead, just use atom families keyed to the compound keys of the join.

## 0.41.1

### Patch Changes

- 44f90d8: ♻️ Improve seralization interface for `OList` and `UList`.

## 0.41.0

### Minor Changes

- 77794eb: 🚀 Added a custom serialization strategy for updates to `UList` and `OList`.

### Patch Changes

- 77794eb: ♻️ Simplified the JSON form of `UList` to simply be a `ReadonlyArray`.

## 0.40.10

### Patch Changes

- e76f2e1: 🎁 `atom.io/transceivers/o-list` brings the new `OList` (ordered list) transceiver. `OList` is a fully-featured `Array` that emits any mutations made to it as valid remote procedure calls to another `OList`.

## 0.40.9

### Patch Changes

- 57d9a11: 🎁 `atom.io/transceivers/u-list` is a pared-down version of `SetRTX`. No numbered updates, no transactions; just a `Set` that transmits and receives.

## 0.40.8

### Patch Changes

- 1ac962f: 🚀 Mutable atoms now set the state of their \*tracker states within the same operation. This is more efficient, and also means that the tracker does not attempt and fail a redundant update against the mutable.

## 0.40.7

### Patch Changes

- 089fb5f: 📝 Updated README; fixed broken "0 Dependencies" badge.

## 0.40.6

### Patch Changes

- 8a510f6: 🏷️ Removed confusing overloads from `useLoadable`.

## 0.40.5

### Patch Changes

- 521993c: ✨ Add special-case handling for errors in `useLoadable`. If you pass a state that's able to `catch` and a fallback value to render, anything thrown from computing the state will show up on the `error?` property alongside `loading` and `value`. Currently, the fallback value is used in the case of an error, but in future an option this default may be changed or an option may be added to prefer the last loaded value.
- 0b45d0c: 🐛 Fixed bug where the `error` property could linger unexpectedly in some cases inside the wrapper returned from `useLoadable`.

## 0.40.4

### Patch Changes

- cb4b78b: 🐛 Fixed bug where states with caught rejected promises would not propagate updates to some consumers, such as `useLoadable`.

## 0.40.3

### Patch Changes

- 9b5a3fa: 🏷️ Fixed a bug with the types for the new `catch` option released `v0.40.2`. Passing constructors with required parameters previously resulted in a type error, but now this is provided for.

## 0.40.2

### Patch Changes

- 22703a6: ✨ `atom` and `selector` (as well as `atomFamily` and `selectorFamily`) add the new `catch` option.

  ```ts
  const orgMembersAtoms = AtomIO.atomFamily<
    Loadable<User[]>,
    OrgId,
    TRPCClientError
  >({
    key: `orgMembers`,
    get: trpcClient.getOrgMembers,
    default: [TRPCClientError],
  });
  ```

  With this, we can establish specifically what kinds of errors we want to catch as each atom resolves.

  Kind of like Python's nice `try/except` blocks!

  ```ts
  const orgMembers = useLoadable(orgMembersAtoms, orgId);
  /*
  | "LOADING"
  | { loading: boolean; value: TRPCClientError }
  | { loading: boolean; value: User[] }
  */
  ```

  Now, when we `useLoadable` in a react component, we have three easy pivots:
  1. If `orgMembers === LOADING`, we can render a loading state.
  2. Otherwise, if `orgMembers.value instanceof TRPCClientError`, we can render an error state.
  3. If it's not an error, we can map over the `orgMembers.value` array and render each member.
  4. (Bonus) is `orgMembers.loading === true`, we can also render an unobtrusive loading overlay!

## 0.40.1

### Patch Changes

- 28f3c72: ✨ `Realm.deallocate()` and `Realm.claim` now use transactions under the hood to guarantee that only one timeline checkpoint is created when running them.

## 0.40.0

### Minor Changes

- 549b0d6: 💥 BREAKING CHANGE: The timeline option `shouldCapture` has been removed. This was never a good option, and was only used to prevent changes from atoms' default values from being recorded.

### Patch Changes

- 549b0d6: ✨ `timeline` overhaul.

  Timelines now make the following guarantees:
  - `undo` and `redo` iterates over 1 checkpoint in the timeline.
  - Reading from the store—"getting" a state—does not produce a checkpoint.
  - Writing to the store—"setting" a state—will create exactly 1 checkpoint.
  - Running a transaction will create exactly 1 checkpoint.

  With these changes, it is easier to use setState on a single atom or selector when the atoms being set are governed by a timeline. You don't need to wrap everything in a transaction, as long as you want a checkpoint for that one change.

  That being said, if you are in an `immortal` store, transactions are still preferred. Changes to remedy this are forthcoming.

## 0.39.1

### Patch Changes

- c9c6341: 🐛 Fixed issue where, if a selector was set to a Promise, that Promise would be given out as the newValue without being merged into a manager for further updates that may occur before it is resolved.
- c9c6341: 🚀 Avoid recomputing if possible when a selector is set.

## 0.39.0

### Minor Changes

- 376b088: 💥 BREAKING CHANGE: When an state is created for the first time, the event that is broadcast to subscribers will not include an `oldValue`. Only a `newValue` will be included. This only applies to subscribers to a state that placed subscriptions before the state had been given a value, which usually only applies to the `onSet` helper in atom `effects`.

### Patch Changes

- 376b088: 🚀 Setting an atom now only produces up to one timeline event. Previously, if the atom had not been initialized previously, setting it could result in a state creation event and an state update event. This was undesirable, as these are really best seen as the same event. Now, they are.
- 376b088: 🐛 Fixed issue where some writable selectors were still (erroneously) being eagerly computed upon creation. Now, they wait until the last possible moment to be given values like other states.
- 376b088: 🔊 Improved the information given to atom.io's built-in logger in several key areas:
  1. **state creation**: logged for selectors as well as atoms
  2. **writing to cache**: now straightforward writes are logged, with further logging for futures forthcoming
  3. **value origination**: now all values for states are logged when derived, whether from selector computation, atom defaults, or setState

## 0.38.2

### Patch Changes

- 3f19f7e: 🐛 Fix bug where, when disposing a key in the store, the event recorded would erroneously use the tokens of deleted states where the values should have been placed.

## 0.38.1

### Patch Changes

- 61c21d8: 🏷️ Improved the inference types for `parseJson` in `atom.io/json`.

## 0.38.0

### Minor Changes

- eb7f647: 🚀 With this update, atom.io no longer eagerly creates states when `find()`, `findState()`, or `findInStore()` is called. Only getting or setting a state can create it now.

## 0.37.1

### Patch Changes

- 1486927: 🐛 Fixed bug where a serialized form of a key would be used when producing a default value, in the event that an immortal store prevented the instantiation of a state whose key had not been safely preallocated.

## 0.37.0

### Minor Changes

- 06aebed: ♻️ Consolidated the overall number of events that can be produced from the atom.io store, in preparation for a broader rework to `timeline`s.

## 0.36.3

### Patch Changes

- 36e1b76: 🐛 Fixed bug where getting a writable, loadable selector could return a stale Promise.

## 0.36.2

### Patch Changes

- 4516be7: 🐛 Fix a bug where a selector two or more degrees of separation downstream from another selector would not be forced to recalculate when the upstream changed.

## 0.36.1

### Patch Changes

- 72f21f5: 🚀 Improved performance when reading mutable atoms in a transaction.

## 0.36.0

### Minor Changes

- 5a5498d: 🔥 Remove eslint rule `synchronous-selector-dependencies`. This isn't a necessary pattern to follow anymore.
- 5a5498d: 💥 BREAKING CHANGE: `mutableAtom` greatly simplifies its API, removing a significant amount of boilerplate.

  Previously, creating a mutable atom looked like this:

  ```typescript
  const atom = atom<SetRTX<string>, SetRTXJson<string>({
    key: 'my-atom',
    mutable: true,
    default: () => new SetRTX<string>(),
    toJson: (value) => value.toJSON(),
    fromJson: (value) => SetRTX.fromJSON(value),
  });

  const mutableAtom = mutableAtom(atom);
  ```

  Now, it can be created much more simply:

  ```javascript
  const mutableAtom = mutableAtom({
    key: 'my-atom',
    class: SetRTX<string>,
  });
  ```

### Patch Changes

- 5a5498d: ✨ Update eslint rule `explicit-state-types` to require explicit typing for `mutableAtom` and `mutableAtomFamily`.

## 0.35.0

### Minor Changes

- 6baaffc: 💥 For a more convenient experience using the `atom` and `atomFamily` functions, the "mutable" overloads for creating mutable atoms have been moved to their own functions, `mutableAtom` and `mutableAtomFamily`, respectively. They behave exactly the same, except the `mutable: true` flag is no longer necessary to pass.

  This is how mutable atoms have been created previously:

  ```typescript
  import { atom } from "atom.io";

  const myAtom = atom<SetRTX<string>, SetRTXJson<string>>({
    key: "myAtom",
    default: 0,
    mutable: true,
    toJson: (set) => set.toJSON(),
    fromJson: (json) => SetRTX.fromJSON(json),
  });
  ```

  Now, this is done instead:

  ```typescript
  import { mutableAtom } from "atom.io";

  const myAtom = mutableAtom<SetRTX<string>, SetRTXJson<string>>({
    key: "myAtom",
    default: 0,
    toJson: (set) => set.toJSON(),
    fromJson: (json) => SetRTX.fromJSON(json),
  });
  ```

## 0.34.2

### Patch Changes

- 0a20064: 📝 Added more in-editor documentation for the `atom.io` and `atom.io/json` modules.

## 0.34.1

### Patch Changes

- 3793608: 📝 Added inline documentation to almost all of `atom.io`'s core module.

## 0.34.0

### Minor Changes

- 0bf335a: 🚀 Atom.io becomes lazier. Now, atoms and selectors are not evaluated when declared, but wait until you `getState` to be computed. Strategies to add background eager evaluation are forthcoming.

## 0.33.21

### Patch Changes

- 3d35fe5: ✨ `atom.io/react` — The `useLoadable` hook now guarantees that the wrapper it returns will maintain referential identity as long as the loading state does not change. If the loading state does change, a new reference will be used. This allows for optimal use of `useLoadable`'s output as a dependency of a `useEffect`.

## 0.33.20

### Patch Changes

- 6a25fd9: ✨ Add `resetState` to the atom `Effectors`.

## 0.33.19

### Patch Changes

- 3435018: 🐛 Fixed a bug with `atom.io/react-devtools` where the devtools, when using the implicit store, would not respect the value of the `hideByDefault` prop.

## 0.33.18

### Patch Changes

- 199600d: ✨ `atom.io/react-devtools` adds a new hotkey (`ctrl+shift+a`) to toggle hidden mode. This way, they can be embedded into production websites for debugging without confusing users.

## 0.33.17

### Patch Changes

- 0dbd502: ✨ `atom.io/react` adds the new hook `useLoadable` to make it more convenient to handle asynchronously retrieved states when rendering.

## 0.33.16

### Patch Changes

- eb7c534: 🐛 Fixed an issue where resetting states that belong to a family wouldn't cause them to re-execute their `default` function, in the case `default` is defined as a function `(key) => T`.

## 0.33.15

### Patch Changes

- ee3e02e: ✨ `atom.io` adds a new `resetState` function, which sets an atom to its default value. It also sets a writable selector to its default value, by setting all of its root atoms to its defaults. Look for new `resetState` and `reset` methods on `Silo` and `ActorToolkit` respectively.

## 0.33.14

### Patch Changes

- 208b4a9: 🐛 Removed "openCloseAll" from default transactions list in `atom.io/react-devtools`.
- 208b4a9: 💄 Improved appearance of JSON previews in `atom.io/react-devtools`.
- 208b4a9: 💄 Added empty states for `atom.io/react-devtools` store indices.
- 208b4a9: 🐛 No longer record transactions in the list multiple times.
- 208b4a9: ✨ Added the ability to dispose of states in `atom.io/react-devtools`.

## 0.33.13

### Patch Changes

- 6fc9abf: ✨ In `atom.io/react-devtools`, add the ability to simultaneously open and close all state editors at a particular level by holding the `shift` key.
- 6fc9abf: 💄 Improve font sizes and level of contrast in `atom.io/react-devtools`.

## 0.33.12

### Patch Changes

- 8288ed6: 💄 Allow for the collapse and and expansion of nested structures like arrays and objects in `atom.io/react-devtools`.

## 0.33.11

### Patch Changes

- f7ce7b7: 💄 Improve styling of devtools; improve Array layout.

## 0.33.10

### Patch Changes

- 5a8193d: 🐛 Previously, there were problems when creating synchronous states downstream from asynchronous ones. Now, this is better supported.
- 5a8193d: 🚀 Improve performance with async states; create fewer Promise objects under the hood.

## 0.33.9

### Patch Changes

- ba95e13: 🔧 Reduced the 'files' list in package.json to respect atom.io's new package structure.

## 0.33.8

### Patch Changes

- ac830e1: 💄 Improved styles for `react-devtools` to be more compact and readable.

## 0.33.7

### Patch Changes

- 2d0483b: 🐛 Avoided blocking the application with devtools by setting `pointer-events: none` on all wrappers and `pointer-events: all` on the devtools themselves.

## 0.33.6

### Patch Changes

- f552fba: 🐛 Fix bug where atom.io/react-devtools would be included unstyled.
- f552fba: 🎁 Exported `atom.io/react-devtools/css`. Import this to automatically style atom.io's devtools.

## 0.33.5

### Patch Changes

- 8f2e97a: 🏷️ Fix some of the overload type signatures for families given for the internal `withdraw()` function. Previously, the type parameter `K`, representing a family's key type was not being carried through.

## 0.33.4

### Patch Changes

- d26f8c5: 🐛 Fix incorrectly specified peer dependency for `typescript-eslint/parser`.

## 0.33.3

### Patch Changes

- 7bf6762: ✨ Introducing _Held Selectors_, `atom.io`'s novel object-pooling strategy for large, reusable objects. Held Selectors (as opposed to conventional selectors, which are now called _Pure Selectors)_ keep a constant binding to a single object, and are not garbage collected when one of their dependencies updates.

  ```ts
  const myAtom = atom<{ a: number[]; b: number[]; c: number[] }>({
    key: `myAtom`,
    default: {
      a: [],
      b: [],
      c: [],
    },
  });

  const mySelector = selector<{
    a: number;
    b: number;
    c: number;
  }>({
    key: `mySelector`,
    const: { a: 0, b: 0, c: 0 },
    get: ({ get }, self) => {
      const { a, b, c } = get(myAtom);
      self.a = a.reduce((acc, cur) => acc + cur, 0);
      self.b = b.reduce((acc, cur) => acc + cur, 0);
      self.c = c.reduce((acc, cur) => acc + cur, 0);
    },
  });
  ```

  A held selector requires a `const` value to be initialized. The `get` function for a held selector passes the held value of the selector to the getter function as a second parameter following the `GetterToolkit` interface. The expectation is that the getter mutates the held value and returns `void`.

## 0.33.2

### Patch Changes

- f008f47: 🔧 Repair atom.io's representation of its own size in its `README.md`.

## 0.33.1

### Patch Changes

- ff43a3d: 🐛 Fix issue where IMPLICIT.STORE is the wrong type.

## 0.33.0

### Minor Changes

- d654c2d: 🚀 `atom.io` now builds with rolldown. As a result, the `.scss` stylesheet included with `atom.io/react-devtools` has been changed to `.css`.

## 0.32.4

### Patch Changes

- 23a9345: ✨ `atom.io` now reflects on the type-level, the fact that `ATOM_IO_IMPLICIT_STORE` is defined on `globalThis`.

## 0.32.3

### Patch Changes

- 93e1af1: 📝 Update README.md.

## 0.32.2

### Patch Changes

- bf686e6: ✨ Support `erasableSyntaxOnly`. Opens a path to import source code directly in later versions..

## 0.32.1

### Patch Changes

- aca8fc3: 🚀 Make `atom.io`'s bundle size much smaller.

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
