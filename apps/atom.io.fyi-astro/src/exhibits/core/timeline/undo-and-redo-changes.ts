import { getState, redo, setState, subscribe, undo } from "atom.io"

import { xAtoms } from "../families/declare-a-family"
import { coordinatesTL } from "./create-a-timeline"

subscribe(coordinatesTL, (value) => {
	console.log(value)
})

setState(xAtoms, `sample_key`, 1)
getState(xAtoms, `sample_key`) // 1
setState(xAtoms, `sample_key`, 2)
getState(xAtoms, `sample_key`) // 2
undo(coordinatesTL)
getState(xAtoms, `sample_key`) // 1
redo(coordinatesTL)
getState(xAtoms, `sample_key`) // 2
