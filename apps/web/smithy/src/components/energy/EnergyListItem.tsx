import type { FC } from "react"

import { RecoverableErrorBoundary } from "~/packages/hamr/recoil-error-boundary/src"
import type { RecoilListItemProps } from "~/packages/hamr/recoil-tools/src/RecoilList"

import type { Energy } from "../../services/energy"
import { SVG_EnergyIcon } from "./EnergyIcon"

export const EnergyListItem: FC<RecoilListItemProps<Energy>> = ({ label }) => (
	<RecoverableErrorBoundary>
		<SVG_EnergyIcon energyId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
