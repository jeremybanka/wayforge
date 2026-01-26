import { getState, setState } from "atom.io"

import {
	dividendAtom,
	divisorAtom,
	quotientSelector,
} from "./declare-a-selector"

getState(dividendAtom) // -> 0
getState(divisorAtom) // -> 2
getState(quotientSelector) // -> 0

setState(dividendAtom, 4)

getState(quotientSelector) // -> 2
