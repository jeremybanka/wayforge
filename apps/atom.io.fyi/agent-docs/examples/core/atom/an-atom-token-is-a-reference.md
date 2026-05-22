# an atom token is a reference

Source: src/exhibits/core/atom/an-atom-token-is-a-reference.ts

```ts
import { getState } from "atom.io"

import { countAtom } from "./declare-an-atom"

countAtom // -> { key: `count`, type: `atom` }
getState(countAtom) // -> 0
getState({ key: `count`, type: `atom` }) // -> 0
```
