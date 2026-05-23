# declare an atom

Source: docs/source/exhibits/core/atom/declare-an-atom.ts

```ts
import { atom } from "atom.io"

export const countAtom = atom<number>({
	key: `count`,
	default: 0,
})
```
