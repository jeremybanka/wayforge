---
"atom.io": minor
---

✨ Added tools for working with a `join` to the toolkit for selectors and transactions. These tools are nested under the `relations` property of the toolkit.

```ts
const userGroups = join({
  key: `userGroups`,
  between: [`user`, `group`],
  cardinality: `n:n`,
  isAType: (input): input is `user::${string}` => input.startsWith(`user::`),isBType: (input): input is `group::${string}` => input.startsWith(`group::`),
})

const removeUserFromAllGroupsTX = transaction<
  (user: string) => void
>({
  key: `removeUserFromAllGroups`,
  do: ({ relations }) => {
    relations.edit(userGroups, (ugs) => {
      ugs.delete(`user::${user}`)
    })
  },
})
```

This makes joins more implicitly portable between stores.
