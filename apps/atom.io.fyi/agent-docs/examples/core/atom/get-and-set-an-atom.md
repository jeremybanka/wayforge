# get and set an atom

Source: docs/source/exhibits/core/atom/get-and-set-an-atom.ts

```ts
import { getState, setState } from "atom.io"

import { countAtom } from "./declare-an-atom"

getState(countAtom) // -> 0
setState(countAtom, 1)
getState(countAtom) // -> 1

// @ts-expect-error `hello` is not a number
setState(countAtom, `hello`)
```
