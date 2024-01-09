import { getState, redo, setState, subscribe, undo } from "atom.io"

import { findXState } from "../families/declare-a-family"
import { coordinatesTL } from "./create-a-timeline"

subscribe(coordinatesTL, (value) => {
	console.log(value)
})

setState(findXState(`sample_key`), 1)
getState(findXState(`sample_key`)) // 1
setState(findXState(`sample_key`), 2)
getState(findXState(`sample_key`)) // 2
undo(coordinatesTL)
getState(findXState(`sample_key`)) // 1
redo(coordinatesTL)
getState(findXState(`sample_key`)) // 2
