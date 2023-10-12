import { getState, setState } from "atom.io"
import { dividendState, divisorState, quotientState } from "./declare-a-selector"

getState(dividendState) // -> 0
getState(divisorState) // -> 2
getState(quotientState) // -> 0

setState(dividendState, 4)

getState(quotientState) // -> 2
