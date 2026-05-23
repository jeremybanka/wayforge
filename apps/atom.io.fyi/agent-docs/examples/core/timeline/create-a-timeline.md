# create a timeline

Source: docs/source/exhibits/core/timeline/create-a-timeline.ts

```ts
import { timeline } from "atom.io"

import { xAtoms, yAtoms } from "../families/declare-a-family"

export const coordinatesTL = timeline({
	key: `timeline`,
	scope: [xAtoms, yAtoms],
})
```
