# hydrate an atom with set self

Source: src/exhibits/core/advanced/effects/hydrate-an-atom-with-set-self.ts

```ts
import { atom } from "atom.io"

export const sidebarOpenAtom = atom<boolean>({
	key: `sidebarOpen`,
	default: false,
	effects: [
		({ setSelf }) => {
			const stored = localStorage.getItem(`sidebarOpen`)
			if (stored !== null) {
				setSelf(JSON.parse(stored))
			}
		},
	],
})
```
