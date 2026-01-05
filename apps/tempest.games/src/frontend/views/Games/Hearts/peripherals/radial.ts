import { atom, getState, setState } from "atom.io"
import type { RadialAction, RadialMode } from "hamr/react-radial"
import { composeUseRadial } from "hamr/react-radial"

import { windowMousePositionAtom } from "./mouse-position"

export const actionsAtom = atom<RadialAction[]>({
	key: `actions`,
	default: [],
})
export const radialModeAtom = atom<RadialMode>({
	key: `radialMode`,
	default: `idle`,
})

export const useRadial = composeUseRadial(
	(v) => {
		setState(actionsAtom, v)
	},
	() => getState(radialModeAtom),
	(v) => {
		setState(radialModeAtom, v)
	},
	(v) => {
		setState(windowMousePositionAtom, v)
	},
)
