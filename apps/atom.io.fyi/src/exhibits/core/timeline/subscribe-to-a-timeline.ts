import { setState, subscribe } from "atom.io"

import { xAtoms } from "../families/declare-a-family"
import { coordinatesTL } from "./create-a-timeline"

subscribe(coordinatesTL, (value) => {
	console.log(value)
})

setState(xAtoms, `sample_key`, 1)
/* {
  type: `update`,
  subType: `atom`,
  update: {
    newValue: 1,
    oldValue: 0,
  }
  token: {
    key: `sample_key`,
    type: `atom`,
    family: {
      key: `x`,
      type: `atom_family`,
    },
  },
  timestamp: 1629780000000,
} */
