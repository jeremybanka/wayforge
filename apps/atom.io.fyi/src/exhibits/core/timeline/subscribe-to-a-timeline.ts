import { setState, subscribeToTimeline } from "atom.io"

import { findXState } from "../families/declare-a-family"
import { coordinatesTL } from "./create-a-timeline"

subscribeToTimeline(coordinatesTL, (value) => {
	console.log(value)
})

setState(findXState(`sample_key`), 1)
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
