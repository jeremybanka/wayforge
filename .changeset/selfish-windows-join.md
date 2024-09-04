---
"atom.io": minor
---

💥 BREAKING CHANGE: Cascading disposal has been removed: Selectors are no longer disposed when the atoms or selectors they depend on are disposed.

This is due to a problematic and hard-to-debug behavior that would occur when disposal cascades down the dependency tree.

Say for example, you have index atom, a family of atoms, and an selector that maps the index to the values of the atoms in the family.

```ts
const indexAtom = atom<string[]>({ key: `index`, default: [] })
const countAtoms = atomFamily<number, string>({ key: `count`, default: 0 })
const allCountsSelector = selector<number[]>({
  key: `allCounts`,
  get: ({ get }) => get(indexAtom).map((key) => get(countAtoms, key)),
})
```

I create an atom with "my-key" as the key, and then I set the index to include "my-key".

```ts
const myState = findState(countAtoms, `my-key`)
setState(indexAtom, (current) => [...current, `my-key`])
```

Now, the `allCountsSelector` will hold `[2]` when retrieved.

However, if I dispose the `myState` atom, the `allCountsSelector` would be disposed as a result, because it depended on `myState` last time it was computed.

This happens even if I've removed `my-key` from the index, because the although in this case the selector's expired its cached value, it hasn't recomputed. Therefore from its point of view, it's still dependent on `myState`.

We can fix this in the cascading-delete paradigm if we force the selector to recompute, but that's quite unintuitive and incurs an arbitrary performance penalty.

```ts
setState(indexAtom, (current) => current.filter((key) => key !== `my-key`))
getState(allCountsSelector) // []
disposeState(myState)
```

Suffice to say, cascading disposal is a major footgun, because "dependents" of a disposed state at the time of their last computation are not necessarily dependents at disposal time.