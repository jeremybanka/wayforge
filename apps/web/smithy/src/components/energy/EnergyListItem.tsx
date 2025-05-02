import type { AtomListItemProps } from "hamr/atom.io-tools"
import type { FC } from "react"

import type { Energy } from "../../services/energy"
import { RecoverableErrorBoundary } from "../RecoverableErrorBoundary"
import { SVG_EnergyIcon } from "./EnergyIcon"

export const EnergyListItem: FC<AtomListItemProps<Energy>> = ({ label }) => (
	<RecoverableErrorBoundary>
		<SVG_EnergyIcon energyId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
