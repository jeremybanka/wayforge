---
"atom.io": patch
---

✨ `atom.io/data` `join` now offers an API for compatibility with the new transactor policy introduced in this version. To update relations in a transaction, use the `.transact` method on the relation:

```ts
const userGroups = join({
  key: `userGroups`,
  between: [`user`, `group`],
  cardinality: `n:n`
})
const addUsersToGroupTX = transaction<(groupKey: string, userKeys: string[]) => void>({
  key: `addUsersToGroup`,
  do: (transactors, groupKey, userKeys) => {
    userGroups.transact(transactors, ({ relations }) => {
      for (const userKey of userKeys) {
        relations.add(groupKey, userKey)
      }
    })
  }
})
```