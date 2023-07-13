import type { FC } from "react"

import { RecoverableErrorBoundary } from "~/packages/hamr/src/react-error-boundary"
import type { RecoilListItemProps } from "~/packages/hamr/src/recoil-tools/RecoilList"

import { SVG_EnergyIcon } from "./EnergyIcon"
import type { Energy } from "../../services/energy"

export const EnergyListItem: FC<RecoilListItemProps<Energy>> = ({ label }) => (
  <RecoverableErrorBoundary>
    <SVG_EnergyIcon energyId={label.id} size={30} />
  </RecoverableErrorBoundary>
)
