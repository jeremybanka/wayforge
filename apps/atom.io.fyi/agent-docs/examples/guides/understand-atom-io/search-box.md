# search box

Source: docs/source/exhibits/guides/understand-atom-io/search-box.tsx

```tsx
import { atom } from "atom.io"
import { useI, useO } from "atom.io/react"
import type { JSX } from "preact/jsx-runtime"

const searchBoxDraftAtom = atom<string>({
	key: `searchBoxDraft`,
	default: ``,
})

export function SearchBox(): JSX.Element {
	const draft = useO(searchBoxDraftAtom)
	const setDraft = useI(searchBoxDraftAtom)

	return (
		<input
			value={draft}
			onInput={(event) => {
				setDraft(event.currentTarget.value)
			}}
			placeholder="Filter results"
		/>
	)
}
```
