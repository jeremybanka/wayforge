# subscribe is the foundation of reactivity

Source: src/exhibits/core/atom/subscribe-is-the-foundation-of-reactivity.tsx

```tsx
import { useO } from "atom.io/react"

import { countAtom } from "./declare-an-atom"

function Component() {
	const count = useO(countAtom)
	return <>{count}</>
}
```
