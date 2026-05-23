# use an index to track family members

Source: docs/source/exhibits/core/families/use-an-index-to-track-family-members.tsx

```tsx
import { atom } from "atom.io"
import { useO } from "atom.io/react"

import { Point, xAtoms, yAtoms } from "./declare-a-family"

export const pointKeysAtom = atom<string[]>({
	key: `pointKeys`,
	default: [],
})

function AllPoints() {
	const pointIds = useO(pointKeysAtom)
	return (
		<>
			{pointIds.map((pointId) => {
				return <Point key={pointId} pointId={pointId} />
			})}
		</>
	)
}
```
