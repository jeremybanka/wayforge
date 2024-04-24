---
"atom.io": minor
---

🐛 Fix bug with `Loadable` (async) selectors.

  It remains the case that, when an atom or selector is set to a Promise, the store will wrap that Promise in an internal mechanism called a "Future". When the Future is resolved, the atom or selector will be updated to the resolved value.
  
  Previously, the store had the option to "cancel" a Future in the event that a selector was evicted from the store, due to states upstream of the selector being changed. The idea was to prevent a race condition where an earlier value might override a later one. But because a cancelled Future will never resolve, a problem arose with code like the following:
  
  ```ts
  const urlAtom = atom<string>({
    key: `url`,
    default: `https://example.com`,
  })
  const fetchResponseSelector = selector<Loadable<Response>>({
    key: `fetch`,
    get: async ({ get }) => {
      const url = get(urlAtom)
      return await fetch(url)
    }
  })
  const fetchedJsonSelector = selector<Loadable<Json.Serializable>>({
    key: `fetchedJson`,
    get: async ({ get }) => {
      const responseLoadable = get(fetchResponseSelector)
      const response = await responseLoadable // <-- ❗ this might never resolve if the urlAtom changes
      return await response.json()
    }
  })
  ```

  The problem here is that, if the `urlAtom` changes while `fetchedJsonSelector`'s getter is running, the `fetchResponseSelector`'s current future value will be cancelled and will never resolve, leading to a getter will hang forever.

  This fix guarantees that every instance of a Loadable selector will always resolve, so atom.io won't cause code like the above to hang.

  However, this also means that selectors whose values are currently a future will not be evicted, and will always be recomputed eagerly when their dependencies change. This behavior may become somewhat lazier in a future release.
  