import type { FC } from "react"

import type { Energy } from "../../services/energy"
import { SVG_EnergyIcon } from "./EnergyIcon"
import { AtomListItemProps } from "hamr/atom.io-tools"
import { RecoverableErrorBoundary } from "../RecoverableErrorBoundary"

export const EnergyListItem: FC<AtomListItemProps<Energy>> = ({ label }) => (
	<RecoverableErrorBoundary>
		<SVG_EnergyIcon energyId={label.id} size={30} />
	</RecoverableErrorBoundary>
)
