import { atom, getState, setState } from "atom.io"
import type { RadialAction, RadialMode } from "~/packages/hamr/react-radial/src"
import { composeUseRadial } from "~/packages/hamr/react-radial/src"

import { windowMousePositionState } from "./mouse-position"

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
	(v) => setState(windowMousePositionState, v),
)
