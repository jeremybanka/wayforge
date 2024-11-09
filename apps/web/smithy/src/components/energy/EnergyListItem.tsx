import type { FC } from "react"

import { RecoverableErrorBoundary } from "hamr/recoil-error-boundary"
import type { RecoilListItemProps } from "hamr/recoil-tools"

import type { Energy } from "../../services/energy"
import { SVG_EnergyIcon } from "./EnergyIcon"

export const EnergyListItem: FC<RecoilListItemProps<Energy>> = ({ label }) => (
	<RecoverableErrorBoundary>
		<SVG_EnergyIcon energyId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
