import { setState, subscribe } from "atom.io"

import { xAtoms } from "../families/declare-a-family"
import { coordinatesTL } from "./create-a-timeline"

subscribe(coordinatesTL, (value) => {
	console.log(value)
})

setState(xAtoms, `sample_key`, 1)
/* {
  newValue: 1,
  oldValue: 0,
  key: `sample_key`,
  type: `atom_update`,
  timestamp: 1629780000000,
  family: {
    key: `x`,
    type: `atom_family`,
  }
} */
