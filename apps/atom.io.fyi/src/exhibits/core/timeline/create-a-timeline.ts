import { timeline } from "atom.io"
import { findXState, findYState } from "../families/declare-a-family"

export const coordinatesTL = timeline({
	key: `timeline`,
	atoms: [findXState, findYState],
})
