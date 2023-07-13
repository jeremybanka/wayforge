import * as AtomIO from "atom.io"

import type { RadialAction, RadialMode } from "~/packages/hamr/src/react-radial"
import { composeUseRadial } from "~/packages/hamr/src/react-radial"

export const actionsState = AtomIO.atom<RadialAction[]>({
  key: `actions`,
  default: [],
})
export const radialModeState = AtomIO.atom<RadialMode>({
  key: `radialMode`,
  default: `idle`,
})

export const useRadial = composeUseRadial(
  (v) => AtomIO.setState(actionsState, v),
  () => AtomIO.getState(radialModeState),
  (v) => AtomIO.setState(radialModeState, v)
)
