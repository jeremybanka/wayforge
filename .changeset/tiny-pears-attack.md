---
"atom.io": minor
---

✨ `getState` and `setState` can now be used for family members without requiring `findState`. Simply pass the family member and key.

```ts
const countAtoms = atomFamily<number, string>({
  key: `count`,
  default: 0,
})

getState(countAtoms, `find-me`) // -> 0
setState(countAtoms, `find-me`, 1)
getState(countAtoms, `find-me`) // -> 1
```

⚠️ Note that, if the family member is not found, this will throw a `NotFoundError` in `immortal` stores.