---
"atom.io": patch
---

🗑️ Formally deprecate the family-as-function style of usage.

```ts
const countAtoms = atomFamily<number, string>({
  key: `count`,
  default: 0,
})

// Deprecated
const countState = countAtoms('find-me')

// Use this instead
const countState = findState(countAtoms, 'find-me')
```