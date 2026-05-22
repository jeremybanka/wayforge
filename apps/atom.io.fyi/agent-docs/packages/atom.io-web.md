# atom.io/web

Source: src/pages/docs/web.mdx
URL: /docs/web

# atom.io/web

`atom.io/web` provides browser-specific atom effects.

Right now, that means:

- `storageSync`: keep an atom in sync with `localStorage`, `sessionStorage`, or any compatible `Storage`
- `searchParamSync`: keep an atom in sync with a URL search parameter

These tools are useful when some state should survive refreshes or be shareable through the URL.

## package contents

| Export | Description |
| --- | --- |
| `storageSync` | Sync an atom with a browser storage interface. |
| `searchParamSync` | Sync an atom with a query parameter in the current URL. |

## storageSync

`storageSync` hydrates an atom from browser storage when the atom is created, then writes future changes back to storage.

### sync with local storage
Source: src/exhibits/web/sync-with-local-storage.ts

```ts
import { atom } from "atom.io"
import { storageSync } from "atom.io/web"

export const sidebarOpenAtom = atom<boolean | null>({
	key: `sidebarOpen`,
	default: true,
	effects: [storageSync(localStorage, JSON, `sidebarOpen`)],
})
```

The second parameter is any object with `stringify` and `parse` methods. In many cases, `JSON` is exactly what you want.

When the atom is set to `null`, the stored item is removed.

Because the storage object is passed in directly, this also works with `sessionStorage`:

### sync with session storage
Source: src/exhibits/web/sync-with-session-storage.ts

```ts
import { storageSync } from "atom.io/web"

effects: [storageSync(sessionStorage, JSON, `sidebarOpen`)]
```

If storage is unavailable, such as during SSR, the effect simply does nothing.

## searchParamSync

`searchParamSync` reads from the current page URL, then keeps one search parameter updated as the atom changes.

### sync with the url
Source: src/exhibits/web/sync-with-the-url.ts

```ts
import { atom } from "atom.io"
import { searchParamSync } from "atom.io/web"

export const selectedTabAtom = atom<string | null>({
	key: `selectedTab`,
	default: `overview`,
	effects: [searchParamSync(JSON, `tab`)],
})
```

If the current URL is `/?tab="settings"`, the atom initializes to `"settings"`.

Later, if the atom changes to `"billing"`, the URL is updated in place using `history.replaceState`, so the page does not reload.

If the atom is set to `null`, that search parameter is removed from the URL.

`searchParamSync` preserves the rest of the URL, including unrelated query params and the hash fragment.

## serialization

Both effects take the same kind of serializer:

### string interface
Source: src/exhibits/web/string-interface.ts

```ts
type StringInterface<T> = {
	stringify: (t: T) => string
	parse: (s: string) => T
}
```

That means you can use `JSON`, or define your own format if you want cleaner URLs or custom parsing rules.

## ssr behavior

Both effects are safe to include in code that also runs on the server.

- `storageSync` does nothing when the storage object is `undefined`
- `searchParamSync` does nothing when `window`, `location`, or `history` are unavailable

This makes it straightforward to declare one atom and use it in both browser and SSR contexts.
