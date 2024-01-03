import { atom, getState, setState } from "atom.io"
import type { RadialAction, RadialMode } from "hamr/react-radial"
import { composeUseRadial } from "hamr/react-radial"

export const actionsState = atom<RadialAction[]>({
	key: `actions`,
	default: [],
})
export const radialModeState = atom<RadialMode>({
	key: `radialMode`,
	default: `idle`,
})

export const useRadial = composeUseRadial(
	(v) => setState(actionsState, v),
	() => getState(radialModeState),
	(v) => setState(radialModeState, v),
)
