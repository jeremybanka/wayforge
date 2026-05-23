# browser path sync

Source: docs/source/exhibits/guides/understand-atom-io/browser-path-sync.ts

```ts
import { atom } from "atom.io"

export const pathnameAtom = atom<string>({
	key: `pathname`,
	default: () => window.location.pathname,
	effects: [
		({ setSelf, onSet }) => {
			const syncFromBrowser = () => {
				setSelf(window.location.pathname)
			}

			window.addEventListener(`popstate`, syncFromBrowser)

			onSet(({ newValue }) => {
				if (window.location.pathname !== newValue) {
					window.history.pushState(null, ``, newValue)
				}
			})

			return () => {
				window.removeEventListener(`popstate`, syncFromBrowser)
			}
		},
	],
})
```
