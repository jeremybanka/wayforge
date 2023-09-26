import { getState } from "atom.io"
import { countState } from "./declare-an-atom"

countState // -> { key: `count`, type: `atom` }
getState(countState) // -> 0
getState({ key: `count`, type: `atom` }) // -> 0
