---
"atom.io": patch
---

✨ `atom.io/react` — The `useLoadable` hook now guarantees that the wrapper it returns will maintain referential identity as long as the loading state does not change. If the loading state does change, a new reference will be used. This allows for optimal use of `useLoadable`'s output as a dependency of a `useEffect`.
