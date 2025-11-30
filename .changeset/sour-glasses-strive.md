---
"atom.io": minor
---

🏷️ This release contains a deliberate breaking change to types in the interest of correctness. Specifically, the `ViewOf<T>` type has been changed to be more accurate and more useful.

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
