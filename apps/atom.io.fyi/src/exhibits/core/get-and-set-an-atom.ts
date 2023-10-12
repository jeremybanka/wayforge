import { getState, setState } from "atom.io"
import { countState } from "./declare-an-atom"

getState(countState) // -> 0
setState(countState, 1)
getState(countState) // -> 1

// @ts-expect-error `hello` is not a number
setState(countState, `hello`)
