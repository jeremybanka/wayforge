# subscribe to an atom

Source: src/exhibits/core/atom/subscribe-to-an-atom.ts

```ts
import { subscribe } from "atom.io"

import { countAtom } from "./declare-an-atom"

subscribe(countAtom, (count) => {
	console.log(`count is now ${count.newValue}`)
})
```
