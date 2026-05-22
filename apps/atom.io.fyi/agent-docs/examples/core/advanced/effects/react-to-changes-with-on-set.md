# react to changes with on set

Source: src/exhibits/core/advanced/effects/react-to-changes-with-on-set.ts

```ts
import { atom } from "atom.io"

export const searchQueryAtom = atom<string>({
	key: `searchQuery`,
	default: ``,
	effects: [
		({ onSet }) => {
			onSet(({ newValue }) => {
				console.log(`search query updated:`, newValue)
			})
		},
	],
})
```
