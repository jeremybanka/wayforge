---
"atom.io": patch
---

✨ Mutating the value of a mutable atom now dispatches an update to the store, even outside of a `setState` callback. Keep in mind that this is a somewhat reckless pattern, as the dispatch is only bound to the layer of the store that the atom's value was gotten from.

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

The above transaction, when run, will not include any updates. However, the base store *will* be updated as the transaction runs.

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