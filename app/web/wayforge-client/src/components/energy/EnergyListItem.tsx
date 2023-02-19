import type { FC } from "react"

import type { RecoilListItemProps } from "~/app/web/wayforge-client/recoil-list"
import { RecoverableErrorBoundary } from "~/packages/hamr/react-ui/error-boundary"

import { SVG_EnergyIcon } from "./EnergyIcon"
import type { Energy } from "../../services/energy"

export const EnergyListItem: FC<RecoilListItemProps<Energy>> = ({ label }) => (
  <RecoverableErrorBoundary>
    <SVG_EnergyIcon energyId={label.id} size={30} />
  </RecoverableErrorBoundary>
)
